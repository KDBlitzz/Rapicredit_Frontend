'use client';

import { ApiError, apiFetch } from '../lib/api';

export type Gasto = {
  _id?: string;
  codigoGasto?: string;
  fechaGasto?: string;
  tipoGasto?: string;
  descripcion?: string;
  monto?: number;
  codigoCobradorId?: string;
  codigoPrestamo?: string;
  codigoRegistradoPor?: string;
  [key: string]: unknown;
};

export type ListGastosParams = {
  tipoGasto?: string;
  fechaInicio?: string;
  fechaFin?: string;
  codigoCobradorId?: string;
};

export type CreateGastoBody = {
  codigoGasto: string;
  fechaGasto: string;
  tipoGasto: string;
  descripcion?: string;
  monto: number;
  codigoCobradorId?: string;
  codigoPrestamo?: string;
  codigoRegistradoPor: string;
};

export type UpdateGastoBody = Partial<CreateGastoBody>;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const extractArray = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (!isRecord(res)) return [];
  const candidates = ['gastos', 'items', 'results', 'data'];
  for (const k of candidates) {
    const v = res[k];
    if (Array.isArray(v)) return v;
  }
  return [];
};

export const gastosApi = {
  /**
   * GET /api/gastos?tipoGasto=&fechaInicio=&fechaFin=&codigoCobradorId=
   */
  async list(params: ListGastosParams): Promise<Gasto[]> {
    const qs = new URLSearchParams();
    if (params.tipoGasto) qs.set('tipoGasto', params.tipoGasto);
    if (params.fechaInicio) qs.set('fechaInicio', params.fechaInicio);
    if (params.fechaFin) qs.set('fechaFin', params.fechaFin);
    if (params.codigoCobradorId) qs.set('codigoCobradorId', params.codigoCobradorId);

    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiFetch<unknown>(`/api/gastos${suffix}`);
    return extractArray(res) as Gasto[];
  },

  /**
   * POST /api/gastos
   */
  async create(body: CreateGastoBody): Promise<Gasto> {
    return await apiFetch<Gasto>('/api/gastos', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT/PATCH /api/gastos/:id
   * Nota: algunos backends exponen PUT, otros PATCH. Intentamos PUT y caemos a PATCH si aplica.
   */
  async update(id: string, body: UpdateGastoBody): Promise<Gasto> {
    const safeId = encodeURIComponent(String(id));
    const url = `/api/gastos/${safeId}`;

    try {
      return await apiFetch<Gasto>(url, {
        method: 'PUT',
        body: JSON.stringify(body),
        silent: true,
      });
    } catch (err: unknown) {
      const status = err instanceof ApiError ? err.status : undefined;
      // Fallback típico cuando el backend solo soporta PATCH.
      if (status === 404 || status === 405) {
        return await apiFetch<Gasto>(url, {
          method: 'PATCH',
          body: JSON.stringify(body),
          silent: true,
        });
      }
      throw err;
    }
  },
};
