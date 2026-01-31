"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface BonificacionItem {
  concepto: string;
  monto: number;
}

export interface MoraRangoItem {
  rango: string; // ej: "0-7 días", "8-30 días"
  cantidadClientes: number;
  saldo: number;
}

export interface PrestamoDetalleItem {
  id?: string;
  codigoFinanciamiento?: string;
  cliente?: { id?: string; codigoCliente?: string; nombre?: string } | null;
  montoOtorgado: number;
  saldoActual: number;
  enMora: boolean;
  interesesCobradosTotal?: number; // usamos intereses cobrados, no devengados
  interesesDevengadosTotal?: number; // opcional, informativo
}

export interface CarteraResumen {
  cantidadClientes: number;
  cantidadPrestamos: number;
  montoOtorgadoTotal: number;
  saldoActualTotal: number;
  interesesCobradosTotal: number;
}

export interface EstadisticasEmpleadoData {
  asesor: { id?: string; codigoUsuario?: string; nombreCompleto?: string } | null;
  periodo: { inicio: string; fin: string };
  bonificaciones: BonificacionItem[];
  totalBonificaciones?: number;
  renovaciones: number;
  nuevosMes: number;
  nuevosInactivos: number;
  moraPorcentaje: number; // 0..100
  clientesEnMora: number;
  moraPorRangos: MoraRangoItem[];
  carteraActiva: CarteraResumen;
  prestamos: PrestamoDetalleItem[];
}

/**
 * Hook para cargar estadísticas por asesor (empleado).
 * Espera que el backend exponga GET /estadisticas/empleado?codigoUsuario=...&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 * Si el backend usa otro nombre, puedes adaptar `endpoint` o el mapeo.
 */
export function useEstadisticasEmpleado(
  codigoUsuario?: string,
  fechaInicio?: string,
  fechaFin?: string,
) {
  const [data, setData] = useState<EstadisticasEmpleadoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!codigoUsuario) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("codigoUsuario", codigoUsuario);
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        const query = params.toString();
        const path = query ? `/estadisticas/empleado?${query}` : "/estadisticas/empleado";

        const res = await apiFetch<any>(path);

        // Intentar mapear con tolerancia diferentes formas de respuesta
        const mapped: EstadisticasEmpleadoData = {
          asesor: res.asesor || res.empleado || null,
          periodo: res.periodo || { inicio: String(fechaInicio || ""), fin: String(fechaFin || "") },
          bonificaciones: Array.isArray(res.bonificaciones) ? res.bonificaciones : [],
          totalBonificaciones: Number(res.totalBonificaciones ?? 0),
          renovaciones: Number(res.renovaciones ?? res.totalRenovaciones ?? 0),
          nuevosMes: Number(res.nuevosMes ?? res.clientesNuevosMes ?? 0),
          nuevosInactivos: Number(res.nuevosInactivos ?? res.clientesNuevosInactivos ?? 0),
          moraPorcentaje: Number(res.moraPorcentaje ?? res.porcentajeMora ?? 0),
          clientesEnMora: Number(res.clientesEnMora ?? res.totalClientesEnMora ?? 0),
          moraPorRangos: Array.isArray(res.moraPorRangos) ? res.moraPorRangos : (Array.isArray(res.moraRangos) ? res.moraRangos : []),
          carteraActiva: {
            cantidadClientes: Number(res.carteraActiva?.cantidadClientes ?? res.cantidadClientesActivos ?? 0),
            cantidadPrestamos: Number(res.carteraActiva?.cantidadPrestamos ?? res.cantidadPrestamosActivos ?? 0),
            montoOtorgadoTotal: Number(res.carteraActiva?.montoOtorgadoTotal ?? res.montoOtorgadoTotal ?? 0),
            saldoActualTotal: Number(res.carteraActiva?.saldoActualTotal ?? res.saldoActualTotal ?? 0),
            interesesCobradosTotal: Number(res.carteraActiva?.interesesCobradosTotal ?? res.interesesCobradosTotal ?? 0),
          },
          prestamos: Array.isArray(res.prestamos) ? res.prestamos.map((p: any) => ({
            id: p.id ?? p._id,
            codigoFinanciamiento: p.codigoFinanciamiento ?? p.codigo,
            cliente: p.cliente ?? null,
            montoOtorgado: Number(p.montoOtorgado ?? p.monto ?? 0),
            saldoActual: Number(p.saldoActual ?? p.saldo ?? 0),
            enMora: Boolean(p.enMora ?? (String(p.estado || "").toUpperCase() === "EN_MORA")),
            interesesCobradosTotal: Number(p.interesesCobradosTotal ?? p.interesesCobrados ?? 0),
            interesesDevengadosTotal: Number(p.interesesDevengadosTotal ?? p.interesesDevengados ?? 0),
          })) : [],
        };

        if (!cancelled) setData(mapped);
      } catch (err: any) {
        console.error("Error cargando estadísticas de empleado:", err);
        if (!cancelled) setError(err.message || "Error al cargar estadísticas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [codigoUsuario, fechaInicio, fechaFin]);

  return { data, loading, error };
}
