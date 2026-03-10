"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const COMPROBANTE_STORAGE_KEY = "rapicredit:comprobanteAbono";

const NuevoPagoPage: React.FC = () => {
  const router = useRouter();
  const { hasPermiso, loading: loadingPermisos, empleado } = usePermisos();
  const {
    data: prestamosAsignados,
    loading: loadingPrestamosAsignados,
  } = usePrestamosAsignados();

  const prestamosDisponibles = useMemo(
    () => prestamosAsignados.filter((p) => (p.estadoPrestamo || "").toUpperCase() !== "CERRADO"),
    [prestamosAsignados]
  );
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

  // Log para verificar que el archivo actualizado se cargó
  console.log("🔵 NuevoPagoPage cargado - versión con logs de depuración");
  console.log("👤 Empleado actual:", empleado);
  console.log("📝 Préstamos asignados:", prestamosAsignados);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.codigoPrestamo) return prev;
      const existe = prestamosDisponibles.some((p) => p.codigoPrestamo === prev.codigoPrestamo);
      if (existe) return prev;
      setCodigoPrestamo("");
      return { ...prev, codigoPrestamo: "" };
    });
  }, [prestamosDisponibles]);

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
      const normalized = value.replace(",", ".");
      if (normalized !== "" && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
      setForm((prev) => ({ ...prev, monto: normalized }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 handleSubmit iniciado");
    console.log("📋 Form data:", form);

    if (!form.codigoPrestamo || !form.monto || !form.fecha) {
      console.log("❌ Validación 1 FALLÓ: Campos requeridos faltantes");
      setSnackbarMsg("Por favor completa los campos requeridos");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    console.log("✅ Validación 1 OK: Campos requeridos presentes");

    const monto = Number(form.monto);
    if (Number.isNaN(monto) || monto < 0) {
      console.log("❌ Validación 2 FALLÓ: Monto inválido o negativo", monto);
      setSnackbarMsg("El monto no puede ser negativo");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    console.log("✅ Validación 2 OK: Monto válido", monto);

    setSaving(true);
    try {
      const selected = prestamosDisponibles.find((p) => p.codigoPrestamo === form.codigoPrestamo);
      console.log("🔍 Préstamo seleccionado:", selected);
      if (!selected?.id) {
        console.log("❌ Validación 3 FALLÓ: Préstamo no encontrado o sin ID");
        setSnackbarMsg("Selecciona un préstamo válido para registrar el pago");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      console.log("✅ Validación 3 OK: Préstamo encontrado con ID", selected.id);

      console.log("🔍 prestamoDetalle completo:", prestamoDetalle);
      const clienteId = prestamoDetalle?.cliente?.id || prestamoDetalle?.clienteId;
      console.log("🔍 clienteId extraído:", clienteId);
      if (!clienteId) {
        console.log("❌ Validación 4 FALLÓ: ClienteId no encontrado");
        setSnackbarMsg("No se pudo determinar el cliente del préstamo seleccionado");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      console.log("✅ Validación 4 OK: ClienteId encontrado", clienteId);

      console.log("🔍 empleado completo:", empleado);
      const cobradorId = empleado?._id;
      console.log("🔍 cobradorId extraído:", cobradorId);
      if (!cobradorId) {
        console.log("❌ Validación 5 FALLÓ: CobradorId no encontrado");
        setSnackbarMsg("No se pudo determinar el cobrador actual para registrar el pago");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      console.log("✅ Validación 5 OK: CobradorId encontrado", cobradorId);

      const payload = {
        prestamoId: selected.id,
        clienteId,
        cobradorId,
        montoPago: monto,
        fechaPago: form.fecha,
        metodoPago: form.medioPago,
        observaciones: form.observaciones || undefined,
      };

      console.log("🔥 TODAS LAS VALIDACIONES PASARON");
      console.log("📦 Payload construido:", payload);
      console.log("📡 URL completa:", `/prestamos/id/${selected.id}/aplicar-pago`);
      
      console.log("⏳ Iniciando apiFetch...");
      await apiFetch(`/prestamos/id/${selected.id}/aplicar-pago`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log("✅ apiFetch completado exitosamente");
      

      // Comprobante (por ahora: en duro / local). No depende de que el backend devuelva un ID.
      try {
        const clienteNombre =
          prestamoDetalle?.cliente?.nombreCompleto ||
          selected.clienteNombre ||
          "—";
        const asesorNombre = empleado?.nombreCompleto || empleado?.usuario || "—";
        const saldoPendiente =
          prestamoDetalle?.saldo ??
          prestamoDetalle?.saldoActual ??
          prestamoDetalle?.saldoPendiente ??
          0;

        const comprobante = {
          recibo: String(Date.now()).slice(-5),
          codigoPrestamo: form.codigoPrestamo,
          fecha: form.fecha,
          cliente: clienteNombre.toUpperCase(),
          asesor: asesorNombre.toUpperCase(),
          monto,
          saldoPendiente,
          cuotasPendientes: 0,
          cuotasPagadas: [
            {
              numero: 1,
              cuota: prestamoDetalle?.cuotaFija ?? 0,
              pago: monto,
              multa: 0,
            },
          ],
        };

        sessionStorage.setItem(COMPROBANTE_STORAGE_KEY, JSON.stringify(comprobante));
      } catch {
        // Ignorar errores de storage (ej: navegador restringido)
      }

      setSnackbarMsg("Pago registrado exitosamente");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      router.push("/pagos/comprobante");
    } catch (e: unknown) {
      console.log("💥 ERROR capturado en handleSubmit:", e);
      const msg =
        e instanceof Error ? e.message : "No se pudo registrar el abono";
      setSnackbarMsg(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      console.log("🏁 handleSubmit finalizado");
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
                    disabled={saving || loadingPrestamosAsignados || prestamosDisponibles.length === 0}
                    helperText={
                      loadingPrestamosAsignados
                        ? "Cargando préstamos asignados..."
                        : prestamosDisponibles.length === 0
                          ? "No tienes préstamos vigentes para registrar pagos."
                          : "Selecciona un préstamo asignado al asesor actual (solo vigentes)."
                    }
                  >
                    {prestamosDisponibles.map((prestamo) => (
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
                    inputProps={{ step: "0.01", min: "0" }}
                    placeholder="0.00"
                    helperText="Permite decimales. No se permiten montos negativos."
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

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Saldo Pendiente por Pagar
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {(() => {
                            if (prestamoDetalle.saldoPendiente != null) {
                              return formatMoney(prestamoDetalle.saldoPendiente);
                            }
                            if (prestamoDetalle.saldo != null) {
                              return formatMoney(prestamoDetalle.saldo);
                            }
                            if (prestamoDetalle.saldoActual != null) {
                              return formatMoney(prestamoDetalle.saldoActual);
                            }
                            const capital = prestamoDetalle.capitalSolicitado ?? 0;
                            const intereses = prestamoDetalle.totalIntereses ?? 0;
                            const pagado = prestamoDetalle.totalPagado ?? 0;
                            return formatMoney(capital + intereses - pagado);
                          })()}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Intereses
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {formatMoney(prestamoDetalle.totalIntereses ?? 0)}
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
