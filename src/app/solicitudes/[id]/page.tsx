'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from '@mui/material';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';

interface SolicitudClienteRef {
  id: string;
  codigoCliente: string;
  nombreCompleto: string;
  identidadCliente?: string;
}

interface SolicitudHistorialItem {
  id: string;
  fecha?: string;
  accion: string;
  usuario?: string;
  comentario?: string;
}

interface SolicitudDetalle {
  id: string;
  codigoSolicitud: string;
  fechaSolicitud?: string;
  capitalSolicitado?: number;   // mapeamos también montoSolicitado
  plazoCuotas?: number | null;  // mapeamos también plazoMeses
  finalidadCredito?: string | null; // mapeamos también producto
  estadoSolicitud: string;
  observaciones?: string | null; // mapeamos también comentario
  cliente?: SolicitudClienteRef | null;
  historial?: SolicitudHistorialItem[];
}

const SolicitudDetallePage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : 'L. 0.00';

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

  const renderEstadoChip = (estado: string) => {
    const val = (estado || '').toUpperCase();
    let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'info';

    if (val === 'REGISTRADA') color = 'info';
    else if (val === 'EN_REVISION') color = 'warning';
    else if (val === 'APROBADA') color = 'success';
    else if (val === 'RECHAZADA') color = 'error';

    return (
      <Chip size="small" label={val || '—'} color={color} variant="outlined" />
    );
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await apiFetch(`/solicitudes/${id}`);

        if (cancelled || !res) return;

        const cliente: SolicitudClienteRef | null = res.cliente
          ? {
              id: String(res.cliente.id ?? res.cliente._id ?? ''),
              codigoCliente: res.cliente.codigoCliente ?? '',
              nombreCompleto:
                res.cliente.nombreCompleto ??
                [res.cliente.nombre, res.cliente.apellido]
                  .filter(Boolean)
                  .join(' ') ??
                'Cliente',
              identidadCliente: res.cliente.identidadCliente ?? undefined,
            }
          : null;

        const historial: SolicitudHistorialItem[] = Array.isArray(res.historial)
          ? res.historial.map((h: any, idx: number) => ({
              id: String(h.id ?? h._id ?? idx),
              fecha: h.fecha,
              accion: h.accion ?? '',
              usuario: h.usuario ?? undefined,
              comentario: h.comentario ?? undefined,
            }))
          : [];

        const detalle: SolicitudDetalle = {
          id: String(res._id ?? res.id ?? id),
          codigoSolicitud: res.codigoSolicitud ?? '',
          fechaSolicitud: res.fechaSolicitud,

          // Soporta tanto los nombres viejos como los nuevos
          capitalSolicitado:
            res.capitalSolicitado ?? res.montoSolicitado ?? 0,
          plazoCuotas: res.plazoCuotas ?? res.plazoMeses ?? null,
          finalidadCredito: res.finalidadCredito ?? res.producto ?? null,
          estadoSolicitud: res.estadoSolicitud ?? res.estado ?? 'REGISTRADA',
          observaciones: res.observaciones ?? res.comentario ?? null,

          cliente,
          historial,
        };

        if (!cancelled) {
          setData(detalle);
        }
      } catch (err: any) {
        console.error('Error cargando solicitud:', err);
        if (!cancelled) {
          setError(err.message || 'Error al cargar la solicitud.');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading && !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          No se pudo cargar la información de la solicitud.
        </Typography>
      </Box>
    );
  }

  const {
    codigoSolicitud,
    fechaSolicitud,
    capitalSolicitado,
    plazoCuotas,
    finalidadCredito,
    estadoSolicitud,
    observaciones,
    cliente,
    historial,
  } = data;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6">
            Solicitud {codigoSolicitud || ''}
          </Typography>
          <Box
            sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}
          >
            {renderEstadoChip(estadoSolicitud)}
            <Typography variant="caption" color="text.secondary">
              Fecha: {formatDate(fechaSolicitud)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {cliente && (
            <Button
              size="small"
              variant="outlined"
              component={Link}
              href={`/clientes/${cliente.id}`}
            >
              Ver cliente
            </Button>
          )}
          <Button size="small" variant="outlined" component={Link} href="/solicitudes">
            Volver a lista
          </Button>
        </Box>
      </Box>

      {/* Datos principales */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos de la solicitud
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Capital solicitado
                </Typography>
                <Typography>{formatMoney(capitalSolicitado)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Finalidad del crédito
                </Typography>
                <Typography>{finalidadCredito || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Plazo (cuotas)
                </Typography>
                <Typography>{plazoCuotas ?? '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Observaciones
                </Typography>
                <Typography>{observaciones || '—'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos del cliente
            </Typography>
            {cliente ? (
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Nombre
                  </Typography>
                  <Typography>{cliente.nombreCompleto}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Identidad
                  </Typography>
                  <Typography>
                    {cliente.identidadCliente || 'No registrada'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Código cliente
                  </Typography>
                  <Typography>{cliente.codigoCliente || '—'}</Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2">
                La solicitud no tiene cliente asociado.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Historial */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Historial de cambios
        </Typography>
        <TableContainer sx={{ maxHeight: 280 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Comentario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial && historial.length > 0 ? (
                historial.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{formatDate(h.fecha)}</TableCell>
                    <TableCell>{h.accion}</TableCell>
                    <TableCell>{h.usuario || '—'}</TableCell>
                    <TableCell>{h.comentario || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay historial registrado para esta solicitud.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SolicitudDetallePage;
