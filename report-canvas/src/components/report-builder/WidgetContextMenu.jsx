// Forge components: ForgeIcon
import { ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';

const menuItems = [
  { value: 'duplicate', label: 'Duplicate', icon: 'content_copy' },
  { value: 'delete', label: 'Delete', icon: 'delete' },
  { divider: true },
  { value: 'front', label: 'Bring to Front', icon: 'flip_to_front' },
  { value: 'back', label: 'Send to Back', icon: 'flip_to_back' },
];

export default function WidgetContextMenu({ widgetId, position, onClose }) {
  const { duplicateWidget, removeWidget, widgets, setWidgets } = useReport();

  const handleSelect = (value) => {
    switch (value) {
      case 'duplicate':
        duplicateWidget(widgetId);
        break;
      case 'delete':
        removeWidget(widgetId);
        break;
      case 'front': {
        const maxRow = Math.max(...widgets.map(w => w.gridRow));
        const widget = widgets.find(w => w.id === widgetId);
        if (widget) {
          setWidgets(prev => prev.filter(w => w.id !== widgetId).concat({ ...widget, gridRow: maxRow + widget.rowSpan }));
        }
        break;
      }
      case 'back': {
        const widget = widgets.find(w => w.id === widgetId);
        if (widget) {
          setWidgets(prev => [{ ...widget, gridRow: 1 }, ...prev.filter(w => w.id !== widgetId)]);
        }
        break;
      }
    }
    onClose();
  };

  return (
    <>
      <div className="context-menu-backdrop" onClick={onClose} />
      <div
        className="context-menu"
        style={{ left: position.x, top: position.y }}
      >
        {menuItems.map((item, i) =>
          item.divider ? (
            <div key={i} className="context-menu-divider" />
          ) : (
            <button
              key={item.value}
              className="context-menu-item"
              onClick={() => handleSelect(item.value)}
            >
              <ForgeIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          )
        )}
      </div>
    </>
  );
}
