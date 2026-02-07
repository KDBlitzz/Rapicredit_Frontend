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

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null;

const getNested = (v: unknown, keys: string[]): unknown => {
  let cur: unknown = v;
  for (const k of keys) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
};

const asString = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v;
  if (v == null) return undefined;
  return String(v);
};

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

export interface UseSolicitudesOptions {
  /**
   * Cualquier valor que cambie para forzar recarga.
   * Útil cuando se ejecutan acciones (aprobar/en revisión/rechazar).
   */
  refreshKey?: unknown;
}

export function useSolicitudes(filters: SolicitudesFilters, options: UseSolicitudesOptions = {}) {
  const [data, setData] = useState<SolicitudResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch<unknown>(`/solicitudes/`);

        // Normalizar respuesta: puede ser array o { solicitudes: [...] }
        const resObj = isRecord(res) ? res : null;
        const rawList: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.solicitudes)
          ? (resObj?.solicitudes as unknown[])
          : Array.isArray(resObj?.data)
          ? (resObj?.data as unknown[])
          : [];

        // ✅ Helpers para obtener SIEMPRE el mismo id (evita mismatch y "Cliente")
        const getClienteId = (a: unknown) => {
          const v =
            getNested(a, ['clienteId', '_id']) ??
            getNested(a, ['clienteId']) ??
            getNested(a, ['cliente', '_id']) ??
            getNested(a, ['cliente', 'id']) ??
            '';
          return String(v ?? '').trim();
        };

        const getVendedorId = (a: unknown) => {
          const v =
            getNested(a, ['vendedorId', '_id']) ??
            getNested(a, ['vendedorId']) ??
            getNested(a, ['cobradorId', '_id']) ??
            getNested(a, ['cobradorId']) ??
            getNested(a, ['vendedor', '_id']) ??
            getNested(a, ['cobrador', '_id']) ??
            '';
          return String(v ?? '').trim();
        };

        // Recolectar IDs para enriquecer nombres
        const clienteIds = new Set<string>();
        const vendedorIds = new Set<string>();

        rawList.forEach((a: unknown) => {
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
              const c = await apiFetch<unknown>(`/clientes/id/${cid}`);
              const nombreCompleto = asString(getNested(c, ['nombreCompleto']));
              const nombre = asString(getNested(c, ['nombre']));
              const apellido = asString(getNested(c, ['apellido']));
              const razonSocial = asString(getNested(c, ['razonSocial']));
              const resolved =
                nombreCompleto ||
                [nombre, apellido].filter(Boolean).join(' ') ||
                razonSocial ||
                'Cliente';
              clienteNames[cid] = String(resolved);
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
              const e = await apiFetch<unknown>(`/empleados/id/${vid}`);
              const nombreCompleto = asString(getNested(e, ['nombreCompleto']));
              const nombre = asString(getNested(e, ['nombre']));
              const apellido = asString(getNested(e, ['apellido']));
              const usuario = asString(getNested(e, ['usuario']));
              const codigoUsuario = asString(getNested(e, ['codigoUsuario']));
              const resolved =
                nombreCompleto ||
                [nombre, apellido].filter(Boolean).join(' ') ||
                usuario ||
                codigoUsuario ||
                'Empleado';
              empleadoNames[vid] = String(resolved);
            } catch (err) {
              console.error('Fallo /empleados/id:', vid, err);
            }
          })
        );

        const mapped: SolicitudResumen[] = (rawList || []).map((a: unknown) => {
          const id = String(getNested(a, ['_id']) ?? getNested(a, ['id']) ?? '');
          const codigoSolicitud = String(
            getNested(a, ['codigoSolicitud']) ?? getNested(a, ['codigo']) ?? ''
          );

          const fechaSolicitud = (() => {
            const f = getNested(a, ['fechaSolicitud']) ?? getNested(a, ['fecha']) ?? null;
            if (!f) return undefined;
            try {
              if (typeof f === 'string') return f;
              if (typeof f === 'number') return new Date(f).toISOString();
              if (f instanceof Date) return f.toISOString();
              return undefined;
            } catch {
              return undefined;
            }
          })();

          // ✅ IMPORTANTE: usar los mismos helpers aquí también
          const cid = getClienteId(a);
          const vid = getVendedorId(a);

          const clienteNombre =
            clienteNames[cid] ??
            asString(getNested(a, ['clienteNombre'])) ??
            (asString(getNested(a, ['cliente', 'nombreCompleto'])) ||
              [asString(getNested(a, ['cliente', 'nombre'])), asString(getNested(a, ['cliente', 'apellido']))]
                .filter(Boolean)
                .join(' ')) ??
            'Cliente';

          const clienteIdentidad =
            asString(getNested(a, ['clienteIdentidad'])) ??
            asString(getNested(a, ['cliente', 'identidadCliente'])) ??
            asString(getNested(a, ['cliente', 'identidad'])) ??
            undefined;

          const capitalSolicitado =
            asNumber(getNested(a, ['capitalSolicitado'])) ??
            asNumber(getNested(a, ['capital'])) ??
            0;

          const estadoSolicitud = String(
            getNested(a, ['estadoSolicitud']) ?? getNested(a, ['estado']) ?? 'REGISTRADA'
          );

          const cobradorNombre =
            empleadoNames[vid] ??
            asString(getNested(a, ['cobradorNombre'])) ??
            asString(getNested(a, ['vendedor', 'nombreCompleto'])) ??
            asString(getNested(a, ['cobrador', 'nombreCompleto'])) ??
            undefined;

          const cuotaEstablecida =
            getNested(a, ['cuotaEstablecida']) != null
              ? asNumber(getNested(a, ['cuotaEstablecida']))
              : getNested(a, ['cuota']) != null
              ? asNumber(getNested(a, ['cuota']))
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
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('Error cargando solicitudes:', err);
          setData([]);
          const msg = err instanceof Error ? err.message : 'Error cargando solicitudes';
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
  }, [filters.busqueda, filters.estado, options.refreshKey]);

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
