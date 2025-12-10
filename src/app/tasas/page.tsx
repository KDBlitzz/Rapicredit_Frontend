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
  Fab,
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
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import { useTasas, Tasa } from "../../hooks/useTasas";

const FRECUENCIAS = [
  { value: "DIARIO", label: "Diario" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
];

const DEMO_TASAS: Tasa[] = [
  {
    _id: "demo-1",
    nombre: "Tasa Personal Estándar",
    tasaAnual: 12.5,
    tasaMora: 24,
    minCapital: 10000,
    maxCapital: 100000,
    diasGracia: 5,
    solicitudRequerida: true,
    frecuenciaCobro: "MENSUAL",
    notas: "Tasa para préstamos personales con montos medios",
    activa: true,
  },
  {
    _id: "demo-2",
    nombre: "Tasa Emergencia",
    tasaAnual: 8,
    tasaMora: 20,
    minCapital: 5000,
    maxCapital: 50000,
    diasGracia: 3,
    solicitudRequerida: false,
    frecuenciaCobro: "SEMANAL",
    notas: "Tasa especial para préstamos de emergencia",
    activa: true,
  },
  {
    _id: "demo-3",
    nombre: "Tasa Vivienda",
    tasaAnual: 6.5,
    tasaMora: 18,
    minCapital: 50000,
    maxCapital: 500000,
    diasGracia: 10,
    solicitudRequerida: true,
    frecuenciaCobro: "MENSUAL",
    notas: "Tasa preferencial para mejora de vivienda",
    activa: true,
  },
];

const emptyForm = {
  nombre: "",
  tasaAnual: "24",
  tasaMora: "36",
  minCapital: "",
  maxCapital: "",
  diasGracia: "",
  solicitudRequerida: true,
  frecuenciaCobro: "MENSUAL",
  vigenciaDesde: "",
  vigenciaHasta: "",
  activa: true,
  notas: "",
};

type FormState = typeof emptyForm;

export default function TasasPage() {
  const { data, loading, saving, error, reload, createTasa, updateTasa, deleteTasa } = useTasas();
  const isDemo = !loading && !error && data.length === 0;
  const [tab, setTab] = useState<"ACTIVAS" | "INACTIVAS">("ACTIVAS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tasa | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const tasasFiltradas = useMemo(() => {
    const source = isDemo ? DEMO_TASAS : data;
    if (tab === "ACTIVAS") return source.filter((t) => t.activa !== false);
    return source.filter((t) => t.activa === false);
  }, [data, tab, isDemo]);

  const counts = useMemo(
    () => {
      const source = isDemo ? DEMO_TASAS : data;
      return {
        activas: source.filter((t) => t.activa !== false).length,
        inactivas: source.filter((t) => t.activa === false).length,
      };
    },
    [data, isDemo]
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
      diasGracia: t.diasGracia?.toString() || "",
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
    setFeedback(null);

    if (!form.nombre.trim()) {
      setFeedback({ type: "error", message: "El nombre es obligatorio." });
      return;
    }

    const tasaAnual = Number(form.tasaAnual);
    const tasaMora = form.tasaMora ? Number(form.tasaMora) : undefined;
    const minCapital = form.minCapital ? Number(form.minCapital) : undefined;
    const maxCapital = form.maxCapital ? Number(form.maxCapital) : undefined;
    const diasGracia = form.diasGracia ? Number(form.diasGracia) : undefined;

    if (Number.isNaN(tasaAnual) || tasaAnual <= 0) {
      setFeedback({ type: "error", message: "Ingresa una tasa anual válida." });
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      tasaAnual,
      tasaMora,
      minCapital,
      maxCapital,
      diasGracia,
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
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "No se pudo guardar la tasa.",
      });
    }
  };

  const handleDelete = async (tasa: Tasa) => {
    if (!tasa._id) return;
    const ok = window.confirm(`¿Eliminar la tasa "${tasa.nombre}"?`);
    if (!ok) return;

    setFeedback(null);
    try {
      await deleteTasa(tasa._id);
      setFeedback({ type: "success", message: "Tasa eliminada." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "No se pudo eliminar." });
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

  const formatDate = (val?: string) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("es-HN");
  };

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

        {isDemo && !loading && !error && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Mostrando datos de ejemplo (la API devolvió 0 registros). Crea una tasa para ver datos reales.
          </Alert>
        )}

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
                <TableCell>Días gracia</TableCell>
                <TableCell>Solicitud</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasasFiltradas.map((tasa) => (
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
                  <TableCell>{tasa.diasGracia ? `${tasa.diasGracia} días` : "-"}</TableCell>
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
                      label={tasa.activa === false ? "Inactiva" : "Activa"}
                      color={tasa.activa === false ? "default" : "success"}
                      variant={tasa.activa === false ? "outlined" : "filled"}
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
                        <IconButton size="small" color="error" onClick={() => handleDelete(tasa)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && tasasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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
                  label="Tasa anual (%)"
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
                  label="Tasa mora (%)"
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
                  label="Días de gracia"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={form.diasGracia}
                  onChange={(e) => handleChange("diasGracia", e.target.value)}
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Notas"
                  fullWidth
                  multiline
                  minRows={1}
                  value={form.notas}
                  onChange={(e) => handleChange("notas", e.target.value)}
                />
              </Grid>
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
            {feedback && feedback.type === "error" && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {feedback.message}
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

    </Box>
  );
}
