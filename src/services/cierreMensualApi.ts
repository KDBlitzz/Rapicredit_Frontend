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
  // El backend NO lo entrega; mantener placeholder en la vista.
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
      cantidadPrestamosCerrados: null,
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
