// Forge components: ForgeIcon
import { ForgeIcon } from '@tylertech/forge-react';

export default function ImageWidget({ widget }) {
  return (
    <div className="image-widget">
      <ForgeIcon name="image" style={{ fontSize: 48, opacity: 0.3 }} />
      <span className="image-label">{widget.title || 'Image'}</span>
    </div>
  );
}
