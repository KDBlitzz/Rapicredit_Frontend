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

export type EstadoAbonFiltro = "TODOS" | "PENDIENTE" | "APLICADO" | "RECHAZADO";

export interface AbonoResumen {
  id: string;
  codigoAbono?: string;
  prestamoId?: string;
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
  estadoAbono?: string;
  observaciones?: string;
}

export interface Abonos {
  busqueda: string;
  estado: EstadoAbonFiltro;
}

export interface UseAbonosOptions {
  /**
   * Cualquier valor que cambie para forzar recarga.
   */
  refreshKey?: unknown;
}

export function useAbonos(filters: Abonos, options: UseAbonosOptions = {}) {
  const [data, setData] = useState<AbonoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<unknown>("/abonos");

        if (cancelled) return;

        const resObj = isRecord(res) ? res : null;
        const rawList: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.abonos)
            ? (resObj?.abonos as unknown[])
            : Array.isArray(resObj?.data)
              ? (resObj?.data as unknown[])
              : [];

        const mapped: AbonoResumen[] = rawList
          .map((p: unknown) => {
            const id = String(getNested(p, ["_id"]) ?? getNested(p, ["id"]) ?? "");
            const codigoPrestamo = String(getNested(p, ["codigoPrestamo"]) ?? "");
            const prestamoId = asString(getNested(p, ["prestamoId"]));
            const clienteId = asString(getNested(p, ["clienteId"]));
            const clienteCodigo = asString(getNested(p, ["clienteCodigo"]) ?? getNested(p, ["codigoCliente"]));
            
            const clienteNombre =
              asString(getNested(p, ["clienteNombre"])) || "—";

            const clienteIdentidad =
              asString(getNested(p, ["clienteIdentidad"])) ||
              asString(getNested(p, ["identidadCliente"])) ||
              undefined;

            const monto = asNumber(getNested(p, ["monto"])) ?? 0;
            const moneda = asString(getNested(p, ["moneda"])) ?? "HNL";
            const fecha = asString(getNested(p, ["fecha"]) ?? getNested(p, ["fechaAbono"])) ?? new Date().toISOString();
            const medioPago = asString(getNested(p, ["medioPago"])) ?? "EFECTIVO";
            const referencia = asString(getNested(p, ["referencia"]) ?? getNested(p, ["recibo"]));
            const estadoAbono = asString(getNested(p, ["estadoAbono"]) ?? getNested(p, ["estado"])) ?? "APLICADO";
            const observaciones = asString(getNested(p, ["observaciones"]));

            return {
              id,
              codigoAbono: asString(getNested(p, ["codigoAbono"])),
              prestamoId,
              codigoPrestamo,
              clienteId,
              clienteCodigo,
              clienteNombre,
              clienteIdentidad,
              monto,
              moneda,
              fecha,
              medioPago,
              referencia,
              estadoAbono,
              observaciones,
            };
          })
          .filter((abono) => {
            // Filtro de búsqueda
            if (filters.busqueda) {
              const searchLower = filters.busqueda.toLowerCase();
              if (
                !abono.codigoPrestamo.toLowerCase().includes(searchLower) &&
                !abono.clienteNombre.toLowerCase().includes(searchLower) &&
                !abono.referencia?.toLowerCase().includes(searchLower)
              ) {
                return false;
              }
            }

            // Filtro de estado
            if (filters.estado !== "TODOS") {
              if (abono.estadoAbono !== filters.estado) {
                return false;
              }
            }

            return true;
          });

        setData(mapped);
      } catch (e: unknown) {
        console.error("Error cargando abonos:", e);
        const errorMsg = e instanceof Error ? e.message : "Error cargando abonos";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filters.busqueda, filters.estado, options.refreshKey]);

  return { data, loading, error, refresh: () => {} };
}
