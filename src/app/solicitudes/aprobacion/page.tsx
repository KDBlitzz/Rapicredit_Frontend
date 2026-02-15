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

type SolicitudDetalle = {
  codigoSolicitud?: string;
  fechaSolicitud?: string;
  clienteNombre?: string;
  clienteId?: unknown;
  cobradorNombre?: string;
  vendedorId?: unknown;
  capitalSolicitado?: number;
  frecuenciaPago?: string;
  plazoCuotas?: number;
  tasaInteres?: unknown;
  tasInteresId?: unknown;
  finalidadCredito?: string;
  observaciones?: string;
  estadoSolicitud?: string;
};
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

  // Detalle de solicitud
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SolicitudDetalle | null>(null);

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

  // Helpers to safely display possible nested objects returned by backend
  const describeEntity = (value: unknown, fallback?: string) => {
    if (typeof fallback === "string" && fallback.trim()) return fallback;
    if (value == null) return "-";
    if (typeof value === "object") {
      const o = value as Record<string, unknown>;
      const nombreCompleto = o["nombreCompleto"];
      const nombre = o["nombre"];
      const apellido = o["apellido"];
      const codigoCliente = o["codigoCliente"];
      const identidadCliente = o["identidadCliente"];
      const codigoUsuario = o["codigoUsuario"];
      const id = o["id"] || o["_id"];

      const fullName = [nombre as string | undefined, apellido as string | undefined]
        .filter(Boolean)
        .join(" ");

      return (
        (typeof nombreCompleto === "string" && nombreCompleto) ||
        (fullName.trim() ? fullName : undefined) ||
        (typeof codigoCliente === "string" && codigoCliente) ||
        (typeof identidadCliente === "string" && identidadCliente) ||
        (typeof codigoUsuario === "string" && codigoUsuario) ||
        (typeof id === "string" && id) ||
        "[detalle]"
      );
    }
    return String(value);
  };

  const describeTasa = (value: unknown, tasaRef: unknown) => {
    // value can be: number | string | { porcentajeInteres } | null
    const tryNumber = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      if (typeof v === "object" && v) {
        const o = v as Record<string, unknown>;
        const candidate = o["porcentajeInteres"] ?? o["tasaInteres"] ?? o["porcentaje"];
        return tryNumber(candidate);
      }
      return null;
    };

    const pct = tryNumber(value) ?? tryNumber(tasaRef);
    return pct != null ? `${pct}%` : "-";
  };

  const openConfirm = (a: SolicitudAccion, id: string, codigoSolicitud: string) => {
    setConfirmAction(a);
    setTargetSolicitudId(id);
    setTargetSolicitudCodigo(codigoSolicitud);
    setConfirmOpen(true);
  };

  const openDetail = async (codigoSolicitud: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);

    try {
      const res = await apiFetch(`/solicitudes/${encodeURIComponent(codigoSolicitud)}`);
      setDetailData(res as SolicitudDetalle);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle.";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (detailLoading) return;
    setDetailOpen(false);
    setDetailData(null);
    setDetailError(null);
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
          <Button variant="outlined" href="/solicitudes/rechazadas" sx={{ ml: 1 }}>
            Solicitudes rechazadas
          </Button>
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

                      <Button size="small" variant="outlined" onClick={() => openDetail(s.codigoSolicitud)}>Ver detalle</Button>
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

      {/* Detalle de solicitud */}
      <Dialog open={detailOpen} onClose={closeDetail} fullWidth maxWidth="sm">
        <DialogTitle>Detalle de solicitud</DialogTitle>
        <DialogContent dividers>
          {detailLoading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">Cargando detalle…</Typography>
            </Box>
          )}

          {!detailLoading && detailError && (
            <Typography variant="body2" color="error">{detailError}</Typography>
          )}

          {!detailLoading && detailData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Código</Typography>
                  <Typography variant="body2">{detailData.codigoSolicitud ?? "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Fecha</Typography>
                  <Typography variant="body2">{formatDate(detailData.fechaSolicitud)}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Cliente</Typography>
                  <Typography variant="body2">{describeEntity(detailData.clienteId, detailData.clienteNombre)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Cobrador/Vendedor</Typography>
                  <Typography variant="body2">{describeEntity(detailData.vendedorId, detailData.cobradorNombre)}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Capital solicitado</Typography>
                  <Typography variant="body2">{formatMoney(detailData.capitalSolicitado)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Frecuencia de pago</Typography>
                  <Typography variant="body2">{detailData.frecuenciaPago ?? "-"}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Plazo (cuotas)</Typography>
                  <Typography variant="body2">{detailData.plazoCuotas ?? "-"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Tasa de interés</Typography>
                  <Typography variant="body2">{describeTasa(detailData.tasaInteres, detailData.tasInteresId)}</Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Finalidad del crédito</Typography>
                  <Typography variant="body2">{detailData.finalidadCredito ?? "-"}</Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2">{detailData.observaciones ?? "-"}</Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Estado</Typography>
                  <Box sx={{ mt: 0.5 }}>{renderEstadoChip(detailData.estadoSolicitud ?? "-")}</Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail} disabled={detailLoading}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
