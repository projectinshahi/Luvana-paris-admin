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

// Carries the HTTP status and, for validation failures, the API's
// { "<field path>": "<message>" } map so forms can show each message in place.
export class ApiError extends Error {
  constructor(message: string, public status = 0, public errors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
  }
}

// Matches the API's multer limit. Checked here, before the request leaves the
// browser, because every form's upload goes through this function — and an
// oversize body sent through the /api proxy hangs until the proxy times out
// instead of surfacing the API's 413.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);
/** One wording for every upload site, and for the API's own rejection. */
export const OVERSIZE_MESSAGE = `Image size must not exceed ${MAX_UPLOAD_MB}MB.`;
/** The files a form must refuse before it uploads anything. */
export const oversizeFiles = (files: File[]) => files.filter((f) => f.size > MAX_UPLOAD_BYTES);

async function fetchWithAuth<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (options.body instanceof FormData) {
    for (const value of options.body.values()) {
      if (value instanceof File && value.size > MAX_UPLOAD_BYTES) {
        // Named the file, because a form may be sending several.
        throw new Error(`"${value.name}" is ${(value.size / 1048576).toFixed(1)}MB. ${OVERSIZE_MESSAGE}`);
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

  let response: Response;
  try {
    response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: defaultHeaders,
    });
  } catch {
    // fetch only rejects when no response arrived at all (offline, server down, CORS)
    throw new ApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    setAuthToken(null);
    //  window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const fallback = response.status >= 500 ? 'Something went wrong on the server. Please try again.' : 'API request failed';
    throw new ApiError(error.message || fallback, response.status, error.errors || {});
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