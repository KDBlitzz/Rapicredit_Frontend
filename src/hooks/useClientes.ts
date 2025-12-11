
// src/hooks/useClientes.ts
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type EstadoClienteFiltro = "TODOS" | "ACTIVO" | "INACTIVO";

export interface ClienteResumen {
  id: string;
  codigoCliente: string;
  nombreCompleto: string;
  identidadCliente?: string | null;
  telefonoPrincipal?: string | null;
  departamentoResidencia?: string | null;
  municipioResidencia?: string | null;
  actividad: boolean; // viene directo del backend
}

interface UseClientesOptions {
  busqueda: string;
  estado: EstadoClienteFiltro;
}

export function useClientes({ busqueda, estado }: UseClientesOptions) {
  const [data, setData] = useState<ClienteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<ClienteResumen[]>("/clientes");
        if (!cancelled) {
          setData(result);
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setError(e.message || "Error cargando clientes");
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

  // Aplicar filtros en memoria
  let filtrados = [...data];

  if (estado !== "TODOS") {
    const isActivo = estado === "ACTIVO";
    filtrados = filtrados.filter((c) => c.actividad === isActivo);
  }

  if (busqueda.trim()) {
    const q = busqueda.trim().toLowerCase();
    filtrados = filtrados.filter(
      (c) =>
        (c.codigoCliente || "").toLowerCase().includes(q) ||
        (c.nombreCompleto || "").toLowerCase().includes(q) ||
        (c.identidadCliente || "").toLowerCase().includes(q)
    );
  }

  filtrados.sort((a, b) =>
    (a.nombreCompleto || "").localeCompare(b.nombreCompleto || "", "es")
  );

  return {
    data: filtrados,
    loading,
    error,
  };
}



/*// src/hooks/useClientes.ts
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export type EstadoClienteFiltro = 'TODOS' | 'ACTIVO' | 'INACTIVO';

export interface ClienteResumen {
  id: string;
  codigoCliente: string;
  nombreCompleto: string;
  identidadCliente?: string;
  telefonoPrincipal?: string;
  departamentoResidencia?: string;
  municipioResidencia?: string;
  zonaResidencialCliente?: string;
  actividad: boolean;
}

export interface ClientesFilters {
  busqueda: string;
  estado: EstadoClienteFiltro;
}

export function useClientes(filters: ClientesFilters) {
  const [data, setData] = useState<ClienteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<any[]>('/clientes'); // GET /api/clientes

        if (cancelled) return;

        const mapped: ClienteResumen[] = (res || []).map((c: any) => {
          const nombreCompleto =
            c.nombreCompleto ||
            [c.nombre, c.apellido].filter(Boolean).join(' ') ||
            'Cliente';

          const telefonos: string[] = Array.isArray(c.telefono)
            ? c.telefono
            : c.telefono
            ? [c.telefono]
            : [];

          return {
            id: String(c._id ?? c.id ?? ''),
            codigoCliente: c.codigoCliente ?? '',
            nombreCompleto,
            identidadCliente: c.identidadCliente ?? c.identidad ?? undefined,
            telefonoPrincipal: telefonos[0],
            departamentoResidencia: c.departamentoResidencia ?? undefined,
            municipioResidencia: c.municipioResidencia ?? undefined,
            zonaResidencialCliente: c.zonaResidencialCliente ?? undefined,
            actividad: c.actividad ?? true,
          };
        });

        setData(mapped);
      } catch (err: any) {
        console.error('Error cargando clientes:', err);
        if (!cancelled) {
          setError(err.message || 'Error al cargar clientes');
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

  if (filters.estado !== 'TODOS') {
    const isActivo = filters.estado === 'ACTIVO';
    filtrados = filtrados.filter((c) => c.actividad === isActivo);
  }

  if (filters.busqueda.trim()) {
    const q = filters.busqueda.trim().toLowerCase();
    filtrados = filtrados.filter((c) => {
      return (
        c.codigoCliente.toLowerCase().includes(q) ||
        c.nombreCompleto.toLowerCase().includes(q) ||
        (c.identidadCliente || '').toLowerCase().includes(q)
      );
    });
  }

  filtrados.sort((a, b) =>
    (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '', 'es'),
  );

  return { data: filtrados, loading, error };
}
*/
