"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export type EstadoEmpleadoFiltro = "TODOS" | "ACTIVO" | "INACTIVO";

export interface Empleado {
  _id: string;
  codigoUsuario?: string;
  usuario?: string;
  nombreCompleto: string;
  rol?: string;
  email?: string;
  telefono?: string;
  estado?: boolean; // algunos backends usan 'estado'
  actividad?: boolean; // en otros módulos se usa 'actividad'
  fechaRegistro?: string;
}

export interface EmpleadosFilters {
  busqueda: string;
  estado: EstadoEmpleadoFiltro;
  rol: string;
}

type UsersResponse = {
  ok: boolean;
  total: number;
  users: Empleado[];
};

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
        const res = await apiFetch<UsersResponse>("/empleados/");
        const lista = Array.isArray(res?.users) ? res.users : [];

        if (!cancelled) setData(lista);
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Error cargando empleados:", err);
          setData([]);
          const msg = err instanceof Error ? err.message : "Error cargando empleados";
          setError(msg);
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

  const filtered = (Array.isArray(data) ? data : []).filter((empleado) => {
    const q = filters.busqueda?.toLowerCase() ?? "";

    const matchBusqueda = q
      ? (empleado.nombreCompleto || "").toLowerCase().includes(q) ||
      (empleado.codigoUsuario || "").toLowerCase().includes(q) ||
      (empleado.usuario || "").toLowerCase().includes(q) ||
      (empleado.email || "").toLowerCase().includes(q) ||
      (empleado.telefono || "").toLowerCase().includes(q)
      : true;

    const isActive = typeof empleado.estado === 'boolean'
      ? empleado.estado
      : !!empleado.actividad;
    const estadoStr = isActive ? "ACTIVO" : "INACTIVO";
    const matchEstado =
      filters.estado === "TODOS" || estadoStr === filters.estado;

    const matchRol = filters.rol
      ? (empleado.rol || "").toLowerCase().includes(filters.rol.toLowerCase())
      : true;

    return matchBusqueda && matchEstado && matchRol;
  });

  return { data: filtered, loading, error };
}
