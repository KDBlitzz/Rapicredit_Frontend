// src/lib/api.ts
'use client';

import { getMyToken } from './firebaseAuth';

export interface ApiOptions extends RequestInit {
  /**
   * Opcional: si alguna vez quieres sobreescribir el token (debug / casos especiales).
   * Normalmente NO lo uses: apiFetch obtiene token desde Firebase.
   */
  authToken?: string;

  /**
   * Si es true, evita hacer `console.error` cuando la API responde !ok.
   * Útil cuando se prueban múltiples rutas candidatas (para no "ensuciar" consola con 404 esperados).
   */
  silent?: boolean;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);

  if (!API_BASE_URL && !isAbsoluteUrl) {
    throw new Error('API base URL not configured');
  }

  const base = API_BASE_URL ? API_BASE_URL.replace(/\/$/, '') : '';
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = isAbsoluteUrl ? path : `${base}${urlPath}`;

  console.log('apiFetch -> URL:', fullUrl);

  // Headers base
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  };

  // Content-Type solo si NO es FormData y si no existe ya
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Token: primero el que venga por options.authToken (si lo mandas),
  // si no, lo pedimos a Firebase.
  const token = options.authToken ?? (await getMyToken());
  console.log("🔥 Firebase token:", token ? token.slice(0, 20) + "..." : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

   console.log("📤 Headers enviados:", headers);

  const res = await fetch(fullUrl, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const raw = await res.text(); // SIEMPRE leer body para ver error real
    let body: any = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }

    if (!options.silent) {
      console.error('API error:', res.status, res.statusText, body);
    }

    const msg =
      (body && body.message) ||
      (typeof body === 'string' && body.trim() ? body : null) ||
      `Error ${res.status}: ${res.statusText}`;

    throw new Error(msg);
  }

  // Si la respuesta no tiene body JSON, evita crash
  const text = await res.text();
  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // si el backend devuelve texto plano (raro), lo devolvemos tal cual
    return text as unknown as T;
  }
}
