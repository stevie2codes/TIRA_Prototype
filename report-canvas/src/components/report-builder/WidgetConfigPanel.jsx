// Forge components: ForgeTextField, ForgeSelect, ForgeOption, ForgeSlider, ForgeSwitch, ForgeIcon
import {
  ForgeTextField, ForgeSelect, ForgeOption, ForgeSlider, ForgeSwitch, ForgeIcon,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import './WidgetConfigPanel.css';

const WIDGET_SLOTS = {
  chart: [
    { id: 'xAxis',   label: 'X axis',     accept: 'dimension' },
    { id: 'yAxis',   label: 'Y axis',     accept: 'measure'   },
    { id: 'groupBy', label: 'Group by',   accept: 'dimension', optional: true },
  ],
  table: [
    { id: 'columns', label: 'Columns',    accept: 'any', multiple: true },
  ],
  kpi: [
    { id: 'value',   label: 'Value',      accept: 'measure'   },
    { id: 'label',   label: 'Label',      accept: 'dimension', optional: true },
  ],
};

const DATA_WIDGET_TYPES = Object.keys(WIDGET_SLOTS);

function SlotEditor({ slot, widgetId, currentFieldId }) {
  const { fieldLibrary, setWidgetBinding } = useReport();
  const current = fieldLibrary.find(f => f.id === currentFieldId);
  const accept = slot.accept;

  const matches = (f) => {
    if (accept === 'any') return true;
    if (accept === 'dimension') return f.role === 'dimension';
    if (accept === 'measure')   return f.role === 'measure';
    return true;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-tira-field');
    if (!raw) return;
    const field = JSON.parse(raw);
    if (!matches(field)) return;
    setWidgetBinding(widgetId, slot.id, field.id);
  };

  const eligible = fieldLibrary.filter(matches);

  return (
    <div className="binding-slot">
      <label className="binding-slot__label">
        {slot.label} {slot.optional && <span className="binding-slot__optional">(optional)</span>}
      </label>
      {current ? (
        <div
          className={`binding-slot__value binding-slot__value--${current.role}`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <span>{current.qualifiedName}</span>
          <button className="binding-slot__clear" onClick={() => setWidgetBinding(widgetId, slot.id, null)} aria-label="Clear">×</button>
        </div>
      ) : (
        <div
          className="binding-slot__drop"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          Drag a {accept === 'any' ? 'field' : accept} here
        </div>
      )}
      {eligible.length > 0 && (
        <select
          className="binding-slot__select"
          value={currentFieldId || ''}
          onChange={(e) => setWidgetBinding(widgetId, slot.id, e.target.value || null)}
        >
          <option value="">— pick from list —</option>
          {eligible.map(f => (
            <option key={f.id} value={f.id}>{f.qualifiedName}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function WidgetConfigPanel() {
  const { widgets, selectedWidgetId, updateWidget } = useReport();
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

  return (
    <div className="config-panel">
      {/* Field Bindings — for data-driven widgets */}
      {showDataSource && (
        <div className="config-section">
          <h3 className="config-section-title">Field Bindings</h3>
          {(WIDGET_SLOTS[widget.type] || []).map(slot => (
            <SlotEditor
              key={slot.id}
              slot={slot}
              widgetId={widget.id}
              currentFieldId={widget.bindings?.[slot.id]}
            />
          ))}
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
          <ForgeSelect
            label="Format"
            value={widget.config?.format || 'currency'}
            on-change={(e) => updateConfig({ format: e.detail })}
          >
            <ForgeOption value="currency">Currency</ForgeOption>
            <ForgeOption value="percent">Percent</ForgeOption>
            <ForgeOption value="number">Number</ForgeOption>
          </ForgeSelect>
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
