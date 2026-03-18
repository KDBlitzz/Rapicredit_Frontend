'use client';

import { ApiError, apiFetch } from '../lib/api';
import { toRange } from '../lib/dateRange';
import { cajaApi } from './cajaApi';
import { gastosApi } from './gastosApi';

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

const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

const pad2 = (n: number) => String(n).padStart(2, '0');

const toDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

export type CierreMensualPeriodo = {
  anio: number;
  mes: number; // 1..12
  desde: string;
  hasta: string;
};

export type CierreMensualResumen = {
  utilidadNeta: number | null;
  gastosPeriodo: number | null;
  interesesGenerados: number | null;
  interesesCobrados: number | null;
  carteraTotalColocada: number | null;
  ingresosPorMultas: number | null;
  totalCobrado: number | null;
  capitalCobrado: number | null;
};

export type CierreMensualIndicadores = {
  cantidadPrestamosDesembolsados: number | null;
  cantidadPagosRecibidos: number | null;
  carteraActivaAlCierre: number | null;
  carteraEnMora: number | null;
  porcentajeMora: number | null; // 0..100
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

function buildMonthRange(anio: number, mes: number) {
  const start = new Date(anio, mes - 1, 1);
  const end = new Date(anio, mes, 0);
  const range = toRange(toDateInput(start), toDateInput(end));
  return {
    start,
    end,
    range,
  };
}

function normalizeCierreMensual(raw: unknown): CierreMensualData | null {
  if (!isRecord(raw)) return null;

  const root = raw;
  const payload = (isRecord(root['data']) ? (root['data'] as UnknownRecord) : null) ??
    (isRecord(root['cierre']) ? (root['cierre'] as UnknownRecord) : null) ??
    root;

  if (!isRecord(payload['periodo']) || !isRecord(payload['resumen']) || !isRecord(payload['indicadores'])) {
    return null;
  }

  const periodoRaw = payload['periodo'] as UnknownRecord;
  const resumenRaw = payload['resumen'] as UnknownRecord;
  const indicadoresRaw = payload['indicadores'] as UnknownRecord;

  const anio = asNumber(periodoRaw['anio']);
  const mes = asNumber(periodoRaw['mes']);
  const desde = asString(periodoRaw['desde']);
  const hasta = asString(periodoRaw['hasta']);

  if (!anio || !mes || !desde || !hasta) return null;

  return {
    periodo: {
      anio,
      mes,
      desde,
      hasta,
    },
    resumen: {
      utilidadNeta: asNumber(resumenRaw['utilidadNeta']),
      gastosPeriodo: asNumber(resumenRaw['gastosPeriodo']),
      interesesGenerados: asNumber(resumenRaw['interesesGenerados']),
      interesesCobrados: asNumber(resumenRaw['interesesCobrados']),
      carteraTotalColocada: asNumber(resumenRaw['carteraTotalColocada']),
      ingresosPorMultas: asNumber(resumenRaw['ingresosPorMultas']),
      totalCobrado: asNumber(resumenRaw['totalCobrado']),
      capitalCobrado: asNumber(resumenRaw['capitalCobrado']),
    },
    indicadores: {
      cantidadPrestamosDesembolsados: asNumber(indicadoresRaw['cantidadPrestamosDesembolsados']),
      cantidadPagosRecibidos: asNumber(indicadoresRaw['cantidadPagosRecibidos']),
      carteraActivaAlCierre: asNumber(indicadoresRaw['carteraActivaAlCierre']),
      carteraEnMora: asNumber(indicadoresRaw['carteraEnMora']),
      porcentajeMora: asNumber(indicadoresRaw['porcentajeMora']),
      cantidadPrestamosCerrados: asNumber(indicadoresRaw['cantidadPrestamosCerrados']),
    },
  };
}

function sumByMonto(items: Array<Record<string, unknown>>): number {
  return items.reduce((acc, it) => {
    const v = asNumber(it['monto']);
    return acc + (typeof v === 'number' ? v : 0);
  }, 0);
}

function normalizeReportesResumen(raw: unknown): {
  totalCartera: number;
  carteraVigente: number;
  carteraEnMora: number;
  carteraPagada: number;
} | null {
  if (!isRecord(raw)) return null;
  const root = raw;
  const payload = (isRecord(root['data']) ? (root['data'] as UnknownRecord) : null) ?? root;

  const resumenRaw = (isRecord(payload['resumen']) ? (payload['resumen'] as UnknownRecord) : null) ?? null;
  if (!resumenRaw) return null;

  const totalCartera = asNumber(resumenRaw['totalCartera']);
  const carteraVigente = asNumber(resumenRaw['carteraVigente']);
  const carteraEnMora = asNumber(resumenRaw['carteraEnMora']);
  const carteraPagada = asNumber(resumenRaw['carteraPagada']);

  if (totalCartera == null || carteraVigente == null || carteraEnMora == null || carteraPagada == null) return null;

  return { totalCartera, carteraVigente, carteraEnMora, carteraPagada };
}

async function buildFromExistingEndpoints(params: GetCierreMensualParams): Promise<CierreMensualData> {
  const { anio, mes } = params;
  const { range, start, end } = buildMonthRange(anio, mes);

  const [cuadre, gastosAll, reportes] = await Promise.all([
    cajaApi.getCuadre(range),
    gastosApi.list({ fechaInicio: range.desde, fechaFin: range.hasta }),
    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set('fechaInicio', toDateInput(start));
        qs.set('fechaFin', toDateInput(end));
        const res = await apiFetch<unknown>(`/reportes/cartera?${qs.toString()}`, { silent: true });
        return normalizeReportesResumen(res);
      } catch {
        return null;
      }
    })(),
  ]);

  const desembolsos = gastosAll.filter((g) => String(g.tipoGasto || '').toUpperCase() === 'DESEMBOLSO') as Array<
    Record<string, unknown>
  >;
  const gastosPeriodoList = gastosAll.filter(
    (g) => String(g.tipoGasto || '').toUpperCase() !== 'DESEMBOLSO'
  ) as Array<Record<string, unknown>>;

  const carteraTotalColocada = sumByMonto(desembolsos);
  const gastosPeriodo = sumByMonto(gastosPeriodoList);

  const totalCobrado = cuadre?.totales?.totalMonto ?? 0;
  const capitalCobrado = cuadre?.totales?.totalCapital ?? 0;
  const interesesCobrados = cuadre?.totales?.totalInteres ?? 0;
  const ingresosPorMultas = cuadre?.totales?.totalMora ?? 0;
  const interesesGenerados = interesesCobrados;

  const utilidadNeta = interesesCobrados + ingresosPorMultas - gastosPeriodo;

  const carteraVigente = reportes?.carteraVigente ?? null;
  const carteraEnMora = reportes?.carteraEnMora ?? null;
  const carteraActivaAlCierre =
    carteraVigente != null && carteraEnMora != null ? carteraVigente + carteraEnMora : null;

  const porcentajeMora = (() => {
    if (carteraEnMora == null || carteraActivaAlCierre == null) return null;
    if (carteraActivaAlCierre <= 0) return 0;
    return (carteraEnMora / carteraActivaAlCierre) * 100;
  })();

  return {
    periodo: {
      anio,
      mes,
      desde: range.desde,
      hasta: range.hasta,
    },
    resumen: {
      utilidadNeta,
      gastosPeriodo,
      interesesGenerados,
      interesesCobrados,
      carteraTotalColocada,
      ingresosPorMultas,
      totalCobrado,
      capitalCobrado,
    },
    indicadores: {
      cantidadPrestamosDesembolsados: desembolsos.length,
      cantidadPagosRecibidos: cuadre?.totales?.cantidadPagos ?? null,
      carteraActivaAlCierre,
      carteraEnMora,
      porcentajeMora,
      cantidadPrestamosCerrados: null,
    },
  };
}

export const cierreMensualApi = {
  /**
   * Intenta cargar el cierre mensual desde un endpoint agregado.
   * Si el backend aún no existe (404), compone el cierre desde endpoints existentes
   * (cuadre de caja + gastos + resumen de reportes).
   */
  async get(params: GetCierreMensualParams): Promise<CierreMensualData> {
    const { anio, mes } = params;

    const qs = new URLSearchParams();
    qs.set('anio', String(anio));
    qs.set('mes', String(mes));

    try {
      const res = await apiFetch<unknown>(`/contabilidad/cierre-mensual?${qs.toString()}`, { silent: true });
      const normalized = normalizeCierreMensual(res);
      if (normalized) return normalized;
      // Si la respuesta no calza, caemos a composición.
      return await buildFromExistingEndpoints(params);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return await buildFromExistingEndpoints(params);
      }
      // Si el backend responde pero falla (500/401/etc), respetamos el error.
      throw err;
    }
  },
};
