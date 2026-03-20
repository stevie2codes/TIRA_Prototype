// Forge components: ForgeIcon
import { Handle, Position } from '@xyflow/react';
import { ForgeIcon } from '@tylertech/forge-react';

export default function OutputNode({ data }) {
  return (
    <div className="node-card output-card">
      <Handle type="target" position={Position.Left} />
      <div className="node-header output">
        <ForgeIcon name="output" />
        <span className="node-title">{data.label}</span>
      </div>
      <div className="node-fields">
        {data.fields?.map((field) => (
          <div key={field} className="node-field">
            <span className="node-field-name">{field}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
