'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

// Shape EXACTO que devuelve tu dashboardService
export interface DashboardCliente {
  id?: string;
  codigoCliente?: string;
  identidadCliente?: string;
}

export interface DashboardPrestamoReciente {
  id?: string;
  codigo?: string;
  cliente: DashboardCliente | null;
  monto?: number;
  saldo?: number | null;
  estado?: string;
  fechaDesembolso?: string;
  fechaVencimiento?: string;
}

export interface DashboardPagoHoy {
  id?: string;
  codigoFinanciamiento?: string | null;
  monto?: number;
  fechaAbono?: string;
  cliente: DashboardCliente | null;
}

export interface DashboardResumen {
  prestamosActivos: number;
  prestamosEnMora: number;
  prestamosPagados: number;
  montoTotalColocado: number;
  vencenEn7Dias: number;
  distribucionEstados: {
    [estado: string]: number;
  };
  prestamosRecientes: DashboardPrestamoReciente[];
  pagosHoy: DashboardPagoHoy[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<DashboardResumen>('/dashboard/resumen');
        if (!cancelled) {
          setData(res);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error cargando dashboard:', err);
          setError(err.message || 'Error al cargar dashboard');
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
  }, []);

  return { data, loading, error };
}
