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

const MONTHS_ES = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];

function mesLabelFromPeriodo(periodo: UnknownRecord): string | null {
  const anio = asNumber(periodo['anio']);
  const mes = asNumber(periodo['mes']);
  const desde = asNonEmptyString(periodo['desde']);
  const hasta = asNonEmptyString(periodo['hasta']);

  if (anio != null && mes != null && mes >= 1 && mes <= 12) {
    const mLabel = MONTHS_ES[mes - 1];
    return `${mLabel} ${anio}`;
  }

  if (desde && hasta) return `${desde} a ${hasta}`;
  return null;
}

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
  tasaInteresPromedioMensual: number | null;
  porcentajeUtilidad: number | null;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type EstadoCuentaContabilidadData = {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  rows: EstadoCuentaContabilidadRow[];
};

export type GetEstadoCuentaContabilidadParams = {
  anio: number;
  mes: number; // 1-12
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

  const cantidadPrestamos = asNumber(
    raw['cantidadPrestamos'] ??
      raw['numeroPrestamos'] ??
      raw['prestamos'] ??
      raw['PRESTAMOS'] ??
      raw['#PRESTAMOS']
  );
  const nuevos = asNumber(raw['nuevos'] ?? raw['NUEVOS']);
  const recurrentes = asNumber(raw['recurrentes'] ?? raw['RECURRENTES']);

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
    tasaInteresPromedioMensual,
    porcentajeUtilidad,
  };
}

function normalizeResponse(raw: unknown, params: GetEstadoCuentaContabilidadParams): EstadoCuentaContabilidadData | null {
  if (isRecord(raw) && raw['ok'] === true && 'data' in raw) {
    return normalizeResponse((raw as UnknownRecord)['data'], params);
  }

  if (isRecord(raw)) {
    // Nuevo shape backend: { periodo: {...}, resumen: {...}, detalle: {...} }
    const periodoRaw = isRecord(raw['periodo']) ? (raw['periodo'] as UnknownRecord) : null;
    const resumenRaw = isRecord(raw['resumen']) ? (raw['resumen'] as UnknownRecord) : null;
    const detalleRaw = isRecord(raw['detalle']) ? (raw['detalle'] as UnknownRecord) : null;
    if (periodoRaw && resumenRaw) {
      const mesLabel = mesLabelFromPeriodo(periodoRaw) ?? '—';
      const baseRow = normalizeRow({ mes: mesLabel, ...resumenRaw });
      if (baseRow) {
        return {
          fechaInicio: asNonEmptyString(periodoRaw['desde']) ?? `${params.anio}-${String(params.mes).padStart(2, '0')}-01`,
          fechaFin: asNonEmptyString(periodoRaw['hasta']) ?? `${params.anio}-${String(params.mes).padStart(2, '0')}-01`,
          rows: [baseRow],
        };
      }
    }

    const rowsRaw = raw['rows'] ?? raw['detalle'] ?? raw['data'] ?? raw['resultados'];
    const rowsArr = Array.isArray(rowsRaw) ? rowsRaw : Array.isArray(raw['rows']) ? (raw['rows'] as unknown[]) : null;

    if (rowsArr) {
      const rows = rowsArr.map(normalizeRow).filter((x): x is EstadoCuentaContabilidadRow => x !== null);
      return {
        fechaInicio: `${params.anio}-${String(params.mes).padStart(2, '0')}-01`,
        fechaFin: `${params.anio}-${String(params.mes).padStart(2, '0')}-01`,
        rows,
      };
    }
  }

  if (Array.isArray(raw)) {
    const rows = raw.map(normalizeRow).filter((x): x is EstadoCuentaContabilidadRow => x !== null);
    return {
      fechaInicio: `${params.anio}-${String(params.mes).padStart(2, '0')}-01`,
      fechaFin: `${params.anio}-${String(params.mes).padStart(2, '0')}-01`,
      rows,
    };
  }

  return null;
}


function buildQuery(params: GetEstadoCuentaContabilidadParams) {
  const qs = new URLSearchParams();
  qs.set('anio', String(params.anio));
  qs.set('mes', String(params.mes));
  return qs.toString();
}

export const estadoCuentaContabilidadApi = {
  async get(params: GetEstadoCuentaContabilidadParams): Promise<EstadoCuentaContabilidadData> {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
    if (!base) {
      throw new Error('Falta configurar NEXT_PUBLIC_API_BASE_URL (o NEXT_PUBLIC_API_URL) para consultar el estado de cuenta.');
    }

    const query = buildQuery(params);

    let res: unknown;
    const primaryPath = `/estado-financiera?${query}`;

    try {
      res = await apiFetch<unknown>(primaryPath, { silent: true });
    } catch (err: unknown) {
      const is404 = err instanceof ApiError && err.status === 404;
      if (!is404) throw err;


      throw new Error('Endpoint no encontrado (404): /estado-financiera. Verifica tu backend.');
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
