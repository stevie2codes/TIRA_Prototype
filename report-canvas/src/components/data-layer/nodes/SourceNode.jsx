// Forge components: ForgeIcon
import { Handle, Position } from '@xyflow/react';
import { ForgeIcon } from '@tylertech/forge-react';

export default function SourceNode({ data }) {
  const isConfigured = data.configured;

  return (
    <div className={`node-card source-card${isConfigured ? '' : ' unconfigured'}`}>
      <div className="node-header source">
        <ForgeIcon name={data.icon || 'storage'} />
        <span className="node-title">{data.label}</span>
      </div>
      {isConfigured ? (
        <div className="node-fields">
          {data.fields?.map((field) => (
            <div key={field} className="node-field">
              <span className="node-field-name">{field}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="node-unconfigured">
          <ForgeIcon name="ads_click" style={{ fontSize: 18, color: '#9ca3af' }} />
          <span>Select to configure</span>
        </div>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
