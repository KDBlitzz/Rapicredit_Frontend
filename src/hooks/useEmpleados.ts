"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export type EstadoEmpleadoFiltro = "TODOS" | "ACTIVO" | "INACTIVO";

export interface Empleado {
  _id: string;
  codigo?: string;
  usuario?: string;
  nombreCompleto: string;
  rol?: string;
  email?: string;
  telefono?: string;
  estado?: string; // ACTIVO / INACTIVO
  fechaRegistro?: string;
}

export interface EmpleadosFilters {
  busqueda: string;
  estado: EstadoEmpleadoFiltro;
  rol: string;
}

export function useEmpleados(filters: EmpleadosFilters) {
  const [data, setData] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 🔹 Cuando conectemos backend: GET /empleados
        let res = await apiFetch<Empleado[]>("/empleados");
        
        // Si no hay respuesta del backend, usar datos de prueba
        if (!res || res.length === 0) {
          res = [];
        }
        
        if (!cancelled) {
          setData(res || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error cargando empleados:", err);
          // Usar datos vacíos en caso de error
          setData([]);
          setError(null); // No mostrar error, solo mostrar tabla vacía
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtrado local
  const filtered = data.filter((empleado) => {
    const matchBusqueda = filters.busqueda
      ? (empleado.nombreCompleto || "")
          .toLowerCase()
          .includes(filters.busqueda.toLowerCase()) ||
        (empleado.codigo || "")
          .toLowerCase()
          .includes(filters.busqueda.toLowerCase()) ||
        (empleado.usuario || "")
          .toLowerCase()
          .includes(filters.busqueda.toLowerCase()) ||
        (empleado.email || "")
          .toLowerCase()
          .includes(filters.busqueda.toLowerCase()) ||
        (empleado.telefono || "")
          .toLowerCase()
          .includes(filters.busqueda.toLowerCase())
      : true;

    const matchEstado =
      filters.estado === "TODOS" ||
      (empleado.estado || "").toUpperCase() === filters.estado;

    const matchRol = filters.rol
      ? (empleado.rol || "").toLowerCase().includes(filters.rol.toLowerCase())
      : true;

    return matchBusqueda && matchEstado && matchRol;
  });

  return { data: filtered, loading, error };
}
