"use client";

import React, { useEffect, useState } from "react";
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
import { usePrestamosAsignados } from "../../../hooks/usePrestamosAsignados";

const NuevoPagoPage: React.FC = () => {
  const router = useRouter();
  const { hasPermiso, loading: loadingPermisos } = usePermisos();
  const {
    data: prestamosAsignados,
    loading: loadingPrestamosAsignados,
  } = usePrestamosAsignados();
  const [codigoPrestamo, setCodigoPrestamo] = useState("");
  
  const { data: prestamoDetalle, loading: loadingDetalle } = usePrestamoDetalle(
    codigoPrestamo || ""
  );

  const [form, setForm] = useState({
    codigoPrestamo: "",
    monto: "",
    fecha: new Date().toISOString().slice(0, 10),
    medioPago: "EFECTIVO" as "EFECTIVO" | "TRANSFERENCIA" | "CREDITO",
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

  useEffect(() => {
    setForm((prev) => {
      if (!prev.codigoPrestamo) return prev;
      const existe = prestamosAsignados.some((p) => p.codigoPrestamo === prev.codigoPrestamo);
      if (existe) return prev;
      setCodigoPrestamo("");
      return { ...prev, codigoPrestamo: "" };
    });
  }, [prestamosAsignados]);

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

    if (name === "monto") {
      const onlyDigits = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, monto: onlyDigits }));
      return;
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

    const monto = Number(form.monto);
    if (Number.isNaN(monto) || monto <= 0 || !Number.isInteger(monto) || monto % 100 !== 0) {
      setSnackbarMsg("El monto debe ser un número entero en intervalos de 100 (100, 200, 300...)");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSaving(true);
    try {
      const selected = prestamosAsignados.find((p) => p.codigoPrestamo === form.codigoPrestamo);
      if (!selected?.id) {
        setSnackbarMsg("Selecciona un préstamo válido para registrar el pago");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      await apiFetch("/pagos", {
        method: "POST",
        body: JSON.stringify({
          financiamientoId: selected.id,
          codigoFinanciamiento: form.codigoPrestamo,
          monto,
          fechaPago: form.fecha,
          metodoPago: form.medioPago,
          observaciones: form.observaciones || undefined,
        }),
      });

      setSnackbarMsg("Pago registrado exitosamente");
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
                    select
                    label="Código de Préstamo *"
                    name="codigoPrestamo"
                    value={form.codigoPrestamo}
                    onChange={handleChange}
                    size="small"
                    disabled={saving || loadingPrestamosAsignados || prestamosAsignados.length === 0}
                    helperText={
                      loadingPrestamosAsignados
                        ? "Cargando préstamos asignados..."
                        : prestamosAsignados.length === 0
                          ? "No tienes préstamos asignados para registrar pagos."
                          : "Selecciona un préstamo asignado al asesor actual."
                    }
                  >
                    {prestamosAsignados.map((prestamo) => (
                      <MenuItem key={prestamo.id} value={prestamo.codigoPrestamo}>
                        {prestamo.codigoPrestamo} — {prestamo.clienteNombre}
                      </MenuItem>
                    ))}
                  </TextField>
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
                    inputProps={{ step: "100", min: "100" }}
                    placeholder="100"
                    helperText="Solo enteros múltiplos de 100"
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
                    <MenuItem value="CREDITO">Crédito</MenuItem>
                  </TextField>
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
                  Selecciona un préstamo para ver los detalles
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
