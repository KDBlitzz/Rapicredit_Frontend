'use client';

import { apiFetch } from '../lib/api';

export type EmpleadoMongo = {
  _id: string;
  codigoUsuario?: string;
  usuario?: string;
  nombreCompleto?: string;
  rol?: string;
  permisos?: string[];
  email?: string;
  telefono?: string;
  estado?: boolean;
  [key: string]: unknown;
};

export type EmpleadosListResponse = {
  ok: boolean;
  total: number;
  users: EmpleadoMongo[];
};

export const empleadosApi = {
  /**
   * POST /api/empleados/login
   * Requiere Authorization: Bearer <Firebase ID token>
   */
  async login(): Promise<EmpleadoMongo> {
    return await apiFetch<EmpleadoMongo>('/api/empleados/login', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * GET /api/empleados?includeInactivos=false
   */
  async list(params?: { includeInactivos?: boolean }): Promise<EmpleadosListResponse> {
    const includeInactivos = params?.includeInactivos ?? false;
    const qs = new URLSearchParams();
    qs.set('includeInactivos', includeInactivos ? 'true' : 'false');
    return await apiFetch<EmpleadosListResponse>(`/api/empleados?${qs.toString()}`);
  },
};
