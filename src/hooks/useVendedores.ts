"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface Vendedor {
  _id: string;
  nombreCompleto: string;
  correo?: string;
}

export function useVendedores() {
  const [data, setData] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Ajusta el endpoint según tu backend: /vendedores o /usuarios?rol=VENDEDOR
        const res = await apiFetch<Vendedor[]>("/users/");
        if (!cancelled) setData(res || []);
      } catch (err: unknown) {
        console.error("Error cargando vendedores:", err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Error al cargar vendedores";
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

  // Orden alfabético simple
  const sorted = [...data].sort((a, b) =>
    (a.nombreCompleto || "").localeCompare(b.nombreCompleto || "", "es")
  );

  return { data: sorted, loading, error };
}
