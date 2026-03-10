"use client";

import React from "react";
import {
  User,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { empleadosApi, type EmpleadoMongo } from "../services/empleadosApi";

export type AuthContextValue = {
  firebaseUser: User | null;
  idToken: string | null;
  empleadoMongo: EmpleadoMongo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<EmpleadoMongo>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const normalizeEmpleado = (emp: EmpleadoMongo): EmpleadoMongo => {
  const permisosRaw = emp.permisos;
  const permisos = Array.isArray(permisosRaw)
    ? (permisosRaw.filter((p) => typeof p === "string") as string[])
    : [];
  return { ...emp, permisos };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [idToken, setIdToken] = React.useState<string | null>(null);
  const [empleadoMongo, setEmpleadoMongo] = React.useState<EmpleadoMongo | null>(null);
  const [loading, setLoading] = React.useState(true);

  const empleadoRef = React.useRef<EmpleadoMongo | null>(null);
  const uidRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    empleadoRef.current = empleadoMongo;
  }, [empleadoMongo]);

  React.useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        uidRef.current = null;
        setIdToken(null);
        setEmpleadoMongo(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = await user.getIdToken();
        setIdToken(token);

        const uidChanged = uidRef.current !== user.uid;
        if (uidChanged) {
          uidRef.current = user.uid;
          empleadoRef.current = null;
          setEmpleadoMongo(null);
        }

        // Solo consulta Mongo si aún no tenemos el perfil o cambió el usuario.
        if (!empleadoRef.current || uidChanged) {
          const emp = normalizeEmpleado(await empleadosApi.login());
          empleadoRef.current = emp;
          setEmpleadoMongo(emp);
        }
      } catch (err) {
        // Si el backend rechaza el token / usuario no existe en Mongo, cerramos sesión.
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        uidRef.current = null;
        empleadoRef.current = null;
        setIdToken(null);
        setEmpleadoMongo(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setFirebaseUser(cred.user);

    const token = await cred.user.getIdToken(true);
    setIdToken(token);
    uidRef.current = cred.user.uid;

    const emp = normalizeEmpleado(await empleadosApi.login());
    empleadoRef.current = emp;
    setEmpleadoMongo(emp);
    return emp;
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
    } finally {
      uidRef.current = null;
      empleadoRef.current = null;
      setFirebaseUser(null);
      setIdToken(null);
      setEmpleadoMongo(null);
    }
  }, []);

  const refreshToken = React.useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken(true);
    setIdToken(token);
    return token;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      idToken,
      empleadoMongo,
      loading,
      login,
      logout,
      refreshToken,
    }),
    [firebaseUser, idToken, empleadoMongo, loading, login, logout, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
