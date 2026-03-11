'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Divider,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { usePagos, EstadoPagoFiltro, type PagoResumen } from '../../hooks/usePagos';
import { usePermisos } from '../../hooks/usePermisos';
import { usePrestamoDetalle } from '../../hooks/usePrestamoDetalle';
import { usePrestamosAsignados } from '../../hooks/usePrestamosAsignados';
import { apiFetch } from '../../lib/api';

const COMPROBANTE_STORAGE_KEY = 'rapicredit:comprobanteAbono';

const emptyForm = {
  codigoPrestamo: '',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  medioPago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO',
  referencia: '',
  observaciones: '',
};

type FormState = typeof emptyForm;

export default function PagosPage() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoPagoFiltro>('TODOS');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogPago, setDialogPago] = useState<PagoResumen | null>(null);
  const [dialogNuevo, setDialogNuevo] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    data: prestamosAsignados,
    loading: loadingPrestamosAsignados,
    error: errorPrestamosAsignados,
  } = usePrestamosAsignados({ refreshKey });

  const prestamosDisponibles = useMemo(
    () => prestamosAsignados.filter((p) => (p.estadoPrestamo || '').toUpperCase() !== 'CERRADO'),
    [prestamosAsignados]
  );

  const allowedFinanciamientoIds = useMemo(
    () => prestamosAsignados.map((p) => p.id),
    [prestamosAsignados]
  );
  const allowedCodigosPrestamo = useMemo(
    () => prestamosAsignados.map((p) => p.codigoPrestamo),
    [prestamosAsignados]
  );

  const { data, loading, error } = usePagos(
    { busqueda, estado },
    { refreshKey, allowedFinanciamientoIds, allowedCodigosPrestamo, enforceAllowedFilter: true }
  );
  const { hasAnyPermiso, hasPermiso, loading: loadingPermisos, empleado } = usePermisos();
  const { data: prestamoDetalle, loading: loadingDetalle } = usePrestamoDetalle(
    form.codigoPrestamo || ''
  );

  const canVerModuloPagos = hasAnyPermiso(['F005', 'F009']);
  const canAplicarPago = hasPermiso('F005');

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEstado(e.target.value as EstadoPagoFiltro);
  };

  const handleOpenNuevo = () => {
    setForm(emptyForm);
    setFormError(null);
    setDialogNuevo(true);
  };

  const handleCloseNuevo = () => {
    setDialogNuevo(false);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'monto') {
      const normalized = value.replace(',', '.');
      if (normalized !== '' && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
      setForm((prev) => ({ ...prev, monto: normalized }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.codigoPrestamo || !form.monto || !form.fecha) {
      setFormError('Por favor completa los campos requeridos');
      return;
    }

    const monto = Number(form.monto);
    if (Number.isNaN(monto) || monto < 0) {
      setFormError('El monto no puede ser negativo');
      return;
    }

    setSaving(true);
    try {
      const selected = prestamosDisponibles.find((p) => p.codigoPrestamo === form.codigoPrestamo);
      if (!selected?.id) {
        setFormError('Selecciona un préstamo válido para registrar el pago');
        return;
      }

      const clienteId = prestamoDetalle?.cliente?.id || prestamoDetalle?.clienteId;
      if (!clienteId) {
        setFormError('No se pudo determinar el cliente del préstamo seleccionado');
        return;
      }

      const cobradorId = empleado?._id;
      if (!cobradorId) {
        setFormError('No se pudo determinar el cobrador actual para registrar el pago');
        return;
      }

      const applyRes = await apiFetch<unknown>(`/prestamos/id/${selected.id}/aplicar-pago`, {
        method: 'POST',
        body: JSON.stringify({
          prestamoId: selected.id,
          clienteId,
          cobradorId,
          montoPago: monto,
          fechaPago: form.fecha,
          metodoPago: form.medioPago,
          observaciones: form.observaciones || undefined,
        }),
      });

      // Comprobante
      try {
        const pickString = (...vals: unknown[]) => {
          for (const v of vals) {
            if (typeof v === 'string' && v.trim()) return v.trim();
            if (typeof v === 'number' && Number.isFinite(v)) return String(v);
          }
          return '';
        };

        const resObj = applyRes && typeof applyRes === 'object' ? (applyRes as Record<string, unknown>) : null;
        const pagoObj =
          resObj && resObj['pago'] && typeof resObj['pago'] === 'object'
            ? (resObj['pago'] as Record<string, unknown>)
            : null;

        const pagoId = pickString(
          pagoObj?._id,
          pagoObj?.id,
          resObj?._id,
          resObj?.id,
          resObj?.pagoId
        );

        const numeroComprobante = pickString(
          pagoObj?.numeroComprobante,
          pagoObj?.recibo,
          pagoObj?.referencia,
          resObj?.numeroComprobante,
          resObj?.recibo,
          resObj?.referencia
        );

        const clienteNombre =
          prestamoDetalle?.cliente?.nombreCompleto ||
          selected.clienteNombre ||
          '—';
        const asesorNombre = empleado?.nombreCompleto || empleado?.usuario || '—';
        const saldoPendiente =
          prestamoDetalle?.saldo ??
          prestamoDetalle?.saldoActual ??
          prestamoDetalle?.saldoPendiente ??
          0;

        const comprobante = {
          pagoId: pagoId || undefined,
          recibo: numeroComprobante || String(Date.now()).slice(-5),
          codigoPrestamo: form.codigoPrestamo,
          fecha: form.fecha,
          cliente: clienteNombre.toUpperCase(),
          asesor: asesorNombre.toUpperCase(),
          metodoPago: String(form.medioPago || '').toUpperCase(),
          referencia: numeroComprobante || undefined,
          observaciones: form.observaciones || undefined,
          monto,
          saldoPendiente,
          cuotasPendientes: 0,
          cuotasPagadas: [
            {
              numero: 1,
              cuota: prestamoDetalle?.cuotaFija ?? 0,
              pago: monto,
              multa: 0,
            },
          ],
        };

        sessionStorage.setItem(COMPROBANTE_STORAGE_KEY, JSON.stringify(comprobante));
      } catch {
        // Ignorar
      }

      setSnackbar({ type: 'success', message: 'Pago registrado exitosamente' });
      handleCloseNuevo();
      setRefreshKey((k) => k + 1);

      {
        const resObj = applyRes && typeof applyRes === 'object' ? (applyRes as Record<string, unknown>) : null;
        const pagoObj =
          resObj && resObj['pago'] && typeof resObj['pago'] === 'object'
            ? (resObj['pago'] as Record<string, unknown>)
            : null;

        const ref =
          (typeof pagoObj?._id === 'string' && pagoObj._id.trim())
            ? pagoObj._id.trim()
            : (typeof pagoObj?.id === 'string' && pagoObj.id.trim())
              ? pagoObj.id.trim()
              : (typeof resObj?._id === 'string' && resObj._id.trim())
                ? resObj._id.trim()
                : (typeof resObj?.id === 'string' && resObj.id.trim())
                  ? resObj.id.trim()
                  : (typeof resObj?.pagoId === 'string' && resObj.pagoId.trim())
                    ? resObj.pagoId.trim()
                    : '';

        router.push(ref ? `/pagos/${encodeURIComponent(ref)}/comprobante` : '/pagos/comprobante');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo registrar el pago';
      setSnackbar({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : 'L. 0.00';

  const parsePaymentDate = (value?: string) => {
    if (!value) return null;

    // Evita desfase horario cuando viene como YYYY-MM-DD (sin zona horaria).
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatDate = (iso?: string) => {
    const parsed = parsePaymentDate(iso);
    return parsed ? parsed.toLocaleDateString('es-HN') : '-';
  };

  const formatTime = (iso?: string) => {
    const parsed = parsePaymentDate(iso);
    return parsed
      ? parsed.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })
      : '-';
  };

  const clientePorPrestamo = useMemo(() => {
    const map = new Map<string, string>();

    for (const prestamo of prestamosAsignados) {
      const nombre = (prestamo.clienteNombre || '').trim();
      if (!nombre) continue;
      if (prestamo.id) map.set(`id:${prestamo.id}`, nombre);
      if (prestamo.codigoPrestamo) map.set(`cod:${prestamo.codigoPrestamo}`, nombre);
    }

    return map;
  }, [prestamosAsignados]);

  const getClientePago = (pago: {
    clienteNombre?: string;
    prestamoId?: string;
    financiamientoId?: string;
    codigoPrestamo?: string;
  }) => {
    const directo = (pago.clienteNombre || '').trim();
    if (directo && directo !== '—') return directo;

    const byId =
      (pago.financiamientoId && clientePorPrestamo.get(`id:${pago.financiamientoId}`)) ||
      (pago.prestamoId && clientePorPrestamo.get(`id:${pago.prestamoId}`));
    if (byId) return byId;

    const byCodigo = pago.codigoPrestamo
      ? clientePorPrestamo.get(`cod:${pago.codigoPrestamo}`)
      : undefined;
    return byCodigo || '—';
  };

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || 'APLICADO').toUpperCase();
    let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'info';

    if (val === 'APLICADO') color = 'success';
    else if (val === 'PENDIENTE') color = 'warning';
    else if (val === 'RECHAZADO') color = 'error';

    return <Chip label={val} color={color} size="small" />;
  };

  const formatMedioPago = (medio?: string) => {
    const value = (medio || '').toUpperCase();
    if (value === 'EFECTIVO') return 'Efectivo';
    if (value === 'TRANSFERENCIA') return 'Transferencia';
    if (value === 'CREDITO') return 'Crédito';
    return medio || '-';
  };

  useEffect(() => {
    if (!dialogNuevo) return;

    setForm((prev) => {
      if (!prev.codigoPrestamo) return prev;
      const existe = prestamosDisponibles.some((p) => p.codigoPrestamo === prev.codigoPrestamo);
      return existe ? prev : { ...prev, codigoPrestamo: '' };
    });
  }, [dialogNuevo, prestamosDisponibles]);

  if (!loadingPermisos && !canVerModuloPagos) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sin permisos para Pagos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No tiene permisos asignados para registrar o consultar pagos.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Pagos
        </Typography>
        {canAplicarPago && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 999 }}
            onClick={handleOpenNuevo}
          >
            Registrar Pago
          </Button>
        )}
      </Box>

      {/* Filtros y búsqueda */}
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar por préstamo, cliente o referencia"
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Ej: PREST-001, Juan López"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              size="small"
              label="Estado"
              value={estado}
              onChange={handleEstadoChange}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="APLICADO">Aplicado</MenuItem>
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="RECHAZADO">Rechazado</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de préstamos asignados al asesor actual */}
      <Paper>
        {errorPrestamosAsignados && (
          <Alert severity="error" sx={{ m: 2 }}>
            {errorPrestamosAsignados}
          </Alert>
        )}

        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Préstamos asignados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona uno de estos préstamos al registrar un pago.
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>Código Préstamo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Capital
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Cuota Fija
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingPrestamosAsignados ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : prestamosAsignados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay préstamos asignados para este asesor.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prestamosAsignados.map((prestamo) => (
                  <TableRow key={prestamo.id} hover>
                    <TableCell>{prestamo.codigoPrestamo}</TableCell>
                    <TableCell>{prestamo.clienteNombre}</TableCell>
                    <TableCell>{prestamo.estadoPrestamo || '—'}</TableCell>
                    <TableCell align="center">{formatMoney(prestamo.capitalSolicitado)}</TableCell>
                    <TableCell align="center">{formatMoney(prestamo.cuotaFija)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tabla de abonos */}
      <Paper>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hora</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Monto
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Medio de Pago</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay pagos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((pago) => (
                  <TableRow key={pago.id} hover>
                    <TableCell>{formatDate(pago.fecha)}</TableCell>
                    <TableCell>{formatTime(pago.fecha)}</TableCell>
                    <TableCell>{getClientePago(pago)}</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                        {formatMoney(pago.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatMedioPago(pago.medioPago)}</TableCell>
                    <TableCell>{renderEstadoChip(pago.estadoPago)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setDialogPago(pago)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog - Detalles del pago */}
      <Dialog
        open={!!dialogPago}
        onClose={() => setDialogPago(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalles del Pago</DialogTitle>
        <DialogContent>
          {dialogPago && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Préstamo
                </Typography>
                <Typography variant="body2">{dialogPago.codigoPrestamo}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="body2">{getClientePago(dialogPago)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Monto
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatMoney(dialogPago.monto)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Fecha y Hora
                </Typography>
                <Typography variant="body2">
                  {formatDate(dialogPago.fecha)} {formatTime(dialogPago.fecha)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Medio de Pago
                </Typography>
                <Typography variant="body2">{formatMedioPago(dialogPago.medioPago)}</Typography>
              </Box>
              {dialogPago.referencia && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Referencia / Recibo
                  </Typography>
                  <Typography variant="body2">{dialogPago.referencia}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                {renderEstadoChip(dialogPago.estadoPago)}
              </Box>
              {dialogPago.observaciones && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body2">{dialogPago.observaciones}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
            {dialogPago ? (
              <Button
                variant="outlined"
                onClick={() => {
                  try {
                    const asesorNombre = empleado?.nombreCompleto || empleado?.usuario || '—';
                    const recibo = String(
                      dialogPago.referencia ||
                        dialogPago.codigoPago ||
                        dialogPago.id ||
                        String(Date.now()).slice(-5)
                    );
                    const comprobante = {
                      pagoId: String(dialogPago.id || ''),
                      recibo,
                      codigoPrestamo: String(dialogPago.codigoPrestamo || ''),
                      fecha: String(dialogPago.fecha || new Date().toISOString()),
                      cliente: String(getClientePago(dialogPago) || '—').toUpperCase(),
                      asesor: String(asesorNombre).toUpperCase(),
                      metodoPago: String(dialogPago.medioPago || '').toUpperCase(),
                      referencia: dialogPago.referencia ? String(dialogPago.referencia) : undefined,
                      observaciones: dialogPago.observaciones ? String(dialogPago.observaciones) : undefined,
                      monto: Number(dialogPago.monto || 0),
                      saldoPendiente: 0,
                      cuotasPendientes: 0,
                      cuotasPagadas: [
                        {
                          numero: 1,
                          cuota: 0,
                          pago: Number(dialogPago.monto || 0),
                          multa: 0,
                        },
                      ],
                    };
                    sessionStorage.setItem(COMPROBANTE_STORAGE_KEY, JSON.stringify(comprobante));
                  } catch {
                    // Ignorar
                  }
                  const ref = String(dialogPago.id || '').trim();
                  router.push(ref ? `/pagos/${encodeURIComponent(ref)}/comprobante` : '/pagos/comprobante');
                }}
              >
                Comprobante
              </Button>
            ) : null}
          <Button onClick={() => setDialogPago(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog - Nuevo Pago */}
      <Dialog open={dialogNuevo} onClose={handleCloseNuevo} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Nuevo Pago</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
              {formError}
            </Alert>
          )}

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              {/* Formulario - Columna Izquierda */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Datos del Pago
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      select
                      label="Código de Préstamo *"
                      name="codigoPrestamo"
                      value={form.codigoPrestamo}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving || loadingPrestamosAsignados || prestamosDisponibles.length === 0}
                      helperText={
                        loadingPrestamosAsignados
                          ? 'Cargando préstamos asignados...'
                          : prestamosDisponibles.length === 0
                          ? 'No tienes préstamos vigentes para registrar pagos.'
                          : 'Selecciona un préstamo asignado al asesor actual (solo vigentes).'
                      }
                    >
                      {prestamosDisponibles.map((prestamo) => (
                        <MenuItem key={prestamo.id} value={prestamo.codigoPrestamo}>
                          {prestamo.codigoPrestamo} — {prestamo.clienteNombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Monto *"
                      name="monto"
                      type="number"
                      value={form.monto}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving}
                      inputProps={{ step: '0.01', min: '0' }}
                      placeholder="0.00"
                      helperText="Permite decimales. No se permiten montos negativos."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Fecha *"
                      name="fecha"
                      type="date"
                      value={form.fecha}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Medio de Pago *"
                      name="medioPago"
                      value={form.medioPago}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving}
                    >
                      <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                      <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                      <MenuItem value="CREDITO">Crédito</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Observaciones"
                      name="observaciones"
                      value={form.observaciones}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving}
                      placeholder="Notas adicionales sobre el pago..."
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Detalles del Financiamiento - Columna Derecha */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Detalles del Financiamiento
                </Typography>

                {loadingDetalle ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : prestamoDetalle ? (
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cliente
                          </Typography>
                          <Typography variant="body2">
                            {prestamoDetalle.cliente?.nombreCompleto || 'No asignado'}
                          </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Capital Solicitado
                            </Typography>
                            <Typography variant="body2">
                              {formatMoney(prestamoDetalle.capitalSolicitado)}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Cuota Fija
                            </Typography>
                            <Typography variant="body2">
                              {formatMoney(prestamoDetalle.cuotaFija)}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Plazo
                            </Typography>
                            <Typography variant="body2">
                              {prestamoDetalle.plazoCuotas} cuotas
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Frecuencia
                            </Typography>
                            <Typography variant="body2">
                              {prestamoDetalle.frecuenciaPago || '-'}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Desembolso
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(prestamoDetalle.fechaDesembolso)}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Vencimiento
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(prestamoDetalle.fechaVencimiento)}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Saldo Pendiente por Pagar
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {(() => {
                                if (prestamoDetalle.saldoPendiente != null) {
                                  return formatMoney(prestamoDetalle.saldoPendiente);
                                }
                                if (prestamoDetalle.saldo != null) {
                                  return formatMoney(prestamoDetalle.saldo);
                                }
                                if (prestamoDetalle.saldoActual != null) {
                                  return formatMoney(prestamoDetalle.saldoActual);
                                }
                                const capital = prestamoDetalle.capitalSolicitado ?? 0;
                                const intereses = prestamoDetalle.totalIntereses ?? 0;
                                const pagado = prestamoDetalle.totalPagado ?? 0;
                                return formatMoney(capital + intereses - pagado);
                              })()}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Intereses
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {formatMoney(prestamoDetalle.totalIntereses ?? 0)}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider />

                        <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Estado
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {prestamoDetalle.estadoPrestamo || 'VIGENTE'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                          Selecciona un préstamo para ver los detalles
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNuevo} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Registrar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de feedback */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
