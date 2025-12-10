"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface ClienteResumen {
  _id: string;
  codigoCliente: string;
  nombreCompleto: string;
  identidadCliente: string;
  telefono?: string;
  estado?: string;
  prestamosActivos?: number;
  saldoPendiente?: number;
}

export function useClientesResumen() {
  const [data, setData] = useState<ClienteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch<ClienteResumen[]>("/clientes");
        if (!cancelled) setData(res || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Error al cargar clientes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
