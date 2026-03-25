import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { getTemplateById } from '../../../../src/output-templates.js';
import { getPageDimensions, getContentArea, DPI } from '../../constants/pageSettings.js';
import WidgetWrapper from './WidgetWrapper.jsx';
import Rulers from './Rulers.jsx';
import ChartWidget from './widgets/ChartWidget.jsx';
import TableWidget from './widgets/TableWidget.jsx';
import KpiWidget from './widgets/KpiWidget.jsx';
import TextWidget from './widgets/TextWidget.jsx';
import ImageWidget from './widgets/ImageWidget.jsx';
import DividerWidget from './widgets/DividerWidget.jsx';
import SectionHeader from './widgets/SectionHeader.jsx';

const WIDGET_MAP = {
  chart: ChartWidget,
  table: TableWidget,
  kpi: KpiWidget,
  text: TextWidget,
  image: ImageWidget,
  divider: DividerWidget,
  'section-header': SectionHeader,
};

function WidgetRenderer({ widget }) {
  const Component = WIDGET_MAP[widget.type];
  if (!Component) {
    return <div className="widget-placeholder-inner"><span>Unknown: {widget.type}</span></div>;
  }
  return <Component widget={widget} />;
}

const ROW_HEIGHT = 72; // px per grid row inside page content
const ROW_GAP = 8;
const HEADER_HEIGHT = 64; // template header area
const FOOTER_HEIGHT = 40; // template footer area

export default function PrintCanvas() {
  const {
    widgets, addWidget, updateWidget,
    selectedWidgetId, setSelectedWidgetId,
    removeWidget, duplicateWidget,
    activeTemplateId, handoffContext,
    zoom, pageSize, orientation, margins, showRulers,
  } = useReport();

  const template = activeTemplateId ? getTemplateById(activeTemplateId) : null;
  const viewportRef = useRef(null);
  const [scrollPos, setScrollPos] = useState({ top: 0, left: 0 });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const pageDims = useMemo(() => getPageDimensions(pageSize, orientation), [pageSize, orientation]);
  const contentArea = useMemo(() => getContentArea(pageSize, orientation, margins), [pageSize, orientation, margins]);

  // Calculate rows per page
  const rowsPerPage = useMemo(() => {
    const headerSpace = template ? HEADER_HEIGHT : 0;
    const footerSpace = FOOTER_HEIGHT;
    const available = contentArea.heightPx - headerSpace - footerSpace;
    return Math.max(1, Math.floor(available / (ROW_HEIGHT + ROW_GAP)));
  }, [contentArea.heightPx, template]);

  // Split widgets into pages
  const pages = useMemo(() => {
    if (widgets.length === 0) return [[]];
    const pageMap = {};
    widgets.forEach(w => {
      const pageIndex = Math.floor((w.gridRow - 1) / rowsPerPage);
      if (!pageMap[pageIndex]) pageMap[pageIndex] = [];
      pageMap[pageIndex].push({
        ...w,
        gridRow: ((w.gridRow - 1) % rowsPerPage) + 1,
      });
    });
    const maxPage = Math.max(...Object.keys(pageMap).map(Number), 0);
    const result = [];
    for (let i = 0; i <= maxPage; i++) {
      result.push(pageMap[i] || []);
    }
    return result;
  }, [widgets, rowsPerPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'Escape') { setSelectedWidgetId(null); return; }
      if (!selectedWidgetId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeWidget(selectedWidgetId); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateWidget(selectedWidgetId); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgetId, setSelectedWidgetId, removeWidget, duplicateWidget]);

  const handleScroll = useCallback(() => {
    if (viewportRef.current) {
      setScrollPos({
        top: viewportRef.current.scrollTop,
        left: viewportRef.current.scrollLeft,
      });
    }
  }, []);

  const handleDragEnd = (event) => {
    const { active, delta } = event;
    if (!active || !delta) return;
    const widget = widgets.find(w => w.id === active.id);
    if (!widget) return;
    const scale = zoom / 100;
    const colDelta = Math.round(delta.x / (scale * (contentArea.widthPx / 12)));
    const rowDelta = Math.round(delta.y / (scale * (ROW_HEIGHT + ROW_GAP)));
    if (colDelta === 0 && rowDelta === 0) return;
    const newCol = Math.max(1, Math.min(13 - widget.colSpan, widget.gridColumn + colDelta));
    const newRow = Math.max(1, widget.gridRow + rowDelta);
    updateWidget(widget.id, { gridColumn: newCol, gridRow: newRow });
  };

  // Handle drops from widget palette
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/widget');
    if (!raw) return;
    const config = JSON.parse(raw);
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: config.type,
      title: config.label,
      gridColumn: 1,
      gridRow: (pages.length > 0 ? pages[0].length : 0) + 1,
      colSpan: config.colSpan,
      rowSpan: config.rowSpan,
      config: config.subtype ? { subtype: config.subtype } : {},
    };
    addWidget(newWidget);
  }, [addWidget, pages]);

  const handleCanvasClick = (e) => {
    if (e.target.closest('.widget-wrapper')) return;
    setSelectedWidgetId(null);
  };

  const reportTitle = handoffContext?.reportTitle || 'Report';
  const dataSource = handoffContext?.dataSource || '';
  const freshness = handoffContext?.freshness || '';

  const templateStyle = template ? {
    '--tpl-primary': template.theme.primary,
    '--tpl-secondary': template.theme.secondary,
    '--tpl-accent': template.theme.accent,
    '--tpl-surface': template.theme.surface,
    '--tpl-text': template.theme.text,
    '--tpl-border': template.theme.border,
    '--tpl-table-border': template.theme.tableBorder,
    '--tpl-table-stripe': template.theme.tableStripe,
    '--tpl-header-accent': template.contentStyle.headerAccent,
  } : {};

  const isEmpty = widgets.length === 0;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="print-canvas-wrapper">
        {showRulers && (
          <Rulers
            pageDims={pageDims}
            zoom={zoom}
            scrollPos={scrollPos}
            margins={margins}
          />
        )}
        <div
          ref={viewportRef}
          className="print-canvas-viewport"
          onScroll={handleScroll}
          onClick={handleCanvasClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div
            className="print-pages-container"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {pages.map((pageWidgets, pageIndex) => (
              <div
                key={pageIndex}
                className={`print-page${template ? ' has-template' : ''}`}
                style={{
                  width: pageDims.widthPx,
                  minHeight: pageDims.heightPx,
                  ...templateStyle,
                }}
                data-template={template?.id || undefined}
              >
                {/* Margin guides */}
                <div className="margin-guide margin-top" style={{ top: margins.top * DPI, left: 0, right: 0, height: 0 }} />
                <div className="margin-guide margin-bottom" style={{ bottom: margins.bottom * DPI, left: 0, right: 0, height: 0 }} />
                <div className="margin-guide margin-left" style={{ left: margins.left * DPI, top: 0, bottom: 0, width: 0 }} />
                <div className="margin-guide margin-right" style={{ right: margins.right * DPI, top: 0, bottom: 0, width: 0 }} />

                {/* Template header */}
                {template && (
                  <div
                    className="print-page-header"
                    style={{
                      background: template.header.background,
                      color: template.header.text,
                      margin: `0 ${margins.right * DPI}px 0 ${margins.left * DPI}px`,
                      marginTop: margins.top * DPI,
                    }}
                  >
                    <div className="tpl-header-logo">
                      <ForgeIcon name={template.logo} />
                    </div>
                    <div className="tpl-header-text">
                      <div className="tpl-header-department">{template.header.department || reportTitle}</div>
                      <div className="tpl-header-subtitle">{template.header.subtitle} — {reportTitle}</div>
                    </div>
                    <div className="tpl-header-meta">
                      {dataSource && <span>{dataSource}</span>}
                      {freshness && <span>{freshness}</span>}
                    </div>
                  </div>
                )}

                {/* Page content grid */}
                <div
                  className="print-page-content"
                  style={{
                    padding: template
                      ? `12px ${margins.right * DPI}px 0 ${margins.left * DPI}px`
                      : `${margins.top * DPI}px ${margins.right * DPI}px 0 ${margins.left * DPI}px`,
                  }}
                >
                  {isEmpty && pageIndex === 0 ? (
                    <div className="canvas-empty-state print-empty">
                      <div className="canvas-empty-icon">
                        <ForgeIcon name="description" style={{ fontSize: 32, color: '#9ca3af' }} />
                      </div>
                      <h3 className="canvas-empty-title">Design your print report</h3>
                      <p className="canvas-empty-desc">
                        Drag widgets from the left panel onto this page. Widgets will flow across pages automatically.
                      </p>
                    </div>
                  ) : (
                    pageWidgets.map(widget => (
                      <WidgetWrapper key={widget.id} widget={widget}>
                        <WidgetRenderer widget={widget} />
                      </WidgetWrapper>
                    ))
                  )}
                </div>

                {/* Page footer */}
                <div
                  className="print-page-footer"
                  style={{
                    margin: `0 ${margins.right * DPI}px ${margins.bottom * DPI}px ${margins.left * DPI}px`,
                    borderTopColor: template?.theme.border || '#e5e7eb',
                  }}
                >
                  <span className="print-footer-text">
                    {template ? template.footer.text : reportTitle}
                  </span>
                  <span className="print-footer-meta">
                    {template?.footer.showDate &&
                      `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    }
                    {' — '}Page {pageIndex + 1} of {pages.length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
