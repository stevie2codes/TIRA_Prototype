// Forge components: none
import { useReport } from '../../../context/ReportContext.jsx';
import { normalizeColumn, formatCellValue, defaultAlign, aggregateForTotal } from '../../../utils/columnConfig.js';

const DEFAULT_TABLE_SETTINGS = {
  striped: true,
  density: 'normal',
  showHeader: true,
  showTotals: false,
};

export default function TableWidget({ widget }) {
  const { fieldLibrary, generatedData } = useReport();

  const bound = widget.bindings?.columns;
  const rawEntries = Array.isArray(bound) ? bound : (bound ? [bound] : []);
  const columns = rawEntries.map(normalizeColumn).filter(Boolean).filter(c => !c.hidden);

  const settings = { ...DEFAULT_TABLE_SETTINGS, ...(widget.config?.tableSettings || {}) };

  if (columns.length === 0) {
    return (
      <div className="table-widget">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-placeholder-inner">
          <span className="widget-type-label">Drag fields into Columns to populate this table</span>
        </div>
      </div>
    );
  }

  // Resolve each column to its field meta + render meta
  const resolved = columns.map(col => {
    const fieldMeta = fieldLibrary.find(f => f.id === col.fieldId);
    return {
      column: col,
      fieldMeta,
      align: col.align || defaultAlign(fieldMeta),
      headerText: col.displayName || fieldMeta?.displayName || col.fieldId,
    };
  });

  // Pull rows from generatedData; positional zip across sources
  const sourceIds = [...new Set(resolved.map(r => r.fieldMeta?.sourceId).filter(Boolean))];
  const perSource = sourceIds.map(sid => ({ sourceId: sid, rows: generatedData?.[`source-${sid}`]?.rows || [] }));
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

  // Decide if a totals row should render
  const anyTotals = settings.showTotals && resolved.some(r => r.column.includeInTotals);

  // For auto-default totals: if showTotals true but NO column has includeInTotals,
  // auto-enable totals on every measure + the first dimension column for display.
  const effectiveTotalsColumns = anyTotals
    ? resolved.map(r => r.column)
    : (settings.showTotals
      ? resolved.map((r, idx) => {
          if (r.fieldMeta?.role === 'measure') return { ...r.column, includeInTotals: true };
          const firstDimIdx = resolved.findIndex(rr => rr.fieldMeta?.role !== 'measure');
          if (idx === firstDimIdx) return { ...r.column, includeInTotals: true };
          return r.column;
        })
      : []);

  // Attach _fieldMeta to each column entry for aggregateForTotal's lookup
  const totalsEntries = effectiveTotalsColumns.map((c, idx) => ({ ...c, _fieldMeta: resolved[idx]?.fieldMeta }));

  return (
    <div className={`table-widget table-widget--${settings.density}${settings.striped ? ' is-striped' : ''}`}>
      <h3 className="widget-title">{widget.title}</h3>
      <div className="table-scroll">
        <table className="data-table">
          {settings.showHeader && (
            <thead>
              <tr>
                {resolved.map(({ column, headerText, align }) => (
                  <th key={column.fieldId} style={{ textAlign: align }}>
                    {headerText.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {resolved.map(({ column, fieldMeta, align }) => {
                  const raw = row[column.fieldId];
                  const display = formatCellValue(raw, column, fieldMeta);
                  return (
                    <td key={column.fieldId} style={{ textAlign: align }}>{display}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {settings.showTotals && (
            <tfoot>
              <tr className="data-table__totals">
                {resolved.map(({ column, fieldMeta, align }, idx) => {
                  const totalsEntry = totalsEntries[idx];
                  const value = aggregateForTotal(rows, totalsEntry, fieldMeta, idx, totalsEntries);
                  return (
                    <td key={column.fieldId} style={{ textAlign: align }}>
                      {value ?? ''}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
