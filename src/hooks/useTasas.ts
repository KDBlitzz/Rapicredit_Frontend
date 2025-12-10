"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface Tasa {
  _id?: string;
  nombre: string;
  tasaAnual: number;
  tasaMora?: number;
  minCapital?: number;
  maxCapital?: number;
  diasGracia?: number;
  solicitudRequerida?: boolean;
  frecuenciaCobro?: "DIARIO" | "SEMANAL" | "QUINCENAL" | "MENSUAL" | string;
  activa?: boolean;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TasaPayload = Omit<Tasa, "_id" | "createdAt" | "updatedAt">;

export function useTasas() {
  const [data, setData] = useState<Tasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Tasa[]>("/tasas");
      setData(res || []);
    } catch (err: any) {
      console.error("Error cargando tasas:", err);
      setError(err.message || "Error al cargar tasas");
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
          body: JSON.stringify(payload),
        });
        await load();
      } catch (err: any) {
        console.error("Error creando tasa:", err);
        setError(err.message || "Error al crear la tasa");
        throw err;
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
        await apiFetch<Tasa>(`/tasas/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        await load();
      } catch (err: any) {
        console.error("Error actualizando tasa:", err);
        setError(err.message || "Error al actualizar la tasa");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const deleteTasa = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);
      try {
        await apiFetch<void>(`/tasas/${id}`, { method: "DELETE" });
        await load();
      } catch (err: any) {
        console.error("Error eliminando tasa:", err);
        setError(err.message || "Error al eliminar la tasa");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return { data, loading, saving, error, reload: load, createTasa, updateTasa, deleteTasa };
}
