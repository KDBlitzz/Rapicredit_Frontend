// src/lib/api.ts
"use client";

export interface ApiOptions extends RequestInit {
  authToken?: string; // para futuro, cuando el login sea real
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL not configured");
  }

  const base = API_BASE_URL.replace(/\/$/, ""); // sin / al final
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${base}${urlPath}`;

   console.log("apiFetch -> URL:", fullUrl); // 👈 log clave
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  // futuro: si ya tienes idToken, lo pasas por options.authToken
  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  const res = await fetch(`${base}${urlPath}`, {
    ...options,
    headers,
    //credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    console.error("API error:", res.status, body || res.statusText);
    throw new Error(body?.message || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/*
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
  const raw = await res.text(); // SIEMPRE lee el body
  let errorBody: any = null;

  try {
    errorBody = raw ? JSON.parse(raw) : null;
  } catch {
    errorBody = raw; // si no es JSON, igual lo vemos
  }

  console.error("API error:", res.status, res.statusText, errorBody);

  const msg =
    (errorBody && errorBody.message) ||
    (typeof errorBody === "string" ? errorBody : null) ||
    `Error ${res.status}: ${res.statusText}`;

  throw new Error(msg);
}


  return res.json() as Promise<T>;
}
*/
