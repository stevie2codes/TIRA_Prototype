// Forge components: ForgeIcon
import { Handle, Position } from '@xyflow/react';
import { ForgeIcon } from '@tylertech/forge-react';

const ICONS = {
  filter: 'filter_alt',
  aggregate: 'functions',
  calculated: 'calculate',
  sort: 'sort',
};

export default function TransformNode({ data }) {
  const icon = ICONS[data.subtype] || 'transform';

  return (
    <div className="node-card transform-card">
      <Handle type="target" position={Position.Left} />
      <div className="node-header transform">
        <ForgeIcon name={icon} />
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-body">
        <span className="node-config-summary">
          {data.configSummary || 'Configure in properties panel'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
