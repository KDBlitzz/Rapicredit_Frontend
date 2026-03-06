"use client";

import { useEffect, useRef, useState } from "react";
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

export type EstadoPrestamoFiltro =
  | "TODOS"
  | "VIGENTE"
  | "PENDIENTE"
  | "CERRADO"
  | "RECHAZADO"
  | "MORA";

export interface PrestamoResumen {
  id: string;
  codigoPrestamo: string;
  solicitudId?: string;
  clienteId?: string;
  clienteCodigo?: string;
  clienteNombre: string;
  clienteIdentidad?: string;
  estadoPrestamo: string;
  frecuenciaPago?: string;
  capitalSolicitado: number;
  saldoCapital?: number;
  cuotaFija: number;
  plazoCuotas: number;
  fechaDesembolso?: string;
  fechaVencimiento?: string;
  totalIntereses?: number;
  totalPagado?: number;
  metodoInteresCorriente?: string;
  configuracionFinancieraId?: string;
  configuracionFinancieraVersion?: number;
}

export interface PrestamosFilters {
  busqueda: string;
  estado: EstadoPrestamoFiltro;
}

export interface UsePrestamosOptions {
  /**
   * Cualquier valor que cambie para forzar recarga.
   * Útil cuando se ejecutan acciones (eliminar, registrar pago, etc.).
   */
  refreshKey?: unknown;
}

export function usePrestamos(filters: PrestamosFilters, options: UsePrestamosOptions = {}) {
  const [data, setData] = useState<PrestamoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clienteNombrePorCodigoRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<unknown>("/prestamos");

        if (cancelled) return;

        const resObj = isRecord(res) ? res : null;
        const rawList: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.prestamos)
          ? (resObj?.prestamos as unknown[])
          : Array.isArray(resObj?.data)
          ? (resObj?.data as unknown[])
          : [];

        const mapped: PrestamoResumen[] = rawList.map((p: unknown) => {
          const id = String(getNested(p, ["_id"]) ?? getNested(p, ["id"]) ?? "");
          const codigoPrestamo = String(getNested(p, ["codigoPrestamo"]) ?? "");

          const clienteRaw = getNested(p, ["cliente"]) ?? getNested(p, ["clienteId"]);
          const clienteIdFromField = (() => {
            const direct = getNested(p, ["clienteId"]);
            if (typeof direct === "string") return direct;
            return undefined;
          })();
          const clienteIdFromObj = asString(getNested(clienteRaw, ["_id"])) || asString(getNested(clienteRaw, ["id"]));
          const clienteId = clienteIdFromField || clienteIdFromObj || undefined;

          // Preferir codigoCliente (identificador de negocio) para resolver nombre
          // porque algunas rutas/backend trabajan por codigo y no por ObjectId.
          const clienteCodigoRaw =
            asString(getNested(p, ["clienteCodigo"])) ||
            asString(getNested(p, ["codigoCliente"])) ||
            asString(getNested(clienteRaw, ["codigoCliente"])) ||
            undefined;

          const clienteCodigo = (() => {
            if (clienteCodigoRaw) return clienteCodigoRaw;
            // Si `clienteId` viene como string, a veces es `codigoCliente` (no ObjectId).
            // Heurística: ObjectId Mongo suele ser hex de 24 chars.
            if (clienteIdFromField && !/^[a-f\d]{24}$/i.test(clienteIdFromField)) return clienteIdFromField;
            return undefined;
          })();

          const cachedByCodigo = clienteCodigo ? clienteNombrePorCodigoRef.current[clienteCodigo] : undefined;

          const clienteNombre =
            cachedByCodigo ||
            asString(getNested(p, ["clienteNombre"])) ||
            (() => {
              const nombreCompleto = asString(getNested(clienteRaw, ["nombreCompleto"]));
              const nombre = asString(getNested(clienteRaw, ["nombre"]));
              const apellido = asString(getNested(clienteRaw, ["apellido"]));
              return (
                nombreCompleto ||
                [nombre, apellido].filter(Boolean).join(" ") ||
                "—"
              );
            })();

          const clienteIdentidad =
            asString(getNested(p, ["clienteIdentidad"])) ||
            asString(getNested(clienteRaw, ["identidadCliente"])) ||
            asString(getNested(clienteRaw, ["identidad"])) ||
            undefined;

          const estadoPrestamo = String(getNested(p, ["estadoPrestamo"]) ?? "");

          const capitalSolicitado = asNumber(getNested(p, ["capitalSolicitado"])) ?? 0;
          const cuotaFija = asNumber(getNested(p, ["cuotaFija"])) ?? 0;
          const plazoCuotas = asNumber(getNested(p, ["plazoCuotas"])) ?? 0;
          const frecuenciaPago = asString(getNested(p, ["frecuenciaPago"])) ?? undefined;

          const fechaDesembolso = asString(getNested(p, ["fechaDesembolso"])) ?? undefined;
          const fechaVencimiento = asString(getNested(p, ["fechaVencimiento"])) ?? undefined;

          const solicitudId = asString(getNested(p, ["solicitudId", "_id"]) ?? getNested(p, ["solicitudId"])) ?? undefined;
          const saldoCapital = asNumber(getNested(p, ["saldoCapital"])) ?? undefined;
          const totalIntereses = asNumber(getNested(p, ["totalIntereses"])) ?? undefined;
          const totalPagado = asNumber(getNested(p, ["totalPagado"])) ?? undefined;
          const metodoInteresCorriente = asString(getNested(p, ["metodoInteresCorriente"])) ?? undefined;
          const configuracionFinancieraId = asString(
            getNested(p, ["configuracionFinancieraId", "_id"]) ?? getNested(p, ["configuracionFinancieraId"])
          ) ?? undefined;
          const configuracionFinancieraVersion = asNumber(getNested(p, ["configuracionFinancieraVersion"])) ?? undefined;

          return {
            id,
            codigoPrestamo,
            solicitudId,
            clienteId,
            clienteCodigo,
            clienteNombre,
            clienteIdentidad,
            estadoPrestamo,
            frecuenciaPago,
            capitalSolicitado,
            saldoCapital,
            cuotaFija,
            plazoCuotas,
            fechaDesembolso,
            fechaVencimiento,
            totalIntereses,
            totalPagado,
            metodoInteresCorriente,
            configuracionFinancieraId,
            configuracionFinancieraVersion,
          };
        });

        // Si faltan nombres, resolverlos con UNA consulta a /clientes usando codigoCliente.
        const codigosNecesarios = Array.from(
          new Set(
            mapped
              .filter((p) => !!p.clienteCodigo && (!p.clienteNombre || p.clienteNombre === "—"))
              .map((p) => p.clienteCodigo as string)
              .filter((c) => !clienteNombrePorCodigoRef.current[c])
          )
        );

        if (codigosNecesarios.length > 0) {
          try {
            const clientes = await apiFetch<unknown>("/clientes");
            const list: unknown[] = (() => {
              if (Array.isArray(clientes)) return clientes;
              if (!isRecord(clientes)) return [];
              const data = getNested(clientes, ["data"]);
              if (Array.isArray(data)) return data;
              const clientesInner = getNested(clientes, ["clientes"]);
              if (Array.isArray(clientesInner)) return clientesInner;
              return [];
            })();

            for (const c of list) {
              const codigo = asString(getNested(c, ["codigoCliente"]));
              if (!codigo) continue;
              const nombreCompleto = asString(getNested(c, ["nombreCompleto"]));
              const nombre = asString(getNested(c, ["nombre"]));
              const apellido = asString(getNested(c, ["apellido"]));
              const resolved = nombreCompleto || [nombre, apellido].filter(Boolean).join(" ") || "";
              if (resolved) clienteNombrePorCodigoRef.current[codigo] = resolved;
            }
          } catch {
            // Si no tenemos permisos para /clientes, dejamos "—" sin romper la pantalla.
          }
        }

        const filled = mapped.map((p) => {
          if (p.clienteNombre && p.clienteNombre !== "—") return p;
          if (!p.clienteCodigo) return p;
          const resolved = clienteNombrePorCodigoRef.current[p.clienteCodigo];
          return resolved ? { ...p, clienteNombre: resolved } : p;
        });

        setData(filled);
      } catch (err: unknown) {
        console.error("Error cargando préstamos:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error al cargar préstamos";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filters.busqueda, filters.estado, options.refreshKey]);

  // 🔹 Filtros en memoria
  let filtrados = [...data];

  if (filters.estado !== "TODOS") {
    filtrados = filtrados.filter(
      (p) => (p.estadoPrestamo || "").toUpperCase() === filters.estado
    );
  }

  if (filters.busqueda.trim()) {
    const q = filters.busqueda.trim().toLowerCase();
    filtrados = filtrados.filter((p) => {
      return (
        p.codigoPrestamo.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        (p.clienteIdentidad || "").toLowerCase().includes(q)
      );
    });
  }

  // Orden por fecha de desembolso (más recientes primero si viene fecha)
  filtrados.sort((a, b) => {
    const da = a.fechaDesembolso ? new Date(a.fechaDesembolso).getTime() : 0;
    const db = b.fechaDesembolso ? new Date(b.fechaDesembolso).getTime() : 0;
    return db - da;
  });

  return { data: filtrados, loading, error };
}
