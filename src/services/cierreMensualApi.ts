'use client';

import { ApiError, apiFetch } from '../lib/api';
import { parseDateInput, toRange } from '../lib/dateRange';
import { cajaApi } from './cajaApi';
import { gastosApi, type Gasto } from './gastosApi';

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

const pad2 = (n: number) => String(n).padStart(2, '0');

const isValidDate = (d: Date) => !Number.isNaN(d.getTime());

const toDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

function normalizeDateInput(value: string): string {
  const d = parseDateInput(value);
  if (!isValidDate(d)) {
    throw new Error('Periodo inválido: verifica las fechas');
  }
  return toDateInput(d);
}

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
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
};

function sumMonto(items: Array<Record<string, unknown>>): number {
  return items.reduce((acc, it) => {
    const v = asNumber(it['monto']);
    return acc + (typeof v === 'number' ? v : 0);
  }, 0);
}

function normalizeReportesResumen(raw: unknown): { carteraVigente: number; carteraEnMora: number } | null {
  if (!isRecord(raw)) return null;
  const payload = raw;
  const resumen = isRecord(payload['resumen']) ? (payload['resumen'] as UnknownRecord) : null;
  if (!resumen) return null;

  const carteraVigente = asNumber(resumen['carteraVigente']);
  const carteraEnMora = asNumber(resumen['carteraEnMora']);
  if (carteraVigente == null || carteraEnMora == null) return null;
  return { carteraVigente, carteraEnMora };
}

async function buildFromExistingEndpoints(params: GetCierreMensualParams): Promise<CierreMensualData> {
  const desdeInput = normalizeDateInput(params.desde);
  const hastaInput = normalizeDateInput(params.hasta);

  const desdeDate = parseDateInput(desdeInput);
  const hastaDate = parseDateInput(hastaInput);
  if (desdeDate.getTime() > hastaDate.getTime()) {
    throw new Error('Periodo inválido: "Desde" no puede ser mayor que "Hasta"');
  }

  const range = toRange(desdeInput, hastaInput);
  const anio = desdeDate.getFullYear();
  const mes = desdeDate.getMonth() + 1;

  const [cuadre, gastosAll, reportesResumen] = await Promise.all([
    cajaApi.getCuadre(range),
    gastosApi.list({ fechaInicio: range.desde, fechaFin: range.hasta }),
    (async () => {
      try {
        const qs = new URLSearchParams();
        qs.set('fechaInicio', desdeInput);
        qs.set('fechaFin', hastaInput);
        const res = await apiFetch<unknown>(`/reportes/cartera?${qs.toString()}`, { silent: true });
        return normalizeReportesResumen(res);
      } catch {
        return null;
      }
    })(),
  ]);

  const gastosRecords = (gastosAll ?? []) as Gasto[];
  const desembolsos = gastosRecords
    .filter((g) => String(g.tipoGasto || '').toUpperCase() === 'DESEMBOLSO')
    .map((g) => g as unknown as Record<string, unknown>);

  const gastosPeriodoList = gastosRecords
    .filter((g) => String(g.tipoGasto || '').toUpperCase() !== 'DESEMBOLSO')
    .map((g) => g as unknown as Record<string, unknown>);

  const carteraTotalColocada = sumMonto(desembolsos);
  const gastosPeriodo = sumMonto(gastosPeriodoList);

  const totalCobrado = typeof cuadre?.totales?.totalMonto === 'number' ? cuadre.totales.totalMonto : null;
  const capitalCobrado = typeof cuadre?.totales?.totalCapital === 'number' ? cuadre.totales.totalCapital : null;
  const interesesCobrados = typeof cuadre?.totales?.totalInteres === 'number' ? cuadre.totales.totalInteres : null;
  const ingresosPorMultas = typeof cuadre?.totales?.totalMora === 'number' ? cuadre.totales.totalMora : null;

  const interesesGenerados = interesesCobrados;

  const utilidadNeta =
    interesesGenerados != null && ingresosPorMultas != null
      ? interesesGenerados + ingresosPorMultas - gastosPeriodo
      : null;

  const carteraVigente = reportesResumen?.carteraVigente ?? null;
  const carteraEnMora = reportesResumen?.carteraEnMora ?? null;
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
      cantidadPagosRecibidos:
        typeof cuadre?.totales?.cantidadPagos === 'number' ? cuadre.totales.cantidadPagos : null,
      carteraActivaAlCierre,
      carteraEnMora,
      porcentajeMora,
      cantidadPrestamosCerrados: null,
    },
  };
}

function normalizeCierreMensual(raw: unknown): CierreMensualData | null {
  if (!isRecord(raw)) return null;
  const root = raw;

  if (!isRecord(root['periodo']) || !isRecord(root['resumen']) || !isRecord(root['indicadores'])) return null;

  const periodoRaw = root['periodo'] as UnknownRecord;
  const resumenRaw = root['resumen'] as UnknownRecord;
  const indicadoresRaw = root['indicadores'] as UnknownRecord;

  const anio = asNumber(periodoRaw['anio']);
  const mes = asNumber(periodoRaw['mes']);
  const desde = asNonEmptyString(periodoRaw['desde']);
  const hasta = asNonEmptyString(periodoRaw['hasta']);
  if (anio == null || mes == null || !desde || !hasta) return null;

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

export const cierreMensualApi = {
  async get(params: GetCierreMensualParams): Promise<CierreMensualData> {
    const desdeInput = normalizeDateInput(params.desde);
    const hastaInput = normalizeDateInput(params.hasta);

    const desdeDate = parseDateInput(desdeInput);
    const hastaDate = parseDateInput(hastaInput);
    if (desdeDate.getTime() > hastaDate.getTime()) {
      throw new Error('Periodo inválido: "Desde" no puede ser mayor que "Hasta"');
    }

    const anio = desdeDate.getFullYear();
    const mes = desdeDate.getMonth() + 1;
    const range = toRange(desdeInput, hastaInput);

    const qs = new URLSearchParams();
    qs.set('anio', String(anio));
    qs.set('mes', String(mes));
    qs.set('desde', range.desde);
    qs.set('hasta', range.hasta);

    try {
      const res = await apiFetch<unknown>(`/contabilidad/cierre-mensual?${qs.toString()}`, { silent: true });
      const normalized = normalizeCierreMensual(res);
      if (normalized) return normalized;

      // Si la ruta existe pero no respeta la estructura, NO hacemos fallback.
      // Esto fuerza al backend a responder exactamente {periodo, resumen, indicadores}.
      throw new Error('Respuesta inválida: se esperaba { periodo, resumen, indicadores }');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        return await buildFromExistingEndpoints({ desde: desdeInput, hasta: hastaInput });
      }
      throw err;
    }
  },
};
