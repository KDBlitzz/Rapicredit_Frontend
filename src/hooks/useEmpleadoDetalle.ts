"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Empleado } from "./useEmpleados";

export function useEmpleadoDetalle(id: string) {
  const [data, setData] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || id === "nuevo") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<Empleado>(`/empleados/${id}`);
        if (!cancelled) {
          setData(res);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando empleado:", err);
          setError(err.message || "Error al cargar empleado");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}
