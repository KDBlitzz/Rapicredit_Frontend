"use client";

import { useMemo } from "react";
import { useEmpleadoActual } from "./useEmpleadoActual";

export function usePermisos() {
  const { empleado, loading, error, firebaseUser } = useEmpleadoActual();

  const permisosSet = useMemo(() => {
    const list = (empleado?.permisos || []).map((p) => p.toUpperCase());
    return new Set(list);
  }, [empleado?.permisos]);

  const hasPermiso = (code: string | undefined | null): boolean => {
    if (!code) return false;
    return permisosSet.has(String(code).toUpperCase());
  };

  const hasAnyPermiso = (codes: Array<string | undefined | null>): boolean => {
    if (!codes || codes.length === 0) return false;
    return codes.some((c) => c && permisosSet.has(String(c).toUpperCase()));
  };

  return {
    empleado,
    loading,
    error,
    firebaseUser,
    permisos: empleado?.permisos || [],
    permisosSet,
    hasPermiso,
    hasAnyPermiso,
  };
}
