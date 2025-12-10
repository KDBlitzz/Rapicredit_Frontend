"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface ReportesResumen {
  totalCartera: number;
  carteraVigente: number;
  carteraEnMora: number;
  carteraPagada: number;
}

export interface ReporteMoraRango {
  rango: string; // "0-7 días", "8-30 días", etc.
  cantidadPrestamos: number;
  saldo: number;
}

export interface ReportePagosDiarios {
  fecha: string; // ISO
  cantidadPagos: number;
  totalMonto: number;
}

export interface ReporteCarteraCobrador {
  cobrador: string;
  cantidadPrestamos: number;
  saldo: number;
  saldoEnMora: number;
}

export interface ReportesData {
  resumen: ReportesResumen;
  moraPorRango: ReporteMoraRango[];
  pagosDiarios: ReportePagosDiarios[];
  carteraPorCobrador: ReporteCarteraCobrador[];
}

/**
 * Llama a: GET /reportes/cartera?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 * y devuelve lo que la página de /reportes ya está esperando.
 */
export function useReportes(fechaInicio?: string, fechaFin?: string) {
  const [data, setData] = useState<ReportesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append("fechaInicio", fechaInicio);
        if (fechaFin) params.append("fechaFin", fechaFin);

        const query = params.toString();
        const path = query ? `/reportes/cartera?${query}` : "/reportes/cartera";

        const res = await apiFetch<ReportesData>(path);

        if (!cancelled) {
          setData(res);
        }
      } catch (err: any) {
        console.error("Error cargando reportes:", err);
        if (!cancelled) {
          setError(err.message || "Error al cargar reportes");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin]);

  return { data, loading, error };
}
