'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { usePagos, EstadoPagoFiltro } from '../../hooks/usePagos';
import { usePermisos } from '../../hooks/usePermisos';
import { usePrestamoDetalle } from '../../hooks/usePrestamoDetalle';
import { usePrestamosAsignados } from '../../hooks/usePrestamosAsignados';
import { apiFetch } from '../../lib/api';

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
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoPagoFiltro>('TODOS');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogPago, setDialogPago] = useState<any>(null);
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
  const { hasAnyPermiso, hasPermiso, loading: loadingPermisos } = usePermisos();
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
      const onlyDigits = value.replace(/\D/g, '');
      setForm((prev) => ({ ...prev, monto: onlyDigits }));
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
    if (Number.isNaN(monto) || monto <= 0 || !Number.isInteger(monto) || monto % 100 !== 0) {
      setFormError('El monto debe ser un número entero en intervalos de 100 (100, 200, 300...)');
      return;
    }

    setSaving(true);
    try {
      const selected = prestamosAsignados.find((p) => p.codigoPrestamo === form.codigoPrestamo);
      if (!selected?.id) {
        setFormError('Selecciona un préstamo válido para registrar el pago');
        return;
      }

      await apiFetch('/pagos', {
        method: 'POST',
        body: JSON.stringify({
          financiamientoId: selected.id,
          codigoFinanciamiento: form.codigoPrestamo,
          monto,
          fechaPago: form.fecha,
          metodoPago: form.medioPago,
          observaciones: form.observaciones || undefined,
        }),
      });

      setSnackbar({ type: 'success', message: 'Pago registrado exitosamente' });
      handleCloseNuevo();
      setRefreshKey((k) => k + 1);
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

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

  const formatTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : '-';

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
      const existe = prestamosAsignados.some((p) => p.codigoPrestamo === prev.codigoPrestamo);
      return existe ? prev : { ...prev, codigoPrestamo: '' };
    });
  }, [dialogNuevo, prestamosAsignados]);

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
                <TableCell sx={{ fontWeight: 600 }}>ID Pago</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hora</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Préstamo</TableCell>
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
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay pagos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((pago) => (
                  <TableRow key={pago.id} hover>
                    <TableCell>{pago.id}</TableCell>
                    <TableCell>{formatDate(pago.fecha)}</TableCell>
                    <TableCell>{formatTime(pago.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {pago.codigoPrestamo}
                      </Typography>
                    </TableCell>
                    <TableCell>{pago.clienteNombre}</TableCell>
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
                <Typography variant="body2">{dialogPago.clienteNombre}</Typography>
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
                      disabled={saving || loadingPrestamosAsignados || prestamosAsignados.length === 0}
                      helperText={
                        loadingPrestamosAsignados
                          ? 'Cargando préstamos asignados...'
                          : prestamosAsignados.length === 0
                          ? 'No tienes préstamos asignados para registrar pagos.'
                          : 'Selecciona un préstamo asignado al asesor actual.'
                      }
                    >
                      {prestamosAsignados.map((prestamo) => (
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
                      inputProps={{ step: '100', min: '100' }}
                      placeholder="100"
                      helperText="Solo enteros múltiplos de 100"
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
