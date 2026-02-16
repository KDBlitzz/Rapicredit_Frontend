"use client";

import React, { useCallback, useMemo, useState } from "react";
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
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import { useTasas, Tasa } from "../../hooks/useTasas";
import { apiFetch } from "../../lib/api";

const CAPITAL_MAX_LIMIT = 1_000_000;

const emptyForm = {
  codigoTasa: "",
  nombre: "",
  descripcion: "",
  porcentajeInteres: "24",
  porcentajeMora: "0",
  capitalMin: "",
  capitalMax: "",
  requiereSolicitud: false,
  activa: true,
};

type FormState = typeof emptyForm;

export default function TasasPage() {
  const {
    data,
    loading,
    saving,
    error,
    reload,
    createTasa,
    updateTasaByCodigo,
    deleteTasa,
    toggleActiveByCodigo,
  } = useTasas();

  const [tab, setTab] = useState<"ACTIVAS" | "INACTIVAS">("ACTIVAS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tasa | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ codigoTasa: string; nextState: boolean; nombre?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ codigoTasa: string; id?: string; nombre?: string } | null>(null);
  const [busyCodigo, setBusyCodigo] = useState<string | null>(null);

  const tasasFiltradas = useMemo(() => {
    if (tab === "ACTIVAS") return data.filter((t) => t.activa !== false);
    return data.filter((t) => t.activa === false);
  }, [data, tab]);

  const counts = useMemo(() => {
    return {
      activas: data.filter((t) => t.activa !== false).length,
      inactivas: data.filter((t) => t.activa === false).length,
    };
  }, [data]);

  const handleChange = useCallback((name: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tasa: Tasa) => {
    setEditing(tasa);
    setFormError(null);
    setForm({
      codigoTasa: tasa.codigoTasa ?? "",
      nombre: tasa.nombre ?? "",
      descripcion: tasa.descripcion ?? "",
      porcentajeInteres: (tasa.porcentajeInteres ?? 0).toString(),
      porcentajeMora: (tasa.porcentajeMora ?? 0).toString(),
      capitalMin: (tasa.capitalMin ?? "").toString(),
      capitalMax: (tasa.capitalMax ?? "").toString(),
      requiereSolicitud: tasa.requiereSolicitud ?? false,
      activa: tasa.activa !== false,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const formatPercent = (val?: number) => {
    if (val == null) return "-";
    return `${val.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  };

  const formatMoney = (val?: number) => {
    if (val == null || Number.isNaN(val)) return "-";
    return `L. ${val.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim() || undefined;

    if (!nombre) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    const porcentajeInteres = Number(form.porcentajeInteres);
    if (Number.isNaN(porcentajeInteres) || porcentajeInteres <= 0) {
      setFormError("Ingresa un porcentaje de interés válido.");
      return;
    }

    const moraRaw = form.porcentajeMora.trim();
    if (moraRaw === "") {
      setFormError("La mora (%) es obligatoria.");
      return;
    }
    const porcentajeMora = Number(moraRaw);
    if (Number.isNaN(porcentajeMora) || porcentajeMora <= 0) {
      setFormError("La mora (%) debe ser mayor que 0.");
      return;
    }

    const capitalMinRaw = form.capitalMin.trim();
    if (capitalMinRaw === "") {
      setFormError("El capital mínimo es obligatorio.");
      return;
    }
    const capitalMin = Number(capitalMinRaw);
    if (Number.isNaN(capitalMin) || capitalMin < 0) {
      setFormError("Ingresa un capital mínimo válido.");
      return;
    }

    const capitalMaxRaw = form.capitalMax.trim();
    if (capitalMaxRaw === "") {
      setFormError("El capital máximo es obligatorio.");
      return;
    }
    const capitalMax = Number(capitalMaxRaw);
    if (Number.isNaN(capitalMax) || capitalMax < 0) {
      setFormError("Ingresa un capital máximo válido.");
      return;
    }

    if (capitalMax > CAPITAL_MAX_LIMIT) {
      setFormError(`El capital máximo no puede exceder L. ${CAPITAL_MAX_LIMIT.toLocaleString("es-HN")}.`);
      return;
    }

    if (capitalMin != null && capitalMax != null && capitalMin >= capitalMax) {
      setFormError("El capital mínimo debe ser menor al máximo.");
      return;
    }

    const updatePayload = {
      nombre,
      descripcion,
      porcentajeInteres,
      porcentajeMora,
      capitalMin,
      capitalMax,
      requiereSolicitud: form.requiereSolicitud,
      activa: form.activa,
    };

    try {
      if (editing && editing.codigoTasa) {
        await updateTasaByCodigo(editing.codigoTasa, updatePayload);
        setFeedback({ type: "success", message: "Tasa actualizada." });
      } else {
        // No enviar codigoTasa al crear; el backend lo genera automáticamente
        await createTasa({
          ...updatePayload,
        });
        setFeedback({ type: "success", message: "Tasa creada." });
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la tasa.";
      setFormError(message);
    }
  };

  const doToggle = async (codigoTasa: string, nextState: boolean) => {
    if (!codigoTasa) return;
    try {
      setBusyCodigo(codigoTasa);
      await toggleActiveByCodigo(codigoTasa);
      setFeedback({ type: "success", message: nextState ? "Tasa activada." : "Tasa desactivada." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el estado.";
      setFeedback({ type: "error", message });
    } finally {
      setBusyCodigo(null);
    }
  };

  const doDelete = async (codigoTasa: string, tasaId?: string) => {
    if (!codigoTasa) return;
    try {
      setBusyCodigo(codigoTasa);

      // Verificar si la tasa está en uso por algún préstamo antes de borrar.
      type UnknownRecord = Record<string, unknown>;
      const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;
      const getNested = (v: unknown, keys: string[]): unknown => {
        let cur: unknown = v;
        for (const k of keys) {
          if (!isRecord(cur)) return undefined;
          cur = cur[k];
        }
        return cur;
      };

      const asString = (v: unknown): string | undefined => {
        if (typeof v === "string") return v;
        if (v == null) return undefined;
        return String(v);
      };

      const matchesTasaRef = (p: unknown) => {
        const candidates: unknown[] = [
          getNested(p, ["tasInteresId"]),
          getNested(p, ["tasaInteresId"]),
          getNested(p, ["tasaId"]),
          getNested(p, ["tasa"]),
          getNested(p, ["tasaInteres"]),
          getNested(p, ["codigoTasa"]),
          getNested(p, ["codigo", "tasa"]),
          getNested(p, ["solicitudId", "tasInteresId"]),
          getNested(p, ["solicitud", "tasInteresId"]),
        ];

        for (const c of candidates) {
          if (c == null) continue;

          // Direct string id/codigo
          const s = asString(c);
          if (s && (s === codigoTasa || (tasaId && s === tasaId))) return true;

          // Nested object
          if (isRecord(c)) {
            const objId = asString(c._id ?? c.id);
            const objCodigo = asString(c.codigoTasa ?? c.codigo);
            if (objCodigo && objCodigo === codigoTasa) return true;
            if (tasaId && objId && objId === tasaId) return true;

            const deepId = asString(getNested(c, ["_id"]) ?? getNested(c, ["id"]));
            const deepCodigo = asString(getNested(c, ["codigoTasa"]) ?? getNested(c, ["codigo"]));
            if (deepCodigo && deepCodigo === codigoTasa) return true;
            if (tasaId && deepId && deepId === tasaId) return true;
          }
        }

        return false;
      };

      try {
        const res = await apiFetch<unknown>("/prestamos");
        const list: unknown[] = (() => {
          if (Array.isArray(res)) return res;
          if (!isRecord(res)) return [];
          const prestamos = getNested(res, ["prestamos"]);
          if (Array.isArray(prestamos)) return prestamos;
          const data = getNested(res, ["data"]);
          if (Array.isArray(data)) return data;
          return [];
        })();

        const isUsed = list.some(matchesTasaRef);
        if (isUsed) {
          setFeedback({ type: "error", message: "No puede borrar la tasa, esta siendo utilizada por un prestamo" });
          return;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "No se pudo verificar préstamos.";
        setFeedback({ type: "error", message });
        return;
      }

      await deleteTasa(codigoTasa);
      setFeedback({ type: "success", message: "Tasa eliminada." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar.";
      setFeedback({ type: "error", message });
    } finally {
      setBusyCodigo(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 2,
          bgcolor: theme.palette.mode === "dark" ? "rgba(15,23,42,0.6)" : "transparent",
          border: theme.palette.mode === "dark" ? "1px solid rgba(74, 222, 128, 0.25)" : "none",
        })}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Breadcrumbs separator="›" sx={{ color: "text.secondary", fontSize: 12, mb: 0.5 }}>
              <Typography color="text.secondary">Administración</Typography>
              <Typography color="text.secondary">Tasas de interés</Typography>
            </Breadcrumbs>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Tasas de interés
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Gestiona tasas, montos y condiciones de solicitud.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={reload} disabled={loading || saving}>
              Recargar
            </Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={handleOpenCreate}>
              Nueva tasa
            </Button>
          </Stack>
        </Stack>

        <Tabs value={tab} onChange={(_, val) => setTab(val)} textColor="secondary" indicatorColor="secondary" sx={{ mt: 2, width: "100%" }}>
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

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={(theme) => ({
            mt: 2,
            border: theme.palette.mode === "light" ? "none" : undefined,
          })}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Interés</TableCell>
                <TableCell>Mora</TableCell>
                <TableCell>Rango de capital</TableCell>
                <TableCell>Solicitud</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasasFiltradas.map((tasa) => (
                <TableRow key={tasa._id || tasa.codigoTasa || tasa.nombre} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {tasa.codigoTasa || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography fontWeight={700}>{tasa.nombre}</Typography>
                      {tasa.descripcion ? (
                        <Typography variant="caption" color="text.secondary">
                          {tasa.descripcion}
                        </Typography>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#4ade80", fontWeight: 700 }}>{formatPercent(tasa.porcentajeInteres)}</TableCell>
                  <TableCell>{formatPercent(tasa.porcentajeMora)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatMoney(tasa.capitalMin)} - {formatMoney(tasa.capitalMax)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={tasa.requiereSolicitud ? "Requerida" : "No requerida"}
                      color={tasa.requiereSolicitud ? "primary" : "default"}
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
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete({ codigoTasa: tasa.codigoTasa ?? "", id: tasa._id, nombre: tasa.nombre })}
                          disabled={Boolean(busyCodigo) || saving}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="outlined"
                        color={tasa.activa === false ? "success" : "error"}
                        onClick={() => {
                          const nextState = tasa.activa === false;
                          setConfirmToggle({ codigoTasa: tasa.codigoTasa ?? "", nextState, nombre: tasa.nombre });
                        }}
                        disabled={Boolean(busyCodigo) || saving}
                      >
                        {tasa.activa === false ? "Activar" : "Desactivar"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && tasasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay tasas registradas en este estado.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(confirmToggle)} onClose={() => setConfirmToggle(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmToggle?.nextState ? "¿Desea activar esta tasa?" : "¿Desea desactivar esta tasa?"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmToggle(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={confirmToggle?.nextState ? "success" : "error"}
            onClick={async () => {
              if (!confirmToggle) return;
              await doToggle(confirmToggle.codigoTasa, confirmToggle.nextState);
              setConfirmToggle(null);
            }}
          >
            {confirmToggle?.nextState ? "Activar" : "Desactivar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Desea eliminar esta tasa?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!confirmDelete) return;
              await doDelete(confirmDelete.codigoTasa, confirmDelete.id);
              setConfirmDelete(null);
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
              {editing ? (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Código de tasa"
                    fullWidth
                    value={form.codigoTasa}
                    disabled
                    helperText="El código se genera automáticamente y es inmutable."
                  />
                </Grid>
              ) : null}

              <Grid size={{ xs: 12 }}>
                <TextField label="Nombre" fullWidth value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)} required />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField label="Descripción" fullWidth value={form.descripcion} onChange={(e) => handleChange("descripcion", e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Interés (%)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={form.porcentajeInteres}
                  onChange={(e) => handleChange("porcentajeInteres", e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Mora (%)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0.01, step: 0.01 }}
                  value={form.porcentajeMora}
                  onChange={(e) => handleChange("porcentajeMora", e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Capital mínimo"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1000 }}
                  value={form.capitalMin}
                  onChange={(e) => handleChange("capitalMin", e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Capital máximo"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: CAPITAL_MAX_LIMIT, step: 1000 }}
                  value={form.capitalMax}
                  onChange={(e) => {
                    const next = e.target.value;
                    const parsed = next.trim() === "" ? NaN : Number(next);
                    if (!Number.isNaN(parsed) && parsed > CAPITAL_MAX_LIMIT) {
                      handleChange("capitalMax", String(CAPITAL_MAX_LIMIT));
                      return;
                    }
                    handleChange("capitalMax", next);
                  }}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={form.activa} onChange={(_, val) => handleChange("activa", val)} />}
                  label="Activa"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={form.requiereSolicitud} onChange={(_, val) => handleChange("requiereSolicitud", val)} />}
                  label="Solicitud requerida"
                />
              </Grid>
            </Grid>

            {formError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formError}
              </Alert>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editing ? "Guardar cambios" : "Crear tasa"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {feedback?.type === "success" ? (
        <Alert severity="success" onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      ) : null}
      {feedback?.type === "error" ? (
        <Alert severity="error" onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      ) : null}
    </Box>
  );
}
