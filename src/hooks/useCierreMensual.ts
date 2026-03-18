'use client';

import { useEffect, useState } from 'react';
import { cierreMensualApi, type CierreMensualData } from '../services/cierreMensualApi';

export type UseCierreMensualOptions = {
  enabled?: boolean;
  refreshKey?: unknown;
};

export function useCierreMensual(
  desde?: string | null,
  hasta?: string | null,
  options: UseCierreMensualOptions = {}
) {
  const enabled = options.enabled ?? true;

  const [data, setData] = useState<CierreMensualData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !desde || !hasta) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cierreMensualApi.get({ desde, hasta });
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar cierre mensual';
          setError(msg);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [desde, hasta, enabled, options.refreshKey]);

  return { data, loading, error };
}
