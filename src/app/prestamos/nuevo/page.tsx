"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

type FrecuenciaPago = "MENSUAL" | "QUINCENAL" | "SEMANAL" | "DIARIO";

const NuevoPrestamoPage: React.FC = () => {
  const router = useRouter();

  const hoy = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    clienteRef: "", // código o identificación del cliente
    producto: "",
    capitalInicial: "",
    plazoMeses: "",
    frecuenciaPago: "MENSUAL" as FrecuenciaPago,
    tasaInteresAnual: "24",
    fechaDesembolso: hoy,
    fechaPrimerPago: "",
    cobrador: "",
    observaciones: "",
  });

  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.clienteRef.trim()) {
      setSnackbarSeverity("error");
      setSnackbarMsg("Debes especificar el cliente (código o identidad).");
      setSnackbarOpen(true);
      return false;
    }

    if (!form.capitalInicial.trim() || Number(form.capitalInicial) <= 0) {
      setSnackbarSeverity("error");
      setSnackbarMsg("El monto del préstamo debe ser mayor a cero.");
      setSnackbarOpen(true);
      return false;
    }

    if (!form.plazoMeses.trim() || Number(form.plazoMeses) <= 0) {
      setSnackbarSeverity("error");
      setSnackbarMsg("El plazo en meses debe ser mayor a cero.");
      setSnackbarOpen(true);
      return false;
    }

    const tasa = Number(form.tasaInteresAnual);
    if (isNaN(tasa) || tasa < 0) {
      setSnackbarSeverity("error");
      setSnackbarMsg("La tasa de interés debe ser un número válido.");
      setSnackbarOpen(true);
      return false;
    }

    return true;
  };

  // Cálculo de cuota estimada (anualidad simple)
  const cuotaEstimada = useMemo(() => {
    const capital = Number(form.capitalInicial);
    const plazoMeses = Number(form.plazoMeses);
    const tasaAnual = Number(form.tasaInteresAnual);

    if (!capital || !plazoMeses) return null;

    let pagosPorMes = 1;
    if (form.frecuenciaPago === "QUINCENAL") pagosPorMes = 2;
    if (form.frecuenciaPago === "SEMANAL") pagosPorMes = 4;
    if (form.frecuenciaPago === "DIARIO") pagosPorMes = 30; // aproximado

    const n = plazoMeses * pagosPorMes;
    if (n <= 0) return null;

    const tasaPeriodica = tasaAnual / 100 / 12 / pagosPorMes; // i por periodo

    if (tasaPeriodica <= 0) {
      // sin interés
      return capital / n;
    }

    const i = tasaPeriodica;
    const cuota = capital * (i / (1 - Math.pow(1 + i, -n)));

    return cuota;
  }, [
    form.capitalInicial,
    form.plazoMeses,
    form.tasaInteresAnual,
    form.frecuenciaPago,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      // Armamos el payload que el backend deberá recibir
      const payload = {
        clienteRef: form.clienteRef, // luego puedes cambiar a clienteId real
        producto: form.producto,
        capitalInicial: Number(form.capitalInicial),
        plazoMeses: Number(form.plazoMeses),
        frecuenciaPago: form.frecuenciaPago,
        tasaInteresAnual: Number(form.tasaInteresAnual),
        fechaDesembolso: form.fechaDesembolso,
        fechaPrimerPago: form.fechaPrimerPago || null,
        cobradorRef: form.cobrador || null,
        observaciones: form.observaciones || null,
      };

      await apiFetch("/financiamientos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSnackbarSeverity("success");
      setSnackbarMsg("Préstamo registrado correctamente.");
      setSnackbarOpen(true);
      router.push("/prestamos");
    } catch (err: any) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg("Error al registrar el préstamo.");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/prestamos");
  };

  const handleCloseSnackbar = (
    _: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const formatMoney = (v: number | null) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "";

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h6">Nuevo préstamo</Typography>
            <Typography variant="caption" color="text.secondary">
              Ingresa los datos del financiamiento. La cuota es un cálculo
              estimado.
            </Typography>
          </Box>
        </Box>

        {/* Formulario */}
        <Paper sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Grid container spacing={2}>
              {/* Cliente */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Cliente (código o identidad)"
                  name="clienteRef"
                  value={form.clienteRef}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  required
                  placeholder="Ej: CL-001 o 0801-XXXX-XXXXX"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Producto / finalidad del crédito"
                  name="producto"
                  value={form.producto}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="Crédito personal, capital de trabajo…"
                />
              </Grid>

              {/* Monto y plazo */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Monto del préstamo"
                  name="capitalInicial"
                  value={form.capitalInicial}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "decimal" }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Plazo (meses)"
                  name="plazoMeses"
                  value={form.plazoMeses}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "numeric" }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Frecuencia de pago"
                  name="frecuenciaPago"
                  value={form.frecuenciaPago}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="MENSUAL">Mensual</MenuItem>
                  <MenuItem value="QUINCENAL">Quincenal</MenuItem>
                  <MenuItem value="SEMANAL">Semanal</MenuItem>
                  <MenuItem value="DIARIO">Diario</MenuItem>
                </TextField>
              </Grid>

              {/* Interés y fechas */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Tasa de interés anual (%)"
                  name="tasaInteresAnual"
                  value={form.tasaInteresAnual}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "decimal" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Fecha de desembolso"
                  type="date"
                  name="fechaDesembolso"
                  value={form.fechaDesembolso}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Fecha primer pago (opcional)"
                  type="date"
                  name="fechaPrimerPago"
                  value={form.fechaPrimerPago}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Cobrador */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Cobrador asignado (nombre o código)"
                  name="cobrador"
                  value={form.cobrador}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="Ej: COB-001 o María López"
                />
              </Grid>

              {/* Observaciones */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Observaciones (opcional)"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  placeholder="Notas internas sobre el crédito…"
                />
              </Grid>
            </Grid>

            {/* Cuota estimada */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Cuota estimada
              </Typography>
              <Typography variant="body1">
                {cuotaEstimada
                  ? formatMoney(cuotaEstimada)
                  : "Ingrese monto, plazo y tasa para calcular."}
              </Typography>
            </Box>

            {/* Botones */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
                mt: 1,
              }}
            >
              <Button onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Guardando…" : "Guardar préstamo"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NuevoPrestamoPage;
