// Forge components: ForgeSelect, ForgeOption, ForgeButton, ForgeIcon
import { useState } from 'react';
import { ForgeSelect, ForgeOption, ForgeButton, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';

export default function JoinConfigPopover({ edgeId, sourceNodeId, targetNodeId, position, onClose }) {
  const { nodes, edges, setEdges } = useReport();
  const sourceNode = nodes.find(n => n.id === sourceNodeId);
  const targetNode = nodes.find(n => n.id === targetNodeId);

  const sourceFields = sourceNode?.data?.fields || [];
  const targetFields = targetNode?.data?.fields || [];

  const edge = edges.find(e => e.id === edgeId);
  const [joinType, setJoinType] = useState(edge?.data?.joinType || 'inner');
  const [leftKey, setLeftKey] = useState(edge?.data?.leftKey || sourceFields[0] || '');
  const [rightKey, setRightKey] = useState(edge?.data?.rightKey || targetFields[0] || '');

  const handleApply = () => {
    setEdges(eds =>
      eds.map(e =>
        e.id === edgeId
          ? { ...e, data: { ...e.data, joinType, leftKey, rightKey } }
          : e
      )
    );
    onClose();
  };

  const handleCancel = () => {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    onClose();
  };

  return (
    <div
      className="join-popover"
      style={{ left: position.x, top: position.y }}
    >
      <h3 className="join-popover-title">
        <ForgeIcon name="link" />
        Join Configuration
      </h3>

      <div className="join-popover-field">
        <ForgeSelect label="Join Type" value={joinType} on-change={(e) => setJoinType(e.detail)}>
          <ForgeOption value="inner">Inner Join</ForgeOption>
          <ForgeOption value="left">Left Join</ForgeOption>
          <ForgeOption value="right">Right Join</ForgeOption>
          <ForgeOption value="full">Full Outer Join</ForgeOption>
        </ForgeSelect>
      </div>

      <div className="join-popover-field">
        <ForgeSelect label="Left Key" value={leftKey} on-change={(e) => setLeftKey(e.detail)}>
          {sourceFields.map(f => (
            <ForgeOption key={f} value={f}>{f}</ForgeOption>
          ))}
        </ForgeSelect>
      </div>

      <div className="join-popover-field">
        <ForgeSelect label="Right Key" value={rightKey} on-change={(e) => setRightKey(e.detail)}>
          {targetFields.map(f => (
            <ForgeOption key={f} value={f}>{f}</ForgeOption>
          ))}
        </ForgeSelect>
      </div>

      <div className="join-popover-actions">
        <ForgeButton variant="text" onClick={handleCancel}>Cancel</ForgeButton>
        <ForgeButton variant="raised" onClick={handleApply}>Apply</ForgeButton>
      </div>
    </div>
  );
}
