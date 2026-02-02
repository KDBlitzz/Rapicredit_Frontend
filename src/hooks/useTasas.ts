"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface Tasa {
  _id?: string;
  codigo?: string;
  nombre: string;
  tasaAnual: number;
  tasaMora?: number;
  minCapital?: number;
  maxCapital?: number;
  diasGracia?: number;
  solicitudRequerida?: boolean;
  frecuenciaCobro?: "DIARIO" | "SEMANAL" | "QUINCENAL" | "MENSUAL" | string;
  activa?: boolean;
  estado?: boolean;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TasaPayload = Omit<Tasa, "_id" | "createdAt" | "updatedAt">;

// Tipos y mappers entre backend y frontend
type BackendTasa = {
  _id?: string;
  codigo?: string;
  codigoTasa?: string;
  nombre?: string;
  porcentajeInteres?: number;
  porcentajeMora?: number;
  capitalMinimo?: number;
  capitalMaximo?: number;
  capitalMin?: number;
  capitalMax?: number;
  diasGracia?: number;
  solicitudRequerida?: boolean;
  requiereSolicitud?: boolean;
  frecuenciaCobro?: string;
  activa?: boolean;
  estado?: boolean;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
  // posibles aliases del backend
  tasaAnual?: number;
  tasaMora?: number;
  minCapital?: number;
  maxCapital?: number;
  notas?: string;
};

const fromBackend = (item: BackendTasa): Tasa => ({
  _id: item?._id,
  codigo: item?.codigo ?? item?.codigoTasa,
  nombre: item?.nombre ?? "",
  tasaAnual: Number(item?.porcentajeInteres ?? item?.tasaAnual ?? 0),
    tasaMora: item?.porcentajeMora ?? item?.tasaMora,
    minCapital: item?.capitalMin ?? item?.minCapital,
    maxCapital: item?.capitalMax ?? item?.maxCapital,
    diasGracia: undefined,
    solicitudRequerida: item?.requiereSolicitud ?? item?.solicitudRequerida,
  frecuenciaCobro: item?.frecuenciaCobro,
  activa: item?.activa,
  estado: item?.estado ?? item?.activa,
  vigenciaDesde: item?.vigenciaDesde,
  vigenciaHasta: item?.vigenciaHasta,
  notas: item?.descripcion ?? item?.notas,
  createdAt: item?.createdAt,
  updatedAt: item?.updatedAt,
});

const toBackend = (payload: TasaPayload): Record<string, unknown> => {
  const out: Record<string, unknown> = {
    nombre: payload.nombre,
    descripcion: payload.notas,
    porcentajeInteres: payload.tasaAnual,
    porcentajeMora: payload.tasaMora,
    capitalMin: payload.minCapital,
    capitalMax: payload.maxCapital,
    requiereSolicitud: payload.solicitudRequerida,
    // No enviar campos no definidos en el esquema para evitar rechazos
  };
  // Quitar claves undefined para evitar rechazos del backend
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined) delete out[k];
  });
  return out;
};

export function useTasas() {
  const [data, setData] = useState<Tasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BackendTasa[]>("/tasas");
      const items = Array.isArray(res) ? res : [];
      setData(items.map(fromBackend));
    } catch (err: unknown) {
      console.error("Error cargando tasas:", err);
      const message = err instanceof Error ? err.message : "Error al cargar tasas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTasa = useCallback(
    async (payload: TasaPayload) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<Tasa>("/tasas", {
          method: "POST",
          body: JSON.stringify(toBackend(payload)),
        });
        await load();
      } catch (err: unknown) {
        console.error("Error creando tasa:", err);
        const message = err instanceof Error ? err.message : "Error al crear la tasa";
        setError(message);
        throw err as Error;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const updateTasa = useCallback(
    async (id: string, payload: TasaPayload) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<Tasa>(`/tasas/id/${id}`, {
          method: "PUT",
          body: JSON.stringify(toBackend(payload)),
        });
        await load();
      } catch (err: unknown) {
        console.error("Error actualizando tasa:", err);
        const message = err instanceof Error ? err.message : "Error al actualizar la tasa";
        setError(message);
        throw err as Error;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const deleteTasa = useCallback(
    async (codigo: string) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<void>(`/tasas/codigo/${codigo}`, { method: "DELETE" });
        await load();
      } catch (err: unknown) {
        console.error("Error eliminando tasa:", err);
        const message = err instanceof Error ? err.message : "Error al eliminar la tasa";
        setError(message);
        throw err as Error;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const setEstadoTasa = useCallback(
    async (codigo: string, activa: boolean) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<void>(`/tasas/codigo/${codigo}/estado`, {
          method: "PATCH",
          body: JSON.stringify({ estado: !!activa }),
        });
        await load();
      } catch (err: unknown) {
        console.error("Error cambiando estado de tasa:", err);
        const message = err instanceof Error ? err.message : "Error al cambiar estado de la tasa";
        setError(message);
        throw err as Error;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return { data, loading, saving, error, reload: load, createTasa, updateTasa, deleteTasa, setEstadoTasa };
}
