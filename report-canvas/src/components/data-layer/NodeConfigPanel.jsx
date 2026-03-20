// Forge components: ForgeTextField, ForgeSwitch, ForgeIcon, ForgeButton
import { useState, useEffect } from 'react';
import { ForgeTextField, ForgeSwitch, ForgeIcon, ForgeButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { fetchSchema } from '../../services/dataService.js';

// Humanize snake_case / camelCase field names
function humanize(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const CATEGORY_ICONS = {
  'People & Citizens': 'people',
  'Operations & Services': 'engineering',
  'Financial & Accounting': 'account_balance',
  'Compliance & Licensing': 'verified',
  'Assets & Inventory': 'inventory_2',
};

export default function NodeConfigPanel() {
  const { nodes, setNodes, selectedNodeId, availableSources, generateNodeData, loadingNodes } = useReport();
  const node = nodes.find(n => n.id === selectedNodeId);

  // Local state for unconfigured source setup
  const [schema, setSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [rowCount, setRowCount] = useState(50);
  const [disabledFields, setDisabledFields] = useState([]);

  // Fetch schema when an unconfigured source node is selected
  useEffect(() => {
    if (node && node.type === 'source' && !node.data.configured && node.data.subtype) {
      setSchemaLoading(true);
      setSchema(null);
      setDisabledFields([]);
      setRowCount(50);
      fetchSchema(node.data.subtype)
        .then(s => setSchema(s))
        .catch(err => console.error('Failed to fetch schema:', err))
        .finally(() => setSchemaLoading(false));
    }
  }, [node?.id, node?.data?.subtype, node?.data?.configured]);

  // ── State 1: No node selected ──
  if (!node) {
    return (
      <div className="panel-empty">
        <div className="panel-empty-icon">
          <ForgeIcon name="touch_app" style={{ fontSize: 28, color: '#9ca3af' }} />
        </div>
        <p className="panel-empty-title">No node selected</p>
        <p className="panel-empty-desc">Click a node on the canvas to view and edit its properties</p>
      </div>
    );
  }

  const updateNodeData = (updates) => {
    setNodes(nds =>
      nds.map(n =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, ...updates } }
          : n
      )
    );
  };

  const toggleField = (field) => {
    const disabled = node.data.disabledFields || [];
    const next = disabled.includes(field)
      ? disabled.filter(f => f !== field)
      : [...disabled, field];
    updateNodeData({ disabledFields: next });
  };

  // Look up the source metadata from availableSources
  const sourceItem = availableSources.find(s => s.type === node.data.subtype);
  const isLoading = loadingNodes.has(node.id);

  // ── State 2: Unconfigured source node ──
  if (node.type === 'source' && !node.data.configured) {
    const enabledFields = schema
      ? schema.fields.filter(f => !disabledFields.includes(f.key)).map(f => f.key)
      : [];

    const handleGenerate = async () => {
      await generateNodeData(node.id, node.data.subtype, rowCount, enabledFields);
      const categoryIcon = sourceItem ? CATEGORY_ICONS[sourceItem.category] || 'dataset' : 'dataset';
      updateNodeData({
        configured: true,
        fields: enabledFields,
        icon: categoryIcon,
      });
    };

    const toggleSetupField = (key) => {
      setDisabledFields(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    };

    return (
      <div className="config-panel">
        {/* Header */}
        <div className="config-section">
          <h3 className="config-section-title">Configure Data Source</h3>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
              {node.data.label}
            </span>
          </div>
          {sourceItem && (
            <p className="config-section-hint" style={{ marginBottom: 0 }}>
              {sourceItem.description}
            </p>
          )}
        </div>

        {/* Field selector */}
        <div className="config-section">
          <h3 className="config-section-title">Fields</h3>
          {schemaLoading ? (
            <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Loading schema...</p>
          ) : schema ? (
            <>
              <p className="config-section-hint">
                Toggle fields to include in the generated dataset.
              </p>
              {schema.fields.map(field => (
                <div key={field.key} className="config-field-row">
                  <span className="config-field-name">{field.label}</span>
                  <ForgeSwitch
                    selected={!disabledFields.includes(field.key)}
                    on-forge-switch-change={() => toggleSetupField(field.key)}
                  />
                </div>
              ))}
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#dc2626' }}>Failed to load schema.</p>
          )}
        </div>

        {/* Row count */}
        <div className="config-section">
          <h3 className="config-section-title">Row Count</h3>
          <ForgeTextField>
            <label>Number of rows</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={rowCount}
              onChange={(e) => {
                const v = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
                setRowCount(v);
              }}
            />
          </ForgeTextField>
        </div>

        {/* Generate button */}
        <div className="config-section">
          <ForgeButton
            variant="raised"
            style={{ width: '100%' }}
            disabled={!schema || enabledFields.length === 0 || isLoading}
            on-click={handleGenerate}
          >
            {isLoading ? (
              <>
                <ForgeIcon name="progress_activity" slot="start" style={{ animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <ForgeIcon name="play_arrow" slot="start" />
                Generate {rowCount} Rows
              </>
            )}
          </ForgeButton>
        </div>
      </div>
    );
  }

  // ── State 3: Configured source node or other node types ──

  const handleRegenerate = async () => {
    const fields = (node.data.fields || []).filter(f => !(node.data.disabledFields || []).includes(f));
    await generateNodeData(node.id, node.data.subtype, 50, fields);
  };

  const handleResetSource = () => {
    updateNodeData({
      label: sourceItem ? sourceItem.label : 'Source',
      fields: [],
      configured: false,
      disabledFields: [],
      icon: undefined,
    });
  };

  return (
    <div className="config-panel">
      <div className="config-section">
        <h3 className="config-section-title">Node Settings</h3>
        <ForgeTextField>
          <label>Name</label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateNodeData({ label: e.target.value })}
          />
        </ForgeTextField>
        <div className="config-row">
          <span className="config-label">Type</span>
          <span className="config-value">{humanize(node.type)}</span>
        </div>
        {node.data.subtype && sourceItem && (
          <div className="config-row">
            <span className="config-label">Source</span>
            <span className="config-value">{sourceItem.label}</span>
          </div>
        )}
        {node.data.subtype && !sourceItem && (
          <div className="config-row">
            <span className="config-label">Source</span>
            <span className="config-value">{humanize(node.data.subtype)}</span>
          </div>
        )}
      </div>

      {node.data.fields && node.data.fields.length > 0 && (
        <div className="config-section">
          <h3 className="config-section-title">Fields</h3>
          {node.data.fields.map(field => (
            <div key={field} className="config-field-row">
              <span className="config-field-name">{humanize(field)}</span>
              <ForgeSwitch
                selected={!(node.data.disabledFields || []).includes(field)}
                on-forge-switch-change={() => toggleField(field)}
              />
            </div>
          ))}
        </div>
      )}

      {node.type === 'source' && (
        <div className="config-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ForgeButton
            variant="raised"
            style={{ width: '100%' }}
            disabled={isLoading}
            on-click={handleRegenerate}
          >
            {isLoading ? (
              <>
                <ForgeIcon name="progress_activity" slot="start" style={{ animation: 'spin 1s linear infinite' }} />
                Regenerating...
              </>
            ) : (
              <>
                <ForgeIcon name="refresh" slot="start" />
                Regenerate Data
              </>
            )}
          </ForgeButton>
          <ForgeButton variant="outlined" style={{ width: '100%' }} on-click={handleResetSource}>
            <ForgeIcon name="swap_horiz" slot="start" />
            Change Data Source
          </ForgeButton>
        </div>
      )}
    </div>
  );
}
