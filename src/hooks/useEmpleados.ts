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

type UsersResponse = {
  ok: boolean;
  total: number;
  users: Empleado[];
};

export function useEmpleados(filters: EmpleadosFilters) {
  const [data, setData] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<UsersResponse>('/empleados/codigos');
        const lista = Array.isArray(res?.users) ? res.users : [];

        if (!cancelled) setData(lista);
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('Error cargando empleados:', err);
          setData([]);
          const msg = err instanceof Error ? err.message : 'Error cargando empleados';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // filtros en memoria
  let filtrados = [...data];

  

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

  return { data: filtrados, loading, error };
}
