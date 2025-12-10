'use client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

// ⚠️ PROVISIONAL: token de prueba mientras no tengas login en el front
const DEV_AUTH_TOKEN = "";

export interface ApiOptions extends RequestInit {
  authToken?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { authToken, headers, ...rest } = options;

  // Normalizamos headers a un objeto simple para poder hacer:
  // finalHeaders['Content-Type'] = ...
  const finalHeaders: Record<string, string> = {
    ...(headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : (headers as Record<string, string> | undefined)),
  };

  const token = authToken || DEV_AUTH_TOKEN;

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Solo ponemos Content-Type si NO es GET y no existe ya
  const method = (rest.method || 'GET').toUpperCase();
  if (method !== 'GET' && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (!API_BASE_URL) {
    throw new Error(
      "Missing API base URL. Set NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL) in your environment."
    );
  }

  console.log("apiFetch URL:", `${API_BASE_URL}${path}`);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch {
      // ignore
    }
    console.error('API error:', res.status, res.statusText, errorBody);
    throw new Error(errorBody?.message || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
