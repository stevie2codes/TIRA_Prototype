// Forge components: none (HTML table styled with Forge tokens)
import { useReport } from '../../../context/ReportContext.jsx';

function formatCell(value) {
  if (typeof value === 'number') {
    return '$' + value.toLocaleString();
  }
  return String(value ?? '');
}

function isNumeric(value) {
  return typeof value === 'number';
}

export default function TableWidget({ widget }) {
  const { datasets } = useReport();
  const dsName = widget.config?.dataSource;
  const dataset = dsName ? datasets[dsName] : null;

  if (!dataset || !dataset.rows.length) {
    return (
      <div className="table-widget">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-placeholder-inner">
          <span className="widget-type-label">No data source selected</span>
        </div>
      </div>
    );
  }

  const columns = dataset.columns || Object.keys(dataset.rows[0]);

  return (
    <div className="table-widget">
      <h3 className="widget-title">{widget.title}</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.rows.map((row, i) => (
              <tr key={i}>
                {columns.map(col => {
                  const val = row[col];
                  const num = isNumeric(val);
                  const negative = num && col.toLowerCase().includes('variance') && val < 0;
                  const positive = num && col.toLowerCase().includes('variance') && val >= 0;
                  return (
                    <td
                      key={col}
                      className={`${num ? 'num' : ''} ${negative ? 'negative' : ''} ${positive ? 'positive' : ''}`}
                    >
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
