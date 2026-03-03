"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useEmpleadoActual } from "./useEmpleadoActual";

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

// Nota: este hook usa /prestamos/mios en el backend para obtener solo
// los préstamos del empleado autenticado (sesión actual).

export interface PrestamoAsignado {
  id: string;
  codigoPrestamo: string;
  clienteNombre: string;
  estadoPrestamo: string;
  capitalSolicitado: number;
  cuotaFija: number;
  plazoCuotas: number;
  frecuenciaPago?: string;
}

export interface UsePrestamosAsignadosOptions {
  refreshKey?: unknown;
}

export function usePrestamosAsignados(options: UsePrestamosAsignadosOptions = {}) {
  const { empleado, loading: loadingEmpleado } = useEmpleadoActual();

  const [data, setData] = useState<PrestamoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (loadingEmpleado) {
        setLoading(true);
        return;
      }

      if (!empleado) {
        setData([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch<unknown>("/prestamos/mios");

        if (cancelled) return;

        const resObj = isRecord(res) ? res : null;
        const rawList: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.prestamos)
          ? (resObj?.prestamos as unknown[])
          : Array.isArray(resObj?.data)
          ? (resObj?.data as unknown[])
          : [];

        const assigned = rawList
          .map((p): PrestamoAsignado => {
            const id = String(getNested(p, ["_id"]) ?? getNested(p, ["id"]) ?? "");
            const codigoPrestamo = String(
              getNested(p, ["codigoPrestamo"]) ??
                getNested(p, ["codigoFinanciamiento"]) ??
                ""
            );

            const clienteRaw = getNested(p, ["cliente"]) ?? getNested(p, ["clienteId"]);
            const clienteNombre =
              asString(getNested(p, ["clienteNombre"])) ||
              asString(getNested(clienteRaw, ["nombreCompleto"])) ||
              [asString(getNested(clienteRaw, ["nombre"])), asString(getNested(clienteRaw, ["apellido"]))]
                .filter(Boolean)
                .join(" ") ||
              "—";

            return {
              id,
              codigoPrestamo,
              clienteNombre,
              estadoPrestamo: String(getNested(p, ["estadoPrestamo"]) ?? ""),
              capitalSolicitado: asNumber(getNested(p, ["capitalSolicitado"])) ?? 0,
              cuotaFija: asNumber(getNested(p, ["cuotaFija"])) ?? 0,
              plazoCuotas: asNumber(getNested(p, ["plazoCuotas"])) ?? 0,
              frecuenciaPago: asString(getNested(p, ["frecuenciaPago"])) ?? undefined,
            };
          })
          .filter((p) => p.codigoPrestamo)
          .sort((a, b) => a.codigoPrestamo.localeCompare(b.codigoPrestamo, "es"));

        setData(assigned);
      } catch (err: unknown) {
        console.error("Error cargando préstamos asignados:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error al cargar préstamos asignados";
          setError(msg);
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [empleado, loadingEmpleado, options.refreshKey]);

  return { data, loading, error, empleado, loadingEmpleado };
}
