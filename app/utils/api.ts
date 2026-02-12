import { getApiUrl } from './api-config';

interface RequestOptions extends RequestInit {
 headers?: Record<string, string>;
}

export interface ApiResponse<T> {
 data: T;
 message?: string; 
}

async function fetchWithAuth<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  
  const token = localStorage.getItem('token');

  const defaultHeaders: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: defaultHeaders,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    //  window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

type RequestData = Record<string, unknown> | FormData;

export const api = {
  get: <T,>(endpoint: string): Promise<T> => 
    fetchWithAuth<T>(endpoint),

  post: <T,>(endpoint: string, data: RequestData): Promise<T> => 
    fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  put: <T,>(endpoint: string, data: RequestData): Promise<T> => 
    fetchWithAuth<T>(endpoint, {
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  delete: <T,>(endpoint: string): Promise<T> => 
    fetchWithAuth<T>(endpoint, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),

  patch: <T,>(endpoint: string, data: RequestData): Promise<T> => 
    fetchWithAuth<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
};