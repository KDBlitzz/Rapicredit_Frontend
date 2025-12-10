"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface DashboardResumen {
  prestamosActivos: number;
  prestamosEnMora: number;
  prestamosPagados: number;
  montoTotalColocado: number;
  vencenEn7Dias: number;
  distribucionEstados: {
    VIGENTE: number;
    EN_MORA: number;
    PAGADO: number;
  };
  prestamosRecientes: {
    id: string;
    codigo: string;
    cliente: {
      id: string;
      codigoCliente?: string;
      identidadCliente?: string;
    } | null;
    monto: number;
    saldo: number;
    estado: string;
    fechaDesembolso: string;
    fechaVencimiento: string;
  }[];
  pagosHoy: {
    id: string;
    codigoFinanciamiento: string | null;
    monto: number;
    fechaAbono: string;
    cliente: {
      id: string;
      codigoCliente?: string;
      identidadCliente?: string;
    } | null;
  }[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<DashboardResumen>("/dashboard/resumen");
        if (!cancelled) {
          setData(res);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando dashboard:", err);
          setError(err.message || "Error al cargar el dashboard");
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
  }, []);

  return { data, loading, error };
}
