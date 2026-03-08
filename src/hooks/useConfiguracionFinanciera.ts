"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export type MetodoInteresCorriente = "FLAT" | "SOBRE_SALDO";

export interface NoLaborable {
  date: string;
  motivo?: string;
}

export interface ConfiguracionFinanciera {
  _id?: string;
  version?: number;
  yearBase?: number;
  weekendDays: number[];
  noLaborables: NoLaborable[];
  montoPrestamoMin: number;
  montoPrestamoMax: number;
  metodoInteresCorriente: MetodoInteresCorriente;
  vigenteDesde?: string;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfiguracionFinancieraPayload {
  weekendDays: number[];
  noLaborables: NoLaborable[];
  montoPrestamoMin: number;
  montoPrestamoMax: number;
  metodoInteresCorriente: MetodoInteresCorriente;
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

const asNumberArray = (v: unknown): number[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => asNumber(x))
    .filter((x): x is number => typeof x === "number")
    .map((x) => Math.trunc(x));
};

const normalizeDateOnly = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapNoLaborables = (v: unknown): NoLaborable[] => {
  if (!Array.isArray(v)) return [];

  const items: NoLaborable[] = [];

  for (const item of v) {
    if (!isRecord(item)) continue;
    const rawDate = asString(item.date);
    if (!rawDate) continue;
    items.push({
      date: normalizeDateOnly(rawDate),
      motivo: asString(item.motivo) ?? "",
    });
  }

  return items;
};

const extractConfig = (raw: unknown): UnknownRecord | null => {
  if (!isRecord(raw)) return null;

  const directKeys = ["montoPrestamoMin", "montoPrestamoMax", "metodoInteresCorriente", "weekendDays", "noLaborables"];
  const looksLikeConfig = directKeys.some((k) => k in raw);
  if (looksLikeConfig) return raw;

  const nestedCandidates = ["configuracion", "data", "payload", "result"];
  for (const key of nestedCandidates) {
    const candidate = raw[key];
    if (!isRecord(candidate)) continue;
    const nestedLooksLikeConfig = directKeys.some((k) => k in candidate);
    if (nestedLooksLikeConfig) return candidate;
  }

  return null;
};

const fromBackend = (raw: unknown): ConfiguracionFinanciera | null => {
  const cfg = extractConfig(raw);
  if (!cfg) return null;

  const metodoRaw = asString(cfg.metodoInteresCorriente);
  const metodoInteresCorriente: MetodoInteresCorriente = metodoRaw === "FLAT" ? "FLAT" : "SOBRE_SALDO";

  return {
    _id: asString(cfg._id),
    version: asNumber(cfg.version),
    yearBase: asNumber(cfg.yearBase),
    weekendDays: asNumberArray(cfg.weekendDays),
    noLaborables: mapNoLaborables(cfg.noLaborables),
    montoPrestamoMin: asNumber(cfg.montoPrestamoMin) ?? 0,
    montoPrestamoMax: asNumber(cfg.montoPrestamoMax) ?? 0,
    metodoInteresCorriente,
    vigenteDesde: asString(cfg.vigenteDesde),
    activa: typeof cfg.activa === "boolean" ? cfg.activa : undefined,
    createdAt: asString(cfg.createdAt),
    updatedAt: asString(cfg.updatedAt),
  };
};

const ENDPOINT_CANDIDATES = ["/configuracion-financiera", "/configuracion"];

const normalizePayload = (payload: ConfiguracionFinancieraPayload): ConfiguracionFinancieraPayload => {
  const uniqueWeekendDays = Array.from(new Set(payload.weekendDays.map((d) => Math.trunc(d)))).sort((a, b) => a - b);

  const uniqueNoLaborablesMap = new Map<string, string>();
  for (const item of payload.noLaborables) {
    const day = normalizeDateOnly(item.date);
    uniqueNoLaborablesMap.set(day, item.motivo ?? "");
  }

  const noLaborables = Array.from(uniqueNoLaborablesMap.entries())
    .map(([date, motivo]) => ({ date, motivo }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    weekendDays: uniqueWeekendDays,
    noLaborables,
    montoPrestamoMin: payload.montoPrestamoMin,
    montoPrestamoMax: payload.montoPrestamoMax,
    metodoInteresCorriente: payload.metodoInteresCorriente,
  };
};

export function useConfiguracionFinanciera() {
  const [data, setData] = useState<ConfiguracionFinanciera | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedEndpoint, setResolvedEndpoint] = useState<string>(ENDPOINT_CANDIDATES[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let lastError: unknown = null;
      let mapped: ConfiguracionFinanciera | null = null;
      let endpointUsed = ENDPOINT_CANDIDATES[0];

      for (const endpoint of ENDPOINT_CANDIDATES) {
        try {
          const res = await apiFetch<unknown>(endpoint, { silent: true });
          mapped = fromBackend(res);
          endpointUsed = endpoint;
          break;
        } catch (err: unknown) {
          lastError = err;
        }
      }

      if (!mapped && lastError) {
        throw lastError;
      }

      setResolvedEndpoint(endpointUsed);
      setData(mapped);
    } catch (err: unknown) {
      console.error("Error cargando configuración financiera:", err);
      const message = err instanceof Error ? err.message : "Error al cargar configuración financiera";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (payload: ConfiguracionFinancieraPayload) => {
      setSaving(true);
      setError(null);
      try {
        const normalized = normalizePayload(payload);

        // Si ya existe configuración, actualizamos; de lo contrario, creamos una nueva.
        await apiFetch<unknown>(resolvedEndpoint, {
          method: data ? "PUT" : "POST",
          body: JSON.stringify(normalized),
        });

        await load();
      } catch (err: unknown) {
        console.error("Error guardando configuración financiera:", err);
        const message = err instanceof Error ? err.message : "Error al guardar configuración financiera";
        setError(message);
        throw err as Error;
      } finally {
        setSaving(false);
      }
    },
    [data, load, resolvedEndpoint]
  );

  return {
    data,
    loading,
    saving,
    error,
    reload: load,
    save,
  };
}
