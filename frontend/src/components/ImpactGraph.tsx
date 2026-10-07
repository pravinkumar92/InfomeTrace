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

const ImpactGraphInner: React.FC<Props> = ({ result, simResult }) => {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!result) return { nodes: [], edges: [] };

    try {
      console.log('ImpactGraph: Rendering with investigation_type:', result.investigation_type);
      console.log('ImpactGraph: simResult:', simResult);
      console.log('ImpactGraph: Result data:', result);

      const newNodes: Node<NodeData>[] = [];
      const newEdges: Edge[] = [];
      
      setRenderError(null);
    
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
      letterSpacing: '0.02em',
      cursor: 'pointer',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease-in-out',
      opacity: 1
    };

    const getStatusColor = (status: string) => {
      switch(status) {
        case 'RECALLED': return '#C41E3A';
        case 'QUARANTINED': return '#FF6B35';
        case 'FLAGGED': return '#F7B801';
        case 'SUSPENDED': return '#9B59B6';
        case 'VERIFIED': return '#27AE60';
        case 'SAFE': return '#315C7D';
        case 'AVAILABLE': return '#66717C';
        case 'COMPLETED': return '#27AE60';
        case 'ACTIVE': return '#315C7D';
        default: return '#52545A';
      }
    };
    
    const fadedStyle = {
      opacity: 0.25,
      filter: 'grayscale(90%) brightness(1.2)'
    };

    const isContained = (type: string, id: string) => {
      if (!simResult) return false;
      const result = (
        (type === 'k' && simResult.contained.kitchens.find(x => x.id === id)) ||
        (type === 'd' && simResult.contained.dishes.find(x => x.id === id)) ||
        (type === 'o' && simResult.contained.orders.find(x => x.id === id)) ||
        (type === 'c' && simResult.contained.customers.find(x => x.id === id))
      );
      if (result) console.log(`isContained(${type}, ${id}): true`);
      return !!result;
    };
    
    const isRemaining = (type: string, id: string) => {
      if (!simResult) return false;
      const result = (
        (type === 'k' && simResult.remaining.kitchens.find(x => x.id === id)) ||
        (type === 'd' && simResult.remaining.dishes.find(x => x.id === id)) ||
        (type === 'o' && simResult.remaining.orders.find(x => x.id === id)) ||
        (type === 'c' && simResult.remaining.customers.find(x => x.id === id))
      );
      if (result) console.log(`isRemaining(${type}, ${id}): true - WILL FADE`);
      return !!result;
    };

    // Apply faded style to REMAINING (not contained) nodes
    const getNodeStyle = (type: string, id: string, baseStyle: any) => {
      if (!simResult) return baseStyle;
      
      // If in remaining (outside containment), fade it out
      if (isRemaining(type, id)) {
        console.log(`Applying fadedStyle to ${type}-${id}`);
        return { ...baseStyle, ...fadedStyle };
      }
      
      // If contained (inside containment area), keep bright
      if (isContained(type, id)) {
        console.log(`Keeping bright: ${type}-${id} (contained)`);
      }
      return baseStyle;
    };

    const edgeStyle = (shouldFade: boolean, isHighlighted: boolean) => ({
      stroke: isHighlighted ? '#F7B801' : (shouldFade ? '#D9DADD' : '#52545A'),
      strokeWidth: isHighlighted ? 3 : 2,
      opacity: shouldFade ? 0.25 : (isHighlighted ? 1 : 0.6),
      animated: isHighlighted
    });

    const edgeLabelStyle = { fill: '#52545A', fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-sans)' };
    const edgeBgStyle = { fill: '#F7F7F5', fillOpacity: 0.95, rx: 4, ry: 4 };

    // Batch Investigation
    if (result.investigation_type === 'batch' && result.batch) {
      const batchStatus = result.batch.status || 'SAFE';
      // Batch is ALWAYS bright (never faded)
      newNodes.push({
        id: `b-${result.batch.id}`,
        data: { 
          label: `ðŸ”´ BATCH\n${result.batch.id}\n[${batchStatus}]`,
          type: 'batch' as const,
          id: result.batch.id,
          details: result.batch
        },
        position: { x: 100, y: 250 },
        style: { 
          ...baseNodeStyle, 
          background: getStatusColor(batchStatus),
          borderColor: batchStatus === 'RECALLED' ? '#FFFFFF' : 'transparent'
        }
      });

      result.kitchens.forEach((k, i) => {
        const kStatus = k.status || 'ACTIVE';
        
        // Kitchen fading logic:
        // If simulation active, fade kitchens from DIFFERENT cities than selected kitchen
        let shouldFade = false;
        if (simResult && simResult.contained && simResult.contained.kitchens.length > 0) {
          // Get the selected kitchen's city from the contained kitchens
          const selectedKitchen = simResult.contained.kitchens[0]; // Should only be 1 kitchen
          const selectedCity = selectedKitchen?.city;
          
          console.log(`Selected kitchen city: ${selectedCity}, Current kitchen: ${k.id} (${k.city})`);
          
          // Fade if this kitchen is from a different city than the selected one
          if (selectedCity && k.city !== selectedCity) {
            shouldFade = true;
            console.log(`âœ— Fading kitchen ${k.id} (${k.city}) - different city than ${selectedCity}`);
          } else {
            console.log(`âœ“ Keeping bright: kitchen ${k.id} (${k.city})`);
          }
        }
        
        const kStyle = shouldFade ? 
          { ...baseNodeStyle, background: getStatusColor(kStatus), ...fadedStyle } :
          { ...baseNodeStyle, background: getStatusColor(kStatus) };
        
        newNodes.push({
          id: `k-${k.id}`,
          data: { 
            label: `ðŸ­ KITCHEN\n${k.id}\n${k.name}`,
            type: 'kitchen' as const,
            id: k.id,
            details: k
          },
          position: { x: 300, y: 50 + i * 80 },
          style: kStyle
        });
        const edgeId = `e-b-${result.batch?.id}-k-${k.id}`;
        newEdges.push({
          id: edgeId,
          source: `b-${result.batch?.id}`,
          target: `k-${k.id}`,
          label: 'DELIVERED TO',
          labelStyle: edgeLabelStyle,
          labelBgStyle: edgeBgStyle,
          style: edgeStyle(shouldFade, highlightPath.includes(edgeId))
        });
      });

      result.dishes.forEach((d, i) => {
        const dStatus = d.status || 'AVAILABLE';
        
        // Dishes: Keep bright (no fading based on simulation)
        const shouldFade = false;
        
        const dStyle = { 
          ...baseNodeStyle, 
          background: getStatusColor(dStatus), 
          borderColor: dStatus === 'SUSPENDED' ? '#FFFFFF' : 'transparent' 
        };
        
        newNodes.push({
          id: `d-${d.id}`,
          data: { 
            label: `ðŸ½ï¸ DISH\n${d.id}\n${d.name}`,
            type: 'dish' as const,
            id: d.id,
            details: d
          },
          position: { x: 500, y: 50 + i * 60 },
          style: dStyle
        });
        
        result.kitchens.forEach(k => {
          // Edge fading: fade edge if connected kitchen is faded
          let kFaded = false;
          
          if (simResult && simResult.contained && simResult.contained.kitchens.length > 0) {
            const selectedKitchen = simResult.contained.kitchens[0];
            const selectedCity = selectedKitchen?.city;
            kFaded = selectedCity ? k.city !== selectedCity : false;
          }
          
          const shouldFadeEdge = kFaded;
          const edgeId = `e-k-${k.id}-d-${d.id}`;
          
          newEdges.push({
            id: edgeId,
            source: `k-${k.id}`,
            target: `d-${d.id}`,
            label: 'USED IN',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(shouldFadeEdge, highlightPath.includes(edgeId))
          });
        });
      });

      result.orders.forEach((o, i) => {
        // Orders: Keep bright (no fading)
        const shouldFade = false;
        const oStyle = { ...baseNodeStyle, background: '#8B939A' };
        
        newNodes.push({
          id: `o-${o.id}`,
          data: { 
            label: `ðŸ“¦ ORDER\n${o.id}\n${o.timestamp.substring(0,10)}`,
            type: 'order' as const,
            id: o.id,
            details: o
          },
          position: { x: 700, y: 50 + i * 50 },
          style: oStyle
        });
        result.dishes.forEach(d => {
          const shouldFadeEdge = false;
          const edgeId = `e-d-${d.id}-o-${o.id}`;
          newEdges.push({
            id: edgeId,
            source: `d-${d.id}`,
            target: `o-${o.id}`,
            label: 'ORDERED AS',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(shouldFadeEdge, highlightPath.includes(edgeId))
          });
        });
      });

      result.customers.forEach((c, i) => {
        // Customers: Keep bright (no fading)
        const shouldFade = false;
        const cStyle = { ...baseNodeStyle, background: '#AEB4B9', color: '#171719' };
        
        newNodes.push({
          id: `c-${c.id}`,
          data: { 
            label: `ðŸ‘¤ CUSTOMER\n${c.id}\n${c.name}`,
            type: 'customer' as const,
            id: c.id,
            details: c
          },
          position: { x: 900, y: 50 + i * 50 },
          style: cStyle
        });
        result.orders.forEach(o => {
          const shouldFadeEdge = false;
          const edgeId = `e-o-${o.id}-c-${c.id}`;
          newEdges.push({
            id: edgeId,
            source: `o-${o.id}`,
            target: `c-${c.id}`,
            label: 'PLACED BY',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(shouldFadeEdge, highlightPath.includes(edgeId))
          });
        });
      });
    }

    // Order Investigation - Same style as Batch (reverse flow: Order -> Dishes -> Kitchens -> Batches -> Suppliers)
    if (result.investigation_type === 'order' && (result as any).order) {
      const orderData = result as any;
      
      // Order Node (Starting point - Left)
      newNodes.push({
        id: `o-${orderData.order.id}`,
        data: { 
          label: `ðŸ“¦ ORDER\n${orderData.order.id}\n${orderData.order.timestamp?.substring(0,10) || 'N/A'}`,
          type: 'order' as const,
          id: orderData.order.id,
          details: orderData.order
        },
        position: { x: 100, y: 250 },
        style: { 
          ...baseNodeStyle, 
          background: getStatusColor(orderData.order.status || 'COMPLETED'),
          borderColor: '#FFFFFF'
        }
      });

      // Customer Node (Below Order)
      if (orderData.customer) {
        newNodes.push({
          id: `c-${orderData.customer.id}`,
          data: { 
            label: `ðŸ‘¤ CUSTOMER\n${orderData.customer.id}\n${orderData.customer.name}`,
            type: 'customer' as const,
            id: orderData.customer.id,
            details: orderData.customer
          },
          position: { x: 50, y: 350 },
          style: { 
            ...baseNodeStyle, 
            background: '#AEB4B9',
            color: '#171719'
          }
        });
        
        newEdges.push({
          id: `e-o-${orderData.order.id}-c-${orderData.customer.id}`,
          source: `o-${orderData.order.id}`,
          target: `c-${orderData.customer.id}`,
          label: 'PLACED BY',
          labelStyle: edgeLabelStyle,
          labelBgStyle: edgeBgStyle,
          style: edgeStyle(false, highlightPath.includes(`e-o-${orderData.order.id}-c-${orderData.customer.id}`))
        });
      }

      // Dishes
      (orderData.dishes || []).forEach((d: any, i: number) => {
        newNodes.push({
          id: `d-${d.id}`,
          data: { 
            label: `ðŸ½ï¸ DISH\n${d.id}\n${d.name}`,
            type: 'dish' as const,
            id: d.id,
            details: d
          },
          position: { x: 350, y: 50 + i * 100 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(d.status || 'AVAILABLE'),
            borderColor: d.status === 'SUSPENDED' ? '#FFFFFF' : 'transparent'
          }
        });
        
        // Connect Order to Dish
        const edgeId = `e-o-${orderData.order.id}-d-${d.id}`;
        newEdges.push({
          id: edgeId,
          source: `o-${orderData.order.id}`,
          target: `d-${d.id}`,
          label: 'CONTAINS',
          labelStyle: edgeLabelStyle,
          labelBgStyle: edgeBgStyle,
          style: edgeStyle(false, highlightPath.includes(edgeId))
        });
      });

      // Kitchens
      (orderData.kitchens || []).forEach((k: any, i: number) => {
        newNodes.push({
          id: `k-${k.id}`,
          data: { 
            label: `ðŸ­ KITCHEN\n${k.id}\n${k.name}`,
            type: 'kitchen' as const,
            id: k.id,
            details: k
          },
          position: { x: 500, y: 50 + i * 60 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(k.status || 'ACTIVE')
          }
        });
        
        // Connect all Dishes to all Kitchens (mesh)
        (orderData.dishes || []).forEach((d: any) => {
          const edgeId = `e-d-${d.id}-k-${k.id}`;
          newEdges.push({
            id: edgeId,
            source: `d-${d.id}`,
            target: `k-${k.id}`,
            label: 'PREPARED AT',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(false, highlightPath.includes(edgeId))
          });
        });
      });

      // Batches
      (orderData.batches || []).forEach((b: any, i: number) => {
        newNodes.push({
          id: `b-${b.id}`,
          data: { 
            label: `ðŸ”´ BATCH\n${b.id}\n${b.ingredient}`,
            type: 'batch' as const,
            id: b.id,
            details: b
          },
          position: { x: 950, y: 50 + i * 80 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(b.status || 'SAFE')
          }
        });
        
        // Connect all Kitchens to all Batches (mesh)
        (orderData.kitchens || []).forEach((k: any) => {
          const edgeId = `e-k-${k.id}-b-${b.id}`;
          newEdges.push({
            id: edgeId,
            source: `k-${k.id}`,
            target: `b-${b.id}`,
            label: 'SOURCED FROM',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(false, highlightPath.includes(edgeId))
          });
        });
      });

      // Suppliers
      (orderData.suppliers || []).forEach((s: any, i: number) => {
        newNodes.push({
          id: `s-${s.id}`,
          data: { 
            label: `ðŸšš SUPPLIER\n${s.id}\n${s.name}`,
            type: 'customer' as const,
            id: s.id,
            details: s
          },
          position: { x: 1250, y: 50 + i * 80 },
          style: { 
            ...baseNodeStyle, 
            background: '#66717C',
            color: '#FFFFFF'
          }
        });
        
        // Connect all Batches to all Suppliers (mesh)
        (orderData.batches || []).forEach((b: any) => {
          const edgeId = `e-b-${b.id}-s-${s.id}`;
          newEdges.push({
            id: edgeId,
            source: `b-${b.id}`,
            target: `s-${s.id}`,
            label: 'SUPPLIED BY',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(false, highlightPath.includes(edgeId))
          });
        });
      });
    }

    // Customer Investigation - Same style as Batch (Customer -> Orders -> Dishes -> Kitchens -> Batches)
    if (result.investigation_type === 'customer' && (result as any).customer) {
      const customerData = result as any;
      
      // Customer Node (Starting point - Left)
      newNodes.push({
        id: `c-${customerData.customer.id}`,
        data: { 
          label: `ðŸ‘¤ CUSTOMER\n${customerData.customer.id}\n${customerData.customer.name}`,
          type: 'customer' as const,
          id: customerData.customer.id,
          details: customerData.customer
        },
        position: { x: 100, y: 250 },
        style: { 
          ...baseNodeStyle, 
          background: '#AEB4B9',
          color: '#171719',
          borderColor: '#171719',
          borderWidth: '3px'
        }
      });

      // Orders
      (customerData.orders || []).forEach((o: any, i: number) => {
        newNodes.push({
          id: `o-${o.id}`,
          data: { 
            label: `ðŸ“¦ ORDER\n${o.id}\n${o.timestamp?.substring(0,10) || 'N/A'}`,
            type: 'order' as const,
            id: o.id,
            details: o
          },
          position: { x: 350, y: 50 + i * 100 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(o.status || 'COMPLETED')
          }
        });
        
        // Connect Customer to Order
        const edgeId = `e-c-${customerData.customer.id}-o-${o.id}`;
        newEdges.push({
          id: edgeId,
          source: `c-${customerData.customer.id}`,
          target: `o-${o.id}`,
          label: 'PLACED',
          labelStyle: edgeLabelStyle,
          labelBgStyle: edgeBgStyle,
          style: edgeStyle(false, highlightPath.includes(edgeId))
        });
      });

      // Dishes
      (customerData.dishes || []).forEach((d: any, i: number) => {
        newNodes.push({
          id: `d-${d.id}`,
          data: { 
            label: `ðŸ½ï¸ DISH\n${d.id}\n${d.name}`,
            type: 'dish' as const,
            id: d.id,
            details: d
          },
          position: { x: 650, y: 50 + i * 80 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(d.status || 'AVAILABLE'),
            borderColor: d.status === 'SUSPENDED' ? '#FFFFFF' : 'transparent'
          }
        });
        
        // Connect all Orders to all Dishes (mesh)
        (customerData.orders || []).forEach((o: any) => {
          const edgeId = `e-o-${o.id}-d-${d.id}`;
          newEdges.push({
            id: edgeId,
            source: `o-${o.id}`,
            target: `d-${d.id}`,
            label: 'ORDERED',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(false, highlightPath.includes(edgeId))
          });
        });
      });

      // Kitchens
      (customerData.kitchens || []).forEach((k: any, i: number) => {
        newNodes.push({
          id: `k-${k.id}`,
          data: { 
            label: `ðŸ­ KITCHEN\n${k.id}\n${k.name}`,
            type: 'kitchen' as const,
            id: k.id,
            details: k
          },
          position: { x: 950, y: 50 + i * 80 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(k.status || 'ACTIVE')
          }
        });
        
        // Connect all Dishes to all Kitchens (mesh)
        (customerData.dishes || []).forEach((d: any) => {
          const edgeId = `e-d-${d.id}-k-${k.id}`;
          newEdges.push({
            id: edgeId,
            source: `d-${d.id}`,
            target: `k-${k.id}`,
            label: 'FROM',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(false, highlightPath.includes(edgeId))
          });
        });
      });

      // Batches
      (customerData.batches || []).forEach((b: any, i: number) => {
        newNodes.push({
          id: `b-${b.id}`,
          data: { 
            label: `ðŸ”´ BATCH\n${b.id}\n${b.ingredient}`,
            type: 'batch' as const,
            id: b.id,
            details: b
          },
          position: { x: 1250, y: 50 + i * 70 },
          style: { 
            ...baseNodeStyle, 
            background: getStatusColor(b.status || 'SAFE')
          }
        });
        
        // Connect all Kitchens to all Batches (mesh)
        (customerData.kitchens || []).forEach((k: any) => {
          const edgeId = `e-k-${k.id}-b-${b.id}`;
          newEdges.push({
            id: edgeId,
            source: `k-${k.id}`,
            target: `b-${b.id}`,
            label: 'USED',
            labelStyle: edgeLabelStyle,
            labelBgStyle: edgeBgStyle,
            style: edgeStyle(false, highlightPath.includes(edgeId))
          });
        });
      });
    }

    console.log('ImpactGraph: Created nodes:', newNodes.length, 'edges:', newEdges.length);
    return { nodes: newNodes, edges: newEdges };
    } catch (error) {
      console.error('ImpactGraph: Error rendering graph:', error);
      setRenderError(error instanceof Error ? error.message : 'Unknown error');
      return { nodes: [], edges: [] };
    }
  }, [result, simResult, highlightPath]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when initialNodes/initialEdges change (e.g., when simResult changes)
  useEffect(() => {
    console.log('=== ImpactGraph useEffect triggered ===');
    console.log('simResult:', simResult);
    console.log('initialNodes count:', initialNodes.length);
    console.log('initialEdges count:', initialEdges.length);
    setNodes(initialNodes);

    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node.data as NodeData);
    
    const pathEdges: string[] = [];
    const nodeId = node.id;
    
    edges.forEach(edge => {
      if (edge.target === nodeId || edge.source === nodeId) {
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

  if (renderError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">âŒ</div>
          <div className="text-xl font-bold text-ink mb-2">Graph Rendering Error</div>
          <div className="text-sm text-muted mb-4">{renderError}</div>
          <div className="text-xs text-muted font-mono bg-ui-bg p-3 rounded">
            Type: {result.investigation_type}<br/>
            Entity: {result.entity_id}
          </div>
        </div>
      </div>
    );
  }

  if (nodes.length === 0 && edges.length === 0 && result) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">âš ï¸</div>
          <div className="text-xl font-bold text-ink mb-2">No Graph Data</div>
          <div className="text-sm text-muted mb-4">
            No nodes or edges were created for this investigation.
          </div>
          <div className="text-xs text-muted font-mono bg-ui-bg p-3 rounded">
            Entity: {result.entity_id}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <Panel position="top-left" className="bg-transparent">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-bold text-ink tracking-widest uppercase bg-surface px-3 py-1.5 border border-ui-border shadow-sm">
            ðŸ“Š Traceability Graph
          </h2>
          <div className="text-[9px] font-mono text-muted bg-surface px-2 py-1 border border-ui-border">
            {nodes.length} nodes â€¢ {edges.length} edges
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
        <div className="bg-surface px-3 py-2 border border-ui-border shadow-sm">
          <div className="text-[9px] font-bold tracking-widest uppercase text-ink mb-2">Status Colors</div>
          <div className="flex flex-col gap-1.5 text-[9px] font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{background: '#C41E3A'}}></div>
              <span className="text-muted">RECALLED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{background: '#9B59B6'}}></div>
              <span className="text-muted">SUSPENDED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{background: '#F7B801'}}></div>
              <span className="text-muted">FLAGGED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{background: '#27AE60'}}></div>
              <span className="text-muted">VERIFIED</span>
            </div>
          </div>
          {simResult && (
            <div className="mt-3 pt-2 border-t border-ui-border">
              <div className="text-[9px] font-bold tracking-widest uppercase text-ink mb-1">Simulation</div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="text-ink font-bold">â— Contained</span>
                <span className="text-muted opacity-50">â—‹ Remaining</span>
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
                Ã—
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

// Wrapper with ReactFlowProvider
export const ImpactGraph: React.FC<Props> = (props) => {
  return (
    <ReactFlowProvider>
      <ImpactGraphInner {...props} />
    </ReactFlowProvider>
  );
};







