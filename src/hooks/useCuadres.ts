"use client";

import { useEffect, useState } from "react";

export type TipoMovimientoCuadre = "COBRO" | "DESEMBOLSO" | "GASTO";

export interface CuadreRegistro {
  id: string;
  tipo: TipoMovimientoCuadre;
  asesorId?: string;
  asesorNombre?: string;
  fecha: string; // ISO date
  monto: number;
  descripcion?: string;
  referencia?: string;
  categoriaGasto?: string;
  origen?: string; // EFECTIVO, BANCO, etc.
}

export interface CuadresFilters {
  fechaInicio?: string;
  fechaFin?: string;
  asesorId?: string | "TODOS";
  tipo?: TipoMovimientoCuadre | "TODOS";
}

/**
 * Hook base para pantallas de Cuadres.
 *
 * De momento no consume backend. La intención es que posteriormente
 * se conecte a la ruta real (por ejemplo: `/cuadres/resumen` o similar).
 */
export function useCuadres(filters: CuadresFilters) {
  const [data, setData] = useState<CuadreRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // TODO: conectar con backend cuando se defina la ruta.
        // Ejemplo de firma esperada:
        // const res = await apiFetch<CuadreRegistro[]>("/cuadres/resumen", { ... });
        // if (!cancelled) setData(res || []);

        if (!cancelled) {
          setData([]);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando cuadres:", err);
          setError(err.message || "Error al cargar cuadres");
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
  }, [filters.fechaInicio, filters.fechaFin, filters.asesorId, filters.tipo]);

  return { data, loading, error };
}
