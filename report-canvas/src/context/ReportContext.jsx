import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { fetchDataTypes, fetchData } from '../services/dataService.js';
import { DEFAULT_MARGINS } from '../constants/pageSettings.js';

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
 * Build initial data-layer nodes + edges from handoff context.
 */
function buildHandoffNodes(ctx) {
  const columns = ctx.columns || [];
  const fields = columns.map(c => c.property || c.header);

  const sourceNode = {
    id: 'source-handoff',
    type: 'source',
    position: { x: 80, y: 120 },
    data: {
      label: ctx.dataSource || 'Chat Query',
      icon: 'database',
      subtype: 'database',
      fields,
      configured: true,
      configSummary: `${fields.length} fields from chat`,
    },
  };

  const outputNode = {
    id: 'output-handoff',
    type: 'output',
    position: { x: 500, y: 120 },
    data: {
      label: ctx.reportTitle || 'Report Data',
      fields,
    },
  };

  const edge = {
    id: 'e-handoff-source-output',
    source: 'source-handoff',
    target: 'output-handoff',
    animated: true,
    data: {},
  };

  return { nodes: [sourceNode, outputNode], edges: [edge] };
}

/**
 * Build initial report-builder widgets from handoff context.
 */
function buildHandoffWidgets(ctx) {
  const widgets = [];

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

  // Data table from the chat results
  widgets.push({
    id: 'widget-handoff-table',
    type: 'table',
    title: ctx.reportTitle || 'Data Table',
    gridColumn: 1,
    gridRow: 2,
    colSpan: 12,
    rowSpan: 3,
    config: { dataSource: ctx.dataSource || 'Chat Query' },
  });

  // Bar chart
  widgets.push({
    id: 'widget-handoff-chart',
    type: 'chart',
    title: `${ctx.reportTitle || 'Data'} — Visualization`,
    gridColumn: 1,
    gridRow: 5,
    colSpan: 12,
    rowSpan: 3,
    config: { subtype: 'bar', dataSource: ctx.dataSource || 'Chat Query' },
  });

  return widgets;
}

export function ReportProvider({ children }) {
  const [handoffContext] = useState(() => readHandoffContext());

  // Initialize nodes/edges from handoff if available
  const handoffData = useMemo(() => {
    if (!handoffContext) return { nodes: [], edges: [] };
    return buildHandoffNodes(handoffContext);
  }, [handoffContext]);

  const [nodes, setNodes] = useState(handoffData.nodes);
  const [edges, setEdges] = useState(handoffData.edges);
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
  const [viewMode, setViewMode] = useState('print'); // 'print' | 'dashboard'
  const [zoom, setZoom] = useState(100); // 50-200
  const [pageSize, setPageSize] = useState('letter'); // 'letter' | 'a4' | 'legal'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [margins, setMargins] = useState(DEFAULT_MARGINS);
  const [rightPanelTab, setRightPanelTab] = useState('properties'); // 'properties' | 'ai-chat'
  const [showRulers, setShowRulers] = useState(true);

  // API-driven state
  const [availableSources, setAvailableSources] = useState([]);
  const [generatedData, setGeneratedData] = useState(() => {
    // Pre-populate generated data from handoff context
    if (!handoffContext || !handoffContext.data) return {};
    const columns = (handoffContext.columns || []).map(c => c.property || c.header);
    return {
      'source-handoff': {
        type: 'handoff',
        rows: handoffContext.data,
        columns,
      },
    };
  });
  const [loadingNodes, setLoadingNodes] = useState(new Set());

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
      selectedWidgetId, setSelectedWidgetId,
      activeTab, setActiveTab,
      datasets, datasetNames,
      availableSources,
      generateNodeData,
      loadingNodes,
      handoffContext,
      activeTemplateId, setActiveTemplateId,
      viewMode, setViewMode,
      zoom, setZoom,
      pageSize, setPageSize,
      orientation, setOrientation,
      margins, setMargins,
      rightPanelTab, setRightPanelTab,
      showRulers, setShowRulers,
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
