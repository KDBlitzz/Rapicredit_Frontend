"use client";

import { useEffect, useState } from "react";
import {
  impresionCarterasApi,
  type CarteraResumenData,
  type CarteraResumenParams,
} from "../services/impresionCarterasApi";

export function useImpresionCarteras(params: CarteraResumenParams) {
  const { desde, hasta, q, asesorId, estado } = params;
  const [data, setData] = useState<CarteraResumenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await impresionCarterasApi.getResumen({ desde, hasta, q, asesorId, estado });
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al cargar impresion de carteras";
        if (!cancelled) {
          setError(message);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [desde, hasta, q, asesorId, estado, reloadKey]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}
