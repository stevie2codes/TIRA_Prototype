// Forge components: ForgeSelect, ForgeOption, ForgeButton, ForgeIcon
import { useState, useMemo } from 'react';
import { ForgeSelect, ForgeOption, ForgeButton, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { getSchemaFor } from '../../data/sourceSchemas.js';

/**
 * Resolve the fields available on a node for join configuration.
 * Handles three shapes:
 *   - catalog-driven node:  data.sourceId + data.includedFields (look up catalog schema)
 *   - synthetic handoff:    data.sourceId + data.inlineSchema (use inline schema)
 *   - legacy:               data.fields (array of strings)
 */
function getFieldsForNode(node) {
  if (!node) return [];
  const d = node.data || {};
  if (d.sourceId) {
    const schema = d.inlineSchema || getSchemaFor(d.sourceId);
    const included = new Set(d.includedFields || []);
    return schema
      .filter(f => included.size === 0 || included.has(f.name))
      .map(f => f.name);
  }
  return d.fields || [];
}

/**
 * Heuristic: find the best default join keys between two field lists.
 * Prefers exact matches, then "<name>_id" ↔ "id", then any *_id field.
 */
function suggestJoinKeys(leftFields, rightFields) {
  const leftSet = new Set(leftFields);
  const rightSet = new Set(rightFields);

  // Exact name match
  for (const f of leftFields) if (rightSet.has(f)) return { left: f, right: f };

  // <singular>_id ↔ id pattern
  const leftFk = leftFields.find(f => f.endsWith('_id') && f !== 'id');
  if (leftFk && rightSet.has('id')) return { left: leftFk, right: 'id' };

  const rightFk = rightFields.find(f => f.endsWith('_id') && f !== 'id');
  if (rightFk && leftSet.has('id')) return { left: 'id', right: rightFk };

  // First field on each side
  return { left: leftFields[0] || '', right: rightFields[0] || '' };
}

export default function JoinConfigPopover({ edgeId, sourceNodeId, targetNodeId, position, onClose }) {
  const { nodes, edges, setEdges, relationships, setRelationships } = useReport();
  const sourceNode = nodes.find(n => n.id === sourceNodeId);
  const targetNode = nodes.find(n => n.id === targetNodeId);

  const sourceFields = useMemo(() => getFieldsForNode(sourceNode), [sourceNode]);
  const targetFields = useMemo(() => getFieldsForNode(targetNode), [targetNode]);

  const edge = edges.find(e => e.id === edgeId);
  const existingRel = relationships.find(r => r.id === edgeId);

  const suggested = useMemo(() => suggestJoinKeys(sourceFields, targetFields), [sourceFields, targetFields]);

  const [joinType, setJoinType] = useState(existingRel?.joinType || edge?.data?.joinType || 'inner');
  const [leftKey, setLeftKey] = useState(existingRel?.leftField || edge?.data?.leftKey || suggested.left);
  const [rightKey, setRightKey] = useState(existingRel?.rightField || edge?.data?.rightKey || suggested.right);

  const leftSourceId = sourceNode?.data?.sourceId || sourceNodeId;
  const rightSourceId = targetNode?.data?.sourceId || targetNodeId;
  const leftLabel = sourceNode?.data?.displayLabel || leftSourceId;
  const rightLabel = targetNode?.data?.displayLabel || rightSourceId;

  const handleApply = () => {
    // 1. Update the ReactFlow edge with a visible label + stored data
    setEdges(eds =>
      eds.map(e =>
        e.id === edgeId
          ? {
              ...e,
              data: { ...e.data, joinType, leftKey, rightKey },
              label: `${leftKey} = ${rightKey} · ${joinType}`,
              labelBgPadding: [6, 4],
              labelBgBorderRadius: 4,
              labelBgStyle: { fill: '#fff', stroke: '#a05c2c' },
              labelStyle: { fontSize: 10, fill: '#a05c2c' },
            }
          : e
      )
    );

    // 2. Persist into the semantic-model relationships state
    const relationship = {
      id: edgeId,
      leftSourceId,
      leftField: leftKey,
      rightSourceId,
      rightField: rightKey,
      joinType,
      cardinality: 'many-to-one',
    };
    setRelationships(prev => {
      const existing = prev.find(r => r.id === edgeId);
      return existing
        ? prev.map(r => r.id === edgeId ? relationship : r)
        : [...prev, relationship];
    });

    onClose();
  };

  const handleCancel = () => {
    // Remove the half-created edge if it was new
    if (!existingRel) {
      setEdges(eds => eds.filter(e => e.id !== edgeId));
    }
    onClose();
  };

  const handleRemove = () => {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    setRelationships(prev => prev.filter(r => r.id !== edgeId));
    onClose();
  };

  const noFields = sourceFields.length === 0 || targetFields.length === 0;

  return (
    <div className="join-popover-backdrop" onClick={handleCancel}>
      <div className="join-popover" onClick={(e) => e.stopPropagation()}>
      <h3 className="join-popover-title">
        <ForgeIcon name="link" />
        Configure Join
      </h3>

      <div className="join-popover-summary">
        <strong>{leftLabel}</strong> <span style={{ color: '#9ca3af' }}>→</span> <strong>{rightLabel}</strong>
      </div>

      {noFields ? (
        <div className="join-popover-empty">
          One of the sources has no fields selected. Add fields in the source's Inspector panel before configuring the join.
        </div>
      ) : (
        <>
          <div className="join-popover-field">
            <ForgeSelect label="Join type" value={joinType} on-change={(e) => setJoinType(e.detail)}>
              <ForgeOption value="inner">Inner join</ForgeOption>
              <ForgeOption value="left">Left join</ForgeOption>
              <ForgeOption value="right">Right join</ForgeOption>
              <ForgeOption value="full">Full outer join</ForgeOption>
            </ForgeSelect>
          </div>

          <div className="join-popover-field">
            <ForgeSelect label={`Left key (${leftLabel})`} value={leftKey} on-change={(e) => setLeftKey(e.detail)}>
              {sourceFields.map(f => (
                <ForgeOption key={f} value={f}>{f}</ForgeOption>
              ))}
            </ForgeSelect>
          </div>

          <div className="join-popover-field">
            <ForgeSelect label={`Right key (${rightLabel})`} value={rightKey} on-change={(e) => setRightKey(e.detail)}>
              {targetFields.map(f => (
                <ForgeOption key={f} value={f}>{f}</ForgeOption>
              ))}
            </ForgeSelect>
          </div>
        </>
      )}

      <div className="join-popover-actions">
        {existingRel && (
          <ForgeButton type="outlined" on-click={handleRemove}>
            Remove join
          </ForgeButton>
        )}
        <ForgeButton type="text" on-click={handleCancel}>Cancel</ForgeButton>
        <ForgeButton type="raised" on-click={handleApply} disabled={noFields}>
          Apply
        </ForgeButton>
      </div>
      </div>
    </div>
  );
}
