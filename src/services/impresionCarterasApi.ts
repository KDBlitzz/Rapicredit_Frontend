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

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export type TipoCartera = "activa" | "por-cobrar" | "mora";
export type EstadoRegistro = "TODOS" | "NUEVO" | "RENOVADO";

export interface CarteraResumenParams {
  desde: string;
  hasta: string;
  q?: string;
  asesorId?: string;
  estado?: EstadoRegistro;
}

export interface CarteraPrestamoItem {
  id: string;
  clienteNombre: string;
  fecha: string | null;
  estado: "NUEVO" | "RENOVADO" | "OTRO";
  monto: number;
  totalConInteres: number;
  interes: number;
  cuota: number;
}

export interface CarteraAsesorGrupo {
  asesorId: string;
  asesorNombre: string;
  registros: number;
  nuevos: number;
  renovados: number;
  monto: number;
  totalConInteres: number;
  interes: number;
  prestamos: CarteraPrestamoItem[];
}

export interface CarteraResumenData {
  periodo: {
    desde: string;
    hasta: string;
  };
  total: {
    registros: number;
    nuevos: number;
    renovados: number;
    monto: number;
    totalConInteres: number;
    interes: number;
  };
  asesores: CarteraAsesorGrupo[];
}

const normalizeEstado = (raw: unknown): "NUEVO" | "RENOVADO" | "OTRO" => {
  const up = String(raw || "").trim().toUpperCase();
  if (up === "NUEVO") return "NUEVO";
  if (up === "RENOVADO") return "RENOVADO";
  return "OTRO";
};

const normalizePrestamo = (raw: unknown, idx: number): CarteraPrestamoItem => {
  const rec = isRecord(raw) ? raw : {};
  const cliente = asString(rec.clienteNombre ?? rec.nombreCliente ?? rec.cliente ?? rec.nombreCompleto) ?? "Cliente";

  const monto = asNumber(rec.monto ?? rec.capital ?? rec.capitalSolicitado) ?? 0;
  const interes = asNumber(rec.interes ?? rec.intereses) ?? 0;
  const totalConInteres = asNumber(rec.totalConInteres ?? rec.tlInt ?? rec.total) ?? monto + interes;
  const cuota = asNumber(rec.cuota ?? rec.cuotaFija) ?? 0;

  return {
    id: asString(rec.id ?? rec._id ?? rec.prestamoId ?? `prestamo-${idx}`) ?? `prestamo-${idx}`,
    clienteNombre: cliente,
    fecha: asString(rec.fecha ?? rec.fechaRegistro ?? rec.fechaApertura ?? rec.createdAt) ?? null,
    estado: normalizeEstado(rec.estado ?? rec.tipo ?? rec.tipoRegistro),
    monto,
    totalConInteres,
    interes,
    cuota,
  };
};

const summarizePrestamos = (prestamos: CarteraPrestamoItem[]) => {
  return prestamos.reduce(
    (acc, p) => {
      acc.registros += 1;
      if (p.estado === "NUEVO") acc.nuevos += 1;
      if (p.estado === "RENOVADO") acc.renovados += 1;
      acc.monto += p.monto;
      acc.totalConInteres += p.totalConInteres;
      acc.interes += p.interes;
      return acc;
    },
    { registros: 0, nuevos: 0, renovados: 0, monto: 0, totalConInteres: 0, interes: 0 }
  );
};

const normalizeAsesor = (raw: unknown, idx: number): CarteraAsesorGrupo => {
  const rec = isRecord(raw) ? raw : {};
  const prestamosRaw = asArray(rec.prestamos ?? rec.items ?? rec.registrosDetalle ?? rec.detalle);
  const prestamos = prestamosRaw.map((p, i) => normalizePrestamo(p, i));

  const fallbackSummary = summarizePrestamos(prestamos);
  const tot = isRecord(rec.total) ? rec.total : isRecord(rec.resumen) ? rec.resumen : {};

  const asesorNombre =
    asString(rec.asesorNombre ?? rec.nombreAsesor ?? rec.asesor ?? rec.nombreCompleto ?? rec.nombre) ??
    `Asesor ${idx + 1}`;

  return {
    asesorId: asString(rec.asesorId ?? rec.id ?? rec._id ?? rec.codigoUsuario ?? `asesor-${idx}`) ?? `asesor-${idx}`,
    asesorNombre,
    registros: asNumber(tot.registros ?? rec.registros ?? rec.cantidadPrestamos) ?? fallbackSummary.registros,
    nuevos: asNumber(tot.nuevos ?? rec.nuevos) ?? fallbackSummary.nuevos,
    renovados: asNumber(tot.renovados ?? rec.renovados) ?? fallbackSummary.renovados,
    monto: asNumber(tot.monto ?? rec.monto) ?? fallbackSummary.monto,
    totalConInteres:
      asNumber(tot.totalConInteres ?? tot.tlInt ?? rec.totalConInteres ?? rec.tlInt) ??
      fallbackSummary.totalConInteres,
    interes: asNumber(tot.interes ?? rec.interes ?? rec.intereses) ?? fallbackSummary.interes,
    prestamos,
  };
};

const normalizeResumen = (raw: unknown, params: CarteraResumenParams): CarteraResumenData => {
  const payload = isRecord(raw)
    ? isRecord(raw.data)
      ? raw.data
      : raw
    : {};

  const asesoresRaw = asArray(payload.asesores ?? payload.grupos ?? payload.porAsesor ?? payload.items);
  const asesores = asesoresRaw.map((x, i) => normalizeAsesor(x, i));

  const fallbackTotal = asesores.reduce(
    (acc, a) => {
      acc.registros += a.registros;
      acc.nuevos += a.nuevos;
      acc.renovados += a.renovados;
      acc.monto += a.monto;
      acc.totalConInteres += a.totalConInteres;
      acc.interes += a.interes;
      return acc;
    },
    { registros: 0, nuevos: 0, renovados: 0, monto: 0, totalConInteres: 0, interes: 0 }
  );

  const totalRaw = isRecord(payload.total) ? payload.total : isRecord(payload.resumen) ? payload.resumen : {};

  return {
    periodo: {
      desde: asString(payload.desde ?? payload.fechaInicio ?? params.desde) ?? params.desde,
      hasta: asString(payload.hasta ?? payload.fechaFin ?? params.hasta) ?? params.hasta,
    },
    total: {
      registros: asNumber(totalRaw.registros ?? totalRaw.cantidadRegistros) ?? fallbackTotal.registros,
      nuevos: asNumber(totalRaw.nuevos) ?? fallbackTotal.nuevos,
      renovados: asNumber(totalRaw.renovados) ?? fallbackTotal.renovados,
      monto: asNumber(totalRaw.monto) ?? fallbackTotal.monto,
      totalConInteres: asNumber(totalRaw.totalConInteres ?? totalRaw.tlInt) ?? fallbackTotal.totalConInteres,
      interes: asNumber(totalRaw.interes ?? totalRaw.intereses) ?? fallbackTotal.interes,
    },
    asesores,
  };
};

const buildResumenPath = (params: CarteraResumenParams): string => {
  const qs = new URLSearchParams();
  qs.set("desde", params.desde);
  qs.set("hasta", params.hasta);
  if (params.q?.trim()) qs.set("q", params.q.trim());
  if (params.asesorId?.trim()) qs.set("asesorId", params.asesorId.trim());
  if (params.estado && params.estado !== "TODOS") qs.set("estado", params.estado);

  return `/reportes/carteras/resumen?${qs.toString()}`;
};

const buildExportPath = (tipo: TipoCartera, format: "pdf" | "excel", params: CarteraResumenParams) => {
  const qs = new URLSearchParams();
  qs.set("desde", params.desde);
  qs.set("hasta", params.hasta);
  if (params.asesorId?.trim()) qs.set("asesorId", params.asesorId.trim());

  return `/reportes/carteras/${tipo}/${format}?${qs.toString()}`;
};

const signatureMatch = async (blob: Blob, signature: number[]) => {
  const bytes = new Uint8Array(await blob.slice(0, signature.length).arrayBuffer());
  if (bytes.length < signature.length) return false;
  return signature.every((x, idx) => bytes[idx] === x);
};

export const impresionCarterasApi = {
  async getResumen(params: CarteraResumenParams): Promise<CarteraResumenData> {
    const res = await apiFetch<unknown>(buildResumenPath(params));
    return normalizeResumen(res, params);
  },

  async getPdf(tipo: TipoCartera, params: CarteraResumenParams): Promise<Blob> {
    return await apiFetch<Blob>(buildExportPath(tipo, "pdf", params), { responseType: "blob" });
  },

  async getExcel(tipo: TipoCartera, params: CarteraResumenParams): Promise<Blob> {
    return await apiFetch<Blob>(buildExportPath(tipo, "excel", params), { responseType: "blob" });
  },

  async isPdf(blob: Blob): Promise<boolean> {
    return signatureMatch(blob, [0x25, 0x50, 0x44, 0x46]);
  },

  async isExcel(blob: Blob): Promise<boolean> {
    return signatureMatch(blob, [0x50, 0x4b]);
  },
};
