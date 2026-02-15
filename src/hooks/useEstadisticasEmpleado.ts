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
 * Espera que el backend exponga:
 * - GET /estadistica/:codigoEmpleado
 * - GET /estadistica/:codigoEmpleado/global
 * - GET /estadistica/:codigoEmpleado/detallada
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
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        const query = params.toString();
        const basePath = `/estadisticas/${encodeURIComponent(codigoUsuario)}`;
        const withQuery = (path: string) => (query ? `${path}?${query}` : path);

        const res = await apiFetch<any>(withQuery(basePath));

        const toNumber = (value: unknown) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };

        const toNumberOrLength = (value: unknown) => {
          if (Array.isArray(value)) return value.length;
          return toNumber(value);
        };

        const moraPorRangos = Array.isArray(res.moraPorRangos)
          ? res.moraPorRangos
          : [
            { rango: "Al dia", cantidadClientes: toNumber(res.clientesAlDiaCount), saldo: 0 },
            { rango: "Mora leve", cantidadClientes: toNumber(res.clientesMoraLeveCount), saldo: 0 },
            { rango: "Mora moderada", cantidadClientes: toNumber(res.clientesMoraModeradaCount), saldo: 0 },
            { rango: "Mora grave", cantidadClientes: toNumber(res.clientesMoraGraveCount), saldo: 0 },
          ];

        const resumenGlobal = res.resumenGlobalizado || {};
        const prestamosRaw = Array.isArray(res.prestamos)
          ? res.prestamos
          : (Array.isArray(res.detallesPrestamo) ? res.detallesPrestamo : []);

        const mapped: EstadisticasEmpleadoData = {
          asesor: res.asesor || res.empleado || null,
          periodo: res.periodo || { inicio: String(fechaInicio || ""), fin: String(fechaFin || "") },
          bonificaciones: Array.isArray(res.bonificaciones) ? res.bonificaciones : [],
          totalBonificaciones: toNumber(res.totalBonificaciones ?? 0),
          renovaciones: toNumberOrLength(res.renovacionesMes ?? res.renovaciones ?? res.renovacionesTotales ?? 0),
          nuevosMes: toNumber(res.clientesNuevosMes ?? res.nuevosMes ?? 0),
          nuevosInactivos: toNumber(res.clientesNuevosInactivos ?? res.nuevosInactivos ?? 0),
          moraPorcentaje: toNumber(res.porcentajeMora ?? res.moraPorcentaje ?? 0),
          clientesEnMora: toNumber(res.clientesEnMora ?? 0),
          moraPorRangos,
          carteraActiva: {
            cantidadClientes: toNumber(res.carteraActiva?.cantidadClientes ?? res.carteraClientesCount ?? res.clientesTotales ?? 0),
            cantidadPrestamos: toNumberOrLength(
              res.carteraActiva?.cantidadPrestamos
                ?? res.prestamosTotales
                ?? res.totalPrestamos
                ?? 0
            ),
            montoOtorgadoTotal: toNumber(res.carteraActiva?.montoOtorgadoTotal ?? 0),
            saldoActualTotal: toNumber(res.carteraActiva?.saldoActualTotal ?? 0),
            interesesCobradosTotal: toNumber(res.carteraActiva?.interesesCobradosTotal ?? resumenGlobal.interesesCobrados ?? 0),
          },
          prestamos: prestamosRaw.map((p: any) => {
            const clienteNombre = p.cliente?.nombre
              || p.cliente?.nombreCompleto
              || p.Cliente
              || p.cliente?.codigoCliente
              || p.codigoCliente;

            const enMora = typeof p.enMora === "boolean"
              ? p.enMora
              : (String(p.riesgoMora || "").toLowerCase() !== "al dia" && String(p.riesgoMora || "") !== "");

            return {
              id: p.id ?? p._id,
              codigoFinanciamiento: p.codigoFinanciamiento ?? p.codigo,
              cliente: clienteNombre ? { nombre: clienteNombre } : null,
              montoOtorgado: toNumber(p.montoOtorgado ?? p.monto ?? p.MontoOtorgado ?? 0),
              saldoActual: toNumber(p.saldoActual ?? p.saldo ?? 0),
              enMora,
              interesesCobradosTotal: toNumber(p.interesesCobradosTotal ?? p.interesesCobrados ?? 0),
              interesesDevengadosTotal: toNumber(p.interesesDevengadosTotal ?? p.interesesDevengados ?? 0),
            };
          }),
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