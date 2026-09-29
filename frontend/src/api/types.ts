export interface InvestigationRequest {
  batch_id: string;
}

export interface BatchSummary {
  id: string;
  ingredient: string;
  quantity: number;
  received_date: string;
  expiry_date: string;
  status: string;
}

export interface AffectedKitchen {
  id: string;
  name: string;
  city: string;
  location: string;
  status: string;
}

export interface AffectedDish {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
}

export interface AffectedOrder {
  id: string;
  timestamp: string;
  status: string;
}

export interface AffectedCustomer {
  id: string;
  name: string;
  city: string;
}

export interface ImpactSummary {
  kitchens: number;
  dishes: number;
  orders: number;
  customers: number;
  batches?: number;
  suppliers?: number;
}

export interface InvestigationResponse {
  success: boolean;
  investigation_type: string;
  entity_id: string;
  batch?: BatchSummary;
  order?: AffectedOrder;
  customer?: AffectedCustomer;
  kitchens: AffectedKitchen[];
  dishes: AffectedDish[];
  orders: AffectedOrder[];
  customers: AffectedCustomer[];
  batches?: BatchSummary[];
  suppliers?: SupplierSummary[];
  impact: ImpactSummary;
  cypher: string;
  parameters: Record<string, any>;
}

export interface RecallRequest {
  batch_id: string;
}

export interface RecallResponse {
  success: boolean;
  batch: BatchSummary;
  cypher: string;
  parameters: Record<string, any>;
}

export interface TraceOriginRequest {
  entity_type: string;
  entity_id: string;
}

export interface SupplierSummary {
  id: string;
  name: string;
  location: string;
}

export interface TracePathNode {
  label: string;
  id: string;
  name?: string;
}

export interface TraceOriginResponse {
  success: boolean;
  source_entity_type: string;
  source_entity_id: string;
  path: TracePathNode[];
  supplier?: SupplierSummary;
  batch?: BatchSummary;
  kitchen?: AffectedKitchen;
  dish?: AffectedDish;
  order?: AffectedOrder;
  customer?: AffectedCustomer;
  cypher: string;
  parameters: Record<string, any>;
}

export interface SimulateContainmentRequest {
  batch_id: string;
  kitchen_id: string;
}

export interface SimulationScope {
  kitchens: AffectedKitchen[];
  dishes: AffectedDish[];
  orders: AffectedOrder[];
  customers: AffectedCustomer[];
  counts: ImpactSummary;
}

export interface SimulateContainmentResponse {
  success: boolean;
  batch_id: string;
  containment_kitchen_id: string;
  selectedCity?: string; // Optional city filter
  remaining: SimulationScope;
  contained: SimulationScope;
  cypher: string;
  parameters: Record<string, any>;
}

export interface TraceAssistRequest {
  question: string;
  entity_type: string;
  entity_id: string;
  containment_kitchen_id?: string;
}

export interface TraceAssistResponse {
  answer: string;
}
