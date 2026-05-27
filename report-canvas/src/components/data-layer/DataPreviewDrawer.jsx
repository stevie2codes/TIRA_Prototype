// Forge components: ForgeIcon, ForgeIconButton
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { fetchData } from '../../services/dataService.js';
import { findSource } from '../../data/sourceCatalog.js';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import './DataPreviewDrawer.css';

const TABS = [
  { id: 'source', label: 'Source data',    desc: 'Raw rows from the source you clicked on the canvas' },
  { id: 'model',  label: 'Model output',   desc: 'Rows your report and the chat AI will see (joins applied)' },
];

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 720;
const DEFAULT_HEIGHT = 360;

export default function DataPreviewDrawer() {
  const { nodes, selectedNodeId, selectedSources, fieldLibrary, generatedData } = useReport();
  const [activeTab, setActiveTab] = useState('model');
  const [collapsed, setCollapsed] = useState(false);
  const [rows, setRows] = useState([]);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const drawerRef = useRef(null);

  // Resize: drag the top handle up/down
  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const next = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight - (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [height]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const selectedSourceId = selectedNode?.data?.sourceId;

  function getSchemaForSource(sourceId) {
    const entry = selectedSources.find(s => s.sourceId === sourceId);
    return entry?.inlineSchema || getSchemaFor(sourceId);
  }

  // Load rows whenever tab / selection / sources change
  useEffect(() => {
    let cancelled = false;
    async function load() {
      // SOURCE DATA TAB — rows for the clicked source
      if (activeTab === 'source') {
        if (!selectedSourceId) { setRows([]); return; }
        const entry = selectedSources.find(s => s.sourceId === selectedSourceId);
        // Pre-populated (handoff)
        const pre = generatedData[`source-${selectedSourceId}`];
        if (pre && Array.isArray(pre.rows)) {
          if (!cancelled) setRows(pre.rows);
          return;
        }
        const schema = entry?.inlineSchema || getSchemaFor(selectedSourceId);
        const fields = schema.map(f => f.name);
        const data = await fetchData(selectedSourceId, 8, fields).catch(() => []);
        if (!cancelled) setRows(data);
        return;
      }

      // MODEL OUTPUT TAB — combined rows from all sources
      if (activeTab === 'model') {
        if (selectedSources.length === 0) { setRows([]); return; }

        // Fetch (or use pre-loaded) rows per source, in parallel
        const perSource = await Promise.all(
          selectedSources.map(async (sel) => {
            const pre = generatedData[`source-${sel.sourceId}`];
            if (pre && Array.isArray(pre.rows)) return { sourceId: sel.sourceId, rows: pre.rows };
            const schema = sel.inlineSchema || getSchemaFor(sel.sourceId);
            const fields = schema.map(f => f.name);
            const rows = await fetchData(sel.sourceId, 8, fields).catch(() => []);
            return { sourceId: sel.sourceId, rows };
          })
        );

        // Positional zip: row i = combined { qualifiedField: value } from all sources
        const maxLen = Math.max(...perSource.map(p => p.rows.length), 0);
        const combined = [];
        for (let i = 0; i < maxLen; i++) {
          const merged = {};
          for (const { sourceId, rows } of perSource) {
            const row = rows[i] || {};
            for (const key of Object.keys(row)) {
              merged[`${sourceId}.${key}`] = row[key];
            }
          }
          combined.push(merged);
        }
        if (!cancelled) setRows(combined);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, selectedSourceId, selectedSources, generatedData]);

  const columns = useMemo(() => {
    if (activeTab === 'source' && selectedSourceId) {
      return getSchemaForSource(selectedSourceId).map(f => ({ key: f.name, label: f.name, role: f.role }));
    }
    // model tab: show the unified Field Library (joined model output)
    if (activeTab === 'model') {
      return fieldLibrary.map(f => ({ key: f.qualifiedName, label: f.qualifiedName, role: f.role }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedSourceId, selectedSources, fieldLibrary]);

  const activeTabDef = TABS.find(t => t.id === activeTab);

  if (collapsed) {
    return (
      <div className="preview-drawer preview-drawer--collapsed">
        <button className="preview-drawer__toggle" onClick={() => setCollapsed(false)}>
          <ForgeIcon name="expand_less" />
          <span>Data preview — sample rows your model will produce</span>
        </button>
      </div>
    );
  }

  return (
    <div className="preview-drawer" ref={drawerRef} style={{ height: `${height}px`, flex: `0 0 ${height}px` }}>
      <div
        className="preview-drawer__resize"
        onMouseDown={onResizeStart}
        title="Drag to resize"
      >
        <div className="preview-drawer__resize-grip" />
      </div>
      <div className="preview-drawer__top">
        <div className="preview-drawer__top-label">DATA PREVIEW</div>
        <div className="preview-drawer__top-help">
          Sample rows · Right rail's MODEL tab shows the schema; this shows the rows that schema produces.
        </div>
      </div>
      <div className="preview-drawer__header">
        <div className="preview-drawer__tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`preview-drawer__tab ${activeTab === t.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              title={t.desc}
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
      <div className="preview-drawer__subtitle">{activeTabDef?.desc}</div>
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
                    <td key={c.key}>{formatCell(row[c.key])}</td>
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
