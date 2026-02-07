"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface PrestamoDetalle {
  id: string;
  codigoPrestamo: string;
  solicitudId?: string;
  frecuenciaPago?: string;
  capitalSolicitado: number;
  cuotaFija: number;
  plazoCuotas: number;
  estadoPrestamo: string;
  fechaDesembolso?: string;
  fechaVencimiento?: string;

  totalIntereses?: number;
  totalPagado?: number;
  observaciones?: string;
  activo?: boolean;

  cliente: {
    id: string;
    nombreCompleto: string;
    identidadCliente?: string;
    codigoCliente?: string;
  } | null;
}

export function usePrestamoDetalle(id: string, reloadKey: number = 0) {
  const [data, setData] = useState<PrestamoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // En esta app la ruta usa el código (ej: /prestamos/P-2026-001)
        const res = await apiFetch<unknown>(`/prestamos/${encodeURIComponent(id)}`);

        if (cancelled || !res) return;

        const clienteRaw = getNested(res, ["clienteId"]) ?? getNested(res, ["cliente"]) ?? null;
        const cliente =
          clienteRaw && (getNested(clienteRaw, ["_id"]) || getNested(clienteRaw, ["id"]) || getNested(clienteRaw, ["codigoCliente"]))
            ? {
                id: String(getNested(clienteRaw, ["_id"]) ?? getNested(clienteRaw, ["id"]) ?? ""),
                nombreCompleto:
                  asString(getNested(clienteRaw, ["nombreCompleto"])) ||
                  [asString(getNested(clienteRaw, ["nombre"])), asString(getNested(clienteRaw, ["apellido"]))]
                    .filter(Boolean)
                    .join(" ") ||
                  "Cliente",
                identidadCliente:
                  asString(getNested(clienteRaw, ["identidadCliente"])) || asString(getNested(clienteRaw, ["identidad"])) || undefined,
                codigoCliente: asString(getNested(clienteRaw, ["codigoCliente"])) ?? undefined,
              }
            : null;

        const detalle: PrestamoDetalle = {
          id: String(getNested(res, ["_id"]) ?? getNested(res, ["id"]) ?? id),
          codigoPrestamo: String(getNested(res, ["codigoPrestamo"]) ?? ""),
          solicitudId: asString(getNested(res, ["solicitudId", "_id"]) ?? getNested(res, ["solicitudId"])) ?? undefined,
          frecuenciaPago: asString(getNested(res, ["frecuenciaPago"])) ?? undefined,
          capitalSolicitado: asNumber(getNested(res, ["capitalSolicitado"])) ?? 0,
          cuotaFija: asNumber(getNested(res, ["cuotaFija"])) ?? 0,
          plazoCuotas: asNumber(getNested(res, ["plazoCuotas"])) ?? 0,
          estadoPrestamo: String(getNested(res, ["estadoPrestamo"]) ?? ""),
          fechaDesembolso: asString(getNested(res, ["fechaDesembolso"])) ?? undefined,
          fechaVencimiento: asString(getNested(res, ["fechaVencimiento"])) ?? undefined,
          totalIntereses: asNumber(getNested(res, ["totalIntereses"])) ?? undefined,
          totalPagado: asNumber(getNested(res, ["totalPagado"])) ?? undefined,
          observaciones: asString(getNested(res, ["observaciones"])) ?? undefined,
          activo: (getNested(res, ["activo"]) as boolean | undefined) ?? undefined,
          cliente,
        };

        if (!cancelled) {
          setData(detalle);
        }
      } catch (err: unknown) {
        console.error("Error cargando detalle de préstamo:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error al cargar el préstamo";
          setError(msg);
          setData(null);
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
  }, [id, reloadKey]);

  return { data, loading, error };
}
