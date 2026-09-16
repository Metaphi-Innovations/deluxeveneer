interface ApiRequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  method?: string;
}

export async function apiRequest<TResponse>(
  _path: string,
  _options: ApiRequestOptions = {},
): Promise<TResponse> {
  throw new Error("Frontend backend API calls are disabled for the local demo.");
}
