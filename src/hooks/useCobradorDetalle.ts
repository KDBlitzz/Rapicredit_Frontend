"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export interface PrestamoCobradorResumen {
  id: string;
  codigoFinanciamiento: string;
  clienteNombre: string;
  zona?: string;
  estadoFinanciamiento: string;
  saldoCapital: number;
  fechaDesembolso?: string;
  fechaVencimiento?: string;
}

export interface AbonoCobradorResumen {
  id: string;
  fecha: string;
  monto: number;
  codigoFinanciamiento: string;
  clienteNombre: string;
  metodoPago?: string;
}

export interface CobradorDetalle {
  id: string;
  codigo?: string;
  nombreCompleto: string;
  telefono?: string;
  correo?: string;
  zona?: string;
  estado?: string;
  fechaRegistro?: string;

  cantidadPrestamos: number;
  saldoCartera: number;
  saldoEnMora: number;

  prestamos: PrestamoCobradorResumen[];
  abonosRecientes: AbonoCobradorResumen[];
}

/**
 * Espera que el backend tenga algo como:
 * GET /cobradores/:id
 * {
 *   _id, codigo, nombreCompleto, telefono, correo, zona, estado, fechaRegistro,
 *   prestamos: [...],
 *   abonosRecientes: [...]
 * }
 */
export function useCobradorDetalle(id: string) {
  const [data, setData] = useState<CobradorDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res: any = await apiFetch<any>(`/cobradores/${id}`);
        if (cancelled || !res) return;

        const prestamosApi = Array.isArray(res.prestamos) ? res.prestamos : [];
        const abonosApi = Array.isArray(res.abonosRecientes)
          ? res.abonosRecientes
          : Array.isArray(res.abonos)
          ? res.abonos
          : [];

        const cantidadPrestamos = prestamosApi.length;
        const saldoCartera = prestamosApi.reduce(
          (acc: number, p: any) => acc + (p.saldoCapital ?? 0),
          0
        );
        const saldoEnMora = prestamosApi
          .filter(
            (p: any) =>
              (p.estadoFinanciamiento || "").toUpperCase() === "EN_MORA"
          )
          .reduce((acc: number, p: any) => acc + (p.saldoCapital ?? 0), 0);

        const prestamos: PrestamoCobradorResumen[] = prestamosApi.map(
          (p: any) => {
            const cliente = p.clienteId || p.cliente || {};
            const nombreCliente =
              cliente.nombreCompleto ||
              [cliente.nombres, cliente.apellidos].filter(Boolean).join(" ") ||
              cliente.razonSocial ||
              "Cliente";

            return {
              id: String(p._id ?? p.id ?? ""),
              codigoFinanciamiento: p.codigoFinanciamiento ?? "",
              clienteNombre: nombreCliente,
              zona: p.zona ?? cliente.zona ?? undefined,
              estadoFinanciamiento: p.estadoFinanciamiento ?? "",
              saldoCapital: p.saldoCapital ?? 0,
              fechaDesembolso: p.fechaDesembolso,
              fechaVencimiento: p.fechaVencimiento,
            };
          }
        );

        const abonosRecientes: AbonoCobradorResumen[] = abonosApi.map(
          (a: any) => {
            const cliente = a.clienteId || a.cliente || {};
            const nombreCliente =
              cliente.nombreCompleto ||
              [cliente.nombres, cliente.apellidos].filter(Boolean).join(" ") ||
              "Cliente";

            const financiamiento = a.financiamientoId || a.financiamiento || {};

            return {
              id: String(a._id ?? a.id ?? ""),
              fecha: a.fechaAbono ?? a.fecha ?? new Date().toISOString(),
              monto: a.montoAbono ?? a.monto ?? 0,
              codigoFinanciamiento:
                financiamiento.codigoFinanciamiento ??
                a.codigoFinanciamiento ??
                "",
              clienteNombre: nombreCliente,
              metodoPago: a.metodoPago ?? a.formaPago ?? undefined,
            };
          }
        );

        const detalle: CobradorDetalle = {
          id: String(res._id ?? res.id ?? id),
          codigo: res.codigo,
          nombreCompleto:
            res.nombreCompleto ||
            [res.nombres, res.apellidos].filter(Boolean).join(" ") ||
            "Cobrador",
          telefono: res.telefono,
          correo: res.correo,
          zona: res.zona,
          estado: res.estado,
          fechaRegistro: res.fechaRegistro,
          cantidadPrestamos,
          saldoCartera,
          saldoEnMora,
          prestamos,
          abonosRecientes,
        };

        if (!cancelled) {
          setData(detalle);
        }
      } catch (err) {
        console.error("Error cargando detalle de cobrador:", err);
        if (!cancelled) {
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
  }, [id]);

  return { data, loading };
}
