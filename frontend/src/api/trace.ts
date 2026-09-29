import type { TraceOriginRequest, TraceOriginResponse } from './types';

export async function traceOrigin(request: TraceOriginRequest): Promise<TraceOriginResponse> {
  const response = await fetch('/api/trace/origin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`${request.entity_type} ${request.entity_id} not found`);
    }
    throw new Error('Trace failed');
  }
  
  return response.json();
}
