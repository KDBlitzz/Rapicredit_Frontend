"use client";

import { useEffect, useMemo, useState } from "react";
import { toRange } from "../lib/dateRange";
import { cajaApi, type CajaCuadreResponse, type CajaMoraResponse, type CajaPagosResponse } from "../services/cajaApi";
import { gastosApi, type Gasto } from "../services/gastosApi";

type HookState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

const getRangeOrNull = (fechaInicio?: string, fechaFin?: string) => {
  if (!fechaInicio || !fechaFin) return null;
  return toRange(fechaInicio, fechaFin);
};

// ============================================================================
// Pagos
// ============================================================================

export function usePagos(
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
): HookState<CajaPagosResponse | null> {
  const [data, setData] = useState<CajaPagosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeOrNull(fechaInicio, fechaFin);
    if (!range) {
      setData(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cajaApi.getPagos(range);
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Error al cargar cobros");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

export function usePagosPorAsesor(
  cobradorId?: string,
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
): HookState<CajaPagosResponse | null> {
  const [data, setData] = useState<CajaPagosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeOrNull(fechaInicio, fechaFin);
    if (!cobradorId || !range) {
      setData(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cajaApi.getPagosPorAsesor(cobradorId, range);
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Error al cargar cobros por asesor");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Cuadre
// ============================================================================

export function useCuadre(
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
): HookState<CajaCuadreResponse | null> {
  const [data, setData] = useState<CajaCuadreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeOrNull(fechaInicio, fechaFin);
    if (!range) {
      setData(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cajaApi.getCuadre(range);
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Error al cargar cuadre");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Gastos / Desembolsos (mismo endpoint /api/gastos)
// ============================================================================

export function useDesembolsosCaja(
  codigoCobradorId?: string,
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
): HookState<Gasto[]> {
  const [data, setData] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeOrNull(fechaInicio, fechaFin);
    if (!range) {
      setData([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await gastosApi.list({
          tipoGasto: "DESEMBOLSO",
          fechaInicio: range.desde,
          fechaFin: range.hasta,
          codigoCobradorId: codigoCobradorId || undefined,
        });
        if (!cancelled) setData(res);
      } catch (err: unknown) {
        if (!cancelled) {
          setData([]);
          setError(err instanceof Error ? err.message : "Error al cargar desembolsos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [codigoCobradorId, fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

export function useGastosCaja(
  codigoCobradorId?: string,
  fechaInicio?: string,
  fechaFin?: string,
  refreshKey?: unknown
): HookState<Gasto[]> {
  const [data, setData] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const range = getRangeOrNull(fechaInicio, fechaFin);
    if (!range) {
      setData([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await gastosApi.list({
          fechaInicio: range.desde,
          fechaFin: range.hasta,
          codigoCobradorId: codigoCobradorId || undefined,
        });

        const onlyGastos = res.filter((g) => String(g.tipoGasto || "").toUpperCase() !== "DESEMBOLSO");
        if (!cancelled) setData(onlyGastos);
      } catch (err: unknown) {
        if (!cancelled) {
          setData([]);
          setError(err instanceof Error ? err.message : "Error al cargar gastos");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [codigoCobradorId, fechaInicio, fechaFin, refreshKey]);

  return { data, loading, error };
}

// ============================================================================
// Mora detallada
// ============================================================================

export function useMoraDetallada(
  cobradorId?: string,
  _clienteId?: string,
  refreshKey?: unknown,
  dias?: number
): HookState<CajaMoraResponse | null> {
  const [data, setData] = useState<CajaMoraResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const diasSafe = Number.isFinite(dias as number) && (dias as number) > 0 ? (dias as number) : 30;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cajaApi.getMoraDetallada({ dias: diasSafe });
        if (cancelled) return;

        if (cobradorId) {
          const filtered: CajaMoraResponse = {
            ...res,
            porAsesor: res.porAsesor.filter((a) => (a.asesor?.id || "") === cobradorId),
          };
          setData(filtered);
        } else {
          setData(res);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Error al cargar mora detallada");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cobradorId, refreshKey, dias]);

  return { data, loading, error };
}

// ============================================================================
// Helpers UI
// ============================================================================

export const useTotalMontoPagos = (resp: CajaPagosResponse | null) => {
  return useMemo(() => {
    const pagos = resp?.pagos ?? [];
    return pagos.reduce((acc, p) => acc + (typeof p.montoPago === "number" ? p.montoPago : 0), 0);
  }, [resp]);
};
