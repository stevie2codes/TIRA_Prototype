// Forge components: ForgeIcon
import { Handle, Position } from '@xyflow/react';
import { ForgeIcon } from '@tylertech/forge-react';
import { findSource } from '../../../data/sourceCatalog.js';
import { getSchemaFor } from '../../../data/sourceSchemas.js';

const ROLE_COLORS = {
  dimension: '#3b6ea5',
  measure:   '#2d8659',
};

const ROLE_ICONS = {
  dimension: '▦',
  measure:   '∑',
};

export default function SourceNode({ data, selected }) {
  // New catalog-driven source
  if (data.sourceId) {
    const meta = findSource(data.sourceId);
    const schema = getSchemaFor(data.sourceId);
    const includedSet = new Set(data.includedFields || []);
    const includedFieldDefs = schema.filter(f => includedSet.has(f.name));
    const previewFields = includedFieldDefs.slice(0, 4);
    const overflow = includedFieldDefs.length - previewFields.length;

    return (
      <div className={`source-node ${selected ? 'is-selected' : ''}`}>
        <Handle type="target" position={Position.Left} />
        <div className="source-node__header">
          <div className="source-node__title">{meta?.label || data.sourceId}</div>
          <div className="source-node__meta">{meta?.system} · {meta?.rowCount?.toLocaleString()} rows</div>
        </div>
        <div className="source-node__fields">
          {previewFields.map(f => (
            <div key={f.name} className="source-node__field">
              <span style={{ color: ROLE_COLORS[f.role], width: 14, display: 'inline-block', textAlign: 'center' }}>
                {ROLE_ICONS[f.role]}
              </span>
              <span>{f.name}</span>
            </div>
          ))}
          {overflow > 0 && (
            <div className="source-node__field source-node__field--more">+{overflow} more</div>
          )}
          {includedFieldDefs.length === 0 && (
            <div className="source-node__field source-node__field--empty">No fields selected</div>
          )}
        </div>
        <Handle type="source" position={Position.Right} />
      </div>
    );
  }

  // Legacy (chat-handoff) source — keep working
  return (
    <div className={`source-node ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="source-node__header">
        <ForgeIcon name={data.icon || 'database'} style={{ fontSize: 16, color: '#3b6ea5' }} />
        <div>
          <div className="source-node__title">{data.label}</div>
          {data.configSummary && (
            <div className="source-node__meta">{data.configSummary}</div>
          )}
        </div>
      </div>
      {data.fields && data.fields.length > 0 && (
        <div className="source-node__fields">
          {data.fields.slice(0, 4).map(f => (
            <div key={f} className="source-node__field">{f}</div>
          ))}
          {data.fields.length > 4 && (
            <div className="source-node__field source-node__field--more">+{data.fields.length - 4} more</div>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
