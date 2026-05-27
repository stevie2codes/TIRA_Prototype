// Forge components: ForgeExpansionPanel, ForgeIcon
import { useState } from 'react';
import { ForgeExpansionPanel, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import FieldsTab from './FieldsTab.jsx';

const widgetTypes = {
  visualizations: [
    { type: 'chart', subtype: 'bar', icon: 'bar_chart', label: 'Bar Chart', colSpan: 6, rowSpan: 3 },
    { type: 'chart', subtype: 'line', icon: 'show_chart', label: 'Line Chart', colSpan: 6, rowSpan: 3 },
    { type: 'chart', subtype: 'pie', icon: 'pie_chart', label: 'Pie / Donut', colSpan: 4, rowSpan: 3 },
    { type: 'chart', subtype: 'area', icon: 'area_chart', label: 'Area Chart', colSpan: 6, rowSpan: 3 },
    { type: 'chart', subtype: 'scatter', icon: 'scatter_plot', label: 'Scatter Plot', colSpan: 6, rowSpan: 3 },
  ],
  dataDisplay: [
    { type: 'table', icon: 'table_chart', label: 'Data Table', colSpan: 12, rowSpan: 3 },
    { type: 'kpi', icon: 'speed', label: 'KPI / Metric Card', colSpan: 4, rowSpan: 1 },
  ],
  content: [
    { type: 'text', icon: 'article', label: 'Rich Text Block', colSpan: 12, rowSpan: 1 },
    { type: 'image', icon: 'image', label: 'Image', colSpan: 6, rowSpan: 2 },
    { type: 'divider', icon: 'horizontal_rule', label: 'Divider', colSpan: 12, rowSpan: 1 },
    { type: 'section-header', icon: 'title', label: 'Section Header', colSpan: 12, rowSpan: 1 },
  ],
};

const ICON_STYLES = {
  viz:     { bg: '#eff6ff', fg: '#1d4ed8' },
  data:    { bg: '#f5f3ff', fg: '#7c3aed' },
  content: { bg: '#f3f4f6', fg: '#4b5563' },
};

function WidgetsTab() {
  const { widgets, addWidget } = useReport();
  const getNextRow = () => widgets.length === 0 ? 1 : Math.max(...widgets.map(w => w.gridRow + w.rowSpan));

  const handleClick = (config) => {
    addWidget({
      id: `widget-${Date.now()}`,
      type: config.type,
      title: config.label,
      gridColumn: 1,
      gridRow: getNextRow(),
      colSpan: config.colSpan,
      rowSpan: config.rowSpan,
      config: config.subtype ? { subtype: config.subtype } : {},
    });
  };

  const onDragStart = (event, config) => {
    event.dataTransfer.setData('application/widget', JSON.stringify(config));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const renderItem = (w, colorClass, iconStyle) => (
    <div
      key={`${w.type}-${w.subtype || w.label}`}
      className={`palette-node ${colorClass}`}
      draggable
      onDragStart={(e) => onDragStart(e, w)}
      onClick={() => handleClick(w)}
    >
      <div className="palette-icon-container" style={{ background: iconStyle.bg }}>
        <ForgeIcon name={w.icon} style={{ color: iconStyle.fg, fontSize: 18 }} />
      </div>
      <span>{w.label}</span>
      <ForgeIcon name="drag_indicator" className="palette-drag-hint" />
    </div>
  );

  return (
    <div className="palette">
      <ForgeExpansionPanel open>
        <span slot="header">Visualizations</span>
        <div className="palette-items">
          {widgetTypes.visualizations.map(w => renderItem(w, 'viz', ICON_STYLES.viz))}
        </div>
      </ForgeExpansionPanel>
      <ForgeExpansionPanel open>
        <span slot="header">Data Display</span>
        <div className="palette-items">
          {widgetTypes.dataDisplay.map(w => renderItem(w, 'data', ICON_STYLES.data))}
        </div>
      </ForgeExpansionPanel>
      <ForgeExpansionPanel open>
        <span slot="header">Content</span>
        <div className="palette-items">
          {widgetTypes.content.map(w => renderItem(w, 'content', ICON_STYLES.content))}
        </div>
      </ForgeExpansionPanel>
    </div>
  );
}

export default function WidgetPalette() {
  const [tab, setTab] = useState('widgets');

  return (
    <div className="palette-container">
      <div className="palette-tabs">
        <button className={`palette-tab ${tab === 'widgets' ? 'is-active' : ''}`} onClick={() => setTab('widgets')}>
          WIDGETS
        </button>
        <button className={`palette-tab ${tab === 'fields' ? 'is-active' : ''}`} onClick={() => setTab('fields')}>
          FIELDS
        </button>
      </div>
      <div className="palette-body">
        {tab === 'widgets' ? <WidgetsTab /> : <FieldsTab />}
      </div>
    </div>
  );
}
