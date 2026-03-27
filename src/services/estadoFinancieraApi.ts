'use client';

import { apiFetch } from '../lib/api';

export type EstadoFinancieraPeriodo = {
  anio: number;
  mes: number;
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
};

export type EstadoFinancieraResumen = {
  ingresosTotales: number;
  gastosTotales: number;
  utilidadNeta: number;
  recuperacionTotal: number;
  totalCartera: number;
  numeroPrestamos: number;
  nuevos: number;
  recurrentes: number;
  tasaInteresPromedioMensual: number;
  porcentajeUtilidad: number;
};

export type EstadoFinancieraDetallePrestamo = {
  id: string;
  clienteId: string;
  codigoPrestamo: string;
  fechaDesembolso: string; // YYYY-MM-DD
  tasaInteresAnual: number;
  capitalSolicitado: number;
  estadoPrestamo: string;
};

export type EstadoFinancieraDetallePago = {
  id: string;
  codigoPago: string;
  fechaPago: string; // YYYY-MM-DD
  montoPago: number;
  aplicadoAInteres: number;
  aplicadoAMora: number;
};

export type EstadoFinancieraDetalleGasto = {
  id: string;
  codigoGasto: string;
  fechaGasto: string; // YYYY-MM-DD
  tipoGasto: string;
  descripcion: string;
  monto: number;
};

export type EstadoFinancieraDetalle = {
  prestamosDelMes: EstadoFinancieraDetallePrestamo[];
  pagosDelMes: EstadoFinancieraDetallePago[];
  gastosDelMes: EstadoFinancieraDetalleGasto[];
};

export type EstadoFinancieraResponse = {
  periodo: EstadoFinancieraPeriodo;
  resumen: EstadoFinancieraResumen;
  detalle: EstadoFinancieraDetalle;
};

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null;

function isEstadoFinancieraResponse(v: unknown): v is EstadoFinancieraResponse {
  if (!isRecord(v)) return false;
  if (!isRecord(v.periodo) || !isRecord(v.resumen) || !isRecord(v.detalle)) return false;

  const p = v.periodo as UnknownRecord;
  const r = v.resumen as UnknownRecord;
  const d = v.detalle as UnknownRecord;

  return (
    typeof p.anio === 'number' &&
    typeof p.mes === 'number' &&
    typeof p.desde === 'string' &&
    typeof p.hasta === 'string' &&
    typeof r.ingresosTotales === 'number' &&
    typeof r.gastosTotales === 'number' &&
    typeof r.utilidadNeta === 'number' &&
    typeof r.recuperacionTotal === 'number' &&
    typeof r.totalCartera === 'number' &&
    typeof r.numeroPrestamos === 'number' &&
    typeof r.nuevos === 'number' &&
    typeof r.recurrentes === 'number' &&
    typeof r.tasaInteresPromedioMensual === 'number' &&
    typeof r.porcentajeUtilidad === 'number' &&
    Array.isArray(d.prestamosDelMes) &&
    Array.isArray(d.pagosDelMes) &&
    Array.isArray(d.gastosDelMes)
  );
}

export type GetEstadoFinancieraParams = { anio: number; mes: number };

function buildQuery(params: GetEstadoFinancieraParams) {
  const qs = new URLSearchParams();
  qs.set('anio', String(params.anio));
  qs.set('mes', String(params.mes));
  return qs.toString();
}

export const estadoFinancieraApi = {
  async get(params: GetEstadoFinancieraParams): Promise<EstadoFinancieraResponse> {
    const query = buildQuery(params);

    // Nota: apiFetch normaliza el path y agrega /api si no viene.
    // Con NEXT_PUBLIC_API_BASE_URL terminando en /api (como en este repo),
    // se debe llamar SIN prefijo /api para evitar /api/api.
    const path = `/estado-financiera?${query}`;

    const raw = await apiFetch<unknown>(path);

    // Algunos backends envuelven con { ok, data }.
    const unwrapped =
      isRecord(raw) && raw.ok === true && 'data' in raw ? (raw as UnknownRecord).data : raw;

    if (!isEstadoFinancieraResponse(unwrapped)) {
      throw new Error('Respuesta inválida: se esperaba { periodo, resumen, detalle }.');
    }

    return unwrapped;
  },
};
