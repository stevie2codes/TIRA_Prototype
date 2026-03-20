// Forge components: ForgeCard, ForgeIcon
import { ForgeCard, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../../context/ReportContext.jsx';

function formatValue(value, format) {
  if (format === 'currency') {
    return '$' + (value / 1_000_000).toFixed(1) + 'M';
  }
  if (format === 'percent') {
    return value + '%';
  }
  return String(value);
}

export default function KpiWidget({ widget }) {
  const { datasets } = useReport();
  const dsName = widget.config?.dataSource;
  const dataset = dsName ? datasets[dsName] : null;
  const metricKey = widget.config?.metric;

  // Try to get value from the dataset's kpiMetrics map, or fall back to row data
  let value = '--';
  if (dataset?.kpiMetrics?.[metricKey]) {
    const m = dataset.kpiMetrics[metricKey];
    value = formatValue(m.value, widget.config?.format || m.format);
  } else if (dataset?.rows?.[0]?.[metricKey] !== undefined) {
    value = formatValue(dataset.rows[0][metricKey], widget.config?.format);
  }

  const trend = widget.config?.trend;
  const trendValue = widget.config?.trendValue || '';

  return (
    <ForgeCard style={{ height: '100%' }}>
      <div className="kpi-widget">
        <span className="kpi-label">{widget.title}</span>
        <span className="kpi-value">{value}</span>
        {trend && (
          <span className={`kpi-trend ${trend === 'down' ? 'positive' : ''}`}>
            <ForgeIcon name={trend === 'up' ? 'trending_up' : 'trending_down'} />
            {trendValue} vs prior year
          </span>
        )}
      </div>
    </ForgeCard>
  );
}
