"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../hooks/usePrestamoDetalle";
import { apiFetch } from "../../../lib/api";
import { useTasasInteres, TasaInteres } from "../../../hooks/useTasasInteres";
import { useFrecuenciasPago, FrecuenciaPago } from "../../../hooks/useFrecuenciasPago";

const PrestamoDetallePage: React.FC = () => {
  const params = useParams();
  // En esta ruta el "id" realmente es el código del préstamo (ej: P-2026-001)
  const codigoPrestamo = params?.id as string;

  const searchParams = useSearchParams();
  const initialEditMode = useMemo(() => {
    const v = (searchParams?.get("edit") || "").toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }, [searchParams]);

  const [reloadKey, setReloadKey] = useState(0);
  const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, reloadKey);

  const [editMode, setEditMode] = useState<boolean>(initialEditMode);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    capitalSolicitado: "",
    plazoCuotas: "",
    fechaDesembolso: "",
    fechaVencimiento: "",
    observaciones: "",
    estadoPrestamo: "",
    activo: "true",
  });

  const { data: tasas } = useTasasInteres();
  const { data: frecuencias } = useFrecuenciasPago();

  const [selectedTasa, setSelectedTasa] = useState<TasaInteres | null>(null);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaPago | null>(null);

  const tasaOptions = useMemo(() => {
    if (!selectedTasa?._id) return tasas;
    const exists = tasas.some((t) => String(t._id) === String(selectedTasa._id));
    return exists ? tasas : [selectedTasa, ...tasas];
  }, [tasas, selectedTasa]);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || "").toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";

    if (val === "VIGENTE") color = "success";
    else if (val === "PENDIENTE") color = "warning";
    else if (val === "CERRADO") color = "default";
    else if (val === "RECHAZADO") color = "error";

    return <Chip size="small" label={val || "—"} color={color} variant="outlined" />;
  };

  const toDateInputValue = (iso?: string) => {
    if (!iso) return "";
    try {
      const s = String(iso);
      return s.length >= 10 ? s.slice(0, 10) : "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!data) return;
    setForm({
      capitalSolicitado: data.capitalSolicitado != null ? String(data.capitalSolicitado) : "",
      plazoCuotas: data.plazoCuotas != null ? String(data.plazoCuotas) : "",
      fechaDesembolso: toDateInputValue(data.fechaDesembolso),
      fechaVencimiento: toDateInputValue(data.fechaVencimiento),
      observaciones: data.observaciones ?? "",
      estadoPrestamo: (data.estadoPrestamo || "").toUpperCase(),
      activo: data.activo === false ? "false" : "true",
    });

    if (data.tasaInteresId) {
      const match = tasas.find((t) => String(t._id) === String(data.tasaInteresId) || String(t.codigoTasa ?? "") === String(data.tasaInteresId));
      const next = match ?? ({ _id: data.tasaInteresId, nombre: data.tasaInteresNombre ?? "Tasa actual" } as TasaInteres);
      setSelectedTasa((prev) => (prev && String(prev._id) === String(next._id) ? prev : next));
    }

    if (data.frecuenciaPago) {
      const raw = String(data.frecuenciaPago).toUpperCase();
      const normalized = raw === "DIARIO" ? "DIARIA" : raw;
      const nombre = (() => {
        if (normalized === "DIARIA") return "Días";
        if (normalized === "SEMANAL") return "Semanas";
        if (normalized === "QUINCENAL") return "Quincenas";
        if (normalized === "MENSUAL") return "Meses";
        return null;
      })();
      const match = nombre ? frecuencias.find((f) => String(f.nombre) === nombre) : null;
      setSelectedFrecuencia(match ?? null);
    }
  }, [data, tasas, frecuencias]);

  const onChangeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCancelEdit = () => {
    if (saving) return;
    setEditMode(false);
    setReloadKey((k) => k + 1);
  };

  const onSave = async () => {
    if (!data?.codigoPrestamo) return;

    const toFiniteNumber = (v: string): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    if (!selectedTasa?._id) {
      setToastSeverity("error");
      setToastMessage("Debes seleccionar una tasa de interés.");
      setToastOpen(true);
      return;
    }
    if (!selectedFrecuencia?.nombre) {
      setToastSeverity("error");
      setToastMessage("Debes seleccionar una frecuencia de pago.");
      setToastOpen(true);
      return;
    }

    const capital = toFiniteNumber(form.capitalSolicitado);
    if (capital == null || capital <= 0) {
      setToastSeverity("error");
      setToastMessage("El capital solicitado debe ser mayor a cero.");
      setToastOpen(true);
      return;
    }

    const plazo = toFiniteNumber(form.plazoCuotas);
    if (plazo == null || plazo <= 0) {
      setToastSeverity("error");
      setToastMessage("El plazo (cuotas) debe ser mayor a cero.");
      setToastOpen(true);
      return;
    }

    if (!form.fechaDesembolso || !form.fechaVencimiento) {
      setToastSeverity("error");
      setToastMessage("Debes indicar fecha de desembolso y vencimiento.");
      setToastOpen(true);
      return;
    }

    // Validación básica: vencimiento no puede ser antes que desembolso
    const desembolsoTime = Date.parse(form.fechaDesembolso);
    const vencimientoTime = Date.parse(form.fechaVencimiento);
    if (Number.isFinite(desembolsoTime) && Number.isFinite(vencimientoTime) && vencimientoTime < desembolsoTime) {
      setToastSeverity("error");
      setToastMessage("La fecha de vencimiento no puede ser anterior a la fecha de desembolso.");
      setToastOpen(true);
      return;
    }

    const min = Number(selectedTasa.capitalMin);
    const max = Number(selectedTasa.capitalMax);
    const hasMin = Number.isFinite(min) && min > 0;
    const hasMax = Number.isFinite(max) && max > 0;
    if (hasMin && capital < min) {
      setToastSeverity("error");
      setToastMessage(`El capital no puede ser menor a L. ${min.toLocaleString("es-HN", { minimumFractionDigits: 2 })} según la tasa seleccionada.`);
      setToastOpen(true);
      return;
    }
    if (hasMax && capital > max) {
      setToastSeverity("error");
      setToastMessage(`El capital no puede ser mayor a L. ${max.toLocaleString("es-HN", { minimumFractionDigits: 2 })} según la tasa seleccionada.`);
      setToastOpen(true);
      return;
    }

    const frecuenciaEnum = (() => {
      switch (selectedFrecuencia.nombre) {
        case "Días":
          return "DIARIA";
        case "Semanas":
          return "SEMANAL";
        case "Quincenas":
          return "QUINCENAL";
        case "Meses":
          return "MENSUAL";
        default:
          return null;
      }
    })();
    if (!frecuenciaEnum) {
      setToastSeverity("error");
      setToastMessage("Frecuencia de pago inválida.");
      setToastOpen(true);
      return;
    }

    const estado = (form.estadoPrestamo || "").toUpperCase();
    const estadoOk = ["VIGENTE", "CERRADO", "RECHAZADO", "PENDIENTE"].includes(estado);
    if (!estadoOk) {
      setToastSeverity("error");
      setToastMessage("Estado de préstamo inválido.");
      setToastOpen(true);
      return;
    }

    const payload: Record<string, unknown> = {
      // Campos requeridos por el modelo (por si el backend valida el documento completo)
      clienteId: data.clienteId,
      solicitudId: data.solicitudId,

      tasaInteresId: selectedTasa._id,
      frecuenciaPago: frecuenciaEnum,
      capitalSolicitado: capital,
      cuotaFija: data.cuotaFija,
      plazoCuotas: plazo,
      fechaDesembolso: form.fechaDesembolso,
      fechaVencimiento: form.fechaVencimiento,
      estadoPrestamo: estado,
      observaciones: form.observaciones ?? "",
      activo: form.activo !== "false",
    };

    if (!payload.clienteId || !payload.solicitudId) {
      setToastSeverity("error");
      setToastMessage("No se pudo determinar cliente/solicitud del préstamo. Recarga la página e inténtalo de nuevo.");
      setToastOpen(true);
      return;
    }

    setSaving(true);
    try {
      await apiFetch(`/prestamos/${encodeURIComponent(data.codigoPrestamo)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setToastSeverity("success");
      setToastMessage("Préstamo actualizado.");
      setToastOpen(true);
      setEditMode(false);
      setReloadKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity("error");
      const msg = e instanceof Error ? e.message : "No se pudo actualizar el préstamo.";
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">No se pudo cargar la información del préstamo.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
        <Box>
          <Typography variant="h6">Préstamo {data.codigoPrestamo || ""}</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
            {renderEstadoChip(data.estadoPrestamo)}
            <Typography variant="caption" color="text.secondary">
              Cliente: {data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {editMode ? (
            <>
              <Button size="small" variant="contained" onClick={onSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button size="small" variant="contained" onClick={() => setEditMode(true)}>
              Editar
            </Button>
          )}

          {data.cliente && (
            <Button size="small" variant="outlined" component={Link} href={`/clientes/${data.cliente.id}`}>
              Ver cliente
            </Button>
          )}
          <Button size="small" variant="outlined" component={Link} href="/prestamos">
            Volver a lista
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Datos del préstamo</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 6 }}>
                {editMode ? (
                  <TextField
                    label="Capital solicitado"
                    fullWidth
                    size="small"
                    type="number"
                    name="capitalSolicitado"
                    value={form.capitalSolicitado}
                    onChange={onChangeForm}
                    inputProps={{ inputMode: "decimal", step: "0.01" }}
                  />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">Capital</Typography>
                    <Typography>{formatMoney(data.capitalSolicitado)}</Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Cuota fija</Typography>
                <Typography>{formatMoney(data.cuotaFija)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {editMode ? (
                  <TextField
                    label="Plazo (cuotas)"
                    fullWidth
                    size="small"
                    type="number"
                    name="plazoCuotas"
                    value={form.plazoCuotas}
                    onChange={onChangeForm}
                    inputProps={{ inputMode: "numeric", step: "1" }}
                  />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">Plazo (cuotas)</Typography>
                    <Typography>{data.plazoCuotas}</Typography>
                  </>
                )}
              </Grid>

              {editMode && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Parámetros financieros</Typography>
                </Grid>
              )}
              {editMode && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Tasa de interés"
                      value={selectedTasa?._id ?? ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const match = tasaOptions.find((t) => String(t._id) === String(id));
                        setSelectedTasa(match ?? null);
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Selecciona una tasa</em>
                      </MenuItem>
                      {tasaOptions.map((t) => (
                        <MenuItem key={String(t._id)} value={String(t._id)}>
                          {t.nombre} {t.porcentajeInteres != null ? `- ${t.porcentajeInteres}%` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Frecuencia de pago"
                      value={selectedFrecuencia?.nombre ?? ""}
                      onChange={(e) => {
                        const nombre = e.target.value;
                        const match = frecuencias.find((f) => String(f.nombre) === String(nombre));
                        setSelectedFrecuencia(match ?? null);
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Selecciona una frecuencia</em>
                      </MenuItem>
                      {frecuencias.map((f) => (
                        <MenuItem key={String(f._id)} value={String(f.nombre)}>
                          {String(f.nombre)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                {editMode ? (
                  <TextField
                    label="Fecha de desembolso"
                    type="date"
                    name="fechaDesembolso"
                    value={form.fechaDesembolso}
                    onChange={onChangeForm}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">Desembolso</Typography>
                    <Typography>{formatDate(data.fechaDesembolso)}</Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {editMode ? (
                  <TextField
                    label="Fecha de vencimiento"
                    type="date"
                    name="fechaVencimiento"
                    value={form.fechaVencimiento}
                    onChange={onChangeForm}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">Vencimiento</Typography>
                    <Typography>{formatDate(data.fechaVencimiento)}</Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total intereses</Typography>
                <Typography>{data.totalIntereses != null ? formatMoney(data.totalIntereses) : "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total pagado</Typography>
                <Typography>{data.totalPagado != null ? formatMoney(data.totalPagado) : "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    name="observaciones"
                    value={form.observaciones}
                    onChange={onChangeForm}
                    placeholder="Observaciones"
                  />
                ) : (
                  <Typography>{data.observaciones || "—"}</Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Estado</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Estado</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    select
                    name="estadoPrestamo"
                    value={form.estadoPrestamo}
                    onChange={onChangeForm}
                  >
                    <MenuItem value="VIGENTE">VIGENTE</MenuItem>
                    <MenuItem value="PENDIENTE">PENDIENTE</MenuItem>
                    <MenuItem value="CERRADO">CERRADO</MenuItem>
                    <MenuItem value="RECHAZADO">RECHAZADO</MenuItem>
                  </TextField>
                ) : (
                  <Typography>{data.estadoPrestamo || "—"}</Typography>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Activo</Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    select
                    name="activo"
                    value={form.activo}
                    onChange={onChangeForm}
                  >
                    <MenuItem value="true">Sí</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </TextField>
                ) : (
                  <Typography>{data.activo === false ? "No" : "Sí"}</Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

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

export default PrestamoDetallePage;
