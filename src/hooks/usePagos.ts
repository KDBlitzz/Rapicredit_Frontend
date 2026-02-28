"use client";

import { useState } from "react";

export type EstadoPagoFiltro = "TODOS" | "PENDIENTE" | "APLICADO" | "RECHAZADO";

export interface PagoResumen {
  id: string;
  codigoPago?: string;
  prestamoId?: string;
  codigoPrestamo: string;
  clienteId?: string;
  clienteCodigo?: string;
  clienteNombre: string;
  clienteIdentidad?: string;
  monto: number;
  moneda?: string;
  fecha: string;
  medioPago?: string;
  referencia?: string;
  estadoPago?: string;
  observaciones?: string;
}

export interface PagosFiltros {
  busqueda: string;
  estado: EstadoPagoFiltro;
}

export interface UsePagosOptions {
  /**
   * Cualquier valor que cambie para forzar recarga.
   */
  refreshKey?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePagos(filters: PagosFiltros, options: UsePagosOptions = {}) {
  // Por ahora solo es un boceto, sin llamadas al backend
  // Los datos están vacíos hasta que se implemente el endpoint
  const [data] = useState<PagoResumen[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // TODO: Implementar la lógica real cuando el endpoint esté disponible
  // Descomentar el useEffect y la lógica de carga cuando se tenga el backend

  /*
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<unknown>("/abonos");
        
        if (cancelled) return;

        const resObj = isRecord(res) ? res : null;
        const rawList: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.abonos)
            ? (resObj?.abonos as unknown[])
            : Array.isArray(resObj?.data)
              ? (resObj?.data as unknown[])
              : [];

        const mapped: PagoResumen[] = rawList
          .map((p: unknown) => {
            // Mapeo de datos...
          })
          .filter((pago) => {
            // Filtros...
          });

        setData(mapped);
      } catch (e: unknown) {
        console.error("Error cargando pagos:", e);
        const errorMsg = e instanceof Error ? e.message : "Error cargando pagos";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filters.busqueda, filters.estado, options.refreshKey]);
  */

  return { data, loading, error, refresh: () => {} };
}
