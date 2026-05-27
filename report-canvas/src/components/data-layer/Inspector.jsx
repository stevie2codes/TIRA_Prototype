// Forge components: ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption
import {
  ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { findSource } from '../../data/sourceCatalog.js';
import { getSchemaFor } from '../../data/sourceSchemas.js';
import { groupFieldsBySource } from '../../utils/fieldLibrary.js';
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
  const meta = findSource(sourceId);
  const schema = getSchemaFor(sourceId);
  const sel = selectedSources.find(s => s.sourceId === sourceId);
  const includedSet = new Set(sel?.includedFields || []);

  return (
    <div className="inspector__pane">
      <div className="inspector__section-label">{meta?.label?.toUpperCase()}</div>
      <div className="inspector__meta">
        {meta?.system} · {meta?.type} · {meta?.rowCount?.toLocaleString()} rows
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

function ModelMode() {
  const {
    fieldLibrary, measures, addMeasure, removeMeasure,
    parameters, addParameter, updateParameter, removeParameter,
  } = useReport();

  const grouped = groupFieldsBySource(fieldLibrary);
  const sourceGroups = Object.keys(grouped).filter(k => k !== 'CALCULATED MEASURES');

  return (
    <div className="inspector__pane">
      <div className="inspector__section-label">MODEL CONTRACT</div>
      <div className="inspector__meta">
        {fieldLibrary.length} fields · {measures.length} measures · {parameters.length} parameters
      </div>

      {/* Field library */}
      <div className="inspector__subsection">
        <div className="inspector__subsection-title">Field Library</div>
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
      </div>

      {/* Measures */}
      <div className="inspector__subsection">
        <div className="inspector__subsection-title">
          Calculated Measures
          <ForgeIconButton density="small" on-click={() => addMeasure({ name: 'new_measure', displayName: 'New Measure', expression: 'SUM(field)', type: 'number' })} aria-label="Add measure">
            <ForgeIcon name="add" />
          </ForgeIconButton>
        </div>
        {measures.length === 0 ? (
          <div className="inspector__empty-small">No calculated measures yet.</div>
        ) : (
          measures.map(m => (
            <div key={m.id} className="inspector__measure-row">
              <div className="inspector__measure-main">
                <div className="inspector__measure-name">{m.displayName || m.name}</div>
                <code className="inspector__measure-expr">{m.expression}</code>
              </div>
              <ForgeIconButton density="small" on-click={() => removeMeasure(m.id)} aria-label="Remove">
                <ForgeIcon name="close" />
              </ForgeIconButton>
            </div>
          ))
        )}
      </div>

      {/* Parameters */}
      <div className="inspector__subsection">
        <div className="inspector__subsection-title">
          Parameters
          <ForgeIconButton density="small" on-click={() => addParameter({ name: 'new_param', displayName: 'New Parameter', type: 'string', defaultValue: '' })} aria-label="Add parameter">
            <ForgeIcon name="add" />
          </ForgeIconButton>
        </div>
        {parameters.map(p => (
          <div key={p.id} className="inspector__param-row">
            <div className="inspector__param-main">
              <ForgeTextField density="small">
                <input
                  type="text"
                  value={p.displayName}
                  onChange={(e) => updateParameter(p.id, { displayName: e.target.value })}
                />
              </ForgeTextField>
              <ForgeSelect density="small" value={p.type} on-change={(e) => updateParameter(p.id, { type: e.detail })}>
                <ForgeOption value="string">String</ForgeOption>
                <ForgeOption value="number">Number</ForgeOption>
                <ForgeOption value="date_range">Date Range</ForgeOption>
                <ForgeOption value="multi_select">Multi-select</ForgeOption>
              </ForgeSelect>
            </div>
            <ForgeIconButton density="small" on-click={() => removeParameter(p.id)} aria-label="Remove">
              <ForgeIcon name="close" />
            </ForgeIconButton>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Inspector() {
  const { inspectorMode, setInspectorMode } = useReport();

  return (
    <div className="inspector">
      <div className="inspector__tabs">
        <button
          className={`inspector__tab ${inspectorMode === 'selection' ? 'is-active' : ''}`}
          onClick={() => setInspectorMode('selection')}
        >
          SELECTION
        </button>
        <button
          className={`inspector__tab ${inspectorMode === 'model' ? 'is-active' : ''}`}
          onClick={() => setInspectorMode('model')}
        >
          MODEL
        </button>
      </div>
      <div className="inspector__body">
        {inspectorMode === 'selection' ? <SelectionMode /> : <ModelMode />}
      </div>
    </div>
  );
}
