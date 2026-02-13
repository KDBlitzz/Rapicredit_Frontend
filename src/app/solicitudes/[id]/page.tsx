'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  TextField,
  Snackbar,
  Alert,
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
  const searchParams = useSearchParams();

  const initialEditMode = useMemo(() => {
    const v = (searchParams?.get('edit') || '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }, [searchParams]);

  const [data, setData] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [editMode, setEditMode] = useState<boolean>(initialEditMode);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    capitalSolicitado: '',
    plazoCuotas: '',
    finalidadCredito: '',
    observaciones: '',
    fechaSolicitud: '',
  });

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

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
  }, [id, refreshKey]);

  useEffect(() => {
    if (!data) return;
    const dateValue = (() => {
      const raw = data.fechaSolicitud;
      if (!raw) return '';
      try {
        // raw normalmente viene como ISO; para input date necesitamos YYYY-MM-DD
        const iso = typeof raw === 'string' ? raw : String(raw);
        return iso.length >= 10 ? iso.slice(0, 10) : '';
      } catch {
        return '';
      }
    })();

    setForm({
      capitalSolicitado: data.capitalSolicitado != null ? String(data.capitalSolicitado) : '',
      plazoCuotas: data.plazoCuotas != null ? String(data.plazoCuotas) : '',
      finalidadCredito: data.finalidadCredito ? String(data.finalidadCredito) : '',
      observaciones: data.observaciones ? String(data.observaciones) : '',
      fechaSolicitud: dateValue,
    });
  }, [data]);

  const onChangeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCancelEdit = () => {
    if (saving) return;
    setEditMode(false);
    // reset al estado actual
    if (data) {
      const dateValue = data.fechaSolicitud ? String(data.fechaSolicitud).slice(0, 10) : '';
      setForm({
        capitalSolicitado: data.capitalSolicitado != null ? String(data.capitalSolicitado) : '',
        plazoCuotas: data.plazoCuotas != null ? String(data.plazoCuotas) : '',
        finalidadCredito: data.finalidadCredito ? String(data.finalidadCredito) : '',
        observaciones: data.observaciones ? String(data.observaciones) : '',
        fechaSolicitud: dateValue,
      });
    }
  };

  const onSave = async () => {
    if (!data) return;
    const codigo = data.codigoSolicitud || id;
    if (!codigo) return;

    const toFiniteNumber = (v: string): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const payload: Record<string, unknown> = {};
    if (form.capitalSolicitado.trim() !== '') {
      const n = toFiniteNumber(form.capitalSolicitado);
      if (n == null || n <= 0) {
        setToastSeverity('error');
        setToastMessage('El capital solicitado debe ser mayor a cero.');
        setToastOpen(true);
        return;
      }
      payload.capitalSolicitado = n;
    }

    if (form.plazoCuotas.trim() !== '') {
      const n = toFiniteNumber(form.plazoCuotas);
      if (n == null || n <= 0) {
        setToastSeverity('error');
        setToastMessage('El plazo de cuotas debe ser mayor a cero.');
        setToastOpen(true);
        return;
      }
      payload.plazoCuotas = n;
    }

    if (form.finalidadCredito.trim() !== '') payload.finalidadCredito = form.finalidadCredito.trim();
    payload.observaciones = form.observaciones ?? '';
    if (form.fechaSolicitud) payload.fechaSolicitud = form.fechaSolicitud;

    setSaving(true);
    try {
      await apiFetch(`/solicitudes/${encodeURIComponent(codigo)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setToastSeverity('success');
      setToastMessage('Solicitud actualizada.');
      setToastOpen(true);
      setEditMode(false);
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity('error');
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar la solicitud.';
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

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

          {editMode ? (
            <>
              <Button size="small" variant="contained" onClick={onSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button size="small" variant="contained" onClick={() => setEditMode(true)}>
              Editar
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
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    name="capitalSolicitado"
                    value={form.capitalSolicitado}
                    onChange={onChangeForm}
                    inputProps={{ inputMode: 'decimal', step: '0.01' }}
                  />
                ) : (
                  <Typography>{formatMoney(capitalSolicitado)}</Typography>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Finalidad del crédito
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    name="finalidadCredito"
                    value={form.finalidadCredito}
                    onChange={onChangeForm}
                    placeholder="Finalidad del crédito"
                  />
                ) : (
                  <Typography>{finalidadCredito || '—'}</Typography>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Plazo (cuotas)
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    name="plazoCuotas"
                    value={form.plazoCuotas}
                    onChange={onChangeForm}
                    inputProps={{ inputMode: 'numeric', step: '1' }}
                  />
                ) : (
                  <Typography>{plazoCuotas ?? '—'}</Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Observaciones
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    name="observaciones"
                    value={form.observaciones}
                    onChange={onChangeForm}
                    placeholder="Observaciones"
                  />
                ) : (
                  <Typography>{observaciones || '—'}</Typography>
                )}
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

      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SolicitudDetallePage;
