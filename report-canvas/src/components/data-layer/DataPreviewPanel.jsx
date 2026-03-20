// Forge components: ForgeIcon, ForgeIconButton
import { useState } from 'react';
import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';

const MAX_PREVIEW_ROWS = 50;

function formatCell(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export default function DataPreviewPanel() {
  const { nodes, selectedNodeId, datasets } = useReport();
  const [collapsed, setCollapsed] = useState(false);

  // Determine which dataset to show
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  let datasetName = null;
  let dataset = null;

  if (selectedNode) {
    // Show the source node's data if it's a source
    if (selectedNode.type === 'source' && selectedNode.data?.label) {
      datasetName = selectedNode.data.label;
      dataset = datasets[datasetName];
    }
    // Output node → show the joined output
    if (selectedNode.type === 'output') {
      datasetName = 'Budget vs Actuals by Dept';
      dataset = datasets[datasetName];
    }
  }

  // Default: show the main output dataset
  if (!dataset) {
    datasetName = 'Line Items';
    dataset = datasets[datasetName];
  }

  const rows = dataset?.rows || [];
  const columns = dataset?.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);
  const displayRows = rows.slice(0, MAX_PREVIEW_ROWS);
  const truncated = rows.length > MAX_PREVIEW_ROWS;

  return (
    <div className={`data-preview-panel${collapsed ? ' collapsed' : ''}`}>
      <div className="data-preview-header" onClick={() => setCollapsed(c => !c)}>
        <div className="data-preview-header-left">
          <ForgeIcon name={collapsed ? 'expand_less' : 'expand_more'} style={{ fontSize: 18 }} />
          <ForgeIcon name="table_chart" style={{ fontSize: 16, opacity: 0.6 }} />
          <span className="data-preview-title">{datasetName}</span>
          <span className="data-preview-count">{rows.length} rows</span>
        </div>
        <div className="data-preview-header-right">
          {selectedNode && (
            <span className="data-preview-source-badge">
              <ForgeIcon name={selectedNode.data?.icon || 'dataset'} style={{ fontSize: 14 }} />
              {selectedNode.data?.label}
            </span>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className="data-preview-body">
          <table className="data-preview-table">
            <thead>
              <tr>
                <th className="data-preview-row-num">#</th>
                {columns.map(col => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr key={i}>
                  <td className="data-preview-row-num">{i + 1}</td>
                  {columns.map(col => (
                    <td key={col} className={typeof row[col] === 'number' ? 'num' : ''}>
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {truncated && (
            <div className="data-preview-truncated">
              Showing {MAX_PREVIEW_ROWS} of {rows.length} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
}
