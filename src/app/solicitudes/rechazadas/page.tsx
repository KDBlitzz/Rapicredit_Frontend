'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogActions,
  Snackbar,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useSolicitudes, EstadoSolicitudFiltro } from '../../../hooks/useSolicitudes';
import { apiFetch } from '../../../lib/api';

const SolicitudesRechazadasPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [confirmDelete, setConfirmDelete] = useState<{ codigoSolicitud: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const { data, loading, error } = useSolicitudes(
    {
      busqueda,
      estado: 'RECHAZADA' satisfies EstadoSolicitudFiltro,
    },
    { refreshKey }
  );

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : 'L. 0.00';

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

  const renderEstadoChip = (estado: string) => {
    const val = (estado || '').toUpperCase();
    return <Chip size="small" label={val || 'RECHAZADA'} color="error" variant="outlined" />;
  };

  const doDelete = async (codigoSolicitud: string) => {
    if (!codigoSolicitud) return;
    setDeleteLoading(true);

    try {
      await apiFetch(`/solicitudes/${encodeURIComponent(codigoSolicitud)}`, {
        method: 'DELETE',
      });

      setToastSeverity('success');
      setToastMessage('Solicitud eliminada.');
      setToastOpen(true);
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity('error');
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar la solicitud.';
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Solicitudes rechazadas</Typography>

      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, cliente, identidad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Grid>
        <Grid
          size={{ xs: 12, sm: 6, md: 6 }}
          sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}
        >
          <Button
            variant="outlined"
            sx={{ mt: { xs: 1, md: 0 }, mr: 1 }}
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            Recargar
          </Button>
          <Button
            variant="outlined"
            sx={{ mt: { xs: 1, md: 0 } }}
            href="/solicitudes/aprobacion"
          >
            Volver a pre-aprobación
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando solicitudes…
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Listado</Typography>
          <Chip size="small" label={`Total: ${data.length}`} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Cobrador</TableCell>
                <TableCell>Cuota</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && data && data.length > 0 &&
                data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.codigoSolicitud}</TableCell>
                    <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                    <TableCell>{s.clienteNombre}</TableCell>
                    <TableCell>{formatMoney(s.capitalSolicitado ?? 0)}</TableCell>
                    <TableCell>{s.cobradorNombre || '—'}</TableCell>
                    <TableCell>
                      {s.cuotaEstablecida != null ? formatMoney(s.cuotaEstablecida) : '—'}
                    </TableCell>
                    <TableCell>{renderEstadoChip(s.estadoSolicitud)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmDelete({ codigoSolicitud: s.codigoSolicitud })}
                            disabled={deleteLoading}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay solicitudes rechazadas que cumplan con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(confirmDelete)} onClose={() => (deleteLoading ? null : setConfirmDelete(null))} maxWidth="xs" fullWidth>
        <DialogTitle>¿Desea eliminar esta solicitud?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteLoading}
            onClick={async () => {
              if (!confirmDelete) return;
              const codigo = confirmDelete.codigoSolicitud;
              setConfirmDelete(null);
              await doDelete(codigo);
            }}
          >
            {deleteLoading ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default SolicitudesRechazadasPage;
