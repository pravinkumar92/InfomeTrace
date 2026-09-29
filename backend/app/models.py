from pydantic import BaseModel
from typing import List, Optional

class InvestigationRequest(BaseModel):
    batch_id: str

class BatchSummary(BaseModel):
    id: str
    ingredient: str
    quantity: int
    received_date: str
    expiry_date: str
    status: str
    status_updated_at: Optional[str] = None
    status_reason: Optional[str] = None
    flagged_at: Optional[str] = None
    quarantined_at: Optional[str] = None
    recalled_at: Optional[str] = None
    verified_at: Optional[str] = None

class AffectedKitchen(BaseModel):
    id: str
    name: str
    city: str
    location: str
    status: str

class AffectedDish(BaseModel):
    id: str
    name: str
    category: str
    price: int
    status: str
    status_updated_at: Optional[str] = None
    status_reason: Optional[str] = None
    flagged_at: Optional[str] = None
    suspended_at: Optional[str] = None
    verified_at: Optional[str] = None

class AffectedOrder(BaseModel):
    id: str
    timestamp: str
    status: str

class AffectedCustomer(BaseModel):
    id: str
    name: str
    city: str

class ImpactSummary(BaseModel):
    kitchens: int
    dishes: int
    orders: int
    customers: int

class InvestigationResponse(BaseModel):
    success: bool
    investigation_type: str
    entity_id: str
    batch: Optional[BatchSummary] = None
    kitchens: List[AffectedKitchen]
    dishes: List[AffectedDish]
    orders: List[AffectedOrder]
    customers: List[AffectedCustomer]
    impact: ImpactSummary
    cypher: str
    parameters: dict

class RecallRequest(BaseModel):
    batch_id: str

class RecallResponse(BaseModel):
    success: bool
    batch: BatchSummary
    cypher: str
    parameters: dict

class TraceOriginRequest(BaseModel):
    entity_type: str
    entity_id: str

class SupplierSummary(BaseModel):
    id: str
    name: str
    location: str

class TracePathNode(BaseModel):
    label: str
    id: str
    name: Optional[str] = None

class TraceOriginResponse(BaseModel):
    success: bool
    source_entity_type: str
    source_entity_id: str
    path: List[TracePathNode]
    supplier: Optional[SupplierSummary] = None
    batch: Optional[BatchSummary] = None
    kitchen: Optional[AffectedKitchen] = None
    dish: Optional[AffectedDish] = None
    order: Optional[AffectedOrder] = None
    customer: Optional[AffectedCustomer] = None
    cypher: str
    parameters: dict

class SimulateContainmentRequest(BaseModel):
    batch_id: str
    kitchen_id: str

class SimulationScope(BaseModel):
    kitchens: List[AffectedKitchen]
    dishes: List[AffectedDish]
    orders: List[AffectedOrder]
    customers: List[AffectedCustomer]
    counts: ImpactSummary

class TraceAssistRequest(BaseModel):
    question: str
    entity_type: str
    entity_id: str
    containment_kitchen_id: Optional[str] = None

class SimulateContainmentResponse(BaseModel):
    success: bool
    batch_id: str
    containment_kitchen_id: str
    remaining: SimulationScope
    contained: SimulationScope
    cypher: str
    parameters: dict

class TraceAssistRequest(BaseModel):
    question: str
    entity_type: str
    entity_id: str
    containment_kitchen_id: Optional[str] = None

class TraceAssistResponse(BaseModel):
    answer: str

# Enhanced models for quantity-aware tracking
class IngredientSummary(BaseModel):
    id: str
    name: str
    category: str
    unit: str

class InventorySummary(BaseModel):
    id: str
    batch_id: str
    kitchen_id: str
    ingredient_id: str
    received_quantity: float
    consumed_quantity: float
    remaining_quantity: float
    unit: str
    status: str
    status_updated_at: Optional[str] = None
    status_reason: Optional[str] = None
    flagged_at: Optional[str] = None
    quarantined_at: Optional[str] = None
    recalled_at: Optional[str] = None
    verified_at: Optional[str] = None

class RecipeSummary(BaseModel):
    id: str
    dish_id: str
    ingredient_id: str
    quantity_per_serving: float
    unit: str
    is_required: bool

class OrderExplanationRequest(BaseModel):
    order_id: str

class ExposurePathNode(BaseModel):
    node_type: str
    id: str
    name: Optional[str] = None
    details: Optional[dict] = None

class OrderExplanationResponse(BaseModel):
    success: bool
    order_id: str
    is_affected: bool
    explanation: str
    exposure_path: List[ExposurePathNode]
    contaminated_batch: Optional[BatchSummary] = None
    affected_inventory: List[InventorySummary]
    recipes_used: List[RecipeSummary]
    cypher: str
    parameters: dict

class QuantityImpactSummary(BaseModel):
    total_distributed_kg: float
    total_consumed_kg: float
    total_remaining_kg: float
    kitchens_with_stock: int

class EnhancedInvestigationResponse(BaseModel):
    success: bool
    investigation_type: str
    entity_id: str
    batch: Optional[BatchSummary] = None
    ingredient: Optional[IngredientSummary] = None
    inventory_details: List[InventorySummary]
    quantity_impact: QuantityImpactSummary
    kitchens: List[AffectedKitchen]
    dishes: List[AffectedDish]
    orders: List[AffectedOrder]
    customers: List[AffectedCustomer]
    impact: ImpactSummary
    cypher: str
    parameters: dict


# Status lifecycle models
class StatusUpdateRequest(BaseModel):
    entity_type: str  # 'batch', 'inventory', 'dish'
    entity_id: str
    new_status: str  # FLAGGED, QUARANTINED, RECALLED, VERIFIED, SUSPENDED
    reason: str
    updated_by: Optional[str] = None
    notification_id: Optional[str] = None

class StatusTransitionHistory(BaseModel):
    entity_type: str
    entity_id: str
    entity_name: Optional[str] = None
    previous_status: str
    new_status: str
    transition_timestamp: str
    reason: str
    updated_by: Optional[str] = None

class StatusUpdateResponse(BaseModel):
    success: bool
    entity_type: str
    entity_id: str
    previous_status: str
    new_status: str
    status_reason: str
    timestamp: str
    cascade_updates: List[StatusTransitionHistory]
    affected_count: int
    cypher: str
    parameters: dict

class RecallCascadeRequest(BaseModel):
    batch_id: str
    reason: str
    recalled_by: str
    notification_id: Optional[str] = None

class RecallCascadeResponse(BaseModel):
    success: bool
    batch_id: str
    batch_recalled: bool
    inventory_recalled: int
    dishes_suspended: int
    affected_customers: int
    transitions: List[StatusTransitionHistory]
    customer_notifications_required: List[AffectedCustomer]
    cypher: str
    parameters: dict

# Recall verification and action tracking models
class RecallActionRequest(BaseModel):
    action_type: str  # INVENTORY_DISPOSAL, CUSTOMER_NOTIFICATION, VERIFICATION_TEST, SUPPLIER_NOTIFICATION, FACILITY_INSPECTION
    batch_id: str
    inventory_id: Optional[str] = None
    kitchen_id: Optional[str] = None
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    quantity_disposed: Optional[float] = None
    unit: Optional[str] = None
    disposal_method: Optional[str] = None
    disposal_receipt_id: Optional[str] = None
    notification_method: Optional[str] = None
    notification_content: Optional[str] = None
    test_type: Optional[str] = None
    test_lab: Optional[str] = None
    test_result: Optional[str] = None
    test_report_id: Optional[str] = None
    inspection_result: Optional[str] = None
    contamination_source: Optional[str] = None
    corrective_action_required: Optional[str] = None
    performed_by: str
    notes: Optional[str] = None

class RecallActionSummary(BaseModel):
    id: str
    action_type: str
    batch_id: str
    performed_by: str
    performed_at: str
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    status: str
    notes: Optional[str] = None
    details: Optional[dict] = None

class RecallVerificationStatus(BaseModel):
    batch_id: str
    batch_status: str
    recall_date: str
    inventory_disposed: int
    customer_notifications_completed: int
    customer_notifications_total: int
    facility_inspections: int
    verification_status: str  # RECALL_VERIFIED_COMPLETE or RECALL_IN_PROGRESS
    completion_percentage: float

class RecallActionResponse(BaseModel):
    success: bool
    action_id: str
    action: RecallActionSummary
    cypher: str
    parameters: dict

class RecallVerificationResponse(BaseModel):
    success: bool
    batch_id: str
    verification_status: RecallVerificationStatus
    actions_completed: List[RecallActionSummary]
    actions_pending: List[RecallActionSummary]
    disposal_verification: dict
    cypher: str
