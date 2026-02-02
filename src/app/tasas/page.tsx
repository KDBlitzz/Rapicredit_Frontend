"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Edit, Refresh, Delete } from "@mui/icons-material";
import { useTasas, Tasa } from "../../hooks/useTasas";

const FRECUENCIAS = [
  { value: "DIARIO", label: "Diario" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
];


const emptyForm = {
  nombre: "",
  tasaAnual: "24",
  tasaMora: "36",
  minCapital: "",
  maxCapital: "",
  solicitudRequerida: true,
  frecuenciaCobro: "MENSUAL",
  vigenciaDesde: "",
  vigenciaHasta: "",
  activa: true,
  notas: "",
};

type FormState = typeof emptyForm;

export default function TasasPage() {
  const { data, loading, saving, error, reload, createTasa, updateTasa, deleteTasa, setEstadoTasa } = useTasas();
  const [tab, setTab] = useState<"ACTIVAS" | "INACTIVAS">("ACTIVAS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tasa | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [confirmTasa, setConfirmTasa] = useState<{ codigo: string; nextState: boolean; nombre?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ codigo: string; nombre?: string } | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const tasasFiltradas = useMemo(() => {
    const source = data;
    if (tab === "ACTIVAS") {
      return source.filter((t: Tasa) => (t.estado === true) || (t.estado === undefined && t.activa !== false));
    }
    return source.filter((t: Tasa) => (t.estado === false) || (t.estado === undefined && t.activa !== false));
  }, [data, tab]);

  const counts = useMemo(
    () => {
      const source = data;
      return {
        activas: source.filter((t: Tasa) => (t.estado === true) || (t.estado === undefined && t.activa !== false)).length,
        inactivas: source.filter((t: Tasa) => (t.estado === false) || (t.estado === undefined && t.activa !== false)).length,
      };
    },
    [data]
  );

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (t: Tasa) => {
    setEditing(t);
    setForm({
      nombre: t.nombre || "",
      tasaAnual: t.tasaAnual?.toString() || "",
      tasaMora: t.tasaMora?.toString() || "",
      minCapital: t.minCapital?.toString() || "",
      maxCapital: t.maxCapital?.toString() || "",
      solicitudRequerida: t.solicitudRequerida ?? true,
      frecuenciaCobro: t.frecuenciaCobro || "MENSUAL",
      vigenciaDesde: t.vigenciaDesde?.slice(0, 10) || "",
      vigenciaHasta: t.vigenciaHasta?.slice(0, 10) || "",
      activa: t.activa !== false,
      notas: t.notas || "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleChange = (name: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    const tasaAnual = Number(form.tasaAnual);
    const tasaMora = form.tasaMora ? Number(form.tasaMora) : undefined;
    const minCapital = form.minCapital ? Number(form.minCapital) : undefined;
    const maxCapital = form.maxCapital ? Number(form.maxCapital) : undefined;

    if (Number.isNaN(tasaAnual) || tasaAnual <= 0) {
      setFormError("Ingresa una tasa anual válida.");
      return;
    }

    // Validación: mínimo capital < máximo capital, cuando ambos existen
    if (minCapital != null && maxCapital != null) {
      if (Number.isNaN(minCapital) || Number.isNaN(maxCapital)) {
        setFormError("Ingresa valores de capital válidos.");
        return;
      }
      if (minCapital >= maxCapital) {
        setFormError("El mínimo capital debe ser menor al máximo capital.");
        return;
      }
    }

    // Validación: vigenciaDesde < vigenciaHasta, cuando ambos existen
    if (form.vigenciaDesde && form.vigenciaHasta) {
      const desde = new Date(form.vigenciaDesde);
      const hasta = new Date(form.vigenciaHasta);
      if (!(desde < hasta)) {
        setFormError("La fecha 'Vigencia desde' debe ser menor que 'Vigencia hasta'.");
        return;
      }
    }

    const payload = {
      nombre: form.nombre.trim(),
      tasaAnual,
      tasaMora,
      minCapital,
      maxCapital,
      solicitudRequerida: form.solicitudRequerida,
      frecuenciaCobro: form.frecuenciaCobro || undefined,
      vigenciaDesde: form.vigenciaDesde || undefined,
      vigenciaHasta: form.vigenciaHasta || undefined,
      activa: form.activa,
      notas: form.notas.trim() || undefined,
    };

    try {
      if (editing?._id) {
        await updateTasa(editing._id, payload);
        setFeedback({ type: "success", message: "Tasa actualizada." });
      } else {
        await createTasa(payload);
        setFeedback({ type: "success", message: "Tasa creada." });
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la tasa.";
      setFormError(message);
    }
  };

  const toggleActivaByCodigo = async (codigo: string, nextState: boolean) => {
    if (!codigo) {
      setFeedback({ type: "error", message: "No se puede actualizar: la tasa no tiene código." });
      return;
    }
    try {
      setUpdatingCode(codigo);
      await setEstadoTasa(codigo, nextState);
      setFeedback({ type: "success", message: nextState ? "Tasa activada." : "Tasa desactivada." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el estado.";
      setFeedback({ type: "error", message });
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleDelete = async (codigo: string) => {
    try {
      setDeletingCode(codigo);
      setFeedback(null);
      await deleteTasa(codigo);
      setFeedback({ type: "success", message: "Tasa eliminada." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar.";
      setFeedback({ type: "error", message });
    } finally {
      setDeletingCode(null);
      setConfirmDelete(null);
    }
  };

  const formatPercent = (val?: number) => {
    if (val == null) return "-";
    return `${val.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  };

  const formatMoney = (val?: number) => {
    if (val == null || Number.isNaN(val)) return "-";
    return `L. ${val.toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // función de fecha eliminada por no usarse

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ p: 2, backgroundColor: "rgba(15,23,42,0.6)", borderColor: "rgba(74, 222, 128, 0.25)" }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={1.5}>
          <Box>
            <Breadcrumbs separator="›" sx={{ color: "text.secondary", fontSize: 12, mb: 0.5 }}>
              <Typography color="text.secondary">Administración</Typography>
              <Typography color="text.secondary">Tasas de interés</Typography>
            </Breadcrumbs>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Tasas de interés
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gestiona tasas activas, montos y condiciones de solicitud.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={reload}
              disabled={loading || saving}
            >
              Recargar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleOpenCreate}
            >
              Nueva tasa
            </Button>
          </Stack>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          textColor="secondary"
          indicatorColor="secondary"
          sx={{ mt: 2, width: "100%" }}
        >
          <Tab
            value="ACTIVAS"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">Activas</Typography>
                <Chip size="small" label={counts.activas} color="success" variant="outlined" />
              </Stack>
            }
            sx={{ textTransform: "none" }}
          />
          <Tab
            value="INACTIVAS"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">Inactivas</Typography>
                <Chip size="small" label={counts.inactivas} color="default" variant="outlined" />
              </Stack>
            }
            sx={{ textTransform: "none" }}
          />
        </Tabs>

        {/* Demo info alert removed */}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tasa</TableCell>
                <TableCell>Rango de capital</TableCell>
                <TableCell>Solicitud</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasasFiltradas.map((tasa: Tasa) => (
                <TableRow key={tasa._id || tasa.nombre} hover>
                  <TableCell>
                    <Box>
                      <Typography fontWeight={700}>{tasa.nombre}</Typography>
                      {tasa.notas && (
                        <Typography variant="caption" color="text.secondary">
                          {tasa.notas}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#4ade80", fontWeight: 700 }}>
                    {formatPercent(tasa.tasaAnual)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatMoney(tasa.minCapital)} - {formatMoney(tasa.maxCapital)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={tasa.solicitudRequerida === false ? "No requerida" : "Requerida"}
                      color={tasa.solicitudRequerida === false ? "default" : "primary"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={tasa.estado === false ? "Inactiva" : "Activa"}
                      color={tasa.estado === false ? "default" : "success"}
                      variant={tasa.estado === false ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenEdit(tasa)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete({ codigo: tasa.codigo ?? "", nombre: tasa.nombre })}
                          disabled={(tasa.codigo ? deletingCode === tasa.codigo : false) || saving}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color={tasa.estado === false ? "success" : "error"}
                        onClick={() => {
                          const currentActive = tasa.estado === true;
                          setConfirmTasa({ codigo: tasa.codigo ?? "", nextState: !currentActive, nombre: tasa.nombre });
                        }}
                        disabled={(tasa.codigo ? updatingCode === tasa.codigo : false) || saving}
                      >
                        {tasa.estado === false ? "Activar" : "Desactivar"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && tasasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay tasas registradas en este estado.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Confirmación activar/desactivar tasa */}
      <Dialog open={Boolean(confirmTasa)} onClose={() => setConfirmTasa(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmTasa?.nextState === false
            ? "¿Desea desactivar esta tasa?"
            : "¿Desea activar esta tasa?"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmTasa(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={confirmTasa?.nextState === false ? "error" : "success"}
            onClick={async () => {
              if (confirmTasa) {
                await toggleActivaByCodigo(confirmTasa.codigo, confirmTasa.nextState);
              }
              setConfirmTasa(null);
            }}
          >
            {confirmTasa?.nextState === false ? "Desactivar" : "Activar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación eliminar tasa */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {"¿Desea eliminar esta tasa?"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!confirmDelete) return;
              const codigo = (confirmDelete.codigo || "").trim();
              if (!codigo) {
                setFeedback({ type: "error", message: "No se puede eliminar: la tasa no tiene código." });
                setConfirmDelete(null);
                return;
              }
              await handleDelete(codigo);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? "Editar tasa" : "Nueva tasa"}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Nombre"
                  fullWidth
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Tasa (%)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={form.tasaAnual}
                  onChange={(e) => handleChange("tasaAnual", e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Mora (%)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={form.tasaMora}
                  onChange={(e) => handleChange("tasaMora", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Mínimo capital"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1000 }}
                  value={form.minCapital}
                  onChange={(e) => handleChange("minCapital", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Máximo capital"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1000 }}
                  value={form.maxCapital}
                  onChange={(e) => handleChange("maxCapital", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Descripción"
                  fullWidth
                  multiline
                  minRows={1}
                  value={form.notas}
                  onChange={(e) => handleChange("notas", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Frecuencia de cobro"
                  fullWidth
                  value={form.frecuenciaCobro}
                  onChange={(e) => handleChange("frecuenciaCobro", e.target.value)}
                >
                  {FRECUENCIAS.map((f) => (
                    <MenuItem key={f.value} value={f.value}>
                      {f.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Descripción movida al espacio del apartado eliminado */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Vigencia desde"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.vigenciaDesde}
                  onChange={(e) => handleChange("vigenciaDesde", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Vigencia hasta"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.vigenciaHasta}
                  onChange={(e) => handleChange("vigenciaHasta", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activa}
                      onChange={(_, val) => handleChange("activa", val)}
                    />
                  }
                  label="Tasa vigente"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.solicitudRequerida}
                      onChange={(_, val) => handleChange("solicitudRequerida", val)}
                    />
                  }
                  label="Solicitud requerida"
                />
              </Grid>
            </Grid>
            {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editing ? "Guardar cambios" : "Crear tasa"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {feedback && feedback.type === "success" && (
        <Alert severity="success" onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {feedback && feedback.type === "error" && (
        <Alert severity="error" onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

    </Box>
  );
}
