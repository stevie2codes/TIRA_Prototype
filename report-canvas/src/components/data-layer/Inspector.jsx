// Forge components: ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption
import { useState } from 'react';
import {
  ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { findSource } from '../../data/sourceCatalog.js';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import { groupFieldsBySource } from '../../utils/fieldLibrary.js';
import ParameterValueEditor from './ParameterValueEditor.jsx';
import { DATE_RANGE_PRESETS, PARAMETER_TYPES, defaultValueForType } from '../../data/parameterPresets.js';
import './Inspector.css';

function SelectionMode() {
  const {
    nodes, selectedNodeId, selectedSources, toggleSourceField, removeSource,
  } = useReport();
  const node = nodes.find(n => n.id === selectedNodeId);

  if (!node || !node.data.sourceId) {
    return (
      <div className="inspector__empty">
        <ForgeIcon name="touch_app" style={{ fontSize: 28, color: '#9ca3af' }} />
        <p>Click a source on the canvas to configure it.</p>
      </div>
    );
  }

  const sourceId = node.data.sourceId;
  const sel = selectedSources.find(s => s.sourceId === sourceId);
  const catalogMeta = findSource(sourceId);
  const catalogSchema = getSchemaFor(sourceId);
  const schema = sel?.inlineSchema || catalogSchema;
  const label = sel?.displayLabel || catalogMeta?.label || sourceId;
  const meta = sel?.meta || catalogMeta;
  const includedSet = new Set(sel?.includedFields || []);

  return (
    <div className="inspector__pane">
      <div className="inspector__section-label">{label?.toUpperCase()}</div>
      <div className="inspector__meta">
        {meta?.system} · {meta?.type} · {(meta?.rowCount || 0).toLocaleString()} rows
      </div>

      <div className="inspector__subsection">
        <div className="inspector__subsection-title">
          Fields included <span className="inspector__count">({includedSet.size} of {schema.length})</span>
        </div>
        <div className="inspector__fields-list">
          {schema.map(field => {
            const checked = includedSet.has(field.name);
            return (
              <label key={field.name} className={`inspector__field-row ${checked ? 'is-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSourceField(sourceId, field.name)}
                />
                <span className="inspector__field-name">{field.name}</span>
                <span className={`inspector__field-role inspector__field-role--${field.role}`}>{field.role === 'dimension' ? 'dim' : 'measure'}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="inspector__subsection">
        <ForgeButton type="outlined" on-click={() => removeSource(sourceId)}>
          Remove from model
        </ForgeButton>
      </div>
    </div>
  );
}

function ParameterCard({ param, expanded, onToggle, onUpdate, onRemove }) {
  const valueLabel = formatParamValueLabel(param);
  const typeLabel = PARAMETER_TYPES.find(t => t.value === param.type)?.label || param.type;

  return (
    <div className={`param-card ${expanded ? 'is-expanded' : ''}`}>
      <div className="param-card__head" onClick={onToggle}>
        <ForgeIcon name={expanded ? 'expand_more' : 'chevron_right'} style={{ fontSize: 16 }} />
        <div className="param-card__main">
          <div className="param-card__name">{param.displayName || param.name}</div>
          <div className="param-card__meta">
            <span className="param-card__type">{typeLabel}</span>
            <span className="param-card__sep">·</span>
            <span className="param-card__value">{valueLabel}</span>
          </div>
        </div>
        <ForgeIconButton density="small" on-click={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove">
          <ForgeIcon name="close" />
        </ForgeIconButton>
      </div>

      {expanded && (
        <div className="param-card__body">
          <div className="param-card__field">
            <label className="param-card__label">Display name</label>
            <ForgeTextField density="small">
              <input
                type="text"
                value={param.displayName}
                onChange={(e) => {
                  const dn = e.target.value;
                  onUpdate({
                    displayName: dn,
                    name: dn.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'param',
                  });
                }}
              />
            </ForgeTextField>
            <div className="param-card__hint">id: <code>{param.name}</code></div>
          </div>

          <div className="param-card__field">
            <label className="param-card__label">Type</label>
            <ForgeSelect
              density="small"
              value={param.type}
              on-change={(e) => onUpdate({ type: e.detail, defaultValue: defaultValueForType(e.detail) })}
            >
              {PARAMETER_TYPES.map(t => (
                <ForgeOption key={t.value} value={t.value}>{t.label}</ForgeOption>
              ))}
            </ForgeSelect>
          </div>

          {param.type === 'multi_select' && (
            <div className="param-card__field">
              <label className="param-card__label">Options</label>
              <ParamOptionsEditor
                options={param.options || []}
                onChange={(options) => onUpdate({ options })}
              />
            </div>
          )}

          <div className="param-card__field">
            <label className="param-card__label">Default value</label>
            <ParameterValueEditor
              param={param}
              value={param.defaultValue}
              onChange={(v) => onUpdate({ defaultValue: v })}
            />
          </div>

          <div className="param-card__field">
            <label className="param-card__label">Description <span className="param-card__optional">(optional)</span></label>
            <ForgeTextField density="small">
              <input
                type="text"
                value={param.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="What this parameter filters or controls"
              />
            </ForgeTextField>
          </div>
        </div>
      )}
    </div>
  );
}

function ParamOptionsEditor({ options, onChange }) {
  const add = () => onChange([...options, { value: `opt_${options.length + 1}`, label: `Option ${options.length + 1}` }]);
  const update = (i, patch) => onChange(options.map((o, idx) => idx === i ? { ...o, ...patch } : o));
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i));

  return (
    <div className="param-options">
      {options.length === 0 && (
        <div className="param-options__empty">
          Add the choices end users can pick from. Include an "all" option if you want to allow no-filter.
        </div>
      )}
      {options.map((o, i) => (
        <div key={i} className="param-options__row">
          <input
            className="param-options__input"
            value={o.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value"
          />
          <input
            className="param-options__input"
            value={o.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="label"
          />
          <button className="param-options__remove" onClick={() => remove(i)} aria-label="Remove">×</button>
        </div>
      ))}
      <button className="param-options__add" onClick={add}>＋ Add option</button>
    </div>
  );
}

function formatParamValueLabel(p) {
  if (p.type === 'date_range') {
    const preset = DATE_RANGE_PRESETS.find(x => x.value === p.defaultValue);
    return preset?.label || String(p.defaultValue);
  }
  if (p.type === 'multi_select') {
    const arr = Array.isArray(p.defaultValue) ? p.defaultValue : [];
    if (arr.length === 0 || arr.includes('all')) return 'All';
    const labels = arr.map(v => (p.options || []).find(o => o.value === v)?.label || v);
    return labels.join(', ');
  }
  if (p.defaultValue == null || p.defaultValue === '') return '—';
  return String(p.defaultValue);
}

function CollapsibleSection({ title, count, open, onToggle, actions, children }) {
  return (
    <div className={`inspector__subsection inspector__subsection--collapsible ${open ? 'is-open' : ''}`}>
      <div className="inspector__subsection-title inspector__subsection-title--clickable">
        <button className="inspector__section-toggle" onClick={onToggle}>
          <ForgeIcon name={open ? 'expand_more' : 'chevron_right'} style={{ fontSize: 16 }} />
          <span>{title}</span>
          {count != null && <span className="inspector__section-count">{count}</span>}
        </button>
        {actions}
      </div>
      {open && <div className="inspector__section-body">{children}</div>}
    </div>
  );
}

function ModelMode() {
  const {
    fieldLibrary, measures, addMeasure, updateMeasure, removeMeasure,
    parameters, addParameter, updateParameter, removeParameter,
  } = useReport();
  const [expandedParamId, setExpandedParamId] = useState(null);
  const [openSection, setOpenSection] = useState({
    fields: true,
    measures: false,
    parameters: false,
  });
  const toggle = (key) => setOpenSection(s => ({ ...s, [key]: !s[key] }));

  const grouped = groupFieldsBySource(fieldLibrary);
  const sourceGroups = Object.keys(grouped).filter(k => k !== 'CALCULATED MEASURES');

  return (
    <div className="inspector__pane">
      <div className="inspector__section-label">MODEL CONTRACT</div>
      <div className="inspector__meta">
        {fieldLibrary.length} fields · {measures.length} measures · {parameters.length} parameters
      </div>

      {/* Field library */}
      <CollapsibleSection
        title="Field Library"
        count={fieldLibrary.length}
        open={openSection.fields}
        onToggle={() => toggle('fields')}
      >
        {sourceGroups.length === 0 ? (
          <div className="inspector__empty-small">Add sources from the catalog on the left.</div>
        ) : (
          sourceGroups.map(sourceId => (
            <div key={sourceId} className="inspector__field-group">
              <div className="inspector__field-group-title">{sourceId}</div>
              {grouped[sourceId].map(f => (
                <div key={f.id} className="inspector__field-row">
                  <span className="inspector__field-name">{f.qualifiedName}</span>
                  <span className={`inspector__field-role inspector__field-role--${f.role}`}>{f.role === 'dimension' ? 'dim' : 'measure'}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </CollapsibleSection>

      {/* Measures */}
      <CollapsibleSection
        title="Calculated Measures"
        count={measures.length}
        open={openSection.measures}
        onToggle={() => toggle('measures')}
        actions={
          <ForgeIconButton density="small" on-click={(e) => { e.stopPropagation(); addMeasure({ name: 'new_measure', displayName: 'New Measure', expression: 'SUM(field)', type: 'number' }); setOpenSection(s => ({ ...s, measures: true })); }} aria-label="Add measure">
            <ForgeIcon name="add" />
          </ForgeIconButton>
        }
      >
        {measures.length === 0 ? (
          <div className="inspector__empty-small">No calculated measures yet.</div>
        ) : (
          measures.map(m => (
            <div key={m.id} className="inspector__measure-row inspector__measure-row--editable">
              <div className="inspector__measure-main">
                <ForgeTextField density="small">
                  <label>Name</label>
                  <input
                    type="text"
                    value={m.displayName || m.name}
                    onChange={(e) => updateMeasure(m.id, { displayName: e.target.value, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  />
                </ForgeTextField>
                <ForgeTextField density="small">
                  <label>Expression</label>
                  <input
                    type="text"
                    value={m.expression}
                    onChange={(e) => updateMeasure(m.id, { expression: e.target.value })}
                  />
                </ForgeTextField>
              </div>
              <ForgeIconButton density="small" on-click={() => removeMeasure(m.id)} aria-label="Remove">
                <ForgeIcon name="close" />
              </ForgeIconButton>
            </div>
          ))
        )}
      </CollapsibleSection>

      {/* Parameters */}
      <CollapsibleSection
        title="Parameters"
        count={parameters.length}
        open={openSection.parameters}
        onToggle={() => toggle('parameters')}
        actions={
          <ForgeIconButton density="small" on-click={(e) => {
            e.stopPropagation();
            addParameter({ name: 'new_param', displayName: 'New parameter', type: 'string', defaultValue: '', description: '' });
            setOpenSection(s => ({ ...s, parameters: true }));
          }} aria-label="Add parameter">
            <ForgeIcon name="add" />
          </ForgeIconButton>
        }
      >
        {parameters.length === 0 ? (
          <div className="inspector__empty-small">No parameters yet. Click + to add one.</div>
        ) : (
          parameters.map(p => (
            <ParameterCard
              key={p.id}
              param={p}
              expanded={expandedParamId === p.id}
              onToggle={() => setExpandedParamId(expandedParamId === p.id ? null : p.id)}
              onUpdate={(updates) => updateParameter(p.id, updates)}
              onRemove={() => removeParameter(p.id)}
            />
          ))
        )}
      </CollapsibleSection>
    </div>
  );
}

export default function Inspector() {
  const { inspectorMode, setInspectorMode } = useReport();

  const subtitle = inspectorMode === 'selection'
    ? "Configure what you've clicked on the canvas"
    : "The published schema — what your report and the chat AI will see";

  return (
    <div className="inspector">
      <div className="inspector__tabs">
        <button
          className={`inspector__tab ${inspectorMode === 'selection' ? 'is-active' : ''}`}
          onClick={() => setInspectorMode('selection')}
          title="Configure the source, join, or field you clicked on the canvas"
        >
          SELECTION
        </button>
        <button
          className={`inspector__tab ${inspectorMode === 'model' ? 'is-active' : ''}`}
          onClick={() => setInspectorMode('model')}
          title="The whole semantic model — fields, measures, and parameters that will be exposed downstream"
        >
          MODEL
        </button>
      </div>
      <div className="inspector__subtitle">{subtitle}</div>
      <div className="inspector__body">
        {inspectorMode === 'selection' ? <SelectionMode /> : <ModelMode />}
      </div>
    </div>
  );
}
