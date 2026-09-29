import type { RecallRequest, RecallResponse } from './types';

export async function recallBatch(request: RecallRequest): Promise<RecallResponse> {
  try {
    const response = await fetch('/api/recall/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Batch not found`);
      } else if (response.status === 503) {
        throw new Error('Unable to connect to InfoMeTrace backend');
      }
      throw new Error('Recall mutation failed. Please retry.');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Recall mutation failed. Please retry.');
  }
}
