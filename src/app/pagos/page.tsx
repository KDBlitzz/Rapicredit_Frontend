'use client';

import React, { useState } from 'react';
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
import { useAbonos, EstadoAbonFiltro } from '../../hooks/useAbonos';
import { usePermisos } from '../../hooks/usePermisos';
import { usePrestamoDetalle } from '../../hooks/usePrestamoDetalle';
import { apiFetch } from '../../lib/api';

const emptyForm = {
  codigoPrestamo: '',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  medioPago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA' | 'DEPOSITO',
  referencia: '',
  observaciones: '',
};

type FormState = typeof emptyForm;

export default function PagosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoAbonFiltro>('TODOS');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogAbono, setDialogAbono] = useState<any>(null);
  const [dialogNuevo, setDialogNuevo] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, loading, error } = useAbonos({ busqueda, estado }, { refreshKey });
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
    setEstado(e.target.value as EstadoAbonFiltro);
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
    if (Number.isNaN(monto) || monto <= 0) {
      setFormError('El monto debe ser mayor que 0');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/abonos', {
        method: 'POST',
        body: JSON.stringify({
          codigoPrestamo: form.codigoPrestamo,
          monto,
          fecha: form.fecha,
          medioPago: form.medioPago,
          referencia: form.referencia || undefined,
          observaciones: form.observaciones || undefined,
        }),
      });

      setSnackbar({ type: 'success', message: 'Abono registrado exitosamente' });
      handleCloseNuevo();
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo registrar el abono';
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
          Abonos y Pagos
        </Typography>
        {canAplicarPago && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 999 }}
            onClick={handleOpenNuevo}
          >
            Registrar Abono
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
                <TableCell sx={{ fontWeight: 600 }}>Préstamo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay abonos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((abono) => (
                  <TableRow key={abono.id} hover>
                    <TableCell>{formatDate(abono.fecha)}</TableCell>
                    <TableCell>{formatTime(abono.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {abono.codigoPrestamo}
                      </Typography>
                    </TableCell>
                    <TableCell>{abono.clienteNombre}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                        {formatMoney(abono.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell>{abono.medioPago}</TableCell>
                    <TableCell>{renderEstadoChip(abono.estadoAbono)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setDialogAbono(abono)}
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

      {/* Dialog - Detalles del abono */}
      <Dialog
        open={!!dialogAbono}
        onClose={() => setDialogAbono(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalles del Abono</DialogTitle>
        <DialogContent>
          {dialogAbono && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Préstamo
                </Typography>
                <Typography variant="body2">{dialogAbono.codigoPrestamo}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="body2">{dialogAbono.clienteNombre}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Monto
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatMoney(dialogAbono.monto)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Fecha y Hora
                </Typography>
                <Typography variant="body2">
                  {formatDate(dialogAbono.fecha)} {formatTime(dialogAbono.fecha)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Medio de Pago
                </Typography>
                <Typography variant="body2">{dialogAbono.medioPago}</Typography>
              </Box>
              {dialogAbono.referencia && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Referencia / Recibo
                  </Typography>
                  <Typography variant="body2">{dialogAbono.referencia}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                {renderEstadoChip(dialogAbono.estadoAbono)}
              </Box>
              {dialogAbono.observaciones && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body2">{dialogAbono.observaciones}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAbono(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog - Nuevo Abono */}
      <Dialog open={dialogNuevo} onClose={handleCloseNuevo} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Nuevo Abono</DialogTitle>
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
                  Datos del Abono
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Código de Préstamo *"
                      name="codigoPrestamo"
                      value={form.codigoPrestamo}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving}
                      placeholder="Ej: PREST-001"
                    />
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
                      <MenuItem value="DEPOSITO">Depósito</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Referencia / Recibo"
                      name="referencia"
                      value={form.referencia}
                      onChange={handleFormChange}
                      size="small"
                      disabled={saving}
                      placeholder="Ej: Recibo #12345"
                    />
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
                        Ingresa un código de préstamo para ver los detalles
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
            {saving ? 'Guardando...' : 'Registrar Abono'}
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
