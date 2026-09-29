import type { InvestigationRequest, InvestigationResponse } from './types';

const API_BASE = 'http://127.0.0.1:8000';

export async function investigateEntity(entityType: string, entityId: string): Promise<InvestigationResponse> {
  try {
    let endpoint = '';
    let body: any = {};

    // Route to appropriate endpoint
    if (entityType === 'Batch') {
      endpoint = `${API_BASE}/api/investigate/batch`;
      body = { batch_id: entityId };
    } else if (entityType === 'Order') {
      endpoint = `${API_BASE}/api/investigate/order?order_id=${entityId}`;
    } else if (entityType === 'Customer') {
      endpoint = `${API_BASE}/api/investigate/customer?customer_id=${entityId}`;
    } else {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: entityType === 'Batch' ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`${entityType} ${entityId} not found`);
      } else if (response.status === 503) {
        throw new Error('Unable to connect to InfoMeTrace backend');
      }
      throw new Error('Investigation failed. Please retry.');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Investigation failed. Please retry.');
  }
}

// Legacy function for backwards compatibility
export async function investigateBatch(request: InvestigationRequest): Promise<InvestigationResponse> {
  return investigateEntity('Batch', request.batch_id);
}
