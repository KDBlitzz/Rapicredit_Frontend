"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface DashboardResumen {
  prestamosActivos: number;
  prestamosEnMora: number;
  prestamosPagados: number;
  montoTotalColocado: number;
  vencenEn7Dias: number;
  cantidadPrestamosNuevosMes?: number;
  prestamosNuevosMes?: number;
  distribucionEstados: {
    VIGENTE: number;
    EN_MORA: number;
    PAGADO: number;
  };
  prestamosRecientes: {
    id: string;
    codigo: string;
    cliente: {
      id: string;
      codigoCliente?: string;
      identidadCliente?: string;
    } | null;
    monto: number;
    saldo: number;
    estado: string;
    fechaDesembolso: string;
    fechaVencimiento: string;
  }[];
  pagosHoy: {
    id: string;
    codigoFinanciamiento: string | null;
    monto: number;
    fechaAbono: string;
    cliente: {
      id: string;
      codigoCliente?: string;
      identidadCliente?: string;
    } | null;
  }[];
}

function normalizeDashboardResumen(raw: unknown): DashboardResumen {
  const asRecord = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : null;

  const root = asRecord(raw);
  const payload =
    asRecord(root?.["response"]) ??
    asRecord(root?.["data"]) ??
    asRecord(root?.["resumen"]) ??
    root ??
    {};

  const toNumber = (v: unknown, fallback = 0): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return fallback;
  };

  const toString = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : v != null ? String(v) : fallback;

  const toArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const normalizeCliente = (v: unknown) => {
    const o = asRecord(v);
    if (!o) return null;
    return {
      id: toString(o["id"] ?? o["_id"] ?? ""),
      codigoCliente: typeof o["codigoCliente"] === "string" ? (o["codigoCliente"] as string) : undefined,
      identidadCliente: typeof o["identidadCliente"] === "string" ? (o["identidadCliente"] as string) : undefined,
    };
  };

  const prestamosRecientes = toArray(payload["prestamosRecientes"]).map((item, idx) => {
    const o = asRecord(item) ?? {};
    const id = toString(o["id"] ?? o["_id"] ?? o["codigo"] ?? idx);
    return {
      id,
      codigo: toString(o["codigo"] ?? o["codigoFinanciamiento"] ?? "—", "—"),
      cliente: normalizeCliente(o["cliente"]),
      monto: toNumber(o["monto"] ?? o["capitalSolicitado"] ?? 0, 0),
      saldo: toNumber(o["saldo"] ?? 0, 0),
      estado: toString(o["estado"] ?? o["estadoPrestamo"] ?? "—", "—"),
      fechaDesembolso: toString(o["fechaDesembolso"] ?? o["fechaSolicitud"] ?? ""),
      fechaVencimiento: toString(o["fechaVencimiento"] ?? ""),
    };
  });

  const pagosHoy = toArray(payload["pagosHoy"]).map((item, idx) => {
    const o = asRecord(item) ?? {};
    const id = toString(o["id"] ?? o["_id"] ?? o["codigoFinanciamiento"] ?? idx);
    return {
      id,
      codigoFinanciamiento:
        o["codigoFinanciamiento"] == null ? null : toString(o["codigoFinanciamiento"]),
      monto: toNumber(o["monto"] ?? o["montoPago"] ?? 0, 0),
      fechaAbono: toString(o["fechaAbono"] ?? o["fechaPago"] ?? o["fecha"] ?? ""),
      cliente: normalizeCliente(o["cliente"]),
    };
  });

  const distRaw = asRecord(payload["distribucionEstados"]);
  const distribucionEstados = {
    VIGENTE: toNumber(distRaw?.["VIGENTE"]),
    EN_MORA: toNumber(distRaw?.["EN_MORA"]),
    PAGADO: toNumber(distRaw?.["PAGADO"]),
  };

  const vencenRaw = payload["vencenEn7Dias"];
  const vencenEn7Dias = Array.isArray(vencenRaw)
    ? vencenRaw.length
    : toNumber(vencenRaw);

  return {
    prestamosActivos: toNumber(payload["prestamosActivos"]),
    prestamosEnMora: toNumber(payload["prestamosEnMora"]),
    prestamosPagados: toNumber(payload["prestamosPagados"]),
    montoTotalColocado: toNumber(payload["montoTotalColocado"]),
    vencenEn7Dias,
    cantidadPrestamosNuevosMes: toNumber(payload["cantidadPrestamosNuevosMes"], 0),
    prestamosNuevosMes: toNumber(payload["prestamosNuevosMes"], 0),
    distribucionEstados,
    prestamosRecientes,
    pagosHoy,
  };
}

export function useDashboard() {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const candidates = ["/dashboard/resumen", "/dashboards/resumen", "/resumen"];
        let res: DashboardResumen | null = null;
        let lastErr: unknown = null;

        for (const path of candidates) {
          try {
            res = await apiFetch<DashboardResumen>(path, { silent: true });
            break;
          } catch (e: unknown) {
            lastErr = e;
            const msg = e instanceof Error ? e.message : String(e);
            // Si es 404, probamos siguiente ruta candidata
            if (/\b404\b/i.test(msg) || /not\s*found/i.test(msg) || /cannot\s+get/i.test(msg)) {
              continue;
            }
            throw e;
          }
        }

        if (!res) {
          throw (lastErr instanceof Error ? lastErr : new Error("No se pudo cargar el resumen del dashboard"));
        }
        if (!cancelled) {
          setData(normalizeDashboardResumen(res));
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando dashboard:", err);
          setError(err.message || "Error al cargar el dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
