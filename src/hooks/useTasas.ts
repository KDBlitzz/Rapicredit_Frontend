"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface Tasa {
  _id?: string;
  codigoTasa: string;
  nombre: string;
  descripcion?: string;
  porcentajeInteres: number;
  porcentajeMora?: number;
  capitalMin?: number;
  capitalMax?: number;
  requiereSolicitud?: boolean;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateTasaPayload = Omit<Tasa, "_id" | "createdAt" | "updatedAt">;
export type UpdateTasaPayload = Omit<CreateTasaPayload, "codigoTasa">;

// Tipos y mappers entre backend y frontend
type BackendTasa = {
  _id?: string;
  codigo?: string;
  codigoTasa?: string;
  nombre?: string;
  descripcion?: string;
  porcentajeInteres?: number;
  porcentajeMora?: number;
  capitalMin?: number;
  capitalMax?: number;
  requiereSolicitud?: boolean;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const fromBackend = (item: BackendTasa): Tasa => ({
  _id: item?._id,
  codigoTasa: item?.codigoTasa ?? item?.codigo ?? "",
  nombre: item?.nombre ?? "",
  descripcion: item?.descripcion ?? "",
  porcentajeInteres: Number(item?.porcentajeInteres ?? 0),
  porcentajeMora: item?.porcentajeMora,
  capitalMin: item?.capitalMin,
  capitalMax: item?.capitalMax,
  requiereSolicitud: item?.requiereSolicitud,
  activa: item?.activa,
  createdAt: item?.createdAt,
  updatedAt: item?.updatedAt,
});

const compactUndefined = (obj: Record<string, unknown>) => {
  Object.keys(obj).forEach((k) => {
    if (obj[k] === undefined) delete obj[k];
  });
  return obj;
};

const toBackendCreate = (payload: CreateTasaPayload): Record<string, unknown> =>
  compactUndefined({
    codigoTasa: payload.codigoTasa,
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    porcentajeInteres: payload.porcentajeInteres,
    porcentajeMora: payload.porcentajeMora,
    capitalMin: payload.capitalMin,
    capitalMax: payload.capitalMax,
    requiereSolicitud: payload.requiereSolicitud,
    activa: payload.activa,
  });

const toBackendUpdate = (payload: UpdateTasaPayload): Record<string, unknown> =>
  compactUndefined({
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    porcentajeInteres: payload.porcentajeInteres,
    porcentajeMora: payload.porcentajeMora,
    capitalMin: payload.capitalMin,
    capitalMax: payload.capitalMax,
    requiereSolicitud: payload.requiereSolicitud,
    activa: payload.activa,
  });

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
    async (payload: CreateTasaPayload) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<Tasa>("/tasas", {
          method: "POST",
          body: JSON.stringify(toBackendCreate(payload)),
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
    async (id: string, payload: UpdateTasaPayload) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<Tasa>(`/tasas/id/${id}`, {
          method: "PUT",
          body: JSON.stringify(toBackendUpdate(payload)),
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

  const updateTasaByCodigo = useCallback(
    async (codigoTasa: string, payload: UpdateTasaPayload) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<Tasa>(`/tasas/codigo/${encodeURIComponent(codigoTasa)}`, {
          method: "PUT",
          body: JSON.stringify(toBackendUpdate(payload)),
        });
        await load();
      } catch (err: unknown) {
        console.error("Error actualizando tasa por código:", err);
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
    async (codigoTasa: string) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<void>(`/tasas/codigo/${encodeURIComponent(codigoTasa)}`, { method: "DELETE" });
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

  const toggleActiveByCodigo = useCallback(
    async (codigoTasa: string) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<void>(`/tasas/toggle/${encodeURIComponent(codigoTasa)}`, { method: "PUT" });
        await load();
      } catch (err: unknown) {
        console.error("Error alternando estado de tasa:", err);
        const message = err instanceof Error ? err.message : "Error al cambiar el estado de la tasa";
        setError(message);
        throw err as Error;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return {
    data,
    loading,
    saving,
    error,
    reload: load,
    createTasa,
    updateTasa,
    updateTasaByCodigo,
    deleteTasa,
    toggleActiveByCodigo,
  };
}
