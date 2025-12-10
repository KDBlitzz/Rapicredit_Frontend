"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface PrestamoAbono {
  id: string;
  fecha: string;
  monto: number;
  metodoPago?: string;
  recibo?: string;
  usuarioRegistro?: string;
}

export interface PrestamoDetalle {
  id: string;
  codigoFinanciamiento: string;
  capitalInicial: number;
  saldoCapital: number;
  tasaInteresAnual?: number;
  estadoFinanciamiento: string;
  fechaDesembolso?: string;
  fechaVencimiento?: string;

  cliente: {
    id: string;
    nombreCompleto: string;
    identidadCliente?: string;
    codigoCliente?: string;
  } | null;

  cobrador: {
    id: string;
    nombreCompleto: string;
    codigo?: string;
  } | null;

  abonos: PrestamoAbono[];
  totalAbonado: number;
}

export function usePrestamoDetalle(id: string, reloadKey: number = 0) {
  const [data, setData] = useState<PrestamoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 👇 Ajusta la ruta si usas otro path
        const res: any = await apiFetch<any>(`/financiamientos/${id}`);

        if (cancelled || !res) return;

        const clienteRaw = res.clienteId || res.cliente || null;
        const cobradorRaw = res.cobradorId || res.cobrador || null;
        const abonosRaw: any[] = Array.isArray(res.abonos)
          ? res.abonos
          : Array.isArray(res.abonosRecientes)
          ? res.abonosRecientes
          : [];

        const cliente =
          clienteRaw &&
          (clienteRaw._id || clienteRaw.id || clienteRaw.codigoCliente)
            ? {
                id: String(clienteRaw._id ?? clienteRaw.id ?? ""),
                nombreCompleto:
                  clienteRaw.nombreCompleto ||
                  [clienteRaw.nombres, clienteRaw.apellidos]
                    .filter(Boolean)
                    .join(" ") ||
                  "Cliente",
                identidadCliente:
                  clienteRaw.identidadCliente ?? clienteRaw.identidad,
                codigoCliente: clienteRaw.codigoCliente,
              }
            : null;

        const cobrador =
          cobradorRaw &&
          (cobradorRaw._id || cobradorRaw.id || cobradorRaw.codigo)
            ? {
                id: String(cobradorRaw._id ?? cobradorRaw.id ?? ""),
                nombreCompleto:
                  cobradorRaw.nombreCompleto ||
                  cobradorRaw.nombre ||
                  "Cobrador",
                codigo: cobradorRaw.codigo,
              }
            : null;

        const abonos: PrestamoAbono[] = abonosRaw.map((a: any) => ({
          id: String(a._id ?? a.id ?? ""),
          fecha: a.fechaAbono ?? a.fecha ?? new Date().toISOString(),
          monto: a.montoAbono ?? a.monto ?? 0,
          metodoPago: a.metodoPago ?? a.formaPago ?? undefined,
          recibo: a.numeroRecibo ?? a.recibo ?? undefined,
          usuarioRegistro: a.usuarioRegistro ?? undefined,
        }));

        const totalAbonado = abonos.reduce((acc, a) => acc + (a.monto || 0), 0);

        const detalle: PrestamoDetalle = {
          id: String(res._id ?? res.id ?? id),
          codigoFinanciamiento: res.codigoFinanciamiento ?? "",
          capitalInicial: res.capitalInicial ?? 0,
          saldoCapital: res.saldoCapital ?? 0,
          tasaInteresAnual:
            res.tasaInteresAnual ?? res.tasaInteres ?? undefined,
          estadoFinanciamiento: res.estadoFinanciamiento ?? "",
          fechaDesembolso: res.fechaDesembolso,
          fechaVencimiento: res.fechaVencimiento,
          cliente,
          cobrador,
          abonos,
          totalAbonado,
        };

        if (!cancelled) {
          setData(detalle);
        }
      } catch (err: any) {
        console.error("Error cargando detalle de préstamo:", err);
        if (!cancelled) {
          setError(err.message || "Error al cargar el préstamo");
          setData(null);
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
  }, [id, reloadKey]);

  return { data, loading, error };
}
