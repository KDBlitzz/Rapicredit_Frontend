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
        const res = await apiFetch<any>(`/solicitudes/`);

        // Normalizar respuesta: puede ser array o { solicitudes: [...] }
        const rawList: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.solicitudes)
          ? res.solicitudes
          : Array.isArray(res?.data)
          ? res.data
          : [];

        // ✅ Helpers para obtener SIEMPRE el mismo id (evita mismatch y "Cliente")
        const getClienteId = (a: any) =>
          String(a?.clienteId?._id ?? a?.clienteId ?? a?.cliente?._id ?? a?.cliente?.id ?? '').trim();

        const getVendedorId = (a: any) =>
          String(
            a?.vendedorId?._id ??
              a?.vendedorId ??
              a?.cobradorId?._id ??
              a?.cobradorId ??
              a?.vendedor?._id ??
              a?.cobrador?._id ??
              ''
          ).trim();

        // Recolectar IDs para enriquecer nombres
        const clienteIds = new Set<string>();
        const vendedorIds = new Set<string>();

        rawList.forEach((a: any) => {
          const cid = getClienteId(a);
          const vid = getVendedorId(a);
          if (cid) clienteIds.add(cid);
          if (vid) vendedorIds.add(vid);
        });

        // (Opcional) útil para debug
        // console.log('clienteIds =>', Array.from(clienteIds));
        // console.log('vendedorIds =>', Array.from(vendedorIds));

        const clienteNames: Record<string, string> = {};
        const empleadoNames: Record<string, string> = {};

        // Fetch nombres de clientes
        await Promise.all(
          Array.from(clienteIds).map(async (cid) => {
            try {
              const c = await apiFetch<any>(`/clientes/id/${cid}`);
              const nombre =
                c?.nombreCompleto ||
                [c?.nombre, c?.apellido].filter(Boolean).join(' ') ||
                c?.razonSocial ||
                'Cliente';
              clienteNames[cid] = String(nombre);
            } catch (err) {
              // ✅ No ocultar errores (si falla, nunca se llenan los nombres)
              console.error('Fallo /clientes/id:', cid, err);
            }
          })
        );

        // Fetch nombres de empleados (cobradores/vendedores)
        await Promise.all(
          Array.from(vendedorIds).map(async (vid) => {
            try {
              const e = await apiFetch<any>(`/empleados/id/${vid}`);
              const nombre =
                e?.nombreCompleto ||
                [e?.nombre, e?.apellido].filter(Boolean).join(' ') ||
                e?.usuario ||
                e?.codigoUsuario ||
                'Empleado';
              empleadoNames[vid] = String(nombre);
            } catch (err) {
              console.error('Fallo /empleados/id:', vid, err);
            }
          })
        );

        const mapped: SolicitudResumen[] = (rawList || []).map((a: any) => {
          const id = String(a._id ?? a.id ?? '');
          const codigoSolicitud = String(a.codigoSolicitud ?? a.codigo ?? '');

          const fechaSolicitud = (() => {
            const f = a.fechaSolicitud ?? a.fecha ?? null;
            if (!f) return undefined;
            try {
              return typeof f === 'string' ? f : new Date(f).toISOString();
            } catch {
              return undefined;
            }
          })();

          // ✅ IMPORTANTE: usar los mismos helpers aquí también
          const cid = getClienteId(a);
          const vid = getVendedorId(a);

          const clienteNombre =
            clienteNames[cid] ??
            a.clienteNombre ??
            (a.cliente?.nombreCompleto || [a.cliente?.nombre, a.cliente?.apellido].filter(Boolean).join(' ')) ??
            'Cliente';

          const clienteIdentidad =
            a.clienteIdentidad ??
            a.cliente?.identidadCliente ??
            a.cliente?.identidad ??
            undefined;

          const capitalSolicitado = Number(a.capitalSolicitado ?? a.capital ?? 0);

          const estadoSolicitud = String(a.estadoSolicitud ?? a.estado ?? 'REGISTRADA');

          const cobradorNombre =
            empleadoNames[vid] ??
            a.cobradorNombre ??
            a.vendedor?.nombreCompleto ??
            a.cobrador?.nombreCompleto ??
            undefined;

          const cuotaEstablecida =
            a.cuotaEstablecida != null
              ? Number(a.cuotaEstablecida)
              : a.cuota != null
              ? Number(a.cuota)
              : undefined;

          return {
            id,
            codigoSolicitud,
            fechaSolicitud,
            clienteNombre,
            clienteIdentidad,
            capitalSolicitado,
            estadoSolicitud,
            cobradorNombre,
            cuotaEstablecida,
          };
        });

        if (!cancelled) setData(mapped);
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
  }, [filters.busqueda, filters.estado]);

  // Filtrado en memoria
  const filteredData = data.filter((s) => {
    const q = filters.busqueda.toLowerCase();

    const matchBusqueda = q
      ? (s.codigoSolicitud || '').toLowerCase().includes(q) ||
        (s.clienteNombre || '').toLowerCase().includes(q) ||
        (s.clienteIdentidad || '').toLowerCase().includes(q)
      : true;

    const matchEstado =
      filters.estado === 'TODAS' || (s.estadoSolicitud || '').toUpperCase() === filters.estado;

    return matchBusqueda && matchEstado;
  });

  return { data: filteredData, loading, error };
}
