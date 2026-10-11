import { useMemo, useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
  ReactFlowProvider
} from 'reactflow';
import type { Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import type { InvestigationResponse, SimulateContainmentResponse } from '../api/types';

interface Props {
  result: InvestigationResponse | null;
  simResult?: SimulateContainmentResponse | null;
}

interface NodeData {
  label: string;
  type: 'batch' | 'kitchen' | 'dish' | 'order' | 'customer';
  id: string;
  details?: any;
}

// Kitchen-Dish mapping (2-3 dishes per kitchen)
const KITCHEN_DISH_MAP: Record<string, string[]> = {
  'K01': ['D01', 'D02', 'D03'],
  'K02': ['D04', 'D05'],
  'K03': ['D06', 'D07'],
  'K04': ['D08']
};

const ImpactGraphInner: React.FC<Props> = ({ result, simResult }) => {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!result) return { nodes: [], edges: [] };

    const newNodes: Node<NodeData>[] = [];
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
      transition: 'all 0.3s ease-in-out',
      opacity: 1
    };

    const fadedStyle = {
      opacity: 0.25,
      filter: 'grayscale(90%) brightness(1.2)'
    };

    const getStatusColor = (status: string) => {
      switch(status) {
        case 'RECALLED': return '#C41E3A';
        case 'QUARANTINED': return '#FF6B35';
        case 'FLAGGED': return '#F7B801';
        case 'SUSPENDED': return '#9B59B6';
        case 'VERIFIED': return '#27AE60';
        case 'SAFE': return '#315C7D';
        default: return '#52545A';
      }
    };

    const edgeStyle = (shouldFade: boolean, isHighlighted: boolean) => ({
      stroke: isHighlighted ? '#F7B801' : (shouldFade ? '#D9DADD' : '#52545A'),
      strokeWidth: isHighlighted ? 3 : 2,
      opacity: shouldFade ? 0.25 : (isHighlighted ? 1 : 0.6),
      animated: isHighlighted
    });

    const edgeLabelStyle = { fill: '#52545A', fontSize: 9, fontWeight: 700 };
    const edgeBgStyle = { fill: '#F7F7F5', fillOpacity: 0.95, rx: 4, ry: 4 };

    // Get selected kitchen ID
    const selectedKitchenId = simResult?.containment_kitchen_id || null;

    if (result.investigation_type === 'batch' && result.batch) {
      const batchStatus = result.batch.status || 'SAFE';
      
      // Batch Node (always bright)
      newNodes.push({
        id: `b-${result.batch.id}`,
        data: { 
          label: `BATCH\n${result.batch.id}\n[${batchStatus}]`,
          type: 'batch' as const,
          id: result.batch.id,
          details: result.batch
        },
        position: { x: 100, y: 250 },
        style: { 
          ...baseNodeStyle, 
          background: getStatusColor(batchStatus)
        }
      });

      // Kitchens
      result.kitchens.forEach((k, i) => {
        const kStatus = k.status || 'ACTIVE';
        const shouldFadeKitchen = selectedKitchenId ? k.id !== selectedKitchenId : false;
        
        const kStyle = shouldFadeKitchen ? 
          { ...baseNodeStyle, background: getStatusColor(kStatus), ...fadedStyle } :
          { ...baseNodeStyle, background: getStatusColor(kStatus) };
        
        newNodes.push({
          id: `k-${k.id}`,
          data: { 
            label: `KITCHEN\n${k.id}\n${k.name}`,
            type: 'kitchen' as const,
            id: k.id,
            details: k
          },
          position: { x: 300, y: 50 + i * 80 },
          style: kStyle
        });
        
        // Batch to Kitchen edge
        const edgeId = `e-b-${result.batch?.id || 'unknown'}-k-${k.id}`;
        newEdges.push({
          id: edgeId,
          source: `b-${result.batch?.id || 'unknown'}`,
          target: `k-${k.id}`,
          label: 'DELIVERED TO',
          labelStyle: edgeLabelStyle,
          labelBgStyle: edgeBgStyle,
          style: edgeStyle(shouldFadeKitchen, highlightPath.includes(edgeId))
        });
      });

      // Dishes (only connect to their specific kitchens)
      result.dishes.forEach((d, i) => {
        const dStatus = d.status || 'AVAILABLE';
        
        // Find which kitchen(s) this dish belongs to
        const dishKitchens: string[] = [];
        for (const [kitchenId, dishIds] of Object.entries(KITCHEN_DISH_MAP)) {
          if (dishIds.includes(d.id)) {
            dishKitchens.push(kitchenId);
          }
        }
        
        // Fade dish if ALL its kitchens are faded
        const allKitchensFaded = dishKitchens.every(kId => 
          selectedKitchenId && kId !== selectedKitchenId
        );
        const shouldFadeDish = selectedKitchenId ? allKitchensFaded : false;
        
        const dStyle = shouldFadeDish ?
          { ...baseNodeStyle, background: getStatusColor(dStatus), ...fadedStyle } :
          { ...baseNodeStyle, background: getStatusColor(dStatus) };
        
        newNodes.push({
          id: `d-${d.id}`,
          data: { 
            label: `DISH\n${d.id}\n${d.name}`,
            type: 'dish' as const,
            id: d.id,
            details: d
          },
          position: { x: 500, y: 50 + i * 60 },
          style: dStyle
        });
        
        // Connect dish only to its specific kitchen(s)
        dishKitchens.forEach(kitchenId => {
          const shouldFadeEdge = selectedKitchenId ? kitchenId !== selectedKitchenId : false;
          const edgeId = `e-k-${kitchenId}-d-${d.id}`;
          
          newEdges.push({
            id: edgeId,
            source: `k-${kitchenId}`,
            target: `d-${d.id}`,
            label: 'USED IN',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(shouldFadeEdge, highlightPath.includes(edgeId))
          });
        });
      });

      // Dish-Order mapping (specific orders per dish, not all-to-all)
      const DISH_ORDER_MAP: Record<string, string[]> = {
        'D01': ['O01', 'O04'],     // K01 dishes
        'D02': ['O02'],
        'D03': ['O03'],
        'D04': ['O05', 'O07'],     // K02 dishes
        'D05': ['O06'],
        'D06': ['O08', 'O10'],     // K03 dishes
        'D07': ['O09'],
        'D08': ['O11', 'O12']      // K04 dishes
      };

      // Order-Customer mapping (1:1 - each order has one customer)
      const ORDER_CUSTOMER_MAP: Record<string, string> = {
        'O01': 'C01', 'O02': 'C02', 'O03': 'C03', 'O04': 'C04',
        'O05': 'C05', 'O06': 'C06', 'O07': 'C07',
        'O08': 'C08', 'O09': 'C09', 'O10': 'C10',
        'O11': 'C01', 'O12': 'C02'  // Repeat customers
      };

      // Get bright dishes (dishes belonging to selected kitchen)
      const brightDishes = new Set<string>();
      if (selectedKitchenId) {
        const selectedDishes = KITCHEN_DISH_MAP[selectedKitchenId] || [];
        selectedDishes.forEach(dishId => brightDishes.add(dishId));
      }

      // Get bright orders (orders connected to bright dishes)
      const brightOrders = new Set<string>();
      if (selectedKitchenId) {
        brightDishes.forEach(dishId => {
          const orders = DISH_ORDER_MAP[dishId] || [];
          orders.forEach(orderId => brightOrders.add(orderId));
        });
      }

      // Get bright customers (customers with bright orders)
      const brightCustomers = new Set<string>();
      if (selectedKitchenId) {
        brightOrders.forEach(orderId => {
          const customerId = ORDER_CUSTOMER_MAP[orderId];
          if (customerId) brightCustomers.add(customerId);
        });
      }

      // Orders - fade if not in bright orders
      result.orders.forEach((o, i) => {
        const shouldFadeOrder = selectedKitchenId && !brightOrders.has(o.id);
        const oStyle = shouldFadeOrder ?
          { ...baseNodeStyle, background: '#8B939A', ...fadedStyle } :
          { ...baseNodeStyle, background: '#8B939A' };
        
        newNodes.push({
          id: `o-${o.id}`,
          data: { 
            label: `ORDER\n${o.id}\n${o.timestamp.substring(0,10)}`,
            type: 'order' as const,
            id: o.id,
            details: o
          },
          position: { x: 700, y: 50 + i * 50 },
          style: oStyle
        });
        
        // Connect orders ONLY to their specific dishes
        result.dishes.forEach(d => {
          const dishOrders = DISH_ORDER_MAP[d.id] || [];
          if (dishOrders.includes(o.id)) {
            const dishIsBright = brightDishes.has(d.id);
            const orderIsBright = brightOrders.has(o.id);
            const shouldFadeEdge = selectedKitchenId && (!dishIsBright || !orderIsBright);
            const edgeId = `e-d-${d.id}-o-${o.id}`;
            
            newEdges.push({
              id: edgeId,
              source: `d-${d.id}`,
              target: `o-${o.id}`,
              label: 'ORDERED AS',
              labelStyle: edgeLabelStyle,
              labelBgStyle: edgeBgStyle,
              style: edgeStyle(shouldFadeEdge || false, highlightPath.includes(edgeId))
            });
          }
        });
      });

      // Customers - fade if not in bright customers
      result.customers.forEach((c, i) => {
        const shouldFadeCustomer = selectedKitchenId && !brightCustomers.has(c.id);
        const cStyle = shouldFadeCustomer ?
          { ...baseNodeStyle, background: '#AEB4B9', color: '#171719', ...fadedStyle } :
          { ...baseNodeStyle, background: '#AEB4B9', color: '#171719' };
        
        newNodes.push({
          id: `c-${c.id}`,
          data: { 
            label: `CUSTOMER\n${c.id}\n${c.name}`,
            type: 'customer' as const,
            id: c.id,
            details: c
          },
          position: { x: 900, y: 50 + i * 50 },
          style: cStyle
        });
        
        // Connect customers ONLY to their specific orders
        result.orders.forEach(o => {
          if (ORDER_CUSTOMER_MAP[o.id] === c.id) {
            const orderIsBright = brightOrders.has(o.id);
            const shouldFadeEdge = selectedKitchenId && !orderIsBright;
            const edgeId = `e-o-${o.id}-c-${c.id}`;
            
            newEdges.push({
              id: edgeId,
              source: `o-${o.id}`,
              target: `c-${c.id}`,
              label: 'PLACED BY',
              labelStyle: edgeLabelStyle,
              labelBgStyle: edgeBgStyle,
              style: edgeStyle(shouldFadeEdge || false, highlightPath.includes(edgeId))
            });
          }
        });
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [result, simResult, highlightPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node.data as NodeData);
    
    const pathEdges: string[] = [];
    edges.forEach(edge => {
      if (edge.target === node.id || edge.source === node.id) {
        pathEdges.push(edge.id);
      }
    });
    
    setHighlightPath(pathEdges);
  }, [edges]);

  const closeDetail = useCallback(() => {
    setSelectedNode(null);
    setHighlightPath([]);
  }, []);

  if (!result) return null;

  return (
    <div className="h-full w-full relative">
      <Panel position="top-left" className="bg-transparent">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-bold text-ink tracking-widest uppercase bg-surface px-3 py-1.5 border border-ui-border shadow-sm">
            Traceability Graph
          </h2>
          <div className="text-[9px] font-mono text-muted bg-surface px-2 py-1 border border-ui-border">
            {nodes.length} nodes • {edges.length} edges
          </div>
          {simResult && (
            <div className="flex items-center gap-2 bg-simulation-soft px-3 py-1.5 border border-simulation shadow-sm animate-pulse">
              <div className="w-2 h-2 rounded-full bg-simulation"></div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-simulation">
                SIMULATION ACTIVE
              </span>
            </div>
          )}
        </div>
      </Panel>

      <Panel position="top-right" className="bg-transparent">
        <div className="bg-surface px-4 py-3 border border-ui-border shadow-sm min-w-[180px]">
          <div className="text-[9px] font-bold tracking-widest uppercase text-ink mb-3">Status Colors</div>
          <div className="grid grid-cols-1 gap-2 text-[9px] font-mono">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{background: '#C41E3A'}}></div>
              <span className="text-muted">RECALLED</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{background: '#9B59B6'}}></div>
              <span className="text-muted">SUSPENDED</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{background: '#F7B801'}}></div>
              <span className="text-muted">FLAGGED</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{background: '#27AE60'}}></div>
              <span className="text-muted">VERIFIED</span>
            </div>
          </div>
          {simResult && (
            <div className="mt-4 pt-3 border-t border-ui-border">
              <div className="text-[9px] font-bold tracking-widest uppercase text-ink mb-2">Simulation</div>
              <div className="grid grid-cols-1 gap-2 text-[9px]">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded flex-shrink-0 bg-ink"></div>
                  <span className="text-ink font-bold">Selected</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded flex-shrink-0 bg-muted opacity-30"></div>
                  <span className="text-muted opacity-50">Others</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {selectedNode && (
        <Panel position="bottom-right" className="bg-transparent">
          <div className="bg-surface border-2 border-accent shadow-lg w-80 max-h-96 overflow-auto">
            <div className="sticky top-0 bg-ink text-surface px-4 py-3 flex items-center justify-between border-b-2 border-accent">
              <div>
                <div className="text-[9px] font-bold tracking-widest uppercase opacity-70">
                  {selectedNode.type}
                </div>
                <div className="text-sm font-mono font-bold">{selectedNode.id}</div>
              </div>
              <button 
                onClick={closeDetail}
                className="text-surface hover:text-accent transition-colors text-lg font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(selectedNode.details || {}).map(([key, value]) => (
                <div key={key} className="text-[10px]">
                  <div className="font-bold tracking-wider uppercase text-muted mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="font-mono text-ink bg-ui-bg px-2 py-1 rounded break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView 
        fitViewOptions={{ padding: 0.15, duration: 800 }} 
        minZoom={0.1} 
        maxZoom={2}
        defaultEdgeOptions={{ type: 'straight' }}
      >
        <Background color="#D9DADD" gap={24} size={1} />
        <Controls 
          className="bg-surface fill-ink border-ui-border shadow-md" 
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
};

export const ImpactGraph: React.FC<Props> = (props) => {
  return (
    <ReactFlowProvider>
      <ImpactGraphInner {...props} />
    </ReactFlowProvider>
  );
};
