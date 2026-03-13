'use client';

import { apiFetch } from '../lib/api';

export type MetodoPago = 'EFECTIVO' | 'CREDITO' | 'TRANSFERENCIA' | (string & {});

export type AsesorRef = {
  id: string;
  codigoUsuario: string;
  nombreCompleto: string;
  usuario?: string;
};

export type CajaCuadreResponse = {
  desde: string | null;
  hasta: string | null;
  totales: {
    cantidadPagos: number;
    totalMonto: number;
    totalMora: number;
    totalInteres: number;
    totalCapital: number;
  };
  porMetodo: Array<{
    metodoPago: MetodoPago;
    cantidadPagos: number;
    totalMonto: number;
  }>;
  porAsesor: Array<{
    cobradorId: string;
    cantidadPagos: number;
    totalMonto: number;
    totalMora: number;
    totalInteres: number;
    totalCapital: number;
    asesor: AsesorRef | null;
  }>;
};

export type Pago = {
  _id?: string;
  fechaPago?: string;
  montoPago?: number;
  metodoPago?: MetodoPago;
  numeroComprobante?: string;
  observaciones?: string;
  estado?: string;
  prestamoId?:
    | string
    | {
        codigoPrestamo?: string;
        [key: string]: unknown;
      };
  clienteId?:
    | string
    | {
        codigoCliente?: string;
        identidadCliente?: string;
        [key: string]: unknown;
      };
  cobradorId?:
    | string
    | {
        _id?: string;
        id?: string;
        codigoUsuario?: string;
        nombreCompleto?: string;
        usuario?: string;
        [key: string]: unknown;
      };
  [key: string]: unknown;
};

export type CajaPagosResponse = {
  desde: string | null;
  hasta: string | null;
  total: number;
  pagos: Pago[];
  cobradorId?: string;
};

export type MoraDetalleItem = {
  prestamoId: string;
  codigoPrestamo: string;
  fechaVencimiento: string;
  saldoCapital: number;
  totalMoraPlan: number;
  totalMoraCobrada: number;
  cliente: { id: string; codigoCliente: string; identidadCliente: string } | null;
  asesor: AsesorRef | null;
  totalPago: number;
  ultimoPago: string | null;
  depositoAnticipado: number;
  haPagado: boolean;
};

export type CajaMoraResponse = {
  dias: number;
  cantidad: number;
  porAsesor: Array<{
    asesor: AsesorRef | null;
    totalMoraPlan: number;
    totalMoraCobrada: number;
    totalPago: number;
    totalDepositoAnticipado: number;
    clientesConPago: number;
    detalle: MoraDetalleItem[];
  }>;
};

export const cajaApi = {
  async getCuadre(params: { desde: string; hasta: string }): Promise<CajaCuadreResponse> {
    const qs = new URLSearchParams();
    qs.set('desde', params.desde);
    qs.set('hasta', params.hasta);
    return await apiFetch<CajaCuadreResponse>(`/api/caja/cuadre?${qs.toString()}`);
  },

  async getPagos(params: { desde: string; hasta: string }): Promise<CajaPagosResponse> {
    const qs = new URLSearchParams();
    qs.set('desde', params.desde);
    qs.set('hasta', params.hasta);
    return await apiFetch<CajaPagosResponse>(`/api/caja/pagos?${qs.toString()}`);
  },

  async getPagosPorAsesor(
    cobradorId: string,
    params: { desde: string; hasta: string }
  ): Promise<CajaPagosResponse> {
    const qs = new URLSearchParams();
    qs.set('desde', params.desde);
    qs.set('hasta', params.hasta);
    return await apiFetch<CajaPagosResponse>(
      `/api/caja/pagos/asesor/${encodeURIComponent(cobradorId)}?${qs.toString()}`
    );
  },

  async getMoraDetallada(params?: { dias?: number }): Promise<CajaMoraResponse> {
    const dias = params?.dias ?? 30;
    const qs = new URLSearchParams();
    qs.set('dias', String(dias));
    return await apiFetch<CajaMoraResponse>(`/api/caja/mora?${qs.toString()}`);
  },
};
