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
  email?: string;
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
  referencias: string[];
  refsParentescoTelefonos?: string[];
  actividad: boolean;
  // Backend name is `riesgoMora` (single value)
  riesgoMora?: string;
  // Optional cobrador id
  codigoCobrador?: string;

  // Negocio
  negocioNombre?: string;
  negocioTipo?: string;
  negocioTelefono?: string;
  negocioDireccion?: string;
  negocioDepartamento?: string;
  negocioMunicipio?: string;
  negocioZonaResidencial?: string;
  // NUEVO: parentesco con el propietario del negocio
  parentescoPropietario?: string;
  ventaDiaria?: number;
  capacidadPago?: number;

  // Documentos (se asumen URLs o nombres de archivo)
  documentosFotos?: string[];
  negocioFotos?: string[];
  fotosDireccion?: string[];
  fotosDireccionConyuge?: string[];
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
          email: res.email ?? undefined,
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
          referencias: Array.isArray(res.referencias) ? res.referencias : [],
          refsParentescoTelefonos: Array.isArray(res.refsParentescoTelefonos) ? res.refsParentescoTelefonos : undefined,
          // Support both `actividad` and `activo` (backend uses `activo` in the model)
          actividad: res.actividad ?? res.activo ?? true,
          riesgoMora: res.riesgoMora || undefined,
          codigoCobrador: res.codigoCobrador || undefined,

          negocioNombre: res.negocioNombre || undefined,
          negocioTipo: res.negocioTipo || undefined,
          negocioTelefono: res.negocioTelefono || undefined,
          negocioDireccion: res.negocioDireccion || undefined,
          negocioDepartamento: res.negocioDepartamento || undefined,
          negocioMunicipio: res.negocioMunicipio || undefined,
          negocioZonaResidencial: res.negocioZonaResidencial || undefined,
          parentescoPropietario: res.parentescoPropietario || undefined,
          ventaDiaria: typeof res.ventaDiaria === 'number' ? res.ventaDiaria : undefined,
          capacidadPago: typeof res.capacidadPago === 'number' ? res.capacidadPago : undefined,

          // Accept either `documentosFotos` or legacy `fotosDocs`
          documentosFotos: res.documentosFotos ?? res.fotosDocs ?? [],
          negocioFotos: res.negocioFotos ?? [],
          fotosDireccion: res.fotosDireccion ?? res.direccionFotos ?? [],
          fotosDireccionConyuge: res.fotosDireccionConyuge ?? res.conyugeDireccionFotos ?? [],
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
