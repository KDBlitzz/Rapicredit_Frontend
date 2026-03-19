'use client';

import { useEffect, useState } from 'react';
import { cierreMensualApi, type CierreMensualData } from '../services/cierreMensualApi';

export type UseCierreMensualOptions = {
  enabled?: boolean;
  refreshKey?: unknown;
};

export function useCierreMensual(
  anio?: number | null,
  mes?: number | null,
  options: UseCierreMensualOptions = {}
) {
  const enabled = options.enabled ?? true;

  const [data, setData] = useState<CierreMensualData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !anio || !mes) {
      setData(null);
      setLoading(false);
      setError(null);
      setGeneratedAt(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cierreMensualApi.get({ anio, mes });
        if (!cancelled) {
          setData(res);
          setGeneratedAt(new Date());
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar cierre mensual';
          setError(msg);
          setData(null);
          setGeneratedAt(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [anio, mes, enabled, options.refreshKey]);

  return { data, loading, error, generatedAt };
}
