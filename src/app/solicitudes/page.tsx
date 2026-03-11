'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit } from '@mui/icons-material';
import { useSolicitudes, EstadoSolicitudFiltro } from '../../hooks/useSolicitudes';
import { apiFetch } from '../../lib/api';
import { usePermisos } from "../../hooks/usePermisos";

type SolicitudAccion = 'PRE_APROBAR' | 'PRE_RECHAZAR';

const SolicitudesPage: React.FC = () => {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<SolicitudAccion | null>(null);
  const [targetSolicitudId, setTargetSolicitudId] = useState<string | null>(null);
  const [targetSolicitudCodigo, setTargetSolicitudCodigo] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const { data, loading, error } = useSolicitudes(
    {
    busqueda,
    estado: 'REGISTRADA' satisfies EstadoSolicitudFiltro,
    },
    { refreshKey }
  );

  const { hasPermiso, hasAnyPermiso, loading: loadingPermisos } = usePermisos();

  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setBusqueda(e.target.value);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : 'L. 0.00';

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

  const renderEstadoChip = (estado: string) => {
    const val = estado.toUpperCase();
    let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'info';

    if (val === 'REGISTRADA') color = 'info';
    else if (val === 'PRE-APROBADA') color = 'warning';
    else if (val === 'PRE-RECHAZADA') color = 'warning';
    else if (val === 'APROBADA') color = 'success';
    else if (val === 'RECHAZADA') color = 'error';

    return (
      <Chip size="small" label={val} color={color} variant="outlined" />
    );
  };

  const openConfirm = (a: SolicitudAccion, id: string, codigoSolicitud: string) => {
    setConfirmAction(a);
    setTargetSolicitudId(id);
    setTargetSolicitudCodigo(codigoSolicitud);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (actionLoading) return;
    setConfirmOpen(false);
    setConfirmAction(null);
    setTargetSolicitudId(null);
    setTargetSolicitudCodigo(null);
  };

  const getConfirmMessage = (a: SolicitudAccion | null) => {
    if (a === 'PRE_APROBAR') return '¿Pre-aprobar esta solicitud?';
    if (a === 'PRE_RECHAZAR') return '¿Pre-rechazar esta solicitud?';
    return '';
  };

  const canVerModuloSolicitudes = hasAnyPermiso(["f001", "F002", "F010"]);
  const canCrearSolicitudes = hasPermiso("F002");
  const canGestionarFlujoSolicitudes = hasPermiso("F010"); // Aprobar/Rechazar crédito / flujo de revisión

  if (!loadingPermisos && !canVerModuloSolicitudes) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sin permisos para Solicitudes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No tiene permisos asignados para ver o gestionar solicitudes de crédito.
        </Typography>
      </Box>
    );
  }

  const runAction = async () => {
    if (!confirmAction || !targetSolicitudId || !targetSolicitudCodigo) return;

    setActionLoading(true);
    try {
      if (confirmAction === 'PRE_APROBAR') {
        await apiFetch(`/solicitudes/preaprobar/${encodeURIComponent(targetSolicitudCodigo)}`, {
          method: 'PUT',
        });
      } else if (confirmAction === 'PRE_RECHAZAR') {
        await apiFetch(`/solicitudes/prerechazar/${encodeURIComponent(targetSolicitudCodigo)}`, {
          method: 'PUT',
        });
      }

      setToastSeverity('success');
      setToastMessage('Acción realizada correctamente.');
      setToastOpen(true);
      closeConfirm();
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity('error');
      const msg = e instanceof Error ? e.message : 'No se pudo realizar la acción.';
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Filtros y header */}
      <Grid container spacing={1}>
        <Grid size={{xs: 12, sm: 6, md: 6}}>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, cliente, identidad…"
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}
          sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}
        >
          <Button
            variant="outlined"
            sx={{ mt: { xs: 1, md: 0 }, mr: 1 }}
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            Recargar
          </Button>
          {canCrearSolicitudes && (
            <Button
              variant="contained"
              sx={{ borderRadius: 999, mt: { xs: 1, md: 0 } }}
              component={Link}
              href="/solicitudes/nuevo"
            >
              + Nueva solicitud
            </Button>
          )}
          {canGestionarFlujoSolicitudes && (
            <Button
              variant="outlined"
              sx={{ ml: 1, mt: { xs: 1, md: 0 } }}
              component={Link}
              href="/solicitudes/aprobacion"
            >
              Revisión
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Estado de carga / error */}
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

      {/* Tabla */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Listado de solicitudes</Typography>
          <Chip size="small" label={`Total: ${data.length}`} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Monto (capital)</TableCell>
                <TableCell>Cobrador</TableCell>
                <TableCell>Plazo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.codigoSolicitud}</TableCell>
                    <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                    <TableCell>{s.clienteNombre}</TableCell>
                    <TableCell>{formatMoney(s.capitalSolicitado ?? 0)}</TableCell>
                    <TableCell>{s.cobradorNombre || '—'}</TableCell>
                    <TableCell>{s.plazoCuotas != null ? s.plazoCuotas : '—'}</TableCell>
                    <TableCell>
                      {renderEstadoChip(s.estadoSolicitud)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Ver solicitud">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => router.push(`/solicitudes/${encodeURIComponent(s.codigoSolicitud)}`)}
                              disabled={actionLoading}
                            >
                              Ver
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => router.push(`/solicitudes/${encodeURIComponent(s.codigoSolicitud)}?edit=1`)}
                              disabled={actionLoading}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {canGestionarFlujoSolicitudes && (
                          <>
                            <Tooltip title="Pre-aprobar solicitud">
                              <span>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => openConfirm('PRE_APROBAR', s.id, s.codigoSolicitud)}
                                  disabled={actionLoading}
                                  sx={{ minWidth: '40px', fontSize: '0.75rem' }}
                                >
                                  Pre-Aprobar
                                </Button>
                              </span>
                            </Tooltip>
                            <Tooltip title="Pre-rechazar solicitud">
                              <span>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  onClick={() => openConfirm('PRE_RECHAZAR', s.id, s.codigoSolicitud)}
                                  disabled={actionLoading}
                                  sx={{ minWidth: '40px', fontSize: '0.75rem' }}
                                >
                                  Pre-Rechazar
                                </Button>
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay solicitudes que cumplan con los filtros actuales.
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

      <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="xs">
        <DialogTitle>Confirmación</DialogTitle>
        <DialogContent>
          <Typography>{getConfirmMessage(confirmAction)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={actionLoading}>Cancelar</Button>
          <Button
            onClick={runAction}
            variant="contained"
            disabled={actionLoading}
            color={confirmAction === 'PRE_APROBAR' ? 'success' : 'error'}
          >
            {actionLoading ? 'Procesando…' : 'Confirmar'}
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

export default SolicitudesPage;
