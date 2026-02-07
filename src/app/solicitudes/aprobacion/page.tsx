"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import { useSolicitudes, EstadoSolicitudFiltro } from "../../../hooks/useSolicitudes";
import { apiFetch } from "../../../lib/api";

const estadosAccionFinales = ["APROBADA", "RECHAZADA"]; // no mostrar acciones si ya está finalizada

type SolicitudAccion = "APROBAR" | "RECHAZAR";

const PreAprobacionPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<SolicitudAccion | null>(null);
  const [targetSolicitudId, setTargetSolicitudId] = useState<string | null>(null);
  const [targetSolicitudCodigo, setTargetSolicitudCodigo] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  const { data, loading, error: loadError } = useSolicitudes(
    { busqueda, estado: "EN_REVISION" satisfies EstadoSolicitudFiltro },
    { refreshKey }
  );

  const canActOn = (estadoActual?: string) => {
    const v = (estadoActual || "").toUpperCase();
    return !estadosAccionFinales.includes(v);
  };

  const formatMoney = (v?: number) => (v != null ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "L. 0.00");
  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-HN") : "-");
  const renderEstadoChip = (estado: string) => {
    const val = estado.toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";
    if (val === "REGISTRADA") color = "info";
    else if (val === "EN_REVISION") color = "warning";
    else if (val === "APROBADA") color = "success";
    else if (val === "RECHAZADA") color = "error";
    return <Chip size="small" label={val} color={color} variant="outlined" />;
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
    if (a === "APROBAR") return "¿Desea aprobar esta solicitud?";
    if (a === "RECHAZAR") return "¿Desea rechazar esta solicitud?";
    return "";
  };

  const runAction = async () => {
    if (!confirmAction || !targetSolicitudId || !targetSolicitudCodigo) return;

    setActionLoading(true);
    try {
      if (confirmAction === "APROBAR") {
        await apiFetch(`/solicitudes/${encodeURIComponent(targetSolicitudId)}/aprobar`, {
          method: "POST",
        });
      } else if (confirmAction === "RECHAZAR") {
        await apiFetch(`/solicitudes/rechazar/${encodeURIComponent(targetSolicitudCodigo)}`, {
          method: "PUT",
          body: JSON.stringify({}),
        });
      }

      setToastSeverity("success");
      setToastMessage("Acción realizada correctamente.");
      setToastOpen(true);
      closeConfirm();
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity("error");
      const msg = e instanceof Error ? e.message : "No se pudo realizar la acción.";
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Pre-aprobación de solicitudes</Typography>

      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, cliente, identidad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 8, md: 8 }} sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
          <Button variant="outlined" href="/solicitudes">Volver a listado</Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">Cargando solicitudes…</Typography>
        </Box>
      )}
      {loadError && <Typography variant="caption" color="error">{loadError}</Typography>}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2">Solicitudes para evaluar</Typography>
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
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && data && data.length > 0 && data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.codigoSolicitud}</TableCell>
                  <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                  <TableCell>{s.clienteNombre}</TableCell>
                  <TableCell>{formatMoney(s.capitalSolicitado ?? 0)}</TableCell>
                  <TableCell>{renderEstadoChip(s.estadoSolicitud)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <Tooltip title={canActOn(s.estadoSolicitud) ? "Aprobar" : "No disponible"}>
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            disabled={!canActOn(s.estadoSolicitud)}
                            onClick={() => openConfirm("APROBAR", s.id, s.codigoSolicitud)}
                          >
                            <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>✅</Box>
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={canActOn(s.estadoSolicitud) ? "Rechazar" : "No disponible"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={!canActOn(s.estadoSolicitud)}
                            onClick={() => openConfirm("RECHAZAR", s.id, s.codigoSolicitud)}
                          >
                            <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>❌</Box>
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Button size="small" variant="outlined" href={`/solicitudes/${s.id}`}>Ver detalle</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay solicitudes que cumplan con los filtros actuales.</TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Cargando…</TableCell>
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
            color={confirmAction === "RECHAZAR" ? "error" : "success"}
          >
            {actionLoading ? "Procesando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: "100%" }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PreAprobacionPage;
