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
 * Heuristic: guess whether a column is a dimension or a measure based on its name.
 */
function guessRole(name) {
  const lower = String(name).toLowerCase();
  const measureHints = ['count', 'total', 'amount', 'value', 'fee', 'sum', 'avg', 'budget', 'population', 'fine', 'spend', 'qty', 'quantity'];
  if (measureHints.some(h => lower.includes(h))) return 'measure';
  // Common region/category columns in chat data are numeric counts — treat known dimension names explicitly
  const dimensionHints = ['date', 'month', 'year', 'quarter', 'week', 'day', 'type', 'category', 'status', 'name', 'id', 'department', 'region', 'state', 'city'];
  if (dimensionHints.some(h => lower.includes(h))) return 'dimension';
  // Fall back: numeric-looking sample values mean measure. We don't have that info here, so default to measure for unknown columns.
  return 'measure';
}

/**
 * Build a selectedSources entry from a handoff context. Includes an inline schema
 * so the new semantic-model UI can render fields, checkboxes, and previews without
 * the source being in the static catalog.
 */
function buildHandoffSelectedSource(ctx) {
  if (!ctx) return null;
  const columns = ctx.columns || [];
  if (columns.length === 0) return null;

  const sourceId = (ctx.dataSource || 'chat_query')
    .toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'chat_query';

  const inlineSchema = columns.map(c => {
    const name = c.property || c.header;
    const displayName = c.header || c.property;
    return {
      name,
      displayName,
      type: 'string',
      role: guessRole(name),
      description: '',
    };
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
      setWidgetBinding,
      selectedWidgetId, setSelectedWidgetId,
      activeTab, setActiveTab,
      datasets, datasetNames,
      availableSources,
      generateNodeData,
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
      measures, setMeasures, addMeasure, removeMeasure,
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
