"use client";

import { useEffect, useMemo, useState } from "react";
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

const normalize = (v: string) => v.trim().toLowerCase();

export type EstadoPagoFiltro = "TODOS" | "PENDIENTE" | "APLICADO" | "RECHAZADO";

export interface PagoResumen {
  id: string;
  codigoPago?: string;
  prestamoId?: string;
  financiamientoId?: string;
  codigoPrestamo: string;
  clienteId?: string;
  clienteCodigo?: string;
  clienteNombre: string;
  clienteIdentidad?: string;
  monto: number;
  moneda?: string;
  fecha: string;
  medioPago?: string;
  referencia?: string;
  estadoPago?: string;
  observaciones?: string;
}

export interface PagosFiltros {
  busqueda: string;
  estado: EstadoPagoFiltro;
}

export interface UsePagosOptions {
  /**
   * Cualquier valor que cambie para forzar recarga.
   */
  refreshKey?: unknown;

  /**
   * Opcional: lista de financiamientos/préstamos permitidos.
   * Útil para filtrar pagos por asesor logueado.
   */
  allowedFinanciamientoIds?: string[];
  allowedCodigosPrestamo?: string[];

  /**
   * Si es true y no hay IDs/códigos permitidos, retorna lista vacía.
   * Útil para vistas por asesor donde NO se debe mostrar información global.
   */
  enforceAllowedFilter?: boolean;
}

export function usePagos(filters: PagosFiltros, options: UsePagosOptions = {}) {
  const [data, setData] = useState<PagoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  const allowed = useMemo(() => {
    const ids = (options.allowedFinanciamientoIds || []).filter(Boolean).map(normalize);
    const codigos = (options.allowedCodigosPrestamo || []).filter(Boolean).map(normalize);
    return {
      ids,
      codigos,
      hasFilter: ids.length > 0 || codigos.length > 0,
      key: `${ids.slice().sort().join("|")}:${codigos.slice().sort().join("|")}`,
    };
  }, [options.allowedFinanciamientoIds, options.allowedCodigosPrestamo]);

  const allowedIds = allowed.ids;
  const allowedCodigos = allowed.codigos;
  const allowedHasFilter = allowed.hasFilter;
  const allowedKey = allowed.key;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (options.enforceAllowedFilter && !allowedHasFilter) {
          setData([]);
          return;
        }

        const allowedIdsSet = new Set(allowedIds);
        const allowedCodigosSet = new Set(allowedCodigos);

        const res = await apiFetch<unknown>("/pagos");

        if (cancelled) return;

        const resObj = isRecord(res) ? res : null;
        const rawList: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.pagos)
          ? (resObj?.pagos as unknown[])
          : Array.isArray(resObj?.data)
          ? (resObj?.data as unknown[])
          : [];

        const mapped: PagoResumen[] = rawList.map((p: unknown) => {
          const id = String(getNested(p, ["_id"]) ?? getNested(p, ["id"]) ?? "");
          const codigoPago = asString(getNested(p, ["codigoPago"]) ?? getNested(p, ["codigo"])) ?? undefined;

          const financiamientoRaw = getNested(p, ["financiamientoId"]) ?? getNested(p, ["financiamiento"]) ?? getNested(p, ["prestamoId"]) ?? undefined;
          const financiamientoId = (() => {
            if (typeof financiamientoRaw === "string") return financiamientoRaw;
            if (isRecord(financiamientoRaw)) return asString(financiamientoRaw["_id"] ?? financiamientoRaw["id"]) ?? undefined;
            return undefined;
          })();

          const codigoPrestamo = String(
            getNested(p, ["codigoPrestamo"]) ??
              getNested(p, ["codigoFinanciamiento"]) ??
              getNested(financiamientoRaw, ["codigoPrestamo"]) ??
              getNested(financiamientoRaw, ["codigoFinanciamiento"]) ??
              getNested(financiamientoRaw, ["codigo"]) ??
              ""
          );

          const clienteRaw = getNested(p, ["clienteId"]) ?? getNested(p, ["cliente"]) ?? undefined;
          const clienteId = (() => {
            if (typeof clienteRaw === "string") return clienteRaw;
            if (isRecord(clienteRaw)) return asString(clienteRaw["_id"] ?? clienteRaw["id"]) ?? undefined;
            return undefined;
          })();

          const clienteCodigo =
            asString(getNested(p, ["clienteCodigo"]) ?? getNested(p, ["codigoCliente"])) ||
            (isRecord(clienteRaw) ? asString(clienteRaw["codigoCliente"]) : undefined) ||
            undefined;

          const clienteNombre =
            asString(getNested(p, ["clienteNombre"])) ||
            (isRecord(clienteRaw)
              ? asString(clienteRaw["nombreCompleto"]) ||
                [asString(clienteRaw["nombre"]), asString(clienteRaw["apellido"])].filter(Boolean).join(" ")
              : undefined) ||
            "—";

          const clienteIdentidad =
            asString(getNested(p, ["clienteIdentidad"])) ||
            (isRecord(clienteRaw)
              ? asString(clienteRaw["identidadCliente"] ?? clienteRaw["identidad"]) || undefined
              : undefined) ||
            undefined;

          const monto =
            asNumber(getNested(p, ["monto"])) ??
            asNumber(getNested(p, ["montoPago"])) ??
            asNumber(getNested(p, ["montoAbono"])) ??
            0;

          const fecha =
            asString(getNested(p, ["fecha"])) ||
            asString(getNested(p, ["fechaPago"])) ||
            asString(getNested(p, ["fechaAbono"])) ||
            new Date().toISOString();

          const medioPago =
            asString(getNested(p, ["metodoPago"])) ||
            asString(getNested(p, ["medioPago"])) ||
            asString(getNested(p, ["formaPago"])) ||
            undefined;

          const referencia = asString(getNested(p, ["referencia"]) ?? getNested(p, ["recibo"])) ?? undefined;

          const estadoPago =
            asString(getNested(p, ["estadoPago"]) ?? getNested(p, ["estado"])) ||
            undefined;

          const observaciones = asString(getNested(p, ["observaciones"])) ?? undefined;

          return {
            id,
            codigoPago,
            prestamoId: financiamientoId,
            financiamientoId,
            codigoPrestamo,
            clienteId,
            clienteCodigo,
            clienteNombre,
            clienteIdentidad,
            monto,
            moneda: asString(getNested(p, ["moneda"])) ?? undefined,
            fecha,
            medioPago,
            referencia,
            estadoPago,
            observaciones,
          };
        });

        let filtered = mapped;

        // Filtrar por asesor (préstamos/financiamientos permitidos)
        if (allowedHasFilter) {
          filtered = filtered.filter((p) => {
            const idVals = [p.financiamientoId, p.prestamoId].filter(Boolean).map((v) => normalize(v as string));
            const codeVals = [p.codigoPrestamo].filter(Boolean).map((v) => normalize(v));
            const idMatch = idVals.some((v) => allowedIdsSet.has(v));
            const codeMatch = codeVals.some((v) => allowedCodigosSet.has(v));
            return idMatch || codeMatch;
          });
        }

        // Filtro de estado
        if (filters.estado !== "TODOS") {
          const target = filters.estado.toUpperCase();
          filtered = filtered.filter((p) => (p.estadoPago || "").toUpperCase() === target);
        }

        // Filtro de búsqueda
        if (filters.busqueda.trim()) {
          const q = filters.busqueda.trim().toLowerCase();
          filtered = filtered.filter((p) => {
            return (
              (p.codigoPrestamo || "").toLowerCase().includes(q) ||
              (p.clienteNombre || "").toLowerCase().includes(q) ||
              (p.codigoPago || "").toLowerCase().includes(q) ||
              (p.id || "").toLowerCase().includes(q)
            );
          });
        }

        // Orden por fecha desc
        filtered.sort((a, b) => {
          const da = a.fecha ? new Date(a.fecha).getTime() : 0;
          const db = b.fecha ? new Date(b.fecha).getTime() : 0;
          return db - da;
        });

        setData(filtered);
      } catch (e: unknown) {
        console.error("Error cargando pagos:", e);
        const errorMsg = e instanceof Error ? e.message : "Error cargando pagos";
        setError(errorMsg);
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // allowed.key helps keep deps stable
  }, [
    filters.busqueda,
    filters.estado,
    options.refreshKey,
    localRefreshKey,
    allowedIds,
    allowedCodigos,
    allowedKey,
    allowedHasFilter,
    options.enforceAllowedFilter,
  ]);

  return { data, loading, error, refresh: () => setLocalRefreshKey((k) => k + 1) };
}
