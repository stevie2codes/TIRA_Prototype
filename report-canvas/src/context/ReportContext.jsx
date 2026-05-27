import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { fetchDataTypes, fetchData } from '../services/dataService.js';
import { DEFAULT_MARGINS } from '../constants/pageSettings.js';
import { getSchemaFor } from '../data/sourceSchemas.js';
import { buildFieldLibrary } from '../utils/fieldLibrary.js';

const ReportContext = createContext(null);

/**
 * Check sessionStorage for handoff context from TIRA chat.
 * Returns the parsed object or null.
 */
function readHandoffContext() {
  try {
    const raw = sessionStorage.getItem('tira-handoff-context');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Best-effort role guess from a column name (fallback when no sample data).
 */
function guessRoleByName(name) {
  const lower = String(name).toLowerCase();
  const measureHints = ['count', 'total', 'amount', 'value', 'fee', 'sum', 'avg', 'budget', 'population', 'fine', 'spend', 'qty', 'quantity'];
  if (measureHints.some(h => lower.includes(h))) return 'measure';
  return 'dimension';
}

/**
 * Determine role from a sample value. Numbers are measures; everything else
 * is a dimension.
 */
function roleFromSample(sample) {
  if (sample == null) return null;
  if (typeof sample === 'number' && Number.isFinite(sample)) return 'measure';
  if (typeof sample === 'string') return 'dimension';
  if (typeof sample === 'boolean') return 'dimension';
  return null;
}

/**
 * Best-effort type guess from a column name + sample value.
 */
function typeFromSample(name, sample) {
  if (typeof sample === 'number') {
    const lower = String(name).toLowerCase();
    if (lower.includes('amount') || lower.includes('fee') || lower.includes('budget') || lower.includes('value') || lower.includes('spend') || lower.includes('fine')) return 'currency';
    return 'number';
  }
  if (typeof sample === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(sample)) return 'date';
    return 'string';
  }
  return 'string';
}

function buildHandoffSelectedSource(ctx) {
  if (!ctx) return null;
  const columns = ctx.columns || [];
  if (columns.length === 0) return null;

  const sourceId = (ctx.dataSource || 'chat_query')
    .toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'chat_query';

  const firstRow = (ctx.data && ctx.data[0]) || null;

  const inlineSchema = columns.map(c => {
    const name = c.property || c.header;
    const displayName = c.header || c.property;
    const sample = firstRow ? firstRow[name] : null;
    const role = roleFromSample(sample) || guessRoleByName(name);
    const type = typeFromSample(name, sample);
    return { name, displayName, type, role, description: '' };
  });

  const includedFields = inlineSchema.map(f => f.name);

  return {
    sourceId,
    includedFields,
    isSynthetic: true,
    displayLabel: ctx.dataSource || 'Chat Query',
    inlineSchema,
    meta: {
      system: 'Chat handoff',
      type: 'inline',
      rowCount: (ctx.data || []).length,
    },
  };
}

/**
 * Build initial report-builder widgets from handoff context.
 */
function buildHandoffWidgets(ctx) {
  const widgets = [];
  if (!ctx) return widgets;

  const entry = buildHandoffSelectedSource(ctx);
  const sourceId = entry?.sourceId;

  // Section header with report title
  widgets.push({
    id: 'widget-handoff-header',
    type: 'section-header',
    title: ctx.reportTitle || 'Report',
    gridColumn: 1,
    gridRow: 1,
    colSpan: 12,
    rowSpan: 1,
    config: {},
  });

  if (!sourceId || !entry) return widgets;

  // Table widget bound to all fields from the handoff
  const allFieldIds = entry.inlineSchema.map(f => `${sourceId}.${f.name}`);
  widgets.push({
    id: 'widget-handoff-table',
    type: 'table',
    title: ctx.reportTitle || 'Data Table',
    gridColumn: 1,
    gridRow: 2,
    colSpan: 12,
    rowSpan: 3,
    config: {},
    bindings: { columns: allFieldIds },
  });

  // Chart widget bound to first dimension (xAxis) + first measure (yAxis)
  const firstDim = entry.inlineSchema.find(f => f.role === 'dimension');
  const firstMeasure = entry.inlineSchema.find(f => f.role === 'measure');
  if (firstDim && firstMeasure) {
    widgets.push({
      id: 'widget-handoff-chart',
      type: 'chart',
      title: `${ctx.reportTitle || 'Data'} — Visualization`,
      gridColumn: 1,
      gridRow: 5,
      colSpan: 12,
      rowSpan: 3,
      config: { subtype: 'bar' },
      bindings: {
        xAxis: `${sourceId}.${firstDim.name}`,
        yAxis: `${sourceId}.${firstMeasure.name}`,
      },
    });
  }

  return widgets;
}

export function ReportProvider({ children }) {
  const [handoffContext] = useState(() => readHandoffContext());

  // Initial nodes/edges are always empty. Handoff context now seeds selectedSources
  // (see useState below), which the DataLayerCanvas sync effect projects into nodes.
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Initialize widgets from handoff if available
  const [widgets, setWidgets] = useState(() => {
    if (!handoffContext) return [];
    return buildHandoffWidgets(handoffContext);
  });
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);

  // Start on Report Builder tab if we have handoff context, otherwise Data Layer
  const [activeTab, setActiveTab] = useState(handoffContext ? 1 : 0);

  // Template state — initialized from handoff if available
  const [activeTemplateId, setActiveTemplateId] = useState(
    () => handoffContext?.activeTemplateId || null
  );

  // Canvas view state
  const [zoom, setZoom] = useState(100); // 50-200
  const [pageSize, setPageSize] = useState('letter'); // 'letter' | 'a4' | 'legal'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [margins, setMargins] = useState(DEFAULT_MARGINS);
  const [rightPanelTab, setRightPanelTab] = useState('properties'); // 'properties' | 'ai-chat'
  const [showRulers, setShowRulers] = useState(true);

  // API-driven state
  const [availableSources, setAvailableSources] = useState([]);
  const [generatedData, setGeneratedData] = useState(() => {
    if (!handoffContext || !handoffContext.data) return {};
    const entry = buildHandoffSelectedSource(handoffContext);
    if (!entry) return {};
    const columns = entry.inlineSchema.map(f => f.name);
    return {
      [`source-${entry.sourceId}`]: {
        type: 'handoff',
        rows: handoffContext.data,
        columns,
      },
    };
  });
  const [loadingNodes, setLoadingNodes] = useState(new Set());

  // Semantic-model state (new — runs alongside existing nodes/edges for now)
  // selectedSources: [{ sourceId, includedFields: [fieldName, ...] }]
  const [selectedSources, setSelectedSources] = useState(() => {
    const handoff = buildHandoffSelectedSource(handoffContext);
    return handoff ? [handoff] : [];
  });

  // relationships: [{ id, leftSourceId, leftField, rightSourceId, rightField, joinType, cardinality }]
  const [relationships, setRelationships] = useState([]);

  // measures: [{ id, name, displayName, expression, type }]
  const [measures, setMeasures] = useState([]);

  // parameters: [{ id, name, displayName, type, defaultValue, options? }]
  const [parameters, setParameters] = useState([
    { id: 'param-date-range', name: 'date_range',  displayName: 'Date Range',  type: 'date_range', defaultValue: 'last_90d' },
    { id: 'param-department', name: 'department',  displayName: 'Department',  type: 'multi_select', defaultValue: ['all'] },
  ]);

  // Inspector mode in the Data Layer tab: 'selection' | 'model'
  const [inspectorMode, setInspectorMode] = useState('model');

  // Add a source from catalog to the model (idempotent on sourceId).
  const addSourceFromCatalog = useCallback((sourceId) => {
    setSelectedSources(prev => {
      if (prev.some(s => s.sourceId === sourceId)) return prev;
      const schema = getSchemaFor(sourceId);
      // Default: include all fields
      const includedFields = schema.map(f => f.name);
      return [...prev, { sourceId, includedFields }];
    });
  }, []);

  const removeSource = useCallback((sourceId) => {
    setSelectedSources(prev => prev.filter(s => s.sourceId !== sourceId));
    setRelationships(prev => prev.filter(r => r.leftSourceId !== sourceId && r.rightSourceId !== sourceId));
  }, []);

  const toggleSourceField = useCallback((sourceId, fieldName) => {
    setSelectedSources(prev => prev.map(s => {
      if (s.sourceId !== sourceId) return s;
      const included = s.includedFields.includes(fieldName)
        ? s.includedFields.filter(f => f !== fieldName)
        : [...s.includedFields, fieldName];
      return { ...s, includedFields: included };
    }));
  }, []);

  const addMeasure = useCallback((measure) => {
    setMeasures(prev => [...prev, { id: `measure-${Date.now()}`, ...measure }]);
  }, []);

  const removeMeasure = useCallback((id) => {
    setMeasures(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMeasure = useCallback((id, updates) => {
    setMeasures(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const addParameter = useCallback((param) => {
    setParameters(prev => [...prev, { id: `param-${Date.now()}`, ...param }]);
  }, []);

  const updateParameter = useCallback((id, updates) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removeParameter = useCallback((id) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  }, []);

  // Derived: the unified Field Library
  const fieldLibrary = useMemo(
    () => buildFieldLibrary(selectedSources, measures),
    [selectedSources, measures]
  );

  // Fetch available data types on mount
  useEffect(() => {
    fetchDataTypes()
      .then(setAvailableSources)
      .catch(err => console.error('Failed to load data types:', err));
  }, []);

  // Generate data for a specific node via the API
  const generateNodeData = useCallback(async (nodeId, type, count = 50, fields = []) => {
    setLoadingNodes(prev => new Set(prev).add(nodeId));
    try {
      const rows = await fetchData(type, count, fields);
      const columns = fields.length > 0 ? fields : (rows.length > 0 ? Object.keys(rows[0]) : []);
      setGeneratedData(prev => ({ ...prev, [nodeId]: { type, rows, columns } }));
      return rows;
    } finally {
      setLoadingNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  }, []);

  // Auto-fetch rows for catalog sources so widgets and the preview drawer
  // can render synchronously. Skips synthetic (handoff) sources — they have
  // their rows pre-populated in generatedData.
  useEffect(() => {
    selectedSources.forEach(sel => {
      if (sel.isSynthetic) return;
      const nodeId = `source-${sel.sourceId}`;
      if (generatedData[nodeId]) return;
      // Fire-and-forget; generateNodeData updates state when done
      generateNodeData(nodeId, sel.sourceId, 20, sel.includedFields).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSources]);

  // Derive datasets from generatedData, keyed by node label
  const datasets = useMemo(() => {
    const ds = {};
    Object.entries(generatedData).forEach(([nodeId, data]) => {
      const node = nodes.find(n => n.id === nodeId);
      const label = node?.data?.label || nodeId;
      ds[label] = { rows: data.rows, columns: data.columns };
    });
    return ds;
  }, [generatedData, nodes]);

  const datasetNames = useMemo(() => Object.keys(datasets), [datasets]);

  const addWidget = useCallback((widget) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const updateWidget = useCallback((id, updates) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const setWidgetBinding = useCallback((widgetId, slot, fieldId) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w;
      const bindings = { ...(w.bindings || {}) };
      if (fieldId == null) {
        delete bindings[slot];
      } else {
        bindings[slot] = fieldId;
      }
      return { ...w, bindings };
    }));
  }, []);

  const addFieldToWidgetBinding = useCallback((widgetId, slot, fieldId) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w;
      const current = w.bindings?.[slot];
      const arr = Array.isArray(current) ? current : (current ? [current] : []);
      if (arr.includes(fieldId)) return w;
      const bindings = { ...(w.bindings || {}), [slot]: [...arr, fieldId] };
      return { ...w, bindings };
    }));
  }, []);

  const removeFieldFromWidgetBinding = useCallback((widgetId, slot, fieldId) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== widgetId) return w;
      const current = w.bindings?.[slot];
      const arr = Array.isArray(current) ? current : (current ? [current] : []);
      const next = arr.filter(id => id !== fieldId);
      const bindings = { ...(w.bindings || {}) };
      if (next.length === 0) {
        delete bindings[slot];
      } else {
        bindings[slot] = next;
      }
      return { ...w, bindings };
    }));
  }, []);

  const removeWidget = useCallback((id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setSelectedWidgetId(null);
  }, []);

  const duplicateWidget = useCallback((id) => {
    setWidgets(prev => {
      const source = prev.find(w => w.id === id);
      if (!source) return prev;
      const newWidget = { ...source, id: `widget-${Date.now()}`, gridRow: source.gridRow + source.rowSpan };
      return [...prev, newWidget];
    });
  }, []);

  return (
    <ReportContext.Provider value={{
      nodes, setNodes, edges, setEdges,
      selectedNodeId, setSelectedNodeId,
      widgets, setWidgets, addWidget, updateWidget, removeWidget, duplicateWidget,
      setWidgetBinding, addFieldToWidgetBinding, removeFieldFromWidgetBinding,
      selectedWidgetId, setSelectedWidgetId,
      activeTab, setActiveTab,
      datasets, datasetNames,
      availableSources,
      generateNodeData,
      generatedData,
      loadingNodes,
      handoffContext,
      activeTemplateId, setActiveTemplateId,
      zoom, setZoom,
      pageSize, setPageSize,
      orientation, setOrientation,
      margins, setMargins,
      rightPanelTab, setRightPanelTab,
      showRulers, setShowRulers,
      // Semantic-model state
      selectedSources, setSelectedSources,
      addSourceFromCatalog, removeSource, toggleSourceField,
      relationships, setRelationships,
      measures, setMeasures, addMeasure, updateMeasure, removeMeasure,
      parameters, setParameters, addParameter, updateParameter, removeParameter,
      inspectorMode, setInspectorMode,
      fieldLibrary,
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within ReportProvider');
  return ctx;
}
