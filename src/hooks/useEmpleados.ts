'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export type EstadoEmpleadoFiltro = 'TODOS' | 'ACTIVO' | 'INACTIVO';

export interface Empleado {
  _id: string;
  codigoUsuario?: string;
  usuario?: string;
  nombreCompleto: string;
  rol?: string;
  email?: string;
  telefono?: string;
  estado: boolean;  // 'estado' indica si el empleado está activo o inactivo
  fechaRegistro?: string;
}

export interface EmpleadosFilters {
  busqueda: string;
  estado: EstadoEmpleadoFiltro;
  rol: string;
}

type CodigosResponse = {
  activos: Array<{ codigoUsuario: string; nombreCompleto: string }>;
  inactivos: Array<{ codigoUsuario: string; nombreCompleto: string }>;
};

export function useEmpleados(filters: EmpleadosFilters) {
  const [data, setData] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    const candidates = [
      '/empleados/codigos',
    ];
    let used: CodigosResponse | null = null;
    let lastErr: unknown = null;

    for (const ep of candidates) {
      try {
        const res = await apiFetch<CodigosResponse>(ep);
        used = res;
        break;
      } catch (err: unknown) {
        lastErr = err;
        const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
        // If 404 or "cannot get" try next candidate, otherwise abort
        if (msg.includes('404') || msg.includes('not found') || msg.includes('cannot get')) {
          // try next
          continue;
        }
        // not a not-found error, break and surface
        break;
      }
    }

    try {
      if (!used) throw lastErr ?? new Error('No se obtuvo respuesta de /empleado(s)/codigos');

      const activos = Array.isArray(used?.activos) ? used.activos : [];
      const inactivos = Array.isArray(used?.inactivos) ? used.inactivos : [];

      const mapped: Empleado[] = [
        ...activos.map((a) => ({
          _id: a.codigoUsuario,
          codigoUsuario: a.codigoUsuario,
          nombreCompleto: a.nombreCompleto,
          estado: true,
        })),
        ...inactivos.map((a) => ({
          _id: a.codigoUsuario,
          codigoUsuario: a.codigoUsuario,
          nombreCompleto: a.nombreCompleto,
          estado: false,
        })),
      ];

      setData(mapped);
    } catch (err: unknown) {
      console.error('Error cargando empleados (codigos):', err);
      setData([]);
      const msg = err instanceof Error ? err.message : 'Error cargando empleados';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // filtros en memoria
  let filtrados = [...data];

  // Filtrar por estado (TODOS / ACTIVO / INACTIVO)
  if (filters.estado !== 'TODOS') {
    const expectActivo = filters.estado === 'ACTIVO';
    filtrados = filtrados.filter((e) => e.estado === expectActivo);
  }

  

  if (filters.busqueda.trim()) {
    const q = filters.busqueda.trim().toLowerCase();
    filtrados = filtrados.filter((empleado) => {
      return (
        empleado.codigoUsuario?.toLowerCase().includes(q) ||
        empleado.nombreCompleto.toLowerCase().includes(q) ||
        (empleado.usuario || '').toLowerCase().includes(q) ||
        (empleado.email || '').toLowerCase().includes(q) ||
        (empleado.telefono || '').toLowerCase().includes(q)
      );
    });
  }

  filtrados.sort((a, b) =>
    (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '', 'es'),
  );

  return { data: filtrados, loading, error, refresh: load };
}
