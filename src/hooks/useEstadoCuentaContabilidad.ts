'use client';

import { useEffect, useState } from 'react';
import {
  estadoCuentaContabilidadApi,
  type EstadoCuentaContabilidadData,
} from '../services/estadoCuentaContabilidadApi';

export type UseEstadoCuentaContabilidadOptions = {
  enabled?: boolean;
  refreshKey?: unknown;
};

export function useEstadoCuentaContabilidad(
  anio?: number | null,
  mes?: number | null,
  options: UseEstadoCuentaContabilidadOptions = {}
) {
  const enabled = options.enabled ?? true;

  const [data, setData] = useState<EstadoCuentaContabilidadData | null>(null);
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
        const res = await estadoCuentaContabilidadApi.get({ anio, mes });
        if (!cancelled) {
          setData(res);
          setGeneratedAt(new Date());
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar estado de cuenta';
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
  }, [enabled, anio, mes, options.refreshKey]);

  return { data, loading, error, generatedAt };
}
