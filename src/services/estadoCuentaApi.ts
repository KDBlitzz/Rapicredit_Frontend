"use client";

import { apiFetch } from "../lib/api";

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

const asString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v == null) return undefined;
  return String(v);
};

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const extractPayload = (raw: unknown): unknown => {
  if (!isRecord(raw)) return raw;

  const candidates = ["data", "result", "payload", "estadoCuenta"];
  for (const key of candidates) {
    if (key in raw && raw[key] != null) return raw[key];
  }

  return raw;
};

export interface EstadoCuentaSearchItem {
  prestamoId: string;
  codigoPrestamo: string;
  estadoPrestamo?: string;
  fechaDesembolso?: string | null;
  cliente: {
    id?: string | null;
    nombre: string;
    codigoCliente?: string;
  };
}

export interface EstadoCuentaCuota {
  numero: number;
  estado: string;
  fechaProgramada?: string | null;
  fechaPago?: string | null;
  monto: number;
  capital: number;
  interes: number;
  mora: number;
  montoProgramado: number;
  capitalProgramado: number;
  interesProgramado: number;
  moraProgramada: number;
  pendienteCapital: number;
  pendienteInteres: number;
  pendienteMora: number;
  saldoCapitalProgramado: number;
}

export interface EstadoCuentaPago {
  id?: string;
  codigoPago?: string;
  fechaPago?: string | null;
  montoPago: number;
  aplicadoAMora: number;
  aplicadoAInteres: number;
  aplicadoACapital: number;
  saldoCapitalDespues: number;
  metodoPago?: string;
  estado?: string;
  numeroComprobante?: string;
  observaciones?: string;
}

export interface EstadoCuentaDetalle {
  cliente: {
    id?: string | null;
    nombre: string;
    codigoCliente?: string;
  };
  prestamo: {
    id: string;
    codigoPrestamo: string;
    fechaApertura?: string | null;
    primerPago?: string | null;
    montoOtorgado: number;
    frecuenciaPago?: string;
    metodoInteresCorriente?: string;
    tasaInteresAnual?: number;
    tasaMoraAnual?: number;
    cuotaFija?: number;
    plazoCuotas?: number;
    fechaVencimiento?: string | null;
    estadoPrestamo?: string;
  };
  resumen: {
    saldoActual: number;
    interesPendiente: number;
    moraPendiente: number;
    moraPagada: number;
    saldoCapital: number;
    saldoTotal: number;
    totalPagado: number;
    capitalPagado: number;
    interesPagado: number;
  };
  distribucionPagos: {
    capital: number;
    interes: number;
    mora: number;
  };
  pagos: EstadoCuentaPago[];
  cuotas: EstadoCuentaCuota[];
}

const normalizeSearchItem = (raw: unknown): EstadoCuentaSearchItem | null => {
  if (!isRecord(raw)) return null;

  const clienteRaw = isRecord(raw.cliente) ? raw.cliente : {};

  const prestamoId = asString(raw.prestamoId ?? raw._id ?? raw.id);
  const codigoPrestamo = asString(raw.codigoPrestamo);
  if (!prestamoId || !codigoPrestamo) return null;

  return {
    prestamoId,
    codigoPrestamo,
    estadoPrestamo: asString(raw.estadoPrestamo),
    fechaDesembolso: asString(raw.fechaDesembolso) ?? null,
    cliente: {
      id: asString(clienteRaw.id ?? clienteRaw._id) ?? null,
      nombre: asString(clienteRaw.nombre) ?? "",
      codigoCliente: asString(clienteRaw.codigoCliente ?? clienteRaw.codigo),
    },
  };
};

const normalizeDetalle = (raw: unknown): EstadoCuentaDetalle | null => {
  const payload = extractPayload(raw);
  if (!isRecord(payload)) return null;

  const clienteRaw = isRecord(payload.cliente) ? payload.cliente : {};
  const prestamoRaw = isRecord(payload.prestamo) ? payload.prestamo : {};
  const resumenRaw = isRecord(payload.resumen) ? payload.resumen : {};
  const distribucionRaw = isRecord(payload.distribucionPagos) ? payload.distribucionPagos : {};

  const prestamoId = asString(prestamoRaw.id ?? prestamoRaw._id);
  const codigoPrestamo = asString(prestamoRaw.codigoPrestamo);
  if (!prestamoId || !codigoPrestamo) return null;

  const cuotasRaw = Array.isArray(payload.cuotas) ? payload.cuotas : [];
  const pagosRaw = Array.isArray(payload.pagos) ? payload.pagos : [];

  const cuotas: EstadoCuentaCuota[] = cuotasRaw
    .map((c): EstadoCuentaCuota | null => {
      if (!isRecord(c)) return null;

      return {
        numero: asNumber(c.numero) ?? 0,
        estado: asString(c.estado) ?? "PENDIENTE",
        fechaProgramada: asString(c.fechaProgramada) ?? null,
        fechaPago: asString(c.fechaPago) ?? null,
        monto: asNumber(c.monto) ?? 0,
        capital: asNumber(c.capital) ?? 0,
        interes: asNumber(c.interes) ?? 0,
        mora: asNumber(c.mora) ?? 0,
        montoProgramado: asNumber(c.montoProgramado) ?? 0,
        capitalProgramado: asNumber(c.capitalProgramado) ?? 0,
        interesProgramado: asNumber(c.interesProgramado) ?? 0,
        moraProgramada: asNumber(c.moraProgramada) ?? 0,
        pendienteCapital: asNumber(c.pendienteCapital) ?? 0,
        pendienteInteres: asNumber(c.pendienteInteres) ?? 0,
        pendienteMora: asNumber(c.pendienteMora) ?? 0,
        saldoCapitalProgramado: asNumber(c.saldoCapitalProgramado) ?? 0,
      };
    })
    .filter((x): x is EstadoCuentaCuota => x !== null);

  const pagos: EstadoCuentaPago[] = pagosRaw
    .map((p): EstadoCuentaPago | null => {
      if (!isRecord(p)) return null;

      return {
        id: asString(p.id ?? p._id),
        codigoPago: asString(p.codigoPago),
        fechaPago: asString(p.fechaPago) ?? null,
        montoPago: asNumber(p.montoPago) ?? 0,
        aplicadoAMora: asNumber(p.aplicadoAMora) ?? 0,
        aplicadoAInteres: asNumber(p.aplicadoAInteres) ?? 0,
        aplicadoACapital: asNumber(p.aplicadoACapital) ?? 0,
        saldoCapitalDespues: asNumber(p.saldoCapitalDespues) ?? 0,
        metodoPago: asString(p.metodoPago),
        estado: asString(p.estado),
        numeroComprobante: asString(p.numeroComprobante),
        observaciones: asString(p.observaciones),
      };
    })
    .filter((x): x is EstadoCuentaPago => x !== null);

  return {
    cliente: {
      id: asString(clienteRaw.id ?? clienteRaw._id) ?? null,
      nombre: asString(clienteRaw.nombre) ?? "",
      codigoCliente: asString(clienteRaw.codigoCliente ?? clienteRaw.codigo),
    },
    prestamo: {
      id: prestamoId,
      codigoPrestamo,
      fechaApertura: asString(prestamoRaw.fechaApertura) ?? null,
      primerPago: asString(prestamoRaw.primerPago) ?? null,
      montoOtorgado: asNumber(prestamoRaw.montoOtorgado) ?? 0,
      frecuenciaPago: asString(prestamoRaw.frecuenciaPago),
      metodoInteresCorriente: asString(prestamoRaw.metodoInteresCorriente),
      tasaInteresAnual: asNumber(prestamoRaw.tasaInteresAnual),
      tasaMoraAnual: asNumber(prestamoRaw.tasaMoraAnual),
      cuotaFija: asNumber(prestamoRaw.cuotaFija),
      plazoCuotas: asNumber(prestamoRaw.plazoCuotas),
      fechaVencimiento: asString(prestamoRaw.fechaVencimiento) ?? null,
      estadoPrestamo: asString(prestamoRaw.estadoPrestamo),
    },
    resumen: {
      saldoActual: asNumber(resumenRaw.saldoActual) ?? 0,
      interesPendiente: asNumber(resumenRaw.interesPendiente) ?? 0,
      moraPendiente: asNumber(resumenRaw.moraPendiente) ?? 0,
      moraPagada: asNumber(resumenRaw.moraPagada) ?? 0,
      saldoCapital: asNumber(resumenRaw.saldoCapital) ?? 0,
      saldoTotal: asNumber(resumenRaw.saldoTotal) ?? 0,
      totalPagado: asNumber(resumenRaw.totalPagado) ?? 0,
      capitalPagado: asNumber(resumenRaw.capitalPagado) ?? 0,
      interesPagado: asNumber(resumenRaw.interesPagado) ?? 0,
    },
    distribucionPagos: {
      capital: asNumber(distribucionRaw.capital) ?? 0,
      interes: asNumber(distribucionRaw.interes) ?? 0,
      mora: asNumber(distribucionRaw.mora) ?? 0,
    },
    pagos,
    cuotas,
  };
};

const buildEstadoCuentaBase = () => "/estado-cuenta";

const buildSearchPath = (q?: string) => {
  const query = new URLSearchParams();
  if (q && q.trim()) query.set("q", q.trim());
  const qs = query.toString();
  return qs ? `${buildEstadoCuentaBase()}/buscar?${qs}` : `${buildEstadoCuentaBase()}/buscar`;
};

const buildDetallePath = (prestamoId: string) => `${buildEstadoCuentaBase()}/${encodeURIComponent(prestamoId)}`;
const buildPdfPath = (prestamoId: string) => `${buildDetallePath(prestamoId)}/pdf`;
const buildImprimiblePath = (prestamoId: string) => `${buildDetallePath(prestamoId)}/imprimible`;

export const estadoCuentaApi = {
  async buscar(q?: string): Promise<EstadoCuentaSearchItem[]> {
    const res = await apiFetch<unknown>(buildSearchPath(q));
    const payload = extractPayload(res);
    const list = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : isRecord(payload) && Array.isArray(payload.resultados)
      ? payload.resultados
      : [];

    return list
      .map((item) => normalizeSearchItem(item))
      .filter((x): x is EstadoCuentaSearchItem => x !== null);
  },

  async getDetalle(prestamoId: string): Promise<EstadoCuentaDetalle> {
    const res = await apiFetch<unknown>(buildDetallePath(prestamoId));
    const normalized = normalizeDetalle(res);
    if (!normalized) {
      throw new Error("Respuesta inválida de estado de cuenta");
    }
    return normalized;
  },

  async getPdf(prestamoId: string): Promise<Blob> {
    return await apiFetch<Blob>(buildPdfPath(prestamoId), { responseType: "blob" });
  },

  async getImprimibleHtml(prestamoId: string): Promise<string> {
    return await apiFetch<string>(buildImprimiblePath(prestamoId), { responseType: "text" });
  },

  buildPdfPath,
  buildImprimiblePath,
};

export const blobStartsWith = async (blob: Blob, signature: number[]): Promise<boolean> => {
  const bytes = new Uint8Array(await blob.slice(0, signature.length).arrayBuffer());
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
};

export const isLikelyPdf = async (blob: Blob): Promise<boolean> => blobStartsWith(blob, [0x25, 0x50, 0x44, 0x46]);

export const isLikelyHtml = (text: string): boolean => {
  const sample = String(text || "").trim().toLowerCase();
  if (!sample) return false;
  return sample.startsWith("<!doctype html") || sample.startsWith("<html") || sample.includes("<body");
};

export const openHtmlInNewWindow = (html: string, title = "Estado de cuenta"): boolean => {
  if (typeof window === "undefined") return false;
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return false;

  popup.document.open();
  popup.document.write(html);
  popup.document.title = title;
  popup.document.close();
  return true;
};

export const toObjectUrl = (blob: Blob): string => URL.createObjectURL(blob);

export const revokeObjectUrlLater = (url: string, ms = 60_000): void => {
  if (typeof window === "undefined") return;
  window.setTimeout(() => URL.revokeObjectURL(url), ms);
};
