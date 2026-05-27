// Forge components: none (uses recharts)
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useReport } from '../../../context/ReportContext.jsx';

const COLORS = ['#1976d2', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4'];

function renderChart(subtype, data) {
  // data: [{label, value}, ...]
  const categoryKey = 'label';
  const valueKey = 'value';

  switch (subtype) {
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={valueKey} stroke={COLORS[0]} strokeWidth={2} />
        </LineChart>
      );
    case 'pie':
      return (
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={categoryKey} cx="50%" cy="50%" outerRadius="70%" label>
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
          <Area type="monotone" dataKey={valueKey} fill={COLORS[0]} fillOpacity={0.2} stroke={COLORS[0]} />
        </AreaChart>
      );
    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} name={categoryKey} fontSize={11} />
          <YAxis dataKey={valueKey} name={valueKey} fontSize={11} />
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
          <Bar dataKey={valueKey} fill={COLORS[0]} />
        </BarChart>
      );
  }
}

export default function ChartWidget({ widget }) {
  const { fieldLibrary, generatedData } = useReport();
  const subtype = widget.config?.subtype || 'bar';

  const xField = fieldLibrary.find(f => f.id === widget.bindings?.xAxis);
  const yField = fieldLibrary.find(f => f.id === widget.bindings?.yAxis);

  const ySourceId = yField?.sourceId;
  const rows = ySourceId ? (generatedData[`source-${ySourceId}`]?.rows || []) : [];

  const chartData = (xField && yField && rows.length > 0)
    ? rows.slice(0, 8).map(row => ({
        label: String(row[xField.qualifiedName.split('.').pop()] ?? ''),
        value: Number(row[yField.qualifiedName.split('.').pop()] ?? 0),
      }))
    : [];

  if (!xField || !yField || chartData.length === 0) {
    return (
      <div className="chart-widget">
        <h3 className="widget-title">{widget.title}</h3>
        <div className="widget-placeholder-inner">
          <span className="widget-type-label">Drag a dimension to X axis and a measure to Y axis</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-widget">
      <h3 className="widget-title">{widget.title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        {renderChart(subtype, chartData)}
      </ResponsiveContainer>
    </div>
  );
}
