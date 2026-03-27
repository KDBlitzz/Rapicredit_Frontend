'use client';

import { ApiError, apiFetch } from '../lib/api';

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

export type IndicadoresFinancierosResumen = {
  interesesGenerados: number | null;
  interesesDevengadosNoCobrados: number | null;
  interesesCobrados: number | null;
  interesesNoCobrados: number | null;
  capitalPorCobrar: number | null;
};

export type IndicadoresFinancierosIndicadores = {
  cantidadPrestamosAnalizados: number;
  cantidadCuotasAnalizadas: number;
};

export type IndicadoresFinancierosData = {
  fechaCorte: string; // YYYY-MM-DD
  resumen: IndicadoresFinancierosResumen;
  indicadores: IndicadoresFinancierosIndicadores;
};

export type GetIndicadoresFinancierosParams = {
  fechaCorte: string; // YYYY-MM-DD
};

function normalizeIndicadoresFinancierosData(raw: unknown): IndicadoresFinancierosData | null {
  if (!isRecord(raw)) return null;

  // `fechaCorte` puede venir o no en el backend; si no viene, se completará con el parámetro consultado.
  const fechaCorte =
    asNonEmptyString(raw['fechaCorte']) ??
    asNonEmptyString(raw['fecha_corte']) ??
    asNonEmptyString(raw['fecha']) ??
    '';

  const resumenRaw = isRecord(raw['resumen']) ? (raw['resumen'] as UnknownRecord) : null;
  const indicadoresRaw = isRecord(raw['indicadores']) ? (raw['indicadores'] as UnknownRecord) : null;

  if (!indicadoresRaw) return null;

  const interesesGenerados = resumenRaw ? asNumber(resumenRaw['interesesGenerados']) : null;
  const interesesDevengadosNoCobrados = resumenRaw ? asNumber(resumenRaw['interesesDevengadosNoCobrados']) : null;
  const interesesCobrados = resumenRaw ? asNumber(resumenRaw['interesesCobrados']) : null;
  const interesesNoCobrados = resumenRaw ? asNumber(resumenRaw['interesesNoCobrados']) : null;
  const capitalPorCobrar = resumenRaw ? asNumber(resumenRaw['capitalPorCobrar']) : null;

  const cantidadPrestamosAnalizados = asNumber(indicadoresRaw['cantidadPrestamosAnalizados']);
  const cantidadCuotasAnalizadas = asNumber(indicadoresRaw['cantidadCuotasAnalizadas']);

  if (cantidadPrestamosAnalizados == null || cantidadCuotasAnalizadas == null) {
    return null;
  }

  return {
    fechaCorte,
    resumen: {
      interesesGenerados,
      interesesDevengadosNoCobrados,
      interesesCobrados,
      interesesNoCobrados,
      capitalPorCobrar,
    },
    indicadores: {
      cantidadPrestamosAnalizados,
      cantidadCuotasAnalizadas,
    },
  };
}

function normalizeIndicadoresFinancierosResponse(raw: unknown): IndicadoresFinancierosData | null {
  if (isRecord(raw) && raw['ok'] === true && 'data' in raw) {
    return normalizeIndicadoresFinancierosData((raw as UnknownRecord)['data']);
  }
  return normalizeIndicadoresFinancierosData(raw);
}

function buildQuery(params: GetIndicadoresFinancierosParams) {
  const qs = new URLSearchParams();
  qs.set('fechaCorte', params.fechaCorte);
  return qs.toString();
}

export const indicadoresFinancierosApi = {
  async get(params: GetIndicadoresFinancierosParams): Promise<IndicadoresFinancierosData> {
    const query = buildQuery(params);
    // Nota: en este backend los reportes cuelgan de `/api/reportes/*`.
    // `apiFetch` agregará prefijo `/api` si hace falta.
    const candidates: string[] = [
      // Principal
      `/api/reportes/indicadores-financieros?${query}`,
      `/reportes/indicadores-financieros?${query}`,
      // Variantes por naming (compat)
      `/api/reportes/indicadoresFinancieros?${query}`,
      `/reportes/indicadoresFinancieros?${query}`,
      `/api/reportes/resumen-financiero?${query}`,
      `/reportes/resumen-financiero?${query}`,
      `/api/reportes/resumen_financiero?${query}`,
      `/reportes/resumen_financiero?${query}`,
      `/api/reportes/resumenFinanciero?${query}`,
      `/reportes/resumenFinanciero?${query}`,
    ].filter(Boolean);

    let res: unknown;
    const attempted: string[] = [];
    let lastErr: unknown;

    for (const path of candidates) {
      attempted.push(path);
      try {
        res = await apiFetch<unknown>(path, { silent: true });
        lastErr = undefined;
        break;
      } catch (err: unknown) {
        lastErr = err;
        const is404 = err instanceof ApiError && err.status === 404;
        if (!is404) throw err;
      }
    }

    if (res === undefined) {
      const tried = attempted.join(' | ');
      if (lastErr instanceof Error && lastErr.message.includes('API base URL not configured')) {
        throw lastErr;
      }
      throw new Error(
        `Endpoint no encontrado (404). Verifica la ruta del backend y/o la base URL. Se intentó: ${tried}`
      );
    }

    const normalizedRaw = normalizeIndicadoresFinancierosResponse(res);
    const normalized =
      normalizedRaw && (!normalizedRaw.fechaCorte ? { ...normalizedRaw, fechaCorte: params.fechaCorte } : normalizedRaw);
    if (!normalized) {
      throw new Error(
        'Respuesta inválida: se esperaba { ok: true, data } con { indicadores } y (opcional) { resumen }'
      );
    }
    return normalized;
  },
};
