// Forge components: ForgeTextField, ForgeSelect, ForgeOption, ForgeSlider, ForgeSwitch, ForgeIcon
import {
  ForgeTextField, ForgeSelect, ForgeOption, ForgeSlider, ForgeSwitch, ForgeIcon,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';

const DATA_WIDGET_TYPES = ['chart', 'table', 'kpi'];

export default function WidgetConfigPanel() {
  const { widgets, selectedWidgetId, updateWidget, datasets, datasetNames } = useReport();
  const widget = widgets.find(w => w.id === selectedWidgetId);

  if (!widget) {
    return (
      <div className="panel-empty">
        <div className="panel-empty-icon">
          <ForgeIcon name="widgets" style={{ fontSize: 28, color: '#9ca3af' }} />
        </div>
        <p className="panel-empty-title">No widget selected</p>
        <p className="panel-empty-desc">Click a widget on the canvas to view and edit its properties</p>
      </div>
    );
  }

  const update = (updates) => updateWidget(widget.id, updates);
  const updateConfig = (configUpdates) => update({ config: { ...widget.config, ...configUpdates } });
  const showDataSource = DATA_WIDGET_TYPES.includes(widget.type);
  const currentDataSource = widget.config?.dataSource || '';

  // Get available KPI metrics from the selected dataset
  const selectedDataset = currentDataSource ? datasets[currentDataSource] : null;
  const kpiMetricKeys = selectedDataset?.kpiMetrics
    ? Object.keys(selectedDataset.kpiMetrics)
    : selectedDataset?.columns || [];

  return (
    <div className="config-panel">
      {/* Data Source Section — shown for data-driven widgets */}
      {showDataSource && (
        <div className="config-section">
          <h3 className="config-section-title">Data Source</h3>
          <ForgeSelect
            label="Dataset"
            value={currentDataSource}
            on-change={(e) => updateConfig({ dataSource: e.detail })}
          >
            <ForgeOption value="">None</ForgeOption>
            {datasetNames.map(name => (
              <ForgeOption key={name} value={name}>{name}</ForgeOption>
            ))}
          </ForgeSelect>
          {currentDataSource && selectedDataset && (
            <div className="config-row" style={{ marginTop: 8 }}>
              <span className="config-label">Rows</span>
              <span className="config-value">{selectedDataset.rows.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Display Section */}
      <div className="config-section">
        <h3 className="config-section-title">Display</h3>
        <ForgeTextField>
          <label>Title</label>
          <input
            type="text"
            value={widget.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </ForgeTextField>

        <div className="config-row">
          <span className="config-label">Type</span>
          <span className="config-value">{widget.type}</span>
        </div>

        {/* Chart-specific config */}
        {widget.type === 'chart' && (
          <>
            <ForgeSelect
              label="Chart Type"
              value={widget.config?.subtype || 'bar'}
              on-change={(e) => updateConfig({ subtype: e.detail })}
            >
              <ForgeOption value="bar">Bar Chart</ForgeOption>
              <ForgeOption value="line">Line Chart</ForgeOption>
              <ForgeOption value="pie">Pie / Donut</ForgeOption>
              <ForgeOption value="area">Area Chart</ForgeOption>
              <ForgeOption value="scatter">Scatter Plot</ForgeOption>
            </ForgeSelect>
            <div className="config-field-row">
              <span>Show Legend</span>
              <ForgeSwitch
                selected={widget.config?.showLegend !== false}
                on-forge-switch-change={() => updateConfig({ showLegend: !(widget.config?.showLegend !== false) })}
              />
            </div>
          </>
        )}

        {/* KPI-specific config */}
        {widget.type === 'kpi' && (
          <>
            <ForgeSelect
              label="Metric"
              value={widget.config?.metric || ''}
              on-change={(e) => updateConfig({ metric: e.detail })}
            >
              {kpiMetricKeys.map(key => (
                <ForgeOption key={key} value={key}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                </ForgeOption>
              ))}
            </ForgeSelect>
            <ForgeSelect
              label="Format"
              value={widget.config?.format || 'currency'}
              on-change={(e) => updateConfig({ format: e.detail })}
            >
              <ForgeOption value="currency">Currency</ForgeOption>
              <ForgeOption value="percent">Percent</ForgeOption>
              <ForgeOption value="number">Number</ForgeOption>
            </ForgeSelect>
          </>
        )}

        {/* Text-specific config */}
        {widget.type === 'text' && (
          <ForgeTextField>
            <label>Content</label>
            <textarea
              rows="4"
              value={widget.config?.text || ''}
              onChange={(e) => updateConfig({ text: e.target.value })}
            />
          </ForgeTextField>
        )}
      </div>

      {/* Layout Section */}
      <div className="config-section">
        <h3 className="config-section-title">Layout</h3>
        <div className="config-slider-row">
          <span className="config-label">Column Span ({widget.colSpan})</span>
          <ForgeSlider
            min={1}
            max={12}
            step={1}
            value={widget.colSpan}
            labeled
            on-forge-slider-change={(e) => update({ colSpan: e.detail.value })}
          />
        </div>
        <div className="config-slider-row">
          <span className="config-label">Row Span ({widget.rowSpan})</span>
          <ForgeSlider
            min={1}
            max={6}
            step={1}
            value={widget.rowSpan}
            labeled
            on-forge-slider-change={(e) => update({ rowSpan: e.detail.value })}
          />
        </div>
        <div className="config-row">
          <span className="config-label">Grid Column</span>
          <span className="config-value">{widget.gridColumn}</span>
        </div>
        <div className="config-row">
          <span className="config-label">Grid Row</span>
          <span className="config-value">{widget.gridRow}</span>
        </div>
      </div>
    </div>
  );
}
