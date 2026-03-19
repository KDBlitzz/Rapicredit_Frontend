'use client';

import React from 'react';
import { Alert, CircularProgress, Typography } from '@mui/material';

import { getMyToken } from '../lib/firebaseAuth';
import { fetchCierreMensual, FetchCierreMensualError } from '../services/cierreMensualApi';

type Props = {
  anio: number;
  mes: number;
};

export function CantidadPrestamosCerradosKpiExample({ anio, mes }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cantidad, setCantidad] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const token = await getMyToken();
        const value = await fetchCierreMensual(anio, mes, token ?? '');
        if (!cancelled) setCantidad(value);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof FetchCierreMensualError && err.status === 401) {
          setError('No autorizado: token ausente o expirado');
          return;
        }

        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [anio, mes]);

  if (loading) return <CircularProgress size={20} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Typography variant="body2">
      {cantidad === null ? '—' : cantidad.toLocaleString('es-CO')}
    </Typography>
  );
}
