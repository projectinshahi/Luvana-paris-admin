// utils/api-config.ts
interface AuthEndpoints {
    me: string;
    login: string;
  }
  
  interface APIEndpoints {
    auth: AuthEndpoints;
  }
  
  interface APIConfig {
    baseURL: string | undefined;
    endpoints: APIEndpoints;
  }
  
  export const API_CONFIG: APIConfig = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    endpoints: {
      auth: {
          me: '/me',
          login: '/admin-login'
      }
    }
  };
  
  export const getApiUrl = (endpoint: string): string => {
    if (!API_CONFIG.baseURL) {
      throw new Error('API base URL is not defined');
    }
    return `${API_CONFIG.baseURL}${endpoint}`;
  };