// Forge components: none (HTML table styled with Forge tokens)
import { useReport } from '../../../context/ReportContext.jsx';

function formatCell(value) {
  if (typeof value === 'number') return value.toLocaleString();
  return String(value ?? '');
}

export default function TableWidget({ widget }) {
  const { fieldLibrary, generatedData } = useReport();

  // bindings.columns can be a string (legacy) or array of field IDs
  const bound = widget.bindings?.columns;
  const fieldIds = Array.isArray(bound) ? bound : bound ? [bound] : [];

  if (fieldIds.length === 0) {
    return (
      <div className="table-widget">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-placeholder-inner">
          <span className="widget-type-label">Drag fields into Columns to populate this table</span>
        </div>
      </div>
    );
  }

  // Resolve each field ID to { source, fieldName }
  const resolved = fieldIds.map(id => {
    const f = fieldLibrary.find(lf => lf.id === id);
    return f ? { fieldId: id, sourceId: f.sourceId, fieldName: id.split('.').pop(), label: f.displayName || f.qualifiedName, role: f.role } : null;
  }).filter(Boolean);

  // Group rows by source — pull from generatedData. Positional zip across sources.
  const sourceIds = [...new Set(resolved.map(r => r.sourceId).filter(Boolean))];
  const perSource = sourceIds.map(sid => ({ sourceId: sid, rows: generatedData[`source-${sid}`]?.rows || [] }));
  const maxLen = Math.max(...perSource.map(p => p.rows.length), 0);

  if (maxLen === 0) {
    return (
      <div className="table-widget">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-placeholder-inner">
          <span className="widget-type-label">Loading data…</span>
        </div>
      </div>
    );
  }

  const rows = [];
  for (let i = 0; i < maxLen; i++) {
    const merged = {};
    for (const { sourceId, rows: srows } of perSource) {
      const row = srows[i] || {};
      for (const key of Object.keys(row)) merged[`${sourceId}.${key}`] = row[key];
    }
    rows.push(merged);
  }

  return (
    <div className="table-widget">
      <h3 className="widget-title">{widget.title}</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {resolved.map(r => (
                <th key={r.fieldId}>{r.label.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {resolved.map(r => {
                  const val = row[r.fieldId];
                  const num = typeof val === 'number';
                  return (
                    <td key={r.fieldId} className={num ? 'num' : ''}>
                      {num ? formatCell(val) : String(val ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
