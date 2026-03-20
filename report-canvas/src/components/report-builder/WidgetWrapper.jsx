// Forge components: none (layout wrapper)
import { useState, useCallback, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useReport } from '../../context/ReportContext.jsx';
import WidgetContextMenu from './WidgetContextMenu.jsx';

// Maps resize handle direction to which dimensions it affects
const RESIZE_EFFECTS = {
  e:  { col: 0, row: 0, colSpan: 1, rowSpan: 0 },
  w:  { col: 1, row: 0, colSpan: -1, rowSpan: 0 },
  s:  { col: 0, row: 0, colSpan: 0, rowSpan: 1 },
  n:  { col: 0, row: 1, colSpan: 0, rowSpan: -1 },
  se: { col: 0, row: 0, colSpan: 1, rowSpan: 1 },
  sw: { col: 1, row: 0, colSpan: -1, rowSpan: 1 },
  ne: { col: 0, row: 1, colSpan: 1, rowSpan: -1 },
  nw: { col: 1, row: 1, colSpan: -1, rowSpan: -1 },
};

export default function WidgetWrapper({ widget, children }) {
  const { selectedWidgetId, setSelectedWidgetId, updateWidget } = useReport();
  const isSelected = selectedWidgetId === widget.id;
  const [contextMenu, setContextMenu] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: widget.id,
    data: { type: 'widget', widget },
    disabled: isResizing,
  });

  const style = {
    gridColumn: `${widget.gridColumn} / span ${widget.colSpan}`,
    gridRow: `${widget.gridRow} / span ${widget.rowSpan}`,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: transform ? 10 : contextMenu ? 5 : isResizing ? 10 : undefined,
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setSelectedWidgetId(widget.id);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWidgetId(widget.id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const effects = RESIZE_EFFECTS[direction];
    const startWidget = { ...widget };

    // Estimate grid cell size from the wrapper element
    const el = resizeRef.current;
    const cellWidth = el ? el.offsetWidth / widget.colSpan : 100;
    const cellHeight = el ? el.offsetHeight / widget.rowSpan : 80;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const colDelta = Math.round(dx / cellWidth);
      const rowDelta = Math.round(dy / cellHeight);

      const newColSpan = Math.max(1, Math.min(12, startWidget.colSpan + colDelta * effects.colSpan));
      const newRowSpan = Math.max(1, Math.min(6, startWidget.rowSpan + rowDelta * effects.rowSpan));
      const newCol = Math.max(1, Math.min(13 - newColSpan, startWidget.gridColumn + colDelta * effects.col));
      const newRow = Math.max(1, startWidget.gridRow + rowDelta * effects.row);

      updateWidget(widget.id, {
        colSpan: newColSpan,
        rowSpan: newRowSpan,
        gridColumn: newCol,
        gridRow: newRow,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Remove the dragging class from the grid
      document.querySelector('.report-grid')?.classList.remove('dragging');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Show grid lines during resize
    document.querySelector('.report-grid')?.classList.add('dragging');
  }, [widget, updateWidget]);

  return (
    <div
      ref={(el) => { setNodeRef(el); resizeRef.current = el; }}
      className={`widget-wrapper${isSelected ? ' selected' : ''}${isResizing ? ' resizing' : ''}`}
      style={style}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="widget-drag-handle" {...listeners} {...attributes}>
        <span className="drag-dots">⋮⋮</span>
      </div>
      <div className="widget-content">
        {children}
      </div>
      {isSelected && (
        <>
          {Object.keys(RESIZE_EFFECTS).map(dir => (
            <div
              key={dir}
              className={`resize-handle ${dir}`}
              onMouseDown={(e) => handleResizeStart(e, dir)}
            />
          ))}
        </>
      )}
      {contextMenu && (
        <WidgetContextMenu
          widgetId={widget.id}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
