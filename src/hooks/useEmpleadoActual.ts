"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { apiFetch } from "../lib/api";
import type { Empleado } from "./useEmpleados";

export interface EmpleadoActual extends Empleado {
  uid?: string;
  permisos: string[];
}

interface UseEmpleadoActualState {
  empleado: EmpleadoActual | null;
  loading: boolean;
  error: string | null;
  firebaseUser: User | null;
}

export function useEmpleadoActual(): UseEmpleadoActualState {
  const [empleado, setEmpleado] = useState<EmpleadoActual | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      setFirebaseUser(user);
      if (!user) {
        setEmpleado(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Intento principal: obtener todos los empleados y buscar por uid/email
        const raw = await apiFetch<unknown>("/empleados/");

        const list: unknown[] = (() => {
          if (Array.isArray(raw)) return raw;
          if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            const users = obj["users"];
            if (Array.isArray(users)) return users;
          }
          return [];
        })();

        const foundRaw = list.find((e) => {
          if (!e || typeof e !== "object") return false;
          const rec = e as Record<string, unknown>;
          const uid = typeof rec["uid"] === "string" ? rec["uid"] : undefined;
          const email = typeof rec["email"] === "string" ? rec["email"] : undefined;

          if (uid && uid === user.uid) return true;
          if (email && user.email && email.toLowerCase() === user.email.toLowerCase()) return true;
          return false;
        }) as Record<string, unknown> | undefined;

        if (!foundRaw) {
          if (!cancelled) {
            setEmpleado(null);
            setError("No se encontró información del empleado actual");
          }
          return;
        }

        const permisosVal = foundRaw["permisos"];
        const permisos: string[] = Array.isArray(permisosVal)
          ? (permisosVal.filter((p) => typeof p === "string") as string[])
          : [];

        const estadoVal = foundRaw["estado"];
        const estadoBool = typeof estadoVal === "boolean" ? estadoVal : !!estadoVal;

        const mapped: EmpleadoActual = {
          _id: String(foundRaw["_id"] ?? foundRaw["id"] ?? ""),
          codigoUsuario:
            typeof foundRaw["codigoUsuario"] === "string" ? foundRaw["codigoUsuario"] : undefined,
          usuario:
            typeof foundRaw["usuario"] === "string" ? foundRaw["usuario"] : undefined,
          nombreCompleto:
            typeof foundRaw["nombreCompleto"] === "string"
              ? foundRaw["nombreCompleto"]
              : typeof foundRaw["usuario"] === "string"
              ? foundRaw["usuario"]
              : "",
          rol: typeof foundRaw["rol"] === "string" ? foundRaw["rol"] : undefined,
          email: typeof foundRaw["email"] === "string" ? foundRaw["email"] : undefined,
          telefono: typeof foundRaw["telefono"] === "string" ? foundRaw["telefono"] : undefined,
          estado: estadoBool,
          uid: typeof foundRaw["uid"] === "string" ? foundRaw["uid"] : undefined,
          permisos,
        };

        if (!cancelled) {
          setEmpleado(mapped);
        }
      } catch (err: unknown) {
        console.error("Error obteniendo empleado actual:", err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error obteniendo empleado actual";
          setError(msg);
          setEmpleado(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { empleado, loading, error, firebaseUser };
}
