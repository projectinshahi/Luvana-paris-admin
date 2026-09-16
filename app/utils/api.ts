import { getApiUrl } from './api-config';

let inMemoryToken: string | null = null;

interface RequestOptions extends RequestInit {
 headers?: Record<string, string>;
}

export interface ApiResponse<T> {
 data: T;
 message?: string; 
}

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Matches the API's multer limit. Checked here, before the request leaves the
// browser, because every form's upload goes through this function — and an
// oversize body sent through the /api proxy hangs until the proxy times out
// instead of surfacing the API's 413.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function fetchWithAuth<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (options.body instanceof FormData) {
    for (const value of options.body.values()) {
      if (value instanceof File && value.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `"${value.name}" is ${(value.size / 1048576).toFixed(1)} MB. Maximum upload size is 10 MB.`
        );
      }
    }
  }

  const storedToken = typeof window === 'undefined' ? null : localStorage.getItem('token');
  const token = inMemoryToken || storedToken;

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
    setAuthToken(null);
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

  delete: <T,>(endpoint: string, data?: RequestData): Promise<T> => 
    fetchWithAuth<T>(endpoint, {
      method: 'DELETE',
      body: data instanceof FormData ? data : JSON.stringify(data || {}),
    }),

  patch: <T,>(endpoint: string, data: RequestData): Promise<T> => 
    fetchWithAuth<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
};