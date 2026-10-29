const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function fetchApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;
  const requestHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
  if (!(rest.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API request failed with status ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
