// Forge components: ForgeIcon, ForgeIconButton
import { useState, useMemo, useEffect } from 'react';
import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { fetchData } from '../../services/dataService.js';
import { findSource } from '../../data/sourceCatalog.js';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import './DataPreviewDrawer.css';

const TABS = [
  { id: 'selected', label: 'Selected Source' },
  { id: 'joined',   label: 'Joined Output' },
  { id: 'library',  label: 'Field Library Preview' },
];

export default function DataPreviewDrawer() {
  const { nodes, selectedNodeId, selectedSources, fieldLibrary, generatedData } = useReport();
  const [activeTab, setActiveTab] = useState('library');
  const [collapsed, setCollapsed] = useState(false);
  const [rows, setRows] = useState([]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedSourceId = selectedNode?.data?.sourceId;

  function getSchemaForSource(sourceId) {
    const entry = selectedSources.find(s => s.sourceId === sourceId);
    return entry?.inlineSchema || getSchemaFor(sourceId);
  }

  // Fetch preview rows when tab/selection changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Determine target sourceId for the active tab
      let targetId = null;
      if (activeTab === 'selected') targetId = selectedSourceId;
      else if ((activeTab === 'joined' || activeTab === 'library') && selectedSources.length > 0) {
        targetId = selectedSources[0].sourceId;
      }
      if (!targetId) { setRows([]); return; }

      // Prefer pre-populated generated data (e.g., chat handoff)
      const pre = generatedData[`source-${targetId}`];
      if (pre && Array.isArray(pre.rows) && pre.rows.length > 0) {
        if (!cancelled) setRows(pre.rows);
        return;
      }

      // Otherwise fetch mock data via service
      const entry = selectedSources.find(s => s.sourceId === targetId);
      const schema = entry?.inlineSchema || getSchemaFor(targetId);
      const fields = schema.map(f => f.name);
      const data = await fetchData(targetId, 5, fields).catch(() => []);
      if (!cancelled) setRows(data);
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, selectedSourceId, selectedSources, generatedData]);

  const columns = useMemo(() => {
    if (activeTab === 'selected' && selectedSourceId) {
      return getSchemaForSource(selectedSourceId).map(f => ({ key: f.name, label: f.name, role: f.role }));
    }
    if (activeTab === 'library') {
      return fieldLibrary.map(f => ({ key: f.qualifiedName, label: f.qualifiedName, role: f.role }));
    }
    if (selectedSources.length === 0) return [];
    const primaryId = selectedSources[0].sourceId;
    return getSchemaForSource(primaryId).map(f => ({ key: f.name, label: `${primaryId}.${f.name}`, role: f.role }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedSourceId, selectedSources, fieldLibrary]);

  if (collapsed) {
    return (
      <div className="preview-drawer preview-drawer--collapsed">
        <button className="preview-drawer__toggle" onClick={() => setCollapsed(false)}>
          <ForgeIcon name="expand_less" />
          <span>Data Preview</span>
        </button>
      </div>
    );
  }

  return (
    <div className="preview-drawer">
      <div className="preview-drawer__header">
        <div className="preview-drawer__tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`preview-drawer__tab ${activeTab === t.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="preview-drawer__meta">
          {rows.length > 0 && (() => {
            const primary = selectedSources[0];
            if (!primary) return null;
            const entry = primary;
            const total = entry.meta?.rowCount ?? findSource(primary.sourceId)?.rowCount ?? rows.length;
            return `Showing ${rows.length} of ${total.toLocaleString()}`;
          })()}
          <ForgeIconButton density="small" on-click={() => setCollapsed(true)} aria-label="Collapse">
            <ForgeIcon name="expand_more" />
          </ForgeIconButton>
        </div>
      </div>
      <div className="preview-drawer__table-wrap">
        {columns.length === 0 ? (
          <div className="preview-drawer__empty">No data to preview. Add a source to the model.</div>
        ) : (
          <table className="preview-drawer__table">
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c.key}>
                    {c.label}
                    {c.role && <span className={`preview-drawer__role-tag preview-drawer__role-tag--${c.role}`}>{c.role === 'dimension' ? 'dim' : 'measure'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c.key}>{formatCell(row[c.key.split('.').pop()])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatCell(v) {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}
