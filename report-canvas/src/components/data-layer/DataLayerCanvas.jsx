// Forge components: ForgeIcon
import { useCallback, useRef, useState } from 'react';
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
import DataPreviewPanel from './DataPreviewPanel.jsx';

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
  const { nodes, setNodes, edges, setEdges, setSelectedNodeId } = useReport();
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

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
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
  }, [screenToFlowPosition, setNodes, setSelectedNodeId]);

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
      {!isEmpty && <DataPreviewPanel />}
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
