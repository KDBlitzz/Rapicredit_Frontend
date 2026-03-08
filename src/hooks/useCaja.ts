"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

const getNested = (v: unknown, keys: string[]): unknown => {
  let cur: unknown = v;
  for (const k of keys) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
};

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

const isRouteMissingLike = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /\b404\b/i.test(msg) ||
    /\b405\b/i.test(msg) ||
    /not\s*found/i.test(msg) ||
    /cannot\s+(get|post|put|delete)/i.test(msg)
  );
};

const toArrayFromResponse = (res: unknown, keys: string[] = []): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isRecord(res)) {
    for (const k of keys) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
    const data = res["data"];
    if (Array.isArray(data)) return data;
  }
  return [];
};

const asIsoDate = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) {
    try {
      return new Date(v).toISOString();
    } catch {
      return undefined;
    }
  }
  if (v instanceof Date) {
    try {
      return v.toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const mapPagoItem = (raw: unknown): PagoItem => {
  const r = isRecord(raw) ? raw : ({} as UnknownRecord);

  const clienteRaw = getNested(r, ["cliente"]) ?? getNested(r, ["clienteId"]) ?? undefined;
  const cobradorRaw =
    getNested(r, ["cobrador"]) ?? getNested(r, ["asesor"]) ?? getNested(r, ["empleado"]) ?? undefined;

  const prestamoId =
    asString(r["prestamoId"] ?? r["financiamientoId"] ?? r["creditoId"]) ||
    asString(getNested(r, ["prestamo", "_id"]) ?? getNested(r, ["prestamo", "id"])) ||
    "";

  const clienteId =
    asString(r["clienteId"] ?? r["idCliente"]) ||
    asString(getNested(clienteRaw, ["_id"]) ?? getNested(clienteRaw, ["id"])) ||
    "";

  const clienteNombre =
    asString(r["clienteNombre"]) ||
    asString(getNested(clienteRaw, ["nombreCompleto"])) ||
    [asString(getNested(clienteRaw, ["nombre"])), asString(getNested(clienteRaw, ["apellido"]))]
      .filter(Boolean)
      .join(" ") ||
    asString(getNested(clienteRaw, ["razonSocial"])) ||
    undefined;

  const cobradorId =
    asString(r["cobradorId"] ?? r["asesorId"] ?? r["empleadoId"]) ||
    asString(getNested(cobradorRaw, ["_id"]) ?? getNested(cobradorRaw, ["id"])) ||
    undefined;

  const cobradorNombre =
    asString(r["cobradorNombre"] ?? r["asesorNombre"] ?? r["empleadoNombre"]) ||
    asString(getNested(cobradorRaw, ["nombreCompleto"])) ||
    [asString(getNested(cobradorRaw, ["nombre"])), asString(getNested(cobradorRaw, ["apellido"]))]
      .filter(Boolean)
      .join(" ") ||
    asString(getNested(cobradorRaw, ["usuario"])) ||
    undefined;

  const montoPrincipal = asNumber(r["montoPrincipal"] ?? r["principal"] ?? r["capital"]);
  const montoInteres = asNumber(r["montoInteres"] ?? r["interes"]);
  const montoMora = asNumber(r["montoMora"] ?? r["mora"]);

  return {
    _id: asString(r["_id"] ?? r["id"]) ?? undefined,
    prestamoId,
    clienteId,
    clienteNombre,
    cobradorId,
    cobradorNombre,
    monto:
      asNumber(r["monto"] ?? r["montoAbono"] ?? r["valor"] ?? r["total"]) ??
      0,
    montoPrincipal: montoPrincipal ?? undefined,
    montoInteres: montoInteres ?? undefined,
    montoMora: montoMora ?? undefined,
    fecha:
      asIsoDate(r["fecha"] ?? r["fechaPago"] ?? r["fechaAbono"] ?? r["createdAt"]) ||
      new Date().toISOString(),
    estado: asString(r["estado"] ?? r["status"] ?? r["estadoPago"]) ?? undefined,
    referencia: asString(r["referencia"] ?? r["ref"] ?? r["numero"]) ?? undefined,
    observaciones: asString(r["observaciones"] ?? r["nota"] ?? r["comentario"]) ?? undefined,
  };
};

const mapMoraItem = (raw: unknown): MoraDetallada => {
  const r = isRecord(raw) ? raw : ({} as UnknownRecord);

  const clienteRaw = getNested(r, ["cliente"]) ?? getNested(r, ["clienteId"]) ?? undefined;
  const cobradorRaw =
    getNested(r, ["cobrador"]) ?? getNested(r, ["asesor"]) ?? getNested(r, ["empleado"]) ?? undefined;
  const prestamoRaw = getNested(r, ["prestamo"]) ?? getNested(r, ["financiamiento"]) ?? undefined;

  const prestamoId =
    asString(r["prestamoId"] ?? r["financiamientoId"] ?? r["creditoId"]) ||
    asString(getNested(prestamoRaw, ["_id"]) ?? getNested(prestamoRaw, ["id"])) ||
    "";

  const clienteId =
    asString(r["clienteId"] ?? r["idCliente"]) ||
    asString(getNested(clienteRaw, ["_id"]) ?? getNested(clienteRaw, ["id"])) ||
    "";

  const clienteNombre =
    asString(r["clienteNombre"]) ||
    asString(getNested(clienteRaw, ["nombreCompleto"])) ||
    [asString(getNested(clienteRaw, ["nombre"])), asString(getNested(clienteRaw, ["apellido"]))]
      .filter(Boolean)
      .join(" ") ||
    asString(getNested(clienteRaw, ["razonSocial"])) ||
    undefined;

  const cobradorId =
    asString(r["cobradorId"] ?? r["asesorId"] ?? r["empleadoId"]) ||
    asString(getNested(cobradorRaw, ["_id"]) ?? getNested(cobradorRaw, ["id"])) ||
    undefined;

  const cobradorNombre =
    asString(r["cobradorNombre"] ?? r["asesorNombre"] ?? r["empleadoNombre"]) ||
    asString(getNested(cobradorRaw, ["nombreCompleto"])) ||
    [asString(getNested(cobradorRaw, ["nombre"])), asString(getNested(cobradorRaw, ["apellido"]))]
      .filter(Boolean)
      .join(" ") ||
    asString(getNested(cobradorRaw, ["usuario"])) ||
    undefined;

  const cuotasAtrasadas =
    asNumber(r["cuotasAtrasadas"] ?? r["cuotas"] ?? r["cuotasVencidas"] ?? r["cuotasEnMora"]) ??
    0;

  const totalMora = asNumber(r["totalMora"] ?? r["mora"] ?? r["montoMora"] ?? r["valorMora"]) ?? 0;

  return {
    _id: asString(r["_id"] ?? r["id"]) ?? (prestamoId ? `mora-${prestamoId}` : undefined),
    clienteId,
    clienteNombre,
    prestamoId,
    cuotasAtrasadas,
    totalMora,
    diasAtraso: asNumber(r["diasAtraso"] ?? r["dias"] ?? r["diasMora"]) ?? undefined,
    ultimaFecha: asIsoDate(r["ultimaFecha"] ?? r["ultimaFechaPago"] ?? r["fechaUltimoPago"] ?? r["fecha"]) ?? undefined,
    cobradorId,
    cobradorNombre,
    estadoPrestamo: asString(r["estadoPrestamo"] ?? r["estadoFinanciamiento"] ?? r["estado"]) ?? undefined,
  };
};

// ============================================================================
// Tipos
// ============================================================================

export interface PagoItem {
  _id?: string;
  prestamoId: string;
  clienteId: string;
  clienteNombre?: string;
  cobradorId?: string;
  cobradorNombre?: string;
  monto: number;
  montoPrincipal?: number;
  montoInteres?: number;
  montoMora?: number;
  fecha: string; // ISO date
  estado?: string;
  referencia?: string;
  observaciones?: string;
}

export interface CuadreData {
  fecha: string;
  totalPagos: number;
  totalDesembolsos?: number;
  totalGastos?: number;
  detalleAdesores?: Array<{
    cobradorId: string;
    cobradorNombre: string;
    totalPagos: number;
    countPagos: number;
    promedioPorPago?: number;
  }>;
  desglosePorCategoria?: {
    [categoria: string]: {
      cantidad: number;
      total: number;
    };
  };
}

export interface MoraDetallada {
  _id?: string;
  clienteId: string;
  clienteNombre?: string;
  prestamoId: string;
  cuotasAtrasadas: number;
  totalMora: number;
  diasAtraso?: number;
  ultimaFecha?: string;
  cobradorId?: string;
  cobradorNombre?: string;
  estadoPrestamo?: string;
}

export interface GastoCajaItem {
  _id?: string;
  fecha: string; // ISO date
  cobradorId?: string;
  cobradorNombre?: string;
  monto: number;
  categoria?: string;
  descripcion?: string;
  referencia?: string;
  origen?: string;
}

export interface DesembolsoCajaItem {
  _id?: string;
  fecha: string; // ISO date
  cobradorId?: string;
  cobradorNombre?: string;
  monto: number;
  descripcion?: string;
  referencia?: string;
}

// ============================================================================
// Hook: usePagosPorAsesor
// ============================================================================

export function usePagosPorAsesor(
  cobradorId?: string,
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
) {
  const [data, setData] = useState<PagoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cobradorId) {
      setData([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/pagos/asesor/${cobradorId}`;
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<unknown>(url, { silent: true });
        const list = toArrayFromResponse(res, ["pagos", "items", "results", "data"]);
        const mapped = list.map(mapPagoItem);
        if (!cancelled) setData(mapped);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Error al cargar pagos por asesor");
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Hook: usePagos (Todos)
// ============================================================================

export function usePagos(fechaInicio?: string, fechaFin?: string, refreshKey?: unknown) {
  const [data, setData] = useState<PagoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/pagos`;
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<unknown>(url, { silent: true });
        const list = toArrayFromResponse(res, ["pagos", "items", "results", "data"]);
        const mapped = list.map(mapPagoItem);
        if (!cancelled) setData(mapped);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Error al cargar pagos");
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Hook: useCuadre
// ============================================================================

export function useCuadre(fechaInicio?: string, fechaFin?: string, refreshKey?: unknown) {
  const [data, setData] = useState<CuadreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/cuadre`;
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<CuadreData>(url, { silent: true });
        if (!cancelled) setData(res || null);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Error al cargar cuadre");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Hook: useGastosCaja
// ============================================================================

export function useGastosCaja(
  cobradorId?: string,
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
) {
  const [data, setData] = useState<GastoCajaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const paramsCommon = new URLSearchParams();
        if (fechaInicio) paramsCommon.append("fechaInicio", fechaInicio);
        if (fechaFin) paramsCommon.append("fechaFin", fechaFin);

        const paramsWithCobrador = new URLSearchParams(paramsCommon);
        if (cobradorId) paramsWithCobrador.append("cobradorId", cobradorId);

        const candidates: string[] = [];
        if (cobradorId) {
          const p = paramsCommon.toString();
          candidates.push(`/caja/gastos/asesor/${cobradorId}${p ? `?${p}` : ""}`);
          candidates.push(`/caja/egresos/asesor/${cobradorId}${p ? `?${p}` : ""}`);
          candidates.push(`/caja/gasto/asesor/${cobradorId}${p ? `?${p}` : ""}`);
        }

        const p2 = paramsWithCobrador.toString();
        candidates.push(`/caja/gastos${p2 ? `?${p2}` : ""}`);
        candidates.push(`/caja/egresos${p2 ? `?${p2}` : ""}`);
        candidates.push(`/caja/gasto${p2 ? `?${p2}` : ""}`);

        const paramsMov = new URLSearchParams(paramsWithCobrador);
        paramsMov.append("tipo", "GASTO");
        candidates.push(`/caja/movimientos?${paramsMov.toString()}`);

        let res: unknown = null;
        let lastErr: unknown = null;
        for (const url of candidates) {
          try {
            res = await apiFetch<unknown>(url, { silent: true });
            break;
          } catch (e: unknown) {
            lastErr = e;
            if (isRouteMissingLike(e)) continue;
            throw e;
          }
        }

        if (res == null) {
          // Si todas las rutas candidatas no existen (404/405), degradar a lista vacía sin error.
          if (lastErr && isRouteMissingLike(lastErr)) {
            if (!cancelled) {
              setData([]);
              setError(null);
            }
            return;
          }

          throw lastErr instanceof Error ? lastErr : new Error("No se pudo cargar gastos");
        }

        const list = toArrayFromResponse(res, ["gastos", "egresos", "items", "movimientos"]);

        const mapped: GastoCajaItem[] = list.map((raw) => {
          const r = isRecord(raw) ? raw : ({} as UnknownRecord);

          const cobradorRaw = getNested(r, ["cobrador"]) ?? getNested(r, ["asesor"]) ?? undefined;
          const cobradorIdFromObj = asString(getNested(cobradorRaw, ["_id"]) ?? getNested(cobradorRaw, ["id"]));
          const cobradorNombreFromObj = asString(
            getNested(cobradorRaw, ["nombreCompleto"]) ??
              [asString(getNested(cobradorRaw, ["nombre"])), asString(getNested(cobradorRaw, ["apellido"]))]
                .filter(Boolean)
                .join(" ")
          );

          return {
            _id: asString(r["_id"] ?? r["id"]) ?? undefined,
            fecha:
              asString(r["fecha"] ?? r["fechaGasto"] ?? r["fechaRegistro"] ?? r["createdAt"]) ||
              new Date().toISOString(),
            cobradorId:
              asString(r["cobradorId"] ?? r["asesorId"] ?? r["empleadoId"]) ||
              cobradorIdFromObj ||
              undefined,
            cobradorNombre:
              asString(r["cobradorNombre"] ?? r["asesorNombre"] ?? r["empleadoNombre"]) ||
              cobradorNombreFromObj ||
              undefined,
            monto:
              asNumber(r["monto"] ?? r["montoGasto"] ?? r["valor"] ?? r["total"]) ??
              0,
            categoria:
              asString(r["categoria"] ?? r["categoriaGasto"] ?? r["rubro"]) ||
              undefined,
            descripcion:
              asString(r["descripcion"] ?? r["concepto"] ?? r["detalle"] ?? r["observaciones"]) ||
              undefined,
            referencia: asString(r["referencia"] ?? r["ref"] ?? r["numero"]) || undefined,
            origen: asString(r["origen"] ?? r["medio"] ?? r["fuente"]) || undefined,
          };
        });

        mapped.sort((a, b) => {
          const da = a.fecha ? new Date(a.fecha).getTime() : 0;
          const db = b.fecha ? new Date(b.fecha).getTime() : 0;
          return db - da;
        });

        if (!cancelled) setData(mapped);
      } catch (err: any) {
        if (!cancelled) {
          // Evitar overlay de Next (no console.error). Reportar solo en UI.
          if (!isRouteMissingLike(err)) setError(err.message || "Error al cargar gastos");
          else setError(null);
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Hook: useDesembolsosCaja
// ============================================================================

export function useDesembolsosCaja(
  cobradorId?: string,
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
) {
  const [data, setData] = useState<DesembolsoCajaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const paramsCommon = new URLSearchParams();
        if (fechaInicio) paramsCommon.append("fechaInicio", fechaInicio);
        if (fechaFin) paramsCommon.append("fechaFin", fechaFin);

        const paramsWithCobrador = new URLSearchParams(paramsCommon);
        if (cobradorId) paramsWithCobrador.append("cobradorId", cobradorId);

        const candidates: string[] = [];
        if (cobradorId) {
          const p = paramsCommon.toString();
          candidates.push(`/caja/desembolsos/asesor/${cobradorId}${p ? `?${p}` : ""}`);
          candidates.push(`/caja/desembolso/asesor/${cobradorId}${p ? `?${p}` : ""}`);
        }

        const p2 = paramsWithCobrador.toString();
        candidates.push(`/caja/desembolsos${p2 ? `?${p2}` : ""}`);
        candidates.push(`/caja/desembolso${p2 ? `?${p2}` : ""}`);

        const paramsMov = new URLSearchParams(paramsWithCobrador);
        paramsMov.append("tipo", "DESEMBOLSO");
        candidates.push(`/caja/movimientos?${paramsMov.toString()}`);

        let res: unknown = null;
        let lastErr: unknown = null;
        for (const url of candidates) {
          try {
            res = await apiFetch<unknown>(url, { silent: true });
            break;
          } catch (e: unknown) {
            lastErr = e;
            if (isRouteMissingLike(e)) continue;
            throw e;
          }
        }

        if (res == null) {
          // Si todas las rutas candidatas no existen (404/405), degradar a lista vacía sin error.
          if (lastErr && isRouteMissingLike(lastErr)) {
            if (!cancelled) {
              setData([]);
              setError(null);
            }
            return;
          }

          throw lastErr instanceof Error ? lastErr : new Error("No se pudo cargar desembolsos");
        }

        const list = toArrayFromResponse(res, ["desembolsos", "items", "movimientos"]);

        const mapped: DesembolsoCajaItem[] = list.map((raw) => {
          const r = isRecord(raw) ? raw : ({} as UnknownRecord);

          const cobradorRaw = getNested(r, ["cobrador"]) ?? getNested(r, ["asesor"]) ?? undefined;
          const cobradorIdFromObj = asString(getNested(cobradorRaw, ["_id"]) ?? getNested(cobradorRaw, ["id"]));
          const cobradorNombreFromObj = asString(
            getNested(cobradorRaw, ["nombreCompleto"]) ??
              [asString(getNested(cobradorRaw, ["nombre"])), asString(getNested(cobradorRaw, ["apellido"]))]
                .filter(Boolean)
                .join(" ")
          );

          return {
            _id: asString(r["_id"] ?? r["id"]) ?? undefined,
            fecha:
              asString(r["fecha"] ?? r["fechaDesembolso"] ?? r["fechaRegistro"] ?? r["createdAt"]) ||
              new Date().toISOString(),
            cobradorId:
              asString(r["cobradorId"] ?? r["asesorId"] ?? r["empleadoId"]) ||
              cobradorIdFromObj ||
              undefined,
            cobradorNombre:
              asString(r["cobradorNombre"] ?? r["asesorNombre"] ?? r["empleadoNombre"]) ||
              cobradorNombreFromObj ||
              undefined,
            monto:
              asNumber(r["monto"] ?? r["montoDesembolso"] ?? r["valor"] ?? r["total"]) ??
              0,
            descripcion:
              asString(r["descripcion"] ?? r["concepto"] ?? r["detalle"] ?? r["observaciones"]) ||
              undefined,
            referencia: asString(r["referencia"] ?? r["ref"] ?? r["numero"]) || undefined,
          };
        });

        mapped.sort((a, b) => {
          const da = a.fecha ? new Date(a.fecha).getTime() : 0;
          const db = b.fecha ? new Date(b.fecha).getTime() : 0;
          return db - da;
        });

        if (!cancelled) setData(mapped);
      } catch (err: any) {
        if (!cancelled) {
          if (!isRouteMissingLike(err)) setError(err.message || "Error al cargar desembolsos");
          else setError(null);
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Hook: useMoraDetallada
// ============================================================================

export function useMoraDetallada(cobradorId?: string, clienteId?: string, refreshKey?: unknown) {
  const [data, setData] = useState<MoraDetallada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/mora`;
        const params = new URLSearchParams();
        if (cobradorId) params.append("cobradorId", cobradorId);
        if (clienteId) params.append("clienteId", clienteId);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<unknown>(url, { silent: true });
        const list = toArrayFromResponse(res, ["mora", "moras", "items", "results", "data"]);
        const mapped = list.map(mapMoraItem);
        if (!cancelled) setData(mapped);
      } catch (err: any) {
        if (!cancelled) {
          // Evitar overlay de Next (no console.error). Reportar solo en UI.
          if (!isRouteMissingLike(err)) setError(err.message || "Error al cargar mora detallada");
          else setError(null);
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, clienteId, refreshKey]);

  return { data, loading, error };
}
