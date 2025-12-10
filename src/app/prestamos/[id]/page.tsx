"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../hooks/usePrestamoDetalle";
import { apiFetch } from "../../../lib/api";

const PrestamoDetallePage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;

  const [reloadKey, setReloadKey] = useState(0);
  const { data, loading, error } = usePrestamoDetalle(id, reloadKey);

  const [montoAbono, setMontoAbono] = useState("");
  const [fechaAbono, setFechaAbono] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [metodoPago, setMetodoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [savingAbono, setSavingAbono] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const handleCloseSnackbar = (
    _: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleRegistrarAbono = async (e: React.FormEvent) => {
    e.preventDefault();

    const monto = Number(montoAbono);
    if (!monto || monto <= 0) {
      setSnackbarSeverity("error");
      setSnackbarMsg("El monto del abono debe ser mayor a cero.");
      setSnackbarOpen(true);
      return;
    }

    setSavingAbono(true);

    try {
      const payload = {
        financiamientoId: id,
        montoAbono: monto,
        fechaAbono,
        metodoPago: metodoPago || null,
        observaciones: observaciones || null,
      };

      // 👇 Ajusta la ruta si tu backend usa otro path para abonos
      await apiFetch("/abonos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSnackbarSeverity("success");
      setSnackbarMsg("Abono registrado correctamente.");
      setSnackbarOpen(true);

      // Limpiar campos
      setMontoAbono("");
      setMetodoPago("");
      setObservaciones("");

      // Volver a cargar el detalle del préstamo
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg("Error al registrar el abono.");
      setSnackbarOpen(true);
    } finally {
      setSavingAbono(false);
    }
  };

  if (loading && !data) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          No se pudo cargar la información del préstamo.
        </Typography>
      </Box>
    );
  }

  const {
    codigoFinanciamiento,
    capitalInicial,
    saldoCapital,
    tasaInteresAnual,
    estadoFinanciamiento,
    fechaDesembolso,
    fechaVencimiento,
    cliente,
    cobrador,
    abonos,
    totalAbonado,
  } = data;

  const renderEstadoChip = () => {
    const val = estadoFinanciamiento.toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";

    if (val === "VIGENTE") color = "success";
    else if (val === "EN_MORA") color = "error";
    else if (val === "PAGADO") color = "default";

    return (
      <Chip size="small" label={val || "—"} color={color} variant="outlined" />
    );
  };

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
            <Typography variant="h6">
              Préstamo {codigoFinanciamiento || ""}
            </Typography>
            <Box
              sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}
            >
              {renderEstadoChip()}
              <Typography variant="caption" color="text.secondary">
                Cliente:{" "}
                {cliente
                  ? cliente.nombreCompleto ||
                    cliente.codigoCliente ||
                    cliente.identidadCliente
                  : "—"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {cliente && (
              <Button
                size="small"
                variant="outlined"
                component={Link}
                href={`/clientes/${cliente.id}`}
              >
                Ver cliente
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              component={Link}
              href="/prestamos"
            >
              Volver a lista
            </Button>
          </Box>
        </Box>

        {/* Resumen y datos */}
        <Grid container spacing={2}>
          {/* Resumen financiero */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Resumen del préstamo
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Monto del préstamo
                  </Typography>
                  <Typography>{formatMoney(capitalInicial)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Saldo actual
                  </Typography>
                  <Typography>{formatMoney(saldoCapital)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total abonado
                  </Typography>
                  <Typography>{formatMoney(totalAbonado)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Tasa interés anual
                  </Typography>
                  <Typography>
                    {tasaInteresAnual != null
                      ? `${tasaInteresAnual}%`
                      : "No definido"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha desembolso
                  </Typography>
                  <Typography>{formatDate(fechaDesembolso)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha vencimiento
                  </Typography>
                  <Typography>{formatDate(fechaVencimiento)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Cliente y cobrador */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Cliente y cobrador
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography>
                    {cliente
                      ? cliente.nombreCompleto ||
                        cliente.codigoCliente ||
                        cliente.identidadCliente
                      : "—"}
                  </Typography>
                  {cliente && (
                    <Typography variant="caption" color="text.secondary">
                      Identidad: {cliente.identidadCliente || "No registrada"}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Cobrador
                  </Typography>
                  <Typography>
                    {cobrador
                      ? cobrador.nombreCompleto ||
                        cobrador.codigo ||
                        cobrador.id
                      : "Sin asignar"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Abonos y formulario */}
        <Grid container spacing={2}>
          {/* Tabla de abonos */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Historial de abonos
              </Typography>
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell>Recibo</TableCell>
                      <TableCell>Registrado por</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {abonos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.fecha)}</TableCell>
                        <TableCell>{formatMoney(a.monto)}</TableCell>
                        <TableCell>{a.metodoPago || "—"}</TableCell>
                        <TableCell>{a.recibo || "—"}</TableCell>
                        <TableCell>{a.usuarioRegistro || "—"}</TableCell>
                      </TableRow>
                    ))}

                    {abonos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No hay abonos registrados para este préstamo.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Registrar abono */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Registrar abono
              </Typography>
              <Box
                component="form"
                onSubmit={handleRegistrarAbono}
                sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
              >
                <TextField
                  label="Monto del abono"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  size="small"
                  fullWidth
                  inputProps={{ inputMode: "decimal" }}
                  required
                />
                <TextField
                  label="Fecha del abono"
                  type="date"
                  value={fechaAbono}
                  onChange={(e) => setFechaAbono(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Método de pago (opcional)"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="Efectivo, transferencia…"
                />
                <TextField
                  label="Observaciones (opcional)"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={savingAbono}
                  >
                    {savingAbono ? "Guardando…" : "Guardar abono"}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
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

export default PrestamoDetallePage;
