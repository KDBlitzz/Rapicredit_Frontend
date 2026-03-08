"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export type EstadoCobradorFiltro = "TODOS" | "ACTIVO" | "INACTIVO";

export interface Cobrador {
  _id: string;
  codigo?: string;
  nombreCompleto: string;
  telefono?: string;
  correo?: string;
  zona?: string;
  estado?: string; // ACTIVO / INACTIVO
  fechaRegistro?: string;
  // opcionalmente: cantidadPrestamos, saldoCartera, saldoEnMora
  cantidadPrestamos?: number;
  saldoCartera?: number;
  saldoEnMora?: number;
}

export interface CobradoresFilters {
  busqueda: string;
  estado: EstadoCobradorFiltro;
  zona: string;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

const asString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v == null) return undefined;
  return String(v);
};

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const isRouteMissingLike = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /\b404\b/i.test(msg) ||
    /\b405\b/i.test(msg) ||
    /not\s*found/i.test(msg) ||
    /cannot\s+(get|post|put|delete)/i.test(msg)
  );
};

const toArrayFromResponse = (res: unknown, keys: string[] = []): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isRecord(res)) {
    for (const k of keys) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
    const data = res["data"];
    if (Array.isArray(data)) return data;
  }
  return [];
};

const getEstadoLabel = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "ACTIVO" : "INACTIVO";
  return undefined;
};

const getPhone = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    const first = v.find((x) => typeof x === "string");
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

const mapToCobrador = (raw: unknown, defaultEstado?: "ACTIVO" | "INACTIVO"): Cobrador | null => {
  if (!isRecord(raw)) return null;

  const id = asString(raw["_id"] ?? raw["id"] ?? raw["codigoUsuario"] ?? raw["codigo"]);
  if (!id) return null;

  const nombreCompleto =
    asString(raw["nombreCompleto"]) ||
    [asString(raw["nombre"]), asString(raw["apellido"])].filter(Boolean).join(" ") ||
    asString(raw["usuario"]) ||
    "Cobrador";

  const estado = getEstadoLabel(raw["estado"] ?? raw["activo"] ?? raw["actividad"]) || defaultEstado;

  return {
    _id: id,
    codigo: asString(raw["codigo"] ?? raw["codigoUsuario"]),
    nombreCompleto,
    telefono: getPhone(raw["telefono"] ?? raw["telefonos"] ?? raw["telefonoPrincipal"]),
    correo: asString(raw["correo"] ?? raw["email"]),
    zona: asString(raw["zona"]),
    estado,
    fechaRegistro: asString(raw["fechaRegistro"] ?? raw["createdAt"]),
    cantidadPrestamos: asNumber(raw["cantidadPrestamos"]),
    saldoCartera: asNumber(raw["saldoCartera"]),
    saldoEnMora: asNumber(raw["saldoEnMora"]),
  };
};

export function useCobradores(filters: CobradoresFilters) {
  const [data, setData] = useState<Cobrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const candidates = [
          // Backends recientes: cobranza como empleados
          "/empleados/cobradores",
          "/empleados/rol/COBRADOR",
          "/caja/cobradores",
          // Backends antiguos
          "/cobradores",
          // Fallback: a veces expone códigos agrupados
          "/empleados/codigos",
        ];

        let used: unknown = null;
        let lastErr: unknown = null;
        for (const ep of candidates) {
          try {
            used = await apiFetch<unknown>(ep, { silent: true });
            break;
          } catch (err: unknown) {
            lastErr = err;
            if (isRouteMissingLike(err)) continue;
            break;
          }
        }

        if (!used) {
          throw lastErr instanceof Error ? lastErr : new Error("No se pudo cargar cobradores");
        }

        let rawList: unknown[] = [];

        // Forma especial: { activos: [...], inactivos: [...] }
        if (isRecord(used) && (Array.isArray(used["activos"]) || Array.isArray(used["inactivos"]))) {
          const activos = Array.isArray(used["activos"]) ? (used["activos"] as unknown[]) : [];
          const inactivos = Array.isArray(used["inactivos"]) ? (used["inactivos"] as unknown[]) : [];

          const mapped = [
            ...activos.map((a) => mapToCobrador(a, "ACTIVO")).filter(Boolean),
            ...inactivos.map((a) => mapToCobrador(a, "INACTIVO")).filter(Boolean),
          ] as Cobrador[];

          if (!cancelled) setData(mapped);
          return;
        }

        rawList = toArrayFromResponse(used, ["cobradores", "empleados", "items", "results", "data"]);
        const mapped = rawList.map((a) => mapToCobrador(a)).filter(Boolean) as Cobrador[];

        if (!cancelled) {
          setData(mapped);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Error al cargar cobradores");
          setData([]);
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

  let filtrados = [...data];

  // Filtro por estado
  if (filters.estado !== "TODOS") {
    filtrados = filtrados.filter(
      (c) => (c.estado || "").toUpperCase() === filters.estado
    );
  }

  // Filtro por zona
  if (filters.zona.trim()) {
    const q = filters.zona.trim().toLowerCase();
    filtrados = filtrados.filter((c) =>
      (c.zona || "").toLowerCase().includes(q)
    );
  }

  // Búsqueda por nombre, código, teléfono, correo
  if (filters.busqueda.trim()) {
    const q = filters.busqueda.trim().toLowerCase();
    filtrados = filtrados.filter((c) => {
      return (
        (c.nombreCompleto || "").toLowerCase().includes(q) ||
        (c.codigo || "").toLowerCase().includes(q) ||
        (c.telefono || "").toLowerCase().includes(q) ||
        (c.correo || "").toLowerCase().includes(q)
      );
    });
  }

  // Orden por nombre
  filtrados.sort((a, b) =>
    (a.nombreCompleto || "").localeCompare(b.nombreCompleto || "", "es")
  );

  return { data: filtrados, loading, error };
}