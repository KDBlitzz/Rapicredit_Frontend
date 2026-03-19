'use client';

import { apiFetch } from '../lib/api';

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null;

const asNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const asNonEmptyString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

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

export type CierreMensualPeriodo = {
  anio: number;
  mes: number; // 1..12
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
};

export type CierreMensualResumen = {
  carteraTotalColocada: number;
  totalCobrado: number;
  capitalCobrado: number;
  interesesGenerados: number;
  interesesCobrados: number;
  ingresosPorMultas: number;
  gastosPeriodo: number;
  utilidadNeta: number;
};

export type CierreMensualIndicadores = {
  carteraActivaAlCierre: number;
  carteraEnMora: number;
  porcentajeMora: number; // 0..100 (ya viene en %)
  cantidadPrestamosDesembolsados: number;
  cantidadPagosRecibidos: number;
  cantidadPrestamosCerrados: number | null;
};

export type CierreMensualData = {
  periodo: CierreMensualPeriodo;
  resumen: CierreMensualResumen;
  indicadores: CierreMensualIndicadores;
};

export type GetCierreMensualParams = {
  anio: number;
  mes: number; // 1..12
};
function normalizeCierreMensualData(raw: unknown): CierreMensualData | null {
  if (!isRecord(raw)) return null;

  const periodoRaw = isRecord(raw['periodo']) ? (raw['periodo'] as UnknownRecord) : null;
  const resumenRaw = isRecord(raw['resumen']) ? (raw['resumen'] as UnknownRecord) : null;
  const indicadoresRaw = isRecord(raw['indicadores']) ? (raw['indicadores'] as UnknownRecord) : null;
  if (!periodoRaw || !resumenRaw || !indicadoresRaw) return null;

  const anio = asNumber(periodoRaw['anio']);
  const mes = asNumber(periodoRaw['mes']);
  const desde = asNonEmptyString(periodoRaw['desde']);
  const hasta = asNonEmptyString(periodoRaw['hasta']);
  if (anio == null || mes == null || mes < 1 || mes > 12 || !desde || !hasta) return null;

  const carteraTotalColocada = asNumber(resumenRaw['carteraTotalColocada']);
  const totalCobrado = asNumber(resumenRaw['totalCobrado']);
  const capitalCobrado = asNumber(resumenRaw['capitalCobrado']);
  const interesesGenerados = asNumber(resumenRaw['interesesGenerados']);
  const interesesCobrados = asNumber(resumenRaw['interesesCobrados']);
  const ingresosPorMultas = asNumber(resumenRaw['ingresosPorMultas']);
  const gastosPeriodo = asNumber(resumenRaw['gastosPeriodo']);
  const utilidadNeta = asNumber(resumenRaw['utilidadNeta']);

  if (
    carteraTotalColocada == null ||
    totalCobrado == null ||
    capitalCobrado == null ||
    interesesGenerados == null ||
    interesesCobrados == null ||
    ingresosPorMultas == null ||
    gastosPeriodo == null ||
    utilidadNeta == null
  ) {
    return null;
  }

  const carteraActivaAlCierre = asNumber(indicadoresRaw['carteraActivaAlCierre']);
  const carteraEnMora = asNumber(indicadoresRaw['carteraEnMora']);
  const porcentajeMora = asNumber(indicadoresRaw['porcentajeMora']);
  const cantidadPrestamosDesembolsados = asNumber(indicadoresRaw['cantidadPrestamosDesembolsados']);
  const cantidadPagosRecibidos = asNumber(indicadoresRaw['cantidadPagosRecibidos']);
  const cantidadPrestamosCerrados = asNumber(indicadoresRaw['cantidadPrestamosCerrados']);

  if (
    carteraActivaAlCierre == null ||
    carteraEnMora == null ||
    porcentajeMora == null ||
    cantidadPrestamosDesembolsados == null ||
    cantidadPagosRecibidos == null
  ) {
    return null;
  }

  return {
    periodo: {
      anio,
      mes,
      desde,
      hasta,
    },
    resumen: {
      carteraTotalColocada,
      totalCobrado,
      capitalCobrado,
      interesesGenerados,
      interesesCobrados,
      ingresosPorMultas,
      gastosPeriodo,
      utilidadNeta,
    },
    indicadores: {
      carteraActivaAlCierre,
      carteraEnMora,
      porcentajeMora,
      cantidadPrestamosDesembolsados,
      cantidadPagosRecibidos,
      cantidadPrestamosCerrados,
    },
  };
}

function normalizeCierreMensualResponse(raw: unknown): CierreMensualData | null {
  if (isRecord(raw) && raw['ok'] === true && 'data' in raw) {
    return normalizeCierreMensualData((raw as UnknownRecord)['data']);
  }
  return normalizeCierreMensualData(raw);
}

function buildQuery(params: GetCierreMensualParams) {
  const qs = new URLSearchParams();
  qs.set('anio', String(params.anio));
  qs.set('mes', String(params.mes));
  return qs.toString();
}

export const cierreMensualApi = {
  async get(params: GetCierreMensualParams): Promise<CierreMensualData> {
    const query = buildQuery(params);
    const res = await apiFetch<unknown>(`/api/cierre-mensual?${query}`);
    const normalized = normalizeCierreMensualResponse(res);
    if (!normalized) {
      throw new Error('Respuesta inválida: se esperaba { ok: true, data } con { periodo, resumen, indicadores }');
    }
    return normalized;
  },

  async getPdf(params: GetCierreMensualParams): Promise<Blob> {
    const query = buildQuery(params);
    return await apiFetch<Blob>(`/api/cierre-mensual/pdf?${query}`, { responseType: 'blob' });
  },

  async getExcel(params: GetCierreMensualParams): Promise<Blob> {
    const query = buildQuery(params);
    return await apiFetch<Blob>(`/api/cierre-mensual/excel?${query}`, { responseType: 'blob' });
  },
};

export class FetchCierreMensualError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'FetchCierreMensualError';
    this.status = status;
  }
}

/**
 * Llama al endpoint del backend con auth explícito y devuelve el KPI solicitado.
 */
export async function fetchCierreMensual(anio: number, mes: number, token: string): Promise<number> {
  const anioNum = Number(anio);
  const mesNum = Number(mes);

  if (!Number.isFinite(anioNum) || anioNum < 2000 || anioNum > 3000) {
    throw new FetchCierreMensualError(400, 'Parámetro inválido: anio debe estar entre 2000 y 3000');
  }
  if (!Number.isFinite(mesNum) || mesNum < 1 || mesNum > 12) {
    throw new FetchCierreMensualError(400, 'Parámetro inválido: mes debe estar entre 1 y 12');
  }
  if (!token || !token.trim()) {
    throw new FetchCierreMensualError(401, 'Unauthorized: falta token');
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
  if (!API_BASE_URL) {
    throw new Error('API base URL not configured');
  }

  const qs = new URLSearchParams();
  qs.set('anio', String(anioNum));
  qs.set('mes', String(mesNum));

  const base = API_BASE_URL.replace(/\/$/, '');
  const baseHasApiSuffix = /\/api$/i.test(base);
  const path = `/api/cierre-mensual?${qs.toString()}`;
  const url = baseHasApiSuffix ? `${base}${path.slice(4)}` : `${base}${path}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const rawText = await res.text();
  let body: unknown = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = rawText;
  }

  if (res.status === 401) {
    throw new FetchCierreMensualError(401, extractMessage(body) || 'Unauthorized');
  }
  if (!res.ok) {
    throw new FetchCierreMensualError(res.status, extractMessage(body) || `Error ${res.status}: ${res.statusText}`);
  }

  const normalized = normalizeCierreMensualResponse(body);
  const value = normalized?.indicadores.cantidadPrestamosCerrados;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Respuesta inválida: falta data.indicadores.cantidadPrestamosCerrados');
  }

  return value;
}
