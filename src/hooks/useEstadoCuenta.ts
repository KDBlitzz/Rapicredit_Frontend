"use client";

import { useEffect, useMemo, useState } from "react";
import {
  estadoCuentaApi,
  type EstadoCuentaDetalle,
  type EstadoCuentaSearchItem,
} from "../services/estadoCuentaApi";
import { useEmpleadoActual } from "./useEmpleadoActual";
import { usePrestamosAsignados } from "./usePrestamosAsignados";

export interface UseEstadoCuentaSearchResult {
  data: EstadoCuentaSearchItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useEstadoCuentaSearch(term: string): UseEstadoCuentaSearchResult {
  const [data, setData] = useState<EstadoCuentaSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { empleado } = useEmpleadoActual();
  const rolActual = (empleado?.rol || "").toLowerCase();
  const isAsesor = rolActual === "asesor";

  const { data: asignados } = usePrestamosAsignados({ refreshKey: reloadKey });

  const allowedCodigos = useMemo(() => {
    if (!isAsesor) return null;
    const set = new Set<string>();
    for (const p of asignados) {
      const key = (p.codigoPrestamo || "").trim().toLowerCase();
      if (key) set.add(key);
    }
    return set;
  }, [asignados, isAsesor]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await estadoCuentaApi.buscar(term);
        if (cancelled) return;

        const filtered = !allowedCodigos
          ? result
          : result.filter((x) => allowedCodigos.has((x.codigoPrestamo || "").trim().toLowerCase()));

        setData(filtered);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Error al buscar estado de cuenta";
          setError(message);
          setData([]);
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
  }, [term, reloadKey, allowedCodigos]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}

export interface UseEstadoCuentaDetalleResult {
  data: EstadoCuentaDetalle | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useEstadoCuentaDetalle(prestamoId: string | null | undefined): UseEstadoCuentaDetalleResult {
  const [data, setData] = useState<EstadoCuentaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const id = String(prestamoId || "").trim();
      if (!id) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await estadoCuentaApi.getDetalle(id);
        if (!cancelled) {
          setData(result);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Error al cargar estado de cuenta";
          setError(message);
          setData(null);
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
  }, [prestamoId, reloadKey]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}
