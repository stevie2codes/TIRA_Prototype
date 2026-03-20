// Forge components: ForgeIcon
import { ForgeIcon } from '@tylertech/forge-react';

export default function DragOverlayContent({ item }) {
  if (!item) return null;

  return (
    <div className="drag-overlay">
      {item.icon && <ForgeIcon name={item.icon} />}
      <span>{item.label || item.title || item.type}</span>
    </div>
  );
}
