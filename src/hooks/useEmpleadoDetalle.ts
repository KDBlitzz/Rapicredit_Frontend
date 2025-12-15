"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Empleado } from "./useEmpleados";

export function useEmpleadoDetalle(id: string) {
  const [data, setData] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || id === "nuevo") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Primero intenta por _id (ObjectId) usando fetch directo para evitar el log 404 de apiFetch
        let resData: Empleado | null = null;
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";
        if (!apiBase) throw new Error("Falta NEXT_PUBLIC_API_BASE_URL");

        const res = await fetch(`${apiBase}/empleados/${id}`);
        if (res.ok) {
          resData = (await res.json()) as Empleado;
        } else {
          // Fallback: cargar lista y filtrar por codigoUsuario
          const list = await apiFetch<Empleado[] | { users?: Empleado[] }>(`/empleados/?estado=TODOS`);
          const rawList: Empleado[] = Array.isArray(list) ? list : (list?.users ?? []);
          resData = rawList.find((u) => (u.codigoUsuario || "") === id) || null;
        }

        if (!cancelled) {
          if (resData) {
            setData(resData);
          } else {
            setError("Empleado no encontrado");
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Error cargando empleado:", err);
          const msg = err instanceof Error ? err.message : "Error al cargar empleado";
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
  }, [id]);

  return { data, loading, error };
}
