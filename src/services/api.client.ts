import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://playa-backend.fly.dev';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: any;
  token?: string;
  streams?: any[];
  stream?: any;
  bet?: any;
  bets?: any[];
  error?: string;
  message?: string;
  walletAddress?: string;
  balance?: number;
  balanceUSD?: number;
}

// Helper function to fix image URLs
export function fixImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  
  // If it's already a full URL with https, return as is
  if (url.startsWith('https://')) return url;
  
  // If it starts with /uploads, prepend the API base URL
  if (url.startsWith('/uploads')) {
    return `${API_BASE_URL}${url}`;
  }
  
  // If it has localhost, replace with backend URL
  if (url.includes('localhost')) {
    return url.replace(/http:\/\/localhost:\d+/, API_BASE_URL);
  }
  
  // If it's http, try to convert to https
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 - token expired
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      // Prevent redirect loops
      if (!window.location.pathname.includes('/auth/')) {
         window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);
