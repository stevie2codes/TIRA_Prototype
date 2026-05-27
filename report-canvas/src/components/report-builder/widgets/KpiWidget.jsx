// Forge components: ForgeCard, ForgeIcon
import { ForgeCard, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../../context/ReportContext.jsx';

function formatValue(value, format) {
  if (value == null || Number.isNaN(value)) return '--';
  if (format === 'currency') {
    if (Math.abs(value) >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(value) >= 1_000) return '$' + (value / 1_000).toFixed(1) + 'K';
    return '$' + value.toLocaleString();
  }
  if (format === 'percent') {
    return value + '%';
  }
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

export default function KpiWidget({ widget }) {
  const { fieldLibrary, generatedData } = useReport();
  const valueField = fieldLibrary.find(f => f.id === widget.bindings?.value);

  let value = null;
  if (valueField) {
    const rows = generatedData[`source-${valueField.sourceId}`]?.rows || [];
    const fieldName = valueField.qualifiedName.split('.').pop();
    const sum = rows.reduce((acc, r) => {
      const v = r[fieldName];
      return acc + (typeof v === 'number' ? v : 0);
    }, 0);
    value = sum;
  }

  if (!valueField) {
    return (
      <ForgeCard style={{ height: '100%' }}>
        <div className="kpi-widget">
          <span className="kpi-label">{widget.title}</span>
          <span className="kpi-value" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Bind a measure to display a KPI
          </span>
        </div>
      </ForgeCard>
    );
  }

  const format = widget.config?.format || (valueField.type === 'currency' ? 'currency' : 'number');
  const display = formatValue(value, format);

  const trend = widget.config?.trend;
  const trendValue = widget.config?.trendValue || '';

  return (
    <ForgeCard style={{ height: '100%' }}>
      <div className="kpi-widget">
        <span className="kpi-label">{widget.title}</span>
        <span className="kpi-value">{display}</span>
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
