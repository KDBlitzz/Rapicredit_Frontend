// src/hooks/useClienteDetalle.ts
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export interface ClienteDetalle {
  id: string;
  codigoCliente: string;
  identidadCliente: string;
  nacionalidad: string;
  RTN?: string;

  estadoCivil: string;
  nivelEducativo: string;

  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono: string[];

  sexo: string;
  fechaNacimiento?: string;

  // Dirección
  departamentoResidencia: string;
  municipioResidencia: string;
  zonaResidencialCliente: string;
  direccion: string;

  tipoVivienda: string;
  antiguedadVivenda: number;

  // Cónyuge
  conyugeNombre?: string;
  conyugeTelefono?: string;

  // Financieros
  limiteCredito: number;
  tasaCliente: number;
  frecuenciaPago: string;
  estadoDeuda: string[];
  referencias: string[];
  actividad: boolean;

  // Negocio
  negocioNombre?: string;
  negocioTipo?: string;
  negocioTelefono?: string;
  negocioDireccion?: string;

  // Documentos (se asumen URLs o nombres de archivo)
  documentosFotos?: string[];
  negocioFotos?: string[];
}

export function useClienteDetalle(id: string) {
  const [data, setData] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res: any = await apiFetch<any>(`/clientes/${id}`);

        if (cancelled || !res) return;

        const telefonos: string[] = Array.isArray(res.telefono)
          ? res.telefono
          : res.telefono
          ? [res.telefono]
          : [];

        const detalle: ClienteDetalle = {
          id: String(res._id ?? res.id ?? id),
          codigoCliente: res.codigoCliente ?? '',
          identidadCliente: res.identidadCliente ?? '',
          nacionalidad: res.nacionalidad ?? 'Honduras',
          RTN: res.RTN || undefined,

          estadoCivil: res.estadoCivil ?? '',
          nivelEducativo: res.nivelEducativo ?? '',

          nombre: res.nombre ?? '',
          apellido: res.apellido ?? '',
          nombreCompleto:
            res.nombreCompleto ||
            [res.nombre, res.apellido].filter(Boolean).join(' ') ||
            'Cliente',
          email: res.email ?? '',
          telefono: telefonos,

          sexo: res.sexo ?? '',
          fechaNacimiento: res.fechaNacimiento,

          departamentoResidencia: res.departamentoResidencia ?? '',
          municipioResidencia: res.municipioResidencia ?? '',
          zonaResidencialCliente: res.zonaResidencialCliente ?? '',
          direccion: res.direccion ?? '',

          tipoVivienda: res.tipoVivienda ?? '',
          antiguedadVivenda: res.antiguedadVivenda ?? 0,

          conyugeNombre: res.conyugeNombre || undefined,
          conyugeTelefono: res.conyugeTelefono || undefined,

          limiteCredito: res.limiteCredito ?? 0,
          tasaCliente: res.tasaCliente ?? 0,
          frecuenciaPago: res.frecuenciaPago ?? 'Mensual',
          estadoDeuda: Array.isArray(res.estadoDeuda) ? res.estadoDeuda : [],
          referencias: Array.isArray(res.referencias) ? res.referencias : [],
          actividad: res.actividad ?? true,

          negocioNombre: res.negocioNombre || undefined,
          negocioTipo: res.negocioTipo || undefined,
          negocioTelefono: res.negocioTelefono || undefined,
          negocioDireccion: res.negocioDireccion || undefined,

          documentosFotos: res.documentosFotos ?? [],
          negocioFotos: res.negocioFotos ?? [],
        };

        if (!cancelled) setData(detalle);
      } catch (err: any) {
        console.error('Error cargando detalle de cliente:', err);
        if (!cancelled) {
          setError(err.message || 'Error al cargar el cliente');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}
