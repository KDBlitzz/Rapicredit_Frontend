"use client";

import React, { useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";

const NuevoPrestamoPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente después de 3 segundos
    const timeout = setTimeout(() => {
      router.push("/solicitudes");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 600, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Crear Préstamo
        </Typography>

        <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Información importante:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Los préstamos ahora se crean automáticamente al <strong>aprobar una solicitud</strong>.
          </Typography>
          <Typography variant="body2">
            Para crear un nuevo préstamo, primero debe registrar una solicitud de crédito.
          </Typography>
        </Alert>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
          <Button
            variant="contained"
            component={Link}
            href="/solicitudes/nuevo"
          >
            Crear Nueva Solicitud
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href="/solicitudes"
          >
            Ver Solicitudes
          </Button>
          <Button
            variant="text"
            onClick={() => router.back()}
          >
            Volver
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>
          Redirigiendo a solicitudes en 3 segundos...
        </Typography>
      </Paper>
    </Box>
  );
};

export default NuevoPrestamoPage;
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
