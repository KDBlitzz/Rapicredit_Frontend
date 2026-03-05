"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

// ============================================================================
// Tipos
// ============================================================================

export interface PagoItem {
  _id?: string;
  prestamoId: string;
  clienteId: string;
  clienteNombre?: string;
  cobradorId?: string;
  cobradorNombre?: string;
  monto: number;
  montoPrincipal?: number;
  montoInteres?: number;
  montoMora?: number;
  fecha: string; // ISO date
  estado?: string;
  referencia?: string;
  observaciones?: string;
}

export interface CuadreData {
  fecha: string;
  totalPagos: number;
  totalDesembolsos?: number;
  totalGastos?: number;
  detalleAdesores?: Array<{
    cobradorId: string;
    cobradorNombre: string;
    totalPagos: number;
    countPagos: number;
    promedioPorPago?: number;
  }>;
  desglosePorCategoria?: {
    [categoria: string]: {
      cantidad: number;
      total: number;
    };
  };
}

export interface MoraDetallada {
  _id?: string;
  clienteId: string;
  clienteNombre?: string;
  prestamoId: string;
  cuotasAtrasadas: number;
  totalMora: number;
  diasAtraso?: number;
  ultimaFecha?: string;
  cobradorId?: string;
  cobradorNombre?: string;
  estadoPrestamo?: string;
}

// ============================================================================
// Hook: usePagosPorAsesor
// ============================================================================

export function usePagosPorAsesor(cobradorId?: string, fechaInicio?: string, fechaFin?: string) {
  const [data, setData] = useState<PagoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cobradorId) {
      setData([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/pagos/asesor/${cobradorId}`;
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<PagoItem[]>(url);
        if (!cancelled) setData(res || []);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando pagos por asesor:", err);
          setError(err.message || "Error al cargar pagos por asesor");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, fechaInicio, fechaFin]);

  return { data, loading, error };
}

// ============================================================================
// Hook: usePagos (Todos)
// ============================================================================

export function usePagos(fechaInicio?: string, fechaFin?: string) {
  const [data, setData] = useState<PagoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/pagos`;
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<PagoItem[]>(url);
        if (!cancelled) setData(res || []);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando pagos:", err);
          setError(err.message || "Error al cargar pagos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin]);

  return { data, loading, error };
}

// ============================================================================
// Hook: useCuadre
// ============================================================================

export function useCuadre(fechaInicio?: string, fechaFin?: string) {
  const [data, setData] = useState<CuadreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/cuadre`;
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<CuadreData>(url);
        if (!cancelled) setData(res || null);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando cuadre:", err);
          setError(err.message || "Error al cargar cuadre");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin]);

  return { data, loading, error };
}

// ============================================================================
// Hook: useMoraDetallada
// ============================================================================

export function useMoraDetallada(cobradorId?: string, clienteId?: string) {
  const [data, setData] = useState<MoraDetallada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/caja/mora`;
        const params = new URLSearchParams();
        if (cobradorId) params.append("cobradorId", cobradorId);
        if (clienteId) params.append("clienteId", clienteId);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await apiFetch<MoraDetallada[]>(url);
        if (!cancelled) setData(res || []);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando mora detallada:", err);
          setError(err.message || "Error al cargar mora detallada");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, clienteId]);

  return { data, loading, error };
}
