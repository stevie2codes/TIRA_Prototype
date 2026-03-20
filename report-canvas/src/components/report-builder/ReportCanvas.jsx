// Forge components: ForgeIcon
import { useState, useRef, useCallback, useEffect } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import WidgetWrapper from './WidgetWrapper.jsx';
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

export default function ReportCanvas() {
  const {
    widgets, addWidget, updateWidget,
    selectedWidgetId, setSelectedWidgetId,
    removeWidget, duplicateWidget,
  } = useReport();
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return;
      }

      // Escape → deselect
      if (e.key === 'Escape') {
        setSelectedWidgetId(null);
        return;
      }

      // Only act on selected widget
      if (!selectedWidgetId) return;

      // Delete / Backspace → remove widget
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeWidget(selectedWidgetId);
        return;
      }

      // Cmd+D / Ctrl+D → duplicate widget
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        duplicateWidget(selectedWidgetId);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgetId, setSelectedWidgetId, removeWidget, duplicateWidget]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    setIsDragging(false);
    const { active, delta } = event;
    if (!active || !delta) return;

    const widget = widgets.find(w => w.id === active.id);
    if (!widget) return;

    // Convert pixel delta to grid units (approximate)
    const colDelta = Math.round(delta.x / 100);
    const rowDelta = Math.round(delta.y / 80);

    if (colDelta === 0 && rowDelta === 0) return;

    const newCol = Math.max(1, Math.min(13 - widget.colSpan, widget.gridColumn + colDelta));
    const newRow = Math.max(1, widget.gridRow + rowDelta);

    updateWidget(widget.id, { gridColumn: newCol, gridRow: newRow });
  };

  const handleCanvasClick = () => {
    setSelectedWidgetId(null);
  };

  // Handle native drag from widget palette
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/widget');
    if (!raw) return;

    const config = JSON.parse(raw);
    const grid = gridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    const colWidth = rect.width / 12;
    const rowHeight = 80;

    const gridCol = Math.max(1, Math.min(13 - config.colSpan, Math.floor((event.clientX - rect.left) / colWidth) + 1));
    const gridRow = Math.max(1, Math.floor((event.clientY - rect.top + grid.scrollTop) / (rowHeight + 12)) + 1);

    const newWidget = {
      id: `widget-${Date.now()}`,
      type: config.type,
      title: config.label,
      gridColumn: gridCol,
      gridRow: gridRow,
      colSpan: config.colSpan,
      rowSpan: config.rowSpan,
      config: config.subtype ? { subtype: config.subtype } : {},
    };
    addWidget(newWidget);
  }, [addWidget]);

  const isEmpty = widgets.length === 0;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={gridRef}
        className={`report-grid${isDragging ? ' dragging' : ''}${isEmpty ? ' empty' : ''}`}
        onClick={handleCanvasClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {isEmpty ? (
          <div className="canvas-empty-state report-empty">
            <div className="canvas-empty-icon">
              <ForgeIcon name="dashboard" style={{ fontSize: 32, color: '#9ca3af' }} />
            </div>
            <h3 className="canvas-empty-title">Design your report layout</h3>
            <p className="canvas-empty-desc">
              Add widgets from the left panel to build your report. Click to place or drag for precise positioning.
            </p>
            <div className="canvas-empty-steps">
              <div className="canvas-empty-step">
                <span className="canvas-empty-step-num">1</span>
                <span>Click or drag a widget to add it</span>
              </div>
              <div className="canvas-empty-step">
                <span className="canvas-empty-step-num">2</span>
                <span>Configure data sources and display</span>
              </div>
              <div className="canvas-empty-step">
                <span className="canvas-empty-step-num">3</span>
                <span>Resize and rearrange to finalize</span>
              </div>
            </div>
          </div>
        ) : (
          widgets.map(widget => (
            <WidgetWrapper key={widget.id} widget={widget}>
              <WidgetRenderer widget={widget} />
            </WidgetWrapper>
          ))
        )}
      </div>
    </DndContext>
  );
}
