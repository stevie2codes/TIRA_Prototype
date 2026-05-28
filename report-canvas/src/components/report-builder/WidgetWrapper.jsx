// Forge components: none (layout wrapper)
import { useState } from 'react';
import { useReport } from '../../context/ReportContext.jsx';
import { pickSlotForField } from '../../data/widgetSlots.js';
import WidgetContextMenu from './WidgetContextMenu.jsx';

export default function WidgetWrapper({ widget, children }) {
  const { selectedWidgetId, setSelectedWidgetId, setWidgetBinding, addFieldToWidgetBinding } = useReport();
  const isSelected = selectedWidgetId === widget.id;
  const [contextMenu, setContextMenu] = useState(null);

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

  // Field drop — allow dragging a field from the sidebar onto a widget
  const onFieldDragOver = (e) => {
    if (Array.from(e.dataTransfer.types).includes('application/x-tira-field')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onFieldDrop = (e) => {
    const raw = e.dataTransfer.getData('application/x-tira-field');
    if (!raw) return;
    e.preventDefault();
    e.stopPropagation();
    const field = JSON.parse(raw);
    const pick = pickSlotForField(widget, field);
    if (!pick) return;
    if (pick.multiple) {
      addFieldToWidgetBinding(widget.id, pick.slotId, field.id);
    } else {
      setWidgetBinding(widget.id, pick.slotId, field.id);
    }
  };

  return (
    <div
      className={`widget-wrapper${isSelected ? ' selected' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDragOver={onFieldDragOver}
      onDrop={onFieldDrop}
    >
      <div className="widget-drag-handle">
        <span className="drag-dots">⋮⋮</span>
      </div>
      <div className="widget-content">
        {children}
      </div>
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
