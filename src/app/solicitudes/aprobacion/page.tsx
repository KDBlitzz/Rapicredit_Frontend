"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useSolicitudes, EstadoSolicitudFiltro } from "../../../hooks/useSolicitudes";
import { apiFetch } from "../../../lib/api";

const estadosAccionFinales = ["APROBADA", "RECHAZADA"]; // no mostrar acciones si ya está finalizada

type Accion = "PRE_APROBADA" | "RECHAZADA";

const PreAprobacionPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoSolicitudFiltro>("EN_REVISION");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [comentario, setComentario] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, error: loadError } = useSolicitudes({ busqueda, estado });

  const isSupervisor = useMemo(() => {
    try {
      const rol = (typeof window !== "undefined" && localStorage.getItem("rol")) || "";
      return (rol || "").toUpperCase() === "SUPERVISOR";
    } catch {
      return false;
    }
  }, []);

  const canActOn = (estadoActual?: string) => {
    const v = (estadoActual || "").toUpperCase();
    return isSupervisor && !estadosAccionFinales.includes(v);
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

  const openDialog = (id: string, a: Accion) => {
    setTargetId(id);
    setAccion(a);
    setComentario("");
    setError(null);
    setDialogOpen(true);
  };

  const submitAccion = async () => {
    if (!targetId || !accion) return;
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;
      await apiFetch(`/solicitudes/${targetId}/preaprobacion`, {
        method: "POST",
        body: JSON.stringify({ accion, comentario: comentario || undefined }),
        authToken: token,
      });
      setDialogOpen(false);
      setComentario("");
      // simple refresh: toggle estado to refetch
      setEstado((prev) => prev);
    } catch (e: any) {
      setError(e?.message || "No se pudo registrar la acción.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Pre-aprobación de solicitudes</Typography>
      {!isSupervisor && (
        <Chip color="warning" label="Solo visible para SUPERVISOR" variant="outlined" />
      )}

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
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField fullWidth size="small" select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoSolicitudFiltro)}>
            <MenuItem value="TODAS">Todas</MenuItem>
            <MenuItem value="REGISTRADA">Registradas</MenuItem>
            <MenuItem value="EN_REVISION">En revisión</MenuItem>
            <MenuItem value="APROBADA">Aprobadas</MenuItem>
            <MenuItem value="RECHAZADA">Rechazadas</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 5 }} sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
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
                      {canActOn(s.estadoSolicitud) ? (
                        <>
                          <Button size="small" variant="outlined" color="success" onClick={() => openDialog(s.id, "PRE_APROBADA")}>Pre-aprobar</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => openDialog(s.id, "RECHAZADA")}>Rechazar</Button>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
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

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{accion === "RECHAZADA" ? "Rechazar solicitud" : "Pre-aprobar solicitud"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Comentario (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            helperText={error || "Agrega contexto para trazabilidad"}
            error={!!error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submitAccion} variant="contained" color={accion === "RECHAZADA" ? "error" : "success"} disabled={saving}>
            {saving ? "Guardando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PreAprobacionPage;
