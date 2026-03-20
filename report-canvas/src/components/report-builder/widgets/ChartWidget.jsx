// Forge components: none (uses recharts)
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useReport } from '../../../context/ReportContext.jsx';

const COLORS = ['#1976d2', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4'];

function renderChart(subtype, data, chartKeys) {
  const categoryKey = chartKeys?.category || 'name';
  const valueKeys = chartKeys?.values || ['budget', 'actual'];

  switch (subtype) {
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
          ))}
        </LineChart>
      );
    case 'pie':
      return (
        <PieChart>
          <Pie data={data} dataKey={valueKeys[0]} nameKey={categoryKey} cx="50%" cy="50%" outerRadius="70%" label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    case 'area':
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} stroke={COLORS[i % COLORS.length]} />
          ))}
        </AreaChart>
      );
    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={valueKeys[0]} name={valueKeys[0]} fontSize={11} />
          <YAxis dataKey={valueKeys[1] || valueKeys[0]} name={valueKeys[1] || valueKeys[0]} fontSize={11} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Data" data={data} fill="#1976d2" />
        </ScatterChart>
      );
    case 'bar':
    default:
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} name={key.charAt(0).toUpperCase() + key.slice(1)} />
          ))}
        </BarChart>
      );
  }
}

export default function ChartWidget({ widget }) {
  const { datasets } = useReport();
  const subtype = widget.config?.subtype || 'bar';
  const dsName = widget.config?.dataSource;
  const dataset = dsName ? datasets[dsName] : null;

  if (!dataset) {
    return (
      <div className="chart-widget">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-placeholder-inner">
          <span className="widget-type-label">No data source selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-widget">
      <h3 className="widget-title">{widget.title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        {renderChart(subtype, dataset.rows, dataset.chartKeys)}
      </ResponsiveContainer>
    </div>
  );
}
