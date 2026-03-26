"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface PrestamoDetalle {
  id: string;
  codigoPrestamo: string;
  solicitudId?: string;
  solicitudCodigo?: string;
  tipoContratoSolicitud?: string;
  clienteId?: string;
  tasaInteresId?: string;
  tasaInteresNombre?: string;
  tasaInteresAnual?: number;
  tasaMoraAnual?: number;
  frecuenciaPago?: string;
  capitalSolicitado: number;
  saldoCapital?: number;
  cuotaFija: number;
  plazoCuotas: number;
  estadoPrestamo: string;
  fechaDesembolso?: string;
  fechaVencimiento?: string;

  totalIntereses?: number;
  totalPagado?: number;
  saldo?: number;
  saldoActual?: number;
  saldoPendiente?: number;
  observaciones?: string;
  activo?: boolean;

  metodoInteresCorriente?: string;
  configuracionFinancieraId?: string;
  configuracionFinancieraVersion?: number;
  amortizacionPreview?: unknown[];

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
      const safeId = String(id || "").trim();
      if (!safeId) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // En esta app la ruta usa el código (ej: /prestamos/P-2026-001)
        const res = await apiFetch<unknown>(`/prestamos/${encodeURIComponent(safeId)}`);

        if (cancelled || !res) return;

        const clienteRaw = getNested(res, ["clienteId"]) ?? getNested(res, ["cliente"]) ?? null;
        let cliente =
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

        const clienteId = cliente
          ? cliente.id
          : asString(getNested(res, ["clienteId", "_id"]) ?? getNested(res, ["clienteId"])) ?? undefined;

        // Fallback: cuando el prestamo viene con clienteId string y sin objeto poblado,
        // cargamos el cliente para evitar mostrar "—" en pantallas que dependen de nombre.
        if (!cliente && clienteId) {
          try {
            const clienteRes = await apiFetch<unknown>(`/clientes/id/${encodeURIComponent(clienteId)}`, { silent: true });
            const nombreCompleto =
              asString(getNested(clienteRes, ["nombreCompleto"])) ||
              [asString(getNested(clienteRes, ["nombre"])), asString(getNested(clienteRes, ["apellido"]))]
                .filter(Boolean)
                .join(" ") ||
              "Cliente";

            cliente = {
              id: String(getNested(clienteRes, ["_id"]) ?? getNested(clienteRes, ["id"]) ?? clienteId),
              nombreCompleto,
              identidadCliente:
                asString(getNested(clienteRes, ["identidadCliente"])) ||
                asString(getNested(clienteRes, ["identidad"])) ||
                undefined,
              codigoCliente: asString(getNested(clienteRes, ["codigoCliente"])) ?? undefined,
            };
          } catch {
            // Si falla el enrich, mantenemos el flujo con los datos base del prestamo.
          }
        }

        const detalle: PrestamoDetalle = {
          id: String(getNested(res, ["_id"]) ?? getNested(res, ["id"]) ?? safeId),
          codigoPrestamo: String(getNested(res, ["codigoPrestamo"]) ?? ""),
          solicitudId: asString(getNested(res, ["solicitudId", "_id"]) ?? getNested(res, ["solicitudId"])) ?? undefined,
          solicitudCodigo: asString(
            getNested(res, ["solicitudId", "codigoSolicitud"]) ??
            getNested(res, ["solicitud", "codigoSolicitud"]) ??
            getNested(res, ["codigoSolicitud"])
          ) ?? undefined,
          tipoContratoSolicitud: asString(
            getNested(res, ["tipoContrato"]) ??
            getNested(res, ["contratoTipo"]) ??
            getNested(res, ["solicitudId", "tipoContrato"]) ??
            getNested(res, ["solicitudId", "contratoTipo"]) ??
            getNested(res, ["solicitud", "tipoContrato"]) ??
            getNested(res, ["solicitud", "contratoTipo"])
          ) ?? undefined,
          clienteId,
          tasaInteresId: (() => {
            const raw = getNested(res, ["tasaInteresId"]);
            if (isRecord(raw)) return asString(raw["_id"] ?? raw["id"]) ?? undefined;
            return asString(raw) ?? undefined;
          })(),
          tasaInteresNombre: (() => {
            const raw = getNested(res, ["tasaInteresId"]);
            if (!isRecord(raw)) return undefined;
            return asString(raw["nombre"]) ?? undefined;
          })(),
          tasaInteresAnual: asNumber(getNested(res, ["tasaInteresAnual"])) ?? undefined,
          tasaMoraAnual: asNumber(getNested(res, ["tasaMoraAnual"])) ?? undefined,
          frecuenciaPago: asString(getNested(res, ["frecuenciaPago"])) ?? undefined,
          capitalSolicitado: asNumber(getNested(res, ["capitalSolicitado"])) ?? 0,
          saldoCapital: asNumber(getNested(res, ["saldoCapital"])) ?? undefined,
          cuotaFija: asNumber(getNested(res, ["cuotaFija"])) ?? 0,
          plazoCuotas: asNumber(getNested(res, ["plazoCuotas"])) ?? 0,
          estadoPrestamo: String(getNested(res, ["estadoPrestamo"]) ?? ""),
          fechaDesembolso: asString(getNested(res, ["fechaDesembolso"])) ?? undefined,
          fechaVencimiento: asString(getNested(res, ["fechaVencimiento"])) ?? undefined,
          totalIntereses: asNumber(getNested(res, ["totalIntereses"])) ?? undefined,
          totalPagado: asNumber(getNested(res, ["totalPagado"])) ?? undefined,
          saldo: asNumber(getNested(res, ["saldo"])) ?? asNumber(getNested(res, ["saldoActual"])) ?? asNumber(getNested(res, ["saldoPendiente"])) ?? undefined,
          saldoActual: asNumber(getNested(res, ["saldoActual"])) ?? undefined,
          saldoPendiente: asNumber(getNested(res, ["saldoPendiente"])) ?? undefined,
          observaciones: asString(getNested(res, ["observaciones"])) ?? undefined,
          activo: (getNested(res, ["activo"]) as boolean | undefined) ?? undefined,
          metodoInteresCorriente: asString(getNested(res, ["metodoInteresCorriente"])) ?? undefined,
          configuracionFinancieraId: asString(
            getNested(res, ["configuracionFinancieraId", "_id"]) ?? getNested(res, ["configuracionFinancieraId"])
          ) ?? undefined,
          configuracionFinancieraVersion: asNumber(getNested(res, ["configuracionFinancieraVersion"])) ?? undefined,
          amortizacionPreview: (() => {
            const raw = getNested(res, ["amortizacionPreview"]);
            return Array.isArray(raw) ? raw : undefined;
          })(),
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
