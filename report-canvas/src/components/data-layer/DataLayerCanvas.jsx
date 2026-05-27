// Forge components: ForgeIcon
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow, Controls, Background,
  addEdge, applyNodeChanges, applyEdgeChanges,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import SourceNode from './nodes/SourceNode.jsx';
import TransformNode from './nodes/TransformNode.jsx';
import OutputNode from './nodes/OutputNode.jsx';
import JoinConfigPopover from './JoinConfigPopover.jsx';
import DataPreviewDrawer from './DataPreviewDrawer.jsx';

const nodeTypes = {
  source: SourceNode,
  transform: TransformNode,
  output: OutputNode,
};

function CustomConnectionLine({ fromX, fromY, toX, toY }) {
  if (fromX == null || fromY == null || toX == null || toY == null) return null;
  return (
    <g>
      <path
        fill="none"
        stroke="#94a3b8"
        strokeWidth={1.5}
        strokeDasharray="6 3"
        d={`M${fromX},${fromY} C${fromX + 80},${fromY} ${toX - 80},${toY} ${toX},${toY}`}
      />
      <circle cx={toX} cy={toY} r={4} fill="#94a3b8" />
    </g>
  );
}

function DataLayerCanvasInner() {
  const { nodes, setNodes, edges, setEdges, setSelectedNodeId, selectedSources, addSourceFromCatalog, setInspectorMode } = useReport();
  const SOURCE_NODE_SPACING = 240;
  const SOURCE_NODE_Y = 120;
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [joinPopover, setJoinPopover] = useState(null);

  const onNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const onEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  const onConnect = useCallback((connection) => {
    const edgeId = `e-${connection.source}-${connection.target}-${Date.now()}`;
    const newEdge = { ...connection, id: edgeId, animated: true, data: {} };
    setEdges(eds => addEdge(newEdge, eds));

    // Show join config popover near center of canvas
    const wrapper = reactFlowWrapper.current;
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      setJoinPopover({
        edgeId,
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        position: { x: rect.width / 2 - 140, y: rect.height / 2 - 120 },
      });
    }
  }, [setEdges]);

  // Sync selectedSources (semantic-model state) → ReactFlow nodes
  useEffect(() => {
    setNodes(prevNodes => {
      const prevById = new Map(prevNodes.map(n => [n.id, n]));
      const next = [];

      selectedSources.forEach((sel, idx) => {
        const nodeId = `source-${sel.sourceId}`;
        const existing = prevById.get(nodeId);
        next.push({
          id: nodeId,
          type: 'source',
          position: existing?.position || { x: 80 + idx * SOURCE_NODE_SPACING, y: SOURCE_NODE_Y },
          data: {
            sourceId: sel.sourceId,
            includedFields: sel.includedFields,
            configured: true,
          },
        });
      });

      // Preserve any non-catalog nodes (output, handoff, transforms) by keeping
      // anything that's not a catalog source.
      prevNodes.forEach(n => {
        const isCatalogSource = selectedSources.some(s => `source-${s.sourceId}` === n.id);
        if (!isCatalogSource && !n.id.startsWith('source-')) next.push(n);
      });

      return next;
    });
  }, [selectedSources, setNodes]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setInspectorMode('selection');
  }, [setSelectedNodeId, setInspectorMode]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    // New semantic-model source drag
    const sourceRaw = event.dataTransfer.getData('application/x-tira-source');
    if (sourceRaw) {
      const { sourceId } = JSON.parse(sourceRaw);
      addSourceFromCatalog(sourceId);
      return;
    }

    // Legacy palette drag (kept for compatibility while we transition)
    const raw = event.dataTransfer.getData('application/reactflow');
    if (!raw) return;

    const config = JSON.parse(raw);
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const isSource = config.type === 'source';
    const newNode = {
      id: `${config.type}-${Date.now()}`,
      type: config.type,
      position,
      data: {
        label: config.label || 'Source',
        icon: config.icon,
        subtype: config.subtype,
        fields: [],
        configured: !isSource,
        configSummary: isSource ? '' : 'Configure in properties panel',
      },
    };

    setNodes(nds => [...nds, newNode]);
    if (isSource) setSelectedNodeId(newNode.id);
  }, [screenToFlowPosition, setNodes, setSelectedNodeId, addSourceFromCatalog]);

  const isEmpty = nodes.length === 0;

  return (
    <div className="data-layer-layout">
      <div ref={reactFlowWrapper} className="data-layer-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          connectionLineComponent={CustomConnectionLine}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} />
          {!isEmpty && <Controls />}
        </ReactFlow>
        {isEmpty && (
          <div className="canvas-empty-state">
            <div className="canvas-empty-icon">
              <ForgeIcon name="account_tree" style={{ fontSize: 32, color: '#9ca3af' }} />
            </div>
            <h3 className="canvas-empty-title">Start building your data model</h3>
            <p className="canvas-empty-desc">
              Drag data sources from the left panel onto this canvas, then connect them to define relationships.
            </p>
            <div className="canvas-empty-steps">
              <div className="canvas-empty-step">
                <span className="canvas-empty-step-num">1</span>
                <span>Drag a data source onto the canvas</span>
              </div>
              <div className="canvas-empty-step">
                <span className="canvas-empty-step-num">2</span>
                <span>Add more sources or transforms</span>
              </div>
              <div className="canvas-empty-step">
                <span className="canvas-empty-step-num">3</span>
                <span>Connect nodes to define joins</span>
              </div>
            </div>
          </div>
        )}
        {joinPopover && (
          <JoinConfigPopover
            edgeId={joinPopover.edgeId}
            sourceNodeId={joinPopover.sourceNodeId}
            targetNodeId={joinPopover.targetNodeId}
            position={joinPopover.position}
            onClose={() => setJoinPopover(null)}
          />
        )}
      </div>
      <DataPreviewDrawer />
    </div>
  );
}

// Wrap in ReactFlowProvider so useReactFlow() works
import { ReactFlowProvider } from '@xyflow/react';

export default function DataLayerCanvas() {
  return (
    <ReactFlowProvider>
      <DataLayerCanvasInner />
    </ReactFlowProvider>
  );
}
