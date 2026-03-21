'use client';

import { useEffect, useState } from 'react';
import {
  indicadoresFinancierosApi,
  type IndicadoresFinancierosData,
} from '../services/indicadoresFinancierosApi';

export type UseIndicadoresFinancierosOptions = {
  enabled?: boolean;
  refreshKey?: unknown;
};

export function useIndicadoresFinancieros(
  fechaCorte?: string | null,
  options: UseIndicadoresFinancierosOptions = {}
) {
  const enabled = options.enabled ?? true;

  const [data, setData] = useState<IndicadoresFinancierosData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !fechaCorte) {
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
        const res = await indicadoresFinancierosApi.get({ fechaCorte });
        if (!cancelled) {
          setData(res);
          setGeneratedAt(new Date());
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar indicadores financieros';
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
  }, [fechaCorte, enabled, options.refreshKey]);

  return { data, loading, error, generatedAt };
}
