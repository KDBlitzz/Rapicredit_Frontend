'use client';

import { ApiError, apiFetch } from '../lib/api';
import { parseDateInput } from '../lib/dateRange';

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

export type EstadoCuentaContabilidadRow = {
  mes: string;
  ingresosTotales: number | null;
  gastosTotales: number | null;
  utilidadNeta: number | null;
  recuperacionTotal: number | null;
  totalCartera: number | null;
  cantidadPrestamos: number | null;
  nuevos: number | null;
  recurrentes: number | null;
  reservaMora: number | null;
  reservaLab: number | null;
  tasaInteresPromedioMensual: number | null;
  porcentajeUtilidad: number | null;
};

export type EstadoCuentaContabilidadData = {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  rows: EstadoCuentaContabilidadRow[];
  source?: 'api' | 'mock';
};

export type GetEstadoCuentaContabilidadParams = {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
};

function normalizeRow(raw: unknown): EstadoCuentaContabilidadRow | null {
  if (!isRecord(raw)) return null;

  const mes =
    asNonEmptyString(raw['mes']) ??
    asNonEmptyString(raw['MES']) ??
    asNonEmptyString(raw['month']) ??
    '';

  const ingresosTotales = asNumber(raw['ingresosTotales'] ?? raw['INGRESOS_TOTALES'] ?? raw['ingresos_total']);
  const gastosTotales = asNumber(raw['gastosTotales'] ?? raw['GASTOS_TOTALES'] ?? raw['gastos_total']);
  const utilidadNeta = asNumber(raw['utilidadNeta'] ?? raw['UTILIDAD_NETA'] ?? raw['utilidad_neta']);
  const recuperacionTotal = asNumber(raw['recuperacionTotal'] ?? raw['RECUPERACION_TOTAL'] ?? raw['recuperacion_total']);
  const totalCartera = asNumber(raw['totalCartera'] ?? raw['TOTAL_CARTERA'] ?? raw['total_cartera']);

  const cantidadPrestamos = asNumber(raw['cantidadPrestamos'] ?? raw['prestamos'] ?? raw['PRESTAMOS'] ?? raw['#PRESTAMOS']);
  const nuevos = asNumber(raw['nuevos'] ?? raw['NUEVOS']);
  const recurrentes = asNumber(raw['recurrentes'] ?? raw['RECURRENTES']);

  const reservaMora = asNumber(raw['reservaMora'] ?? raw['RESERVA_MORA'] ?? raw['reserva_mora']);
  const reservaLab = asNumber(raw['reservaLab'] ?? raw['RESERVA_LAB'] ?? raw['reserva_lab']);

  const tasaInteresPromedioMensual = asNumber(
    raw['tasaInteresPromedioMensual'] ??
      raw['TASA_INTERES_PROMEDIO_MENSUAL'] ??
      raw['tasa_interes_promedio_mensual']
  );

  const porcentajeUtilidad = asNumber(raw['porcentajeUtilidad'] ?? raw['PORCENTAJE_UTILIDAD'] ?? raw['%_DE_UTILIDAD']);

  if (!mes) return null;

  return {
    mes,
    ingresosTotales,
    gastosTotales,
    utilidadNeta,
    recuperacionTotal,
    totalCartera,
    cantidadPrestamos,
    nuevos,
    recurrentes,
    reservaMora,
    reservaLab,
    tasaInteresPromedioMensual,
    porcentajeUtilidad,
  };
}

function normalizeResponse(raw: unknown, params: GetEstadoCuentaContabilidadParams): EstadoCuentaContabilidadData | null {
  if (isRecord(raw) && raw['ok'] === true && 'data' in raw) {
    return normalizeResponse((raw as UnknownRecord)['data'], params);
  }

  if (isRecord(raw)) {
    const rowsRaw = raw['rows'] ?? raw['detalle'] ?? raw['data'] ?? raw['resultados'];
    const rowsArr = Array.isArray(rowsRaw) ? rowsRaw : Array.isArray(raw['rows']) ? (raw['rows'] as unknown[]) : null;

    if (rowsArr) {
      const rows = rowsArr.map(normalizeRow).filter((x): x is EstadoCuentaContabilidadRow => x !== null);
      return {
        fechaInicio: params.fechaInicio,
        fechaFin: params.fechaFin,
        rows,
        source: 'api',
      };
    }
  }

  if (Array.isArray(raw)) {
    const rows = raw.map(normalizeRow).filter((x): x is EstadoCuentaContabilidadRow => x !== null);
    return {
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin,
      rows,
      source: 'api',
    };
  }

  return null;
}

function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

function monthLabelEs(d: Date) {
  // Ej: "mar 2026"
  return d
    .toLocaleDateString('es-HN', { year: 'numeric', month: 'short' })
    .replace('.', '')
    .toUpperCase();
}

function buildMock(params: GetEstadoCuentaContabilidadParams): EstadoCuentaContabilidadData {
  const from = parseDateInput(params.fechaInicio);
  const to = parseDateInput(params.fechaFin);

  const fromMonth = new Date(from.getFullYear(), from.getMonth(), 1);
  const toMonth = new Date(to.getFullYear(), to.getMonth(), 1);

  const rows: EstadoCuentaContabilidadRow[] = [];
  const cursor = new Date(fromMonth);

  while (cursor.getTime() <= toMonth.getTime()) {
    const k = cursor.getFullYear() * 100 + (cursor.getMonth() + 1);
    const ingresos = 250_000 + (k % 7) * 18_500;
    const gastos = 110_000 + (k % 5) * 9_200;
    const utilidad = ingresos - gastos;

    const prestamos = 120 + (k % 9) * 6;
    const nuevos = 40 + (k % 4) * 3;
    const recurrentes = prestamos - nuevos;

    const recuperacion = ingresos;
    const cartera = 3_800_000 + (k % 11) * 120_000;

    const reservaMora = ingresos * 0.03;
    const reservaLab = ingresos * 0.01;

    const tasa = 8.5 + (k % 6) * 0.4; // porcentaje mensual (ejemplo)
    const pctUtilidad = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

    rows.push({
      mes: `${monthLabelEs(cursor)} (${monthKey(cursor)})`,
      ingresosTotales: ingresos,
      gastosTotales: gastos,
      utilidadNeta: utilidad,
      recuperacionTotal: recuperacion,
      totalCartera: cartera,
      cantidadPrestamos: prestamos,
      nuevos,
      recurrentes,
      reservaMora,
      reservaLab,
      tasaInteresPromedioMensual: tasa,
      porcentajeUtilidad: pctUtilidad,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    fechaInicio: params.fechaInicio,
    fechaFin: params.fechaFin,
    rows,
    source: 'mock',
  };
}

function buildQuery(params: GetEstadoCuentaContabilidadParams) {
  const qs = new URLSearchParams();
  qs.set('fechaInicio', params.fechaInicio);
  qs.set('fechaFin', params.fechaFin);
  return qs.toString();
}

export const estadoCuentaContabilidadApi = {
  async get(params: GetEstadoCuentaContabilidadParams): Promise<EstadoCuentaContabilidadData> {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
    if (!base) {
      return buildMock(params);
    }

    const query = buildQuery(params);

    // Endpoint sugerido:
    // GET {BASE}/api/contabilidad/estado-cuenta?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
    let res: unknown;
    const primaryPath = `/api/contabilidad/estado-cuenta?${query}`;

    try {
      res = await apiFetch<unknown>(primaryPath, { silent: true });
    } catch (err: unknown) {
      const is404 = err instanceof ApiError && err.status === 404;
      if (!is404) throw err;

      // Fallback sin prefijo /api en base
      const baseNoSlash = base.replace(/\/+$/, '');
      const baseNoApiSuffix = baseNoSlash.replace(/\/api$/i, '');
      const absolute = `${baseNoApiSuffix}/contabilidad/estado-cuenta?${query}`;

      try {
        res = await apiFetch<unknown>(absolute, { silent: true });
      } catch (fallbackErr: unknown) {
        const fallbackIs404 = fallbackErr instanceof ApiError && fallbackErr.status === 404;
        if (!fallbackIs404) throw fallbackErr;

        // Si backend aún no existe, devolvemos mock para que la pantalla no se caiga.
        return buildMock(params);
      }
    }

    const normalized = normalizeResponse(res, params);
    if (!normalized) {
      throw new Error(
        'Respuesta inválida: se esperaba { rows: [...] } o un arreglo de filas con las columnas del estado de cuenta.'
      );
    }

    return normalized;
  },
};
