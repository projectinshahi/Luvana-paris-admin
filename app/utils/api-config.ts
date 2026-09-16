// utils/api-config.ts
interface AuthEndpoints {
  me: string;
  login: string;
}

interface APIEndpoints {
  auth: AuthEndpoints;
}

interface APIConfig {
  baseURL: string;
  endpoints: APIEndpoints;
}

export const API_CONFIG: APIConfig = {
  // Same-origin path that next.config.ts proxies to the API, so it is correct
  // from any device with no per-machine configuration. The API's real address
  // is the server-only API_URL in .env.
  baseURL: "/api",
  endpoints: {
    auth: {
      me: "/me",
      login: "/admin/login",
    },
  },
};

export const getApiUrl = (endpoint: string): string => `${API_CONFIG.baseURL}${endpoint}`;
