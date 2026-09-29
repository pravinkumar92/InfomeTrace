import type { TraceAssistRequest, TraceAssistResponse } from './types';

export async function askTraceAssist(request: TraceAssistRequest): Promise<TraceAssistResponse> {
  const response = await fetch('/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error('Trace Assist request failed');
  }
  
  return response.json();
}
