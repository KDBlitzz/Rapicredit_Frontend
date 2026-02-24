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
  cantidadPrestamosNuevosMes?: number;
  prestamosNuevosMes?: number;
  distribucionEstados: {
    [estado: string]: number;
  };
  prestamosRecientes: DashboardPrestamoReciente[];
  pagosHoy: DashboardPagoHoy[];
}

function normalizeDashboardResumen(raw: unknown): DashboardResumen {
  const asRecord = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === 'object' ? (v as Record<string, unknown>) : null;

  const root = asRecord(raw);
  const payload = asRecord(root?.['response']) ?? asRecord(root?.['data']) ?? asRecord(root?.['resumen']) ?? root ?? {};

  const toNumber = (v: unknown, fallback = 0): number => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return fallback;
  };

  const toArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const vencenRaw = payload['vencenEn7Dias'];
  const vencenEn7Dias = Array.isArray(vencenRaw) ? vencenRaw.length : toNumber(vencenRaw);

  return {
    prestamosActivos: toNumber(payload['prestamosActivos']),
    prestamosEnMora: toNumber(payload['prestamosEnMora']),
    prestamosPagados: toNumber(payload['prestamosPagados']),
    montoTotalColocado: toNumber(payload['montoTotalColocado']),
    vencenEn7Dias,
    cantidadPrestamosNuevosMes: toNumber(payload['cantidadPrestamosNuevosMes'], 0),
    prestamosNuevosMes: toNumber(payload['prestamosNuevosMes'], 0),
    distribucionEstados: (payload['distribucionEstados'] && typeof payload['distribucionEstados'] === 'object')
      ? (payload['distribucionEstados'] as Record<string, number>)
      : {},
    prestamosRecientes: toArray(payload['prestamosRecientes']) as DashboardPrestamoReciente[],
    pagosHoy: toArray(payload['pagosHoy']).map((p) => {
      const o = (p && typeof p === 'object') ? (p as any) : {};
      return {
        ...o,
        monto: o.monto ?? o.montoPago,
        fechaAbono: o.fechaAbono ?? o.fechaPago,
      };
    }) as DashboardPagoHoy[],
  };
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
        const candidates = ["/dashboard/resumen", "/dashboards/resumen", "/resumen"];
        let res: DashboardResumen | null = null;
        let lastErr: unknown = null;

        for (const path of candidates) {
          try {
            res = await apiFetch<DashboardResumen>(path, { silent: true });
            break;
          } catch (e: unknown) {
            lastErr = e;
            const msg = e instanceof Error ? e.message : String(e);
            if (/\b404\b/i.test(msg) || /not\s*found/i.test(msg) || /cannot\s+get/i.test(msg)) {
              continue;
            }
            throw e;
          }
        }

        if (!res) {
          throw (lastErr instanceof Error ? lastErr : new Error('No se pudo cargar dashboard'));
        }
        if (!cancelled) {
          setData(normalizeDashboardResumen(res));
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
