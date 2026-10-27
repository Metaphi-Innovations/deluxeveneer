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
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let resolvedOptions = options;

  // Keep large master column filters out of the URL. Existing master API
  // functions can continue building GET query strings; filtered requests are
  // transparently converted to the shared JSON-payload endpoint here.
  if ((options.method ?? 'GET').toUpperCase() === 'GET') {
    const parsedPath = new URL(normalizedPath, 'http://local');
    const serializedFilters = parsedPath.searchParams.get('filters');

    if ((parsedPath.pathname.startsWith('/masters/') || parsedPath.pathname.startsWith('/orders')) && serializedFilters) {
      let filters: Record<string, string[]> | undefined;
      try {
        filters = JSON.parse(serializedFilters) as Record<string, string[]>;
      } catch {
        try {
          filters = JSON.parse(decodeURIComponent(serializedFilters)) as Record<
            string,
            string[]
          >;
        } catch {
          filters = undefined;
        }
      }

      if (filters) {
        const payload: Record<string, unknown> = {};
        parsedPath.searchParams.forEach((value, key) => {
          if (key !== 'filters') payload[key] = value;
        });
        payload.filters = filters;

        normalizedPath = `${parsedPath.pathname.replace(/\/$/, '')}/filter`;
        resolvedOptions = { ...options, method: 'POST', body: payload };
      }
    }
  }

  const url = `${BASE_API_URL}${normalizedPath}`;

  const token =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(resolvedOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    method: resolvedOptions.method || 'GET',
    headers,
    credentials: 'include',
  };

  if (resolvedOptions.body !== undefined) {
    requestInit.body =
      typeof resolvedOptions.body === 'string'
        ? resolvedOptions.body
        : JSON.stringify(resolvedOptions.body);
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
    const validationMessage = Array.isArray(data?.error)
      ? data.error.find(
          (detail: unknown): detail is { message: string } =>
            Boolean(
              detail &&
                typeof detail === 'object' &&
                'message' in detail &&
                typeof detail.message === 'string',
            ),
        )?.message
      : data?.error &&
          typeof data.error === 'object' &&
          typeof data.error.message === 'string'
        ? data.error.message
        : null;
    const errorMessage =
      validationMessage ||
      data?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data as TResponse;
}
