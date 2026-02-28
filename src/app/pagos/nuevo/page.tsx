"use client";

import React, { useState } from "react";
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
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import { usePermisos } from "../../../hooks/usePermisos";
import { usePrestamoDetalle } from "../../../hooks/usePrestamoDetalle";

const NuevoPagoPage: React.FC = () => {
  const router = useRouter();
  const { hasPermiso, loading: loadingPermisos } = usePermisos();
  const [codigoPrestamo, setCodigoPrestamo] = useState("");
  
  const { data: prestamoDetalle, loading: loadingDetalle } = usePrestamoDetalle(
    codigoPrestamo || ""
  );

  const [form, setForm] = useState({
    codigoPrestamo: "",
    monto: "",
    fecha: new Date().toISOString().slice(0, 10),
    medioPago: "EFECTIVO" as "EFECTIVO" | "TRANSFERENCIA" | "DEPOSITO",
    referencia: "",
    observaciones: "",
  });

  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const canAplicarPago = hasPermiso("F005");

  if (!loadingPermisos && !canAplicarPago) {
    return (
      <Box sx={{ p: 3 }}>
        <Link href="/pagos" style={{ textDecoration: "none" }}>
          <Button startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
            Volver a Pagos
          </Button>
        </Link>
        <Typography variant="h6" gutterBottom>
          Sin permisos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No tiene permisos para registrar pagos.
        </Typography>
      </Box>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "codigoPrestamo") {
      setCodigoPrestamo(value);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.codigoPrestamo || !form.monto || !form.fecha) {
      setSnackbarMsg("Por favor completa los campos requeridos");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/abonos", {
        method: "POST",
        body: JSON.stringify({
          codigoPrestamo: form.codigoPrestamo,
          monto: parseFloat(form.monto),
          fecha: form.fecha,
          medioPago: form.medioPago,
          referencia: form.referencia || undefined,
          observaciones: form.observaciones || undefined,
        }),
      });

      setSnackbarMsg("Abono registrado exitosamente");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTimeout(() => {
        router.push("/pagos");
      }, 1500);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo registrar el abono";
      setSnackbarMsg(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Link href="/pagos" style={{ textDecoration: "none" }}>
          <Button startIcon={<ArrowBackIcon />} variant="text">
            Volver
          </Button>
        </Link>
        <Typography variant="h5">Registrar Nuevo Abono</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Formulario de Registro */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Datos del Abono
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Código de Préstamo *"
                    name="codigoPrestamo"
                    value={form.codigoPrestamo}
                    onChange={handleChange}
                    size="small"
                    disabled={saving}
                    placeholder="Ej: PREST-001"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Monto *"
                    name="monto"
                    type="number"
                    value={form.monto}
                    onChange={handleChange}
                    size="small"
                    disabled={saving}
                    inputProps={{ step: "0.01", min: "0" }}
                    placeholder="0.00"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Fecha *"
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                    size="small"
                    disabled={saving}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Medio de Pago *"
                    name="medioPago"
                    value={form.medioPago}
                    onChange={handleChange}
                    size="small"
                    disabled={saving}
                  >
                    <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                    <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                    <MenuItem value="DEPOSITO">Depósito</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Referencia / Recibo"
                    name="referencia"
                    value={form.referencia}
                    onChange={handleChange}
                    size="small"
                    disabled={saving}
                    placeholder="Ej: Recibo #12345"
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Observaciones"
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    size="small"
                    disabled={saving}
                    placeholder="Notas adicionales sobre el pago..."
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={saving}
                    sx={{ borderRadius: 999 }}
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Guardando...
                      </>
                    ) : (
                      "Registrar Abono"
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Detalle del Financiamiento */}
        {codigoPrestamo && (
          <Grid size={{ xs: 12, md: 6 }}>
            {loadingDetalle ? (
              <Paper sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </Paper>
            ) : prestamoDetalle ? (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Detalles del Financiamiento
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body2">
                        {prestamoDetalle.cliente?.nombreCompleto || "No asignado"}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Capital Solicitado
                        </Typography>
                        <Typography variant="body2">
                          {formatMoney(prestamoDetalle.capitalSolicitado)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Cuota Fija
                        </Typography>
                        <Typography variant="body2">
                          {formatMoney(prestamoDetalle.cuotaFija)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Plazo
                        </Typography>
                        <Typography variant="body2">
                          {prestamoDetalle.plazoCuotas} cuotas
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Frecuencia
                        </Typography>
                        <Typography variant="body2">
                          {prestamoDetalle.frecuenciaPago || "-"}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Desembolso
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(prestamoDetalle.fechaDesembolso)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Vencimiento
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(prestamoDetalle.fechaVencimiento)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ p: 1.5, bgcolor: "background.default", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Estado
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {prestamoDetalle.estadoPrestamo || "VIGENTE"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Ingresa un código de préstamo para ver los detalles
                </Typography>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NuevoPagoPage;
