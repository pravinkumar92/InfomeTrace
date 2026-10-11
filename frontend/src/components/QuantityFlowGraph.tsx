import { useMemo, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import type { Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface QuantityNode {
  id: string;
  label: string;
  type: 'batch' | 'kitchen' | 'inventory' | 'partner';
  quantity?: number;
  contaminated?: number;
  status?: string;
  partnerType?: string;
}

interface QuantityLink {
  source: string;
  target: string;
  quantity?: number;
  type: 'distributed' | 'contaminated' | 'recovery';
}

interface Props {
  batchId: string;
  nodes: QuantityNode[];
  links: QuantityLink[];
  recommendedPartnerId?: string | null;
}

const QuantityFlowGraphInner: React.FC<Props> = ({ batchId, nodes, links, recommendedPartnerId }) => {
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const baseNodeStyle = {
      color: '#FFFFFF',
      width: 120,
      padding: '8px 6px',
      fontSize: '9px',
      fontFamily: 'var(--font-mono)',
      textAlign: 'center' as const,
      border: '2px solid transparent',
      borderRadius: '4px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease-in-out'
    };

    const edgeLabelStyle = { fill: '#52545A', fontSize: 9, fontWeight: 700 };
    const edgeBgStyle = { fill: '#F7F7F5', fillOpacity: 0.95, rx: 4, ry: 4 };

    // Position nodes in layers
    const batchNodes = nodes.filter(n => n.type === 'batch');
    const kitchenNodes = nodes.filter(n => n.type === 'kitchen');
    const inventoryNodes = nodes.filter(n => n.type === 'inventory');
    const partnerNodes = nodes.filter(n => n.type === 'partner');

    // Batch nodes (Layer 1)
    batchNodes.forEach((node, i) => {
      newNodes.push({
        id: node.id,
        data: { label: `BATCH\n${node.id}` },
        position: { x: 100, y: 250 },
        style: { 
          ...baseNodeStyle, 
          background: '#7c3aed',
          borderColor: '#a78bfa'
        }
      });
    });

    // Kitchen nodes (Layer 2)
    kitchenNodes.forEach((node, i) => {
      const isContaminated = node.status === 'CONTAMINATED';
      newNodes.push({
        id: node.id,
        data: { label: `KITCHEN\n${node.id}` },
        position: { x: 300, y: 50 + i * 120 },
        style: {
          ...baseNodeStyle,
          background: isContaminated ? '#991b1b' : '#1e40af',
          borderColor: isContaminated ? '#ef4444' : '#3b82f6'
        }
      });
    });

    // Inventory nodes (Layer 3)
    inventoryNodes.forEach((node, i) => {
      const isContaminated = (node.contaminated || 0) > 0;
      newNodes.push({
        id: node.id,
        data: { label: `STOCK\n${node.label || node.quantity + 'kg'}` },
        position: { x: 500, y: 50 + i * 120 },
        style: {
          ...baseNodeStyle,
          background: isContaminated ? '#dc2626' : '#059669',
          borderColor: isContaminated ? '#fca5a5' : '#34d399',
          width: 100
        }
      });
    });

    // Partner nodes (Layer 4)
    partnerNodes.forEach((node, i) => {
      const isRecommended = node.id === recommendedPartnerId;
      const bgColor = node.partnerType === 'FERTILIZER' ? '#10b981' 
                    : node.partnerType === 'BIOGAS' ? '#3b82f6' 
                    : '#f59e0b';
      
      newNodes.push({
        id: node.id,
        data: { 
          label: isRecommended ? `★ ${node.label}` : node.label 
        },
        position: { x: 700, y: 80 + i * 100 },
        style: {
          ...baseNodeStyle,
          background: bgColor,
          borderColor: isRecommended ? '#fbbf24' : '#ffffff',
          borderWidth: isRecommended ? '3px' : '2px',
          width: 140
        }
      });
    });

    // Create edges
    links.forEach((link, i) => {
      const edgeColor = link.type === 'contaminated' ? '#ef4444' 
                      : link.type === 'recovery' ? '#10b981' 
                      : '#64748b';
      
      const isDashed = link.type === 'recovery';
      
      newEdges.push({
        id: `e-${i}-${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        label: link.quantity ? `${link.quantity}kg` : '',
        labelStyle: edgeLabelStyle,
        labelBgStyle: edgeBgStyle,
        style: {
          stroke: edgeColor,
          strokeWidth: link.type === 'recovery' ? 3 : 2,
          strokeDasharray: isDashed ? '5,5' : '0'
        },
        animated: link.type === 'recovery'
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [nodes, links, recommendedPartnerId]);

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#E5E7EB" gap={16} />
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          style={{ 
            button: { 
              backgroundColor: '#FAFAF9',
              border: '1px solid #E5E7EB',
              borderRadius: '4px'
            }
          }}
        />
        
        {/* Legend Panel */}
        <Panel position="top-right" className="bg-surface border border-ui-border rounded p-2 m-2">
          {isLegendOpen ? (
            <div className="space-y-2 min-w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-[10px] uppercase tracking-widest text-ink">Legend</div>
                <button
                  onClick={() => setIsLegendOpen(false)}
                  className="text-muted hover:text-ink"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 border border-purple-400 rounded flex-shrink-0"></div>
                  <span className="text-muted">Batch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-700 border border-blue-500 rounded flex-shrink-0"></div>
                  <span className="text-muted">Kitchen (Clean)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-800 border border-red-500 rounded flex-shrink-0"></div>
                  <span className="text-muted">Kitchen (Contaminated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 border border-red-400 rounded flex-shrink-0"></div>
                  <span className="text-muted">Contaminated Stock</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLegendOpen(true)}
              className="text-[10px] font-bold text-ink hover:text-accent uppercase tracking-widest flex items-center gap-1"
            >
              Legend
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default function QuantityFlowGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <QuantityFlowGraphInner {...props} />
    </ReactFlowProvider>
  );
}
