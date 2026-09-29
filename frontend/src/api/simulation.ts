import type { SimulateContainmentRequest, SimulateContainmentResponse } from './types';

export async function simulateContainment(request: SimulateContainmentRequest): Promise<SimulateContainmentResponse> {
  const response = await fetch('/api/simulate/containment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Invalid containment selection`);
    }
    throw new Error('Simulation failed');
  }
  
  return response.json();
}
