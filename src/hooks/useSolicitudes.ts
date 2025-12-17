'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export type EstadoSolicitudFiltro = 'TODAS' | 'REGISTRADA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudResumen {
  id: string;
  codigoSolicitud: string;
  fechaSolicitud?: string;
  clienteNombre: string;
  clienteIdentidad?: string;
  capitalSolicitado: number;
  estadoSolicitud: string;
  cobradorNombre?: string;
  cuotaEstablecida?: number;
}

export interface SolicitudesFilters {
  busqueda: string;
  estado: EstadoSolicitudFiltro;
}

type SolicitudesResponse = {
  ok: boolean;
  total: number;
  solicitudes: SolicitudResumen[];
};

export function useSolicitudes(filters: SolicitudesFilters) {
  const [data, setData] = useState<SolicitudResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Construir la URL dinámica para la API, usando los filtros de búsqueda y estado
        const { busqueda, estado } = filters;
        const path = `/solicitudes/`;

        // Hacer la solicitud usando la función apiFetch
        const res = await apiFetch<SolicitudesResponse>(path);

        if (!cancelled) {
          setData(res.solicitudes || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error cargando solicitudes:', err);
          setData([]);
          setError(err?.message ?? 'Error cargando solicitudes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filters]); // Dependemos de los filtros para recargar los datos

  // Filtrado en memoria de los datos ya cargados
  const filteredData = data.filter((s) => {
    const q = filters.busqueda.toLowerCase();
    
    // Filtrar por búsqueda
    const matchBusqueda =
      q
        ? s.codigoSolicitud.toLowerCase().includes(q) ||
          s.clienteNombre.toLowerCase().includes(q) ||
          (s.clienteIdentidad || '').toLowerCase().includes(q)
        : true;

    // Filtrar por estado
    const matchEstado = filters.estado === 'TODAS' || s.estadoSolicitud.toUpperCase() === filters.estado;

    return matchBusqueda && matchEstado;
  });

  return { data: filteredData, loading, error };
}
