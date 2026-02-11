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
          const maybe: any = res;
          if (Array.isArray(maybe.items)) lista = maybe.items;
          else if (Array.isArray(maybe.data)) lista = maybe.data;
        }

        const mapped: TrazabilidadDecisionItem[] = lista.map((raw: any, idx: number) => ({
          id: String(raw.id ?? raw._id ?? idx),
          tipoEntidad: raw.tipoEntidad ?? raw.entidadTipo ?? null,
          codigoEntidad: raw.codigoEntidad ?? raw.codigo ?? null,
          entidadId: raw.entidadId ?? raw.solicitudId ?? raw.prestamoId ?? null,
          accion: String(raw.accion ?? raw.decision ?? ""),
          aprobadoPor: String(raw.aprobadoPor ?? raw.usuario ?? ""),
          fecha: String(raw.fecha ?? raw.fechaDecision ?? new Date().toISOString()),
          comentario: raw.comentario ?? null,
        }));

        if (!cancelled) {
          setData(mapped);
        }
      } catch (err: any) {
        console.error("Error cargando trazabilidad de decisiones:", err);
        if (!cancelled) {
          setError(err.message || "Error al cargar trazabilidad de decisiones");
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
