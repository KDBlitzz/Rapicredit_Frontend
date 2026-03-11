"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface TrazabilidadDecisionItem {
  id: string;
  tipoEntidad?: string | null; // e.g. SOLICITUD, PRESTAMO
  codigoEntidad?: string | null; // codigoSolicitud, codigoPrestamo, etc.
  entidadId?: string | null;
  accion: string; // APROBADA, RECHAZADA, etc.
  aprobadoPor: string; // usuario que realizó la acción
  fecha: string; // ISO date-time string
  comentario?: string | null;
}

export interface UseTrazabilidadDecisionesOptions {
  fechaInicio?: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD
}

export function useTrazabilidadDecisiones(options: UseTrazabilidadDecisionesOptions) {
  const { fechaInicio, fechaFin } = options;

  const [data, setData] = useState<TrazabilidadDecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const asRecord = (v: unknown): Record<string, unknown> | null =>
      v && typeof v === "object" ? (v as Record<string, unknown>) : null;

    const asString = (v: unknown): string | undefined => {
      if (typeof v === "string") {
        const s = v.trim();
        return s ? s : undefined;
      }
      if (v == null) return undefined;
      const s = String(v).trim();
      return s ? s : undefined;
    };

    const normalizeAccion = (raw: Record<string, unknown>): string => {
      const base = asString(raw["accion"] ?? raw["decision"] ?? raw["estado"] ?? raw["estadoDecision"] ?? "") || "";
      const upper = base.toUpperCase();

      if (upper !== "EN_REVISION") return upper || "-";

      const preEstado = asString(raw["preEstado"] ?? raw["preDecision"] ?? raw["estadoPreaprobacion"] ?? "");
      if (preEstado) {
        const preUpper = preEstado.toUpperCase();
        if (preUpper === "PRE_APROBADO" || preUpper === "PRE_RECHAZADO") {
          return preUpper;
        }
      }

      const comentario = asString(raw["comentario"] ?? raw["observacion"] ?? "") || "";
      if (/rechaz|denegad|negad/i.test(comentario)) return "PRE_RECHAZADO";
      return "PRE_APROBADO";
    };

    const resolveActorName = (raw: Record<string, unknown>): string => {
      const actorObj = asRecord(raw["aprobadoPor"] ?? raw["usuario"] ?? raw["supervisor"] ?? raw["empleado"] ?? raw["registradoPor"]);
      const fromActorObj = asString(
        actorObj?.["nombreCompleto"] ??
          actorObj?.["usuario"] ??
          actorObj?.["nombre"] ??
          actorObj?.["codigoUsuario"]
      );

      const direct = asString(
        raw["aprobadoPorNombre"] ??
          raw["usuarioNombre"] ??
          raw["nombreSupervisor"] ??
          raw["nombreEmpleado"] ??
          raw["aprobadoPor"] ??
          raw["usuario"] ??
          raw["supervisor"] ??
          raw["empleado"]
      );

      return fromActorObj || direct || "-";
    };

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);

        const query = params.toString();
        const path = query
          ? `/reportes/trazabilidad-decisiones?${query}`
          : "/reportes/trazabilidad-decisiones";

        const res = await apiFetch<unknown>(path);

        let lista: unknown[] = [];
        if (Array.isArray(res)) {
          lista = res;
        } else if (res && typeof res === "object") {
          const maybe = res as Record<string, unknown>;
          if (Array.isArray(maybe.items)) lista = maybe.items;
          else if (Array.isArray(maybe.data)) lista = maybe.data;
        }

        const mapped: TrazabilidadDecisionItem[] = lista.map((item, idx: number) => {
          const raw = asRecord(item) || {};
          return {
            id: String(raw.id ?? raw._id ?? idx),
            tipoEntidad: asString(raw.tipoEntidad ?? raw.entidadTipo) ?? null,
            codigoEntidad: asString(raw.codigoEntidad ?? raw.codigo) ?? null,
            entidadId: asString(raw.entidadId ?? raw.solicitudId ?? raw.prestamoId) ?? null,
            accion: normalizeAccion(raw),
            aprobadoPor: resolveActorName(raw),
            fecha: String(raw.fecha ?? raw.fechaDecision ?? new Date().toISOString()),
            comentario: asString(raw.comentario ?? raw.observacion) ?? null,
          };
        });

        if (!cancelled) {
          setData(mapped);
        }
      } catch (err: unknown) {
        console.error("Error cargando trazabilidad de decisiones:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar trazabilidad de decisiones");
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
  }, [fechaInicio, fechaFin]);

  return { data, loading, error };
}
