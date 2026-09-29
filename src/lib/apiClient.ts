const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_STORAGE_KEY = 'deluxe-veneers-erp-token';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

interface ApiRequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  method?: string;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_API_URL}${normalizedPath}`;

  const token =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
  };

  if (options.body !== undefined) {
    requestInit.body =
      typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
  }

  let response = await fetch(url, requestInit);

  // If unauthorized (401), attempt to refresh the access token once via HttpOnly refresh cookie
  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${BASE_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json().catch(() => null);
        const newAccessToken = refreshData?.data?.accessToken;
        if (newAccessToken && typeof window !== 'undefined') {
          window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, newAccessToken);
          // Retry the original request with the renewed token
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...requestInit,
            headers,
          });
        }
      }
    } catch {
      // Refresh failed; proceed to normal 401 error handling below
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as TResponse;
}
