'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { estadoFinancieraApi, EstadoFinancieraResponse } from '../services/estadoFinancieraApi';

export type UseEstadoFinancieraResult = {
  data: EstadoFinancieraResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useEstadoFinanciera(anio?: number | null, mes?: number | null): UseEstadoFinancieraResult {
  const [data, setData] = useState<EstadoFinancieraResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const canFetch = useMemo(() => {
    if (anio == null || mes == null) return false;
    if (!Number.isInteger(anio) || anio < 2000 || anio > 3000) return false;
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) return false;
    return true;
  }, [anio, mes]);

  const refetch = useCallback(() => setRefreshKey(Date.now()), []);

  useEffect(() => {
    let cancelled = false;

    if (!canFetch) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    estadoFinancieraApi
      .get({ anio: anio as number, mes: mes as number })
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Error desconocido');
        setData(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [anio, mes, canFetch, refreshKey]);

  return { data, loading, error, refetch };
}
