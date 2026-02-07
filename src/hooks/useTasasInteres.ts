"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface TasaInteres {
  _id: string;
  codigoTasa?: string;
  nombre: string;
  porcentajeInteres?: number;
}

export function useTasasInteres() {
  const [data, setData] = useState<TasaInteres[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Ajusta el endpoint según tu backend
          const res = await apiFetch<TasaInteres[]>("/tasas");
        if (!cancelled) setData(res || []);
      } catch (err: unknown) {
        console.error("Error cargando tasas de interés:", err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Error al cargar tasas de interés";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...data].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
  return { data: sorted, loading, error };
}
