// Forge components: ForgeTextField, ForgeSelect, ForgeOption, ForgeSlider, ForgeSwitch, ForgeIcon, ForgeButton
import { useState } from 'react';
import {
  ForgeTextField, ForgeSelect, ForgeOption, ForgeSlider, ForgeSwitch, ForgeIcon, ForgeButton,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { WIDGET_SLOTS, DATA_WIDGET_TYPES } from '../../data/widgetSlots.js';
import { COLUMN_DENSITIES } from '../../utils/columnConfig.js';
import EditColumnsModal from './EditColumnsModal.jsx';
import './WidgetConfigPanel.css';

function SlotEditor({ slot, widgetId, currentBinding }) {
  const { fieldLibrary, setWidgetBinding, addFieldToWidgetBinding, removeFieldFromWidgetBinding } = useReport();
  const accept = slot.accept;
  const isMulti = !!slot.multiple;

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
    if (isMulti) addFieldToWidgetBinding(widgetId, slot.id, field.id);
    else setWidgetBinding(widgetId, slot.id, field.id);
  };

  const eligible = fieldLibrary.filter(matches);

  if (isMulti && slot.id === 'columns') {
    const ids = (Array.isArray(currentBinding) ? currentBinding : []).map(e => typeof e === 'string' ? e : e?.fieldId).filter(Boolean);
    return (
      <div className="binding-slot">
        <label className="binding-slot__label">
          {slot.label} {slot.optional && <span className="binding-slot__optional">(optional)</span>}
        </label>
        <div className="binding-slot__multi" onDragOver={onDragOver} onDrop={onDrop}>
          {ids.length === 0
            ? <div className="binding-slot__drop binding-slot__drop--inline">Drag fields here or use Edit columns…</div>
            : <div style={{ flex: 1, color: '#3a4a5c', fontSize: 11 }}>{ids.length} column{ids.length === 1 ? '' : 's'} bound</div>
          }
        </div>
      </div>
    );
  }

  if (isMulti) {
    const ids = Array.isArray(currentBinding) ? currentBinding : (currentBinding ? [currentBinding] : []);
    const fields = ids.map(id => fieldLibrary.find(f => f.id === id)).filter(Boolean);

    return (
      <div className="binding-slot">
        <label className="binding-slot__label">
          {slot.label} {slot.optional && <span className="binding-slot__optional">(optional)</span>}
        </label>
        <div className="binding-slot__multi" onDragOver={onDragOver} onDrop={onDrop}>
          {fields.length === 0 && (
            <div className="binding-slot__drop binding-slot__drop--inline">Drag fields here</div>
          )}
          {fields.map(f => (
            <span key={f.id} className={`binding-slot__chip binding-slot__chip--${f.role}`}>
              <span>{f.qualifiedName}</span>
              <button
                className="binding-slot__clear"
                onClick={() => removeFieldFromWidgetBinding(widgetId, slot.id, f.id)}
                aria-label="Remove"
              >×</button>
            </span>
          ))}
        </div>
        {eligible.length > 0 && (
          <select
            className="binding-slot__select"
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) addFieldToWidgetBinding(widgetId, slot.id, id);
            }}
          >
            <option value="">＋ Add field…</option>
            {eligible.filter(f => !ids.includes(f.id)).map(f => (
              <option key={f.id} value={f.id}>{f.qualifiedName}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  // Single-value slot (existing behavior)
  const currentFieldId = currentBinding;
  const current = fieldLibrary.find(f => f.id === currentFieldId);

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
  const { widgets, selectedWidgetId, updateWidget, updateTableSettings } = useReport();
  const [editColumnsOpen, setEditColumnsOpen] = useState(false);
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
  // Section Header merged into the rich text block — treat both the same.
  const isTextBlock = widget.type === 'text' || widget.type === 'section-header';

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
              currentBinding={widget.bindings?.[slot.id]}
            />
          ))}
        </div>
      )}

      {/* Table-specific section */}
      {widget.type === 'table' && (
        <div className="config-section">
          <h3 className="config-section-title">Table</h3>

          <div className="config-field-row">
            <span>Show header</span>
            <ForgeSwitch
              selected={widget.config?.tableSettings?.showHeader !== false}
              on-forge-switch-change={() => updateTableSettings(widget.id, { showHeader: !(widget.config?.tableSettings?.showHeader !== false) })}
            />
          </div>

          <div className="config-field-row">
            <span>Striped rows</span>
            <ForgeSwitch
              selected={widget.config?.tableSettings?.striped !== false}
              on-forge-switch-change={() => updateTableSettings(widget.id, { striped: !(widget.config?.tableSettings?.striped !== false) })}
            />
          </div>

          <div className="config-field-row">
            <span>Totals row</span>
            <ForgeSwitch
              selected={!!widget.config?.tableSettings?.showTotals}
              on-forge-switch-change={() => updateTableSettings(widget.id, { showTotals: !widget.config?.tableSettings?.showTotals })}
            />
          </div>

          <ForgeSelect
            label="Row density"
            value={widget.config?.tableSettings?.density || 'normal'}
            on-change={(e) => updateTableSettings(widget.id, { density: e.detail })}
          >
            {COLUMN_DENSITIES.map(d => (
              <ForgeOption key={d.value} value={d.value}>{d.label}</ForgeOption>
            ))}
          </ForgeSelect>

          <ForgeButton type="outlined" on-click={() => setEditColumnsOpen(true)} style={{ marginTop: 12, width: '100%' }}>
            <ForgeIcon name="view_column" slot="leading" />
            Edit columns…
          </ForgeButton>
        </div>
      )}

      {/* Display Section */}
      <div className="config-section">
        <h3 className="config-section-title">Display</h3>
        {!isTextBlock && (
          <ForgeTextField>
            <label>Title</label>
            <input
              type="text"
              value={widget.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </ForgeTextField>
        )}

        <div className="config-row">
          <span className="config-label">Type</span>
          <span className="config-value">{widget.type}</span>
        </div>

        {isTextBlock && (
          <p className="config-hint">Format text directly in the block — select text to open the formatting menu. Resize by dragging the widget's corner.</p>
        )}

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

      </div>

      {/* Layout Section — hidden for text blocks (resize via canvas corners) */}
      {!isTextBlock && (
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
      )}

      {editColumnsOpen && widget.type === 'table' && (
        <EditColumnsModal widget={widget} onClose={() => setEditColumnsOpen(false)} />
      )}
    </div>
  );
}
