"use client";

import { User } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import type { EmpleadoMongo } from "../services/empleadosApi";

export type EmpleadoActual = EmpleadoMongo & {
  permisos: string[];
};

interface UseEmpleadoActualState {
  empleado: EmpleadoActual | null;
  loading: boolean;
  error: string | null;
  firebaseUser: User | null;
}

export function useEmpleadoActual(): UseEmpleadoActualState {
  const { empleadoMongo, loading, firebaseUser } = useAuth();
  const permisos = Array.isArray(empleadoMongo?.permisos) ? (empleadoMongo!.permisos as string[]) : [];

  const empleado: EmpleadoActual | null = empleadoMongo
    ? ({ ...empleadoMongo, permisos } as EmpleadoActual)
    : null;

  return { empleado, loading, error: null, firebaseUser: (firebaseUser as User | null) };
}
