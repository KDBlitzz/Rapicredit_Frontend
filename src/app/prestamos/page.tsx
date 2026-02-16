"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Delete, Edit } from "@mui/icons-material";
import Link from "next/link";
import { usePrestamos, EstadoPrestamoFiltro } from "../../hooks/usePrestamos";
import { apiFetch } from "../../lib/api";

const PrestamosPage: React.FC = () => {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoPrestamoFiltro>("TODOS");

  const [refreshKey, setRefreshKey] = useState(0);

  const [confirmDelete, setConfirmDelete] = useState<{ codigoPrestamo: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  const { data, loading, error } = usePrestamos({
    busqueda,
    estado,
  }, { refreshKey });

  const doDelete = async (codigoPrestamo: string) => {
    if (!codigoPrestamo) return;
    setDeleteLoading(true);

    try {
      await apiFetch(`/prestamos/${encodeURIComponent(codigoPrestamo)}`, {
        method: "DELETE",
      });

      setToastSeverity("success");
      setToastMessage("Préstamo eliminado.");
      setToastOpen(true);
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity("error");
      const msg = e instanceof Error ? e.message : "No se pudo eliminar el préstamo.";
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setBusqueda(e.target.value);

  const handleEstadoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setEstado(e.target.value as EstadoPrestamoFiltro);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const renderEstadoChip = (estado: string) => {
    const val = estado.toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";

    if (val === "VIGENTE") color = "success";
    else if (val === "PENDIENTE") color = "warning";
    else if (val === "CERRADO") color = "default";
    else if (val === "RECHAZADO") color = "error";

    const variant = theme.palette.mode === "light" ? "filled" : "outlined";
    return <Chip size="small" label={val} color={color} variant={variant} />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Filtros */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, cliente, identidad…"
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Estado"
            value={estado}
            onChange={handleEstadoChange}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="VIGENTE">Vigentes</MenuItem>
            <MenuItem value="PENDIENTE">Pendientes</MenuItem>
            <MenuItem value="CERRADO">Cerrados</MenuItem>
            <MenuItem value="RECHAZADO">Rechazados</MenuItem>
          </TextField>
        </Grid>

        <Grid
          size={{ xs: 12, sm: 12, md: 5 }}
          sx={{ display: "flex", justifyContent: { md: "flex-end" } }}
        >
          <Button
            variant="contained"
            sx={{ borderRadius: 999, mt: { xs: 1, md: 0 } }}
            component={Link}
            href="/solicitudes/nuevo"
          >
            + Nueva solicitud
          </Button>
        </Grid>
      </Grid>

      {/* Estado */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando préstamos…
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
        <Box
          sx={(theme) => ({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: "transparent",
          })}
        >
          <Typography variant="subtitle2">Listado de préstamos</Typography>
          <Chip size="small" label={`Total: ${data.length}`} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Cuotas</TableCell>
                <TableCell>Capital</TableCell>
                <TableCell>Cuota fija</TableCell>
                <TableCell>Desembolso</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.codigoPrestamo}</TableCell>
                    <TableCell>{p.clienteNombre}</TableCell>
                    <TableCell>{renderEstadoChip(p.estadoPrestamo)}</TableCell>
                    <TableCell>{p.frecuenciaPago || "—"}</TableCell>
                    <TableCell>{p.plazoCuotas ?? 0}</TableCell>
                    <TableCell>{formatMoney(p.capitalSolicitado ?? 0)}</TableCell>
                    <TableCell>{formatMoney(p.cuotaFija ?? 0)}</TableCell>
                    <TableCell>{formatDate(p.fechaDesembolso)}</TableCell>
                    <TableCell>{formatDate(p.fechaVencimiento)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="text"
                        component={Link}
                        href={`/prestamos/${encodeURIComponent(p.codigoPrestamo)}`}
                      >
                        Ver
                      </Button>

                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          component={Link}
                          href={`/prestamos/${encodeURIComponent(p.codigoPrestamo)}?edit=1`}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deleteLoading}
                            onClick={() => setConfirmDelete({ codigoPrestamo: p.codigoPrestamo })}
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
                  <TableCell colSpan={10} align="center">
                    No hay préstamos que cumplan con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Cargando…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => (deleteLoading ? null : setConfirmDelete(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Desea eliminar este préstamo?</DialogTitle>
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
              const codigo = confirmDelete.codigoPrestamo;
              setConfirmDelete(null);
              await doDelete(codigo);
            }}
          >
            {deleteLoading ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrestamosPage;
