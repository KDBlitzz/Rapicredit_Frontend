"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export type EstadoPrestamoFiltro = "TODOS" | "VIGENTE" | "EN_MORA" | "PAGADO";

export interface PrestamoResumen {
  id: string;
  codigoFinanciamiento: string;
  clienteNombre: string;
  clienteIdentidad?: string;
  estadoFinanciamiento: string;
  capitalInicial: number;
  saldoCapital: number;
  fechaDesembolso?: string;
  fechaVencimiento?: string;
  cobradorNombre?: string;
}

export interface PrestamosFilters {
  busqueda: string;
  estado: EstadoPrestamoFiltro;
}

export function usePrestamos(filters: PrestamosFilters) {
  const [data, setData] = useState<PrestamoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 👇 Ajusta el path si tu backend usa otro prefijo (/prestamos)
        const res = await apiFetch<any[]>("/financiamientos");

        if (cancelled) return;

        const mapped: PrestamoResumen[] = (res || []).map((f: any) => {
          const cliente = f.clienteId || f.cliente || {};
          const cobrador = f.cobradorId || f.cobrador || {};

          const nombreCliente =
            cliente.nombreCompleto ||
            [cliente.nombres, cliente.apellidos].filter(Boolean).join(" ") ||
            cliente.razonSocial ||
            "Cliente";

          return {
            id: String(f._id ?? f.id ?? ""),
            codigoFinanciamiento: f.codigoFinanciamiento ?? "",
            clienteNombre: nombreCliente,
            clienteIdentidad:
              cliente.identidadCliente ?? cliente.identidad ?? undefined,
            estadoFinanciamiento: f.estadoFinanciamiento ?? "",
            capitalInicial: f.capitalInicial ?? 0,
            saldoCapital: f.saldoCapital ?? 0,
            fechaDesembolso: f.fechaDesembolso,
            fechaVencimiento: f.fechaVencimiento,
            cobradorNombre:
              cobrador.nombreCompleto ??
              cobrador.nombre ??
              cobrador.codigo ??
              undefined,
          };
        });

        setData(mapped);
      } catch (err: any) {
        console.error("Error cargando préstamos:", err);
        if (!cancelled) setError(err.message || "Error al cargar préstamos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔹 Filtros en memoria
  let filtrados = [...data];

  if (filters.estado !== "TODOS") {
    filtrados = filtrados.filter(
      (p) => p.estadoFinanciamiento.toUpperCase() === filters.estado
    );
  }

  if (filters.busqueda.trim()) {
    const q = filters.busqueda.trim().toLowerCase();
    filtrados = filtrados.filter((p) => {
      return (
        p.codigoFinanciamiento.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        (p.clienteIdentidad || "").toLowerCase().includes(q)
      );
    });
  }

  // Orden por fecha de desembolso (más recientes primero si viene fecha)
  filtrados.sort((a, b) => {
    const da = a.fechaDesembolso ? new Date(a.fechaDesembolso).getTime() : 0;
    const db = b.fechaDesembolso ? new Date(b.fechaDesembolso).getTime() : 0;
    return db - da;
  });

  return { data: filtrados, loading, error };
}
