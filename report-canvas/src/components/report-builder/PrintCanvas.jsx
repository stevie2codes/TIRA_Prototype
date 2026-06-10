import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
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
import ParameterStrip from './ParameterStrip.jsx';

const WIDGET_MAP = {
  chart: ChartWidget,
  table: TableWidget,
  kpi: KpiWidget,
  text: TextWidget,
  image: ImageWidget,
  divider: DividerWidget,
  // Section Header merged into the rich text block.
  'section-header': TextWidget,
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

function widgetToLayoutItem(widget, rowOffset) {
  return {
    i: widget.id,
    x: (widget.gridColumn - 1),
    y: (widget.gridRow - 1) - rowOffset,
    w: widget.colSpan,
    h: widget.rowSpan,
  };
}

export default function PrintCanvas() {
  const {
    widgets, addWidget, updateWidget,
    selectedWidgetId, setSelectedWidgetId,
    removeWidget, duplicateWidget,
    activeTemplateId, handoffContext,
    zoom, setZoom, pageSize, orientation, margins, showRulers,
    paletteDragging, setPaletteDragging,
  } = useReport();

  const template = activeTemplateId ? getTemplateById(activeTemplateId) : null;
  const viewportRef = useRef(null);
  const [scrollPos, setScrollPos] = useState({ top: 0, left: 0 });

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
      // Keep original gridRow on the widget; we'll subtract the page rowOffset
      // when computing the RGL layout item.
      pageMap[pageIndex].push(w);
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

  // Pinch-to-zoom (trackpad pinch fires wheel with ctrlKey) and Ctrl/Cmd+wheel
  // explicit zoom. Native scroll without modifier passes through.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Trackpad pinch on macOS fires wheel events with ctrlKey set
      // (even without the actual Ctrl key being pressed). Cmd/Meta also.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      // deltaY: negative = zoom in, positive = zoom out
      // Use a multiplicative step proportional to current zoom so the
      // feel is consistent across the range.
      const direction = e.deltaY < 0 ? 1 : -1;
      const magnitude = Math.min(0.3, Math.abs(e.deltaY) * 0.01);
      setZoom(z => {
        const next = Math.round(z * (1 + direction * magnitude));
        return Math.max(20, Math.min(200, next));
      });
    };

    // Need passive: false so we can preventDefault on pinch
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setZoom]);

  const handleCanvasClick = (e) => {
    if (e.target.closest('.widget-wrapper')) return;
    setSelectedWidgetId(null);
  };

  const onLayoutChange = useCallback((layout, pageIndex) => {
    const rowOffset = pageIndex * rowsPerPage;
    layout.forEach(item => {
      // Skip the dropping placeholder item, if present
      if (item.i === '__palette__' || item.i === '__placeholder__') return;
      const widget = widgets.find(w => w.id === item.i);
      if (!widget) return;
      const newCol = item.x + 1;
      const newRow = item.y + 1 + rowOffset;
      const newColSpan = item.w;
      const newRowSpan = item.h;
      if (
        widget.gridColumn !== newCol ||
        widget.gridRow !== newRow ||
        widget.colSpan !== newColSpan ||
        widget.rowSpan !== newRowSpan
      ) {
        updateWidget(widget.id, {
          gridColumn: newCol,
          gridRow: newRow,
          colSpan: newColSpan,
          rowSpan: newRowSpan,
        });
      }
    });
  }, [widgets, updateWidget, rowsPerPage]);

  const onPaletteDrop = useCallback((layout, item, pageIndex) => {
    if (!paletteDragging) return;
    const config = paletteDragging;
    const rowOffset = pageIndex * rowsPerPage;
    addWidget({
      id: `widget-${Date.now()}`,
      type: config.type,
      title: config.label,
      gridColumn: (item.x ?? 0) + 1,
      gridRow: (item.y ?? 0) + 1 + rowOffset,
      colSpan: config.colSpan,
      rowSpan: config.rowSpan,
      config: config.subtype ? { subtype: config.subtype } : {},
    });
    setPaletteDragging(null);
  }, [paletteDragging, addWidget, setPaletteDragging, rowsPerPage]);

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

  const dropping = paletteDragging
    ? { i: '__palette__', w: paletteDragging.colSpan, h: paletteDragging.rowSpan }
    : { i: '__placeholder__', w: 6, h: 3 };

  return (
    <div className="print-canvas-outer">
      <ParameterStrip />
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
                  data-page-index={pageIndex}
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
                    <GridLayout
                      className="print-grid"
                      layout={pageWidgets.map(w => widgetToLayoutItem(w, pageIndex * rowsPerPage))}
                      cols={12}
                      rowHeight={ROW_HEIGHT}
                      width={contentArea.widthPx}
                      margin={[ROW_GAP, ROW_GAP]}
                      containerPadding={[0, 0]}
                      draggableHandle=".widget-drag-handle"
                      resizeHandles={['se']}
                      compactType="vertical"
                      preventCollision={false}
                      isDroppable={!!paletteDragging && pageIndex === 0}
                      droppingItem={dropping}
                      onLayoutChange={(layout) => onLayoutChange(layout, pageIndex)}
                      onDrop={(layout, item) => onPaletteDrop(layout, item, pageIndex)}
                    >
                      {pageWidgets.map(widget => (
                        <div key={widget.id}>
                          <WidgetWrapper widget={widget}>
                            <WidgetRenderer widget={widget} />
                          </WidgetWrapper>
                        </div>
                      ))}
                    </GridLayout>
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
    </div>
  );
}
