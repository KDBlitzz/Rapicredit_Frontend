// src/lib/api.ts
'use client';

import { getMyToken } from './firebaseAuth';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

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

  /**
   * Tipo de respuesta esperado.
   * - json: default
   * - blob/arrayBuffer: útil para PDF/Excel
   */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, body: unknown) {
    super(401, message, body);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  missingPermiso?: string;
  constructor(message: string, body: unknown, missingPermiso?: string) {
    super(403, message, body);
    this.name = 'ForbiddenError';
    this.missingPermiso = missingPermiso;
  }
}

const extractMessage = (body: unknown): string | null => {
  if (!body) return null;
  if (typeof body === 'string') return body.trim() ? body : null;
  if (typeof body === 'object' && body !== null) {
    const rec = body as Record<string, unknown>;
    const msg = rec['message'];
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return null;
};

const parseForbiddenPermiso = (message: string | null): string | undefined => {
  if (!message) return undefined;
  const m = /falta\s+permiso\s+([A-Z0-9-]+)/i.exec(message);
  return m?.[1];
};

const normalizePathForApi = (path: string): string => {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);
  if (isAbsoluteUrl) return path;

  const raw = path.startsWith('/') ? path : `/${path}`;
  if (raw.startsWith('/api/')) return raw;
  if (raw === '/api') return raw;
  return `/api${raw}`;
};

const buildUrl = (path: string): string => {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);
  if (isAbsoluteUrl) return path;

  if (!API_BASE_URL) {
    throw new Error('API base URL not configured');
  }

  const base = API_BASE_URL.replace(/\/$/, '');
  const baseHasApiSuffix = /\/api$/i.test(base);

  const normalized = normalizePathForApi(path);
  // Si el base ya termina en /api, evitamos duplicar /api en el path.
  const pathPart = baseHasApiSuffix && normalized.startsWith('/api/') ? normalized.slice(4) : normalized;
  return `${base}${pathPart}`;
};

const handleUnauthorized = async () => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    authToken,
    silent,
    responseType: desiredResponseType,
    ...fetchOptions
  } = options;

  const fullUrl = buildUrl(path);

  // Headers base
  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  // Content-Type solo si NO es FormData y si no existe ya
  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Token: primero el que venga por options.authToken (si lo mandas),
  // si no, lo pedimos a Firebase.
  const token = authToken ?? (await getMyToken());
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(fullUrl, {
    ...fetchOptions,
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

    // Manejo específico requerido
    if (res.status === 401) {
      // Token ausente/expirado o usuario no existe en Mongo
      await handleUnauthorized();
      throw new UnauthorizedError(extractMessage(body) || 'Unauthorized', body);
    }

    if (res.status === 403) {
      const backendMsg = extractMessage(body);
      const missingPermiso = parseForbiddenPermiso(backendMsg);
      const msg = missingPermiso ? `Sin permiso (${missingPermiso})` : 'Sin permiso';
      throw new ForbiddenError(msg, body, missingPermiso);
    }

    if (!silent) {
      console.error('API error:', res.status, res.statusText, body);
    }

    const msg =
      extractMessage(body) ||
      `Error ${res.status}: ${res.statusText}`;

    throw new ApiError(res.status, msg, body);
  }

  const responseType = desiredResponseType ?? 'json';
  if (responseType === 'blob') {
    return (await res.blob()) as unknown as T;
  }
  if (responseType === 'arrayBuffer') {
    return (await res.arrayBuffer()) as unknown as T;
  }
  if (responseType === 'text') {
    return (await res.text()) as unknown as T;
  }

  // json (default)
  const text = await res.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
