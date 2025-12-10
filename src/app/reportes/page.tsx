"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import { useReportes } from "../../hooks/useReportes";

const ReportesPage: React.FC = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 7);
  const hace7Iso = hace7.toISOString().slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(hace7Iso);
  const [fechaFin, setFechaFin] = useState(hoy);

  const { data, loading, error } = useReportes(fechaInicio, fechaFin);

  const resumen = data?.resumen;
  const moraPorRango = data?.moraPorRango || [];
  const pagosDiarios = data?.pagosDiarios || [];
  const carteraPorCobrador = data?.carteraPorCobrador || [];

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const handleAplicarRango = (e: React.FormEvent) => {
    e.preventDefault();
    // En el futuro podríamos validar rango, etc.
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header y rango de fechas */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6">Reportes</Typography>
          <Typography variant="caption" color="text.secondary">
            Visualiza la cartera, mora y pagos en un rango de fechas.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleAplicarRango}
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            type="date"
            size="small"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <Button
            type="submit"
            variant="outlined"
            size="small"
            disabled={loading}
          >
            Aplicar
          </Button>
        </Box>
      </Box>

      {/* Estado de carga / error */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando reportes…
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      {/* Tarjetas resumen */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              background:
                "radial-gradient(circle at top, rgba(56,189,248,0.10), rgba(15,23,42,1))",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Cartera total
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {resumen ? formatMoney(resumen.totalCartera) : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Suma de saldos de todos los préstamos
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              background:
                "radial-gradient(circle at top, rgba(56,189,248,0.10), rgba(15,23,42,1))",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Cartera vigente
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {resumen ? formatMoney(resumen.carteraVigente) : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Préstamos al día
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              background:
                "radial-gradient(circle at top, rgba(248,113,113,0.15), rgba(15,23,42,1))",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Cartera en mora
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {resumen ? formatMoney(resumen.carteraEnMora) : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Saldos vencidos
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              background:
                "radial-gradient(circle at top, rgba(34,197,94,0.15), rgba(15,23,42,1))",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Cartera pagada
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {resumen ? formatMoney(resumen.carteraPagada) : "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Préstamos cancelados
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Mora por rango + pagos diarios + cartera por cobrador */}
      <Grid container spacing={2}>
        {/* Mora por rango */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Mora por rango de días
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rango</TableCell>
                    <TableCell>Préstamos</TableCell>
                    <TableCell>Saldo en mora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {moraPorRango.map((m) => (
                    <TableRow key={m.rango}>
                      <TableCell>{m.rango}</TableCell>
                      <TableCell>{m.cantidadPrestamos}</TableCell>
                      <TableCell>{formatMoney(m.saldo)}</TableCell>
                    </TableRow>
                  ))}

                  {moraPorRango.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No hay datos de mora para el rango seleccionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Pagos diarios */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Pagos diarios
            </Typography>
            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Pagos</TableCell>
                    <TableCell>Total pagado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosDiarios.map((p) => (
                    <TableRow key={p.fecha}>
                      <TableCell>{formatDate(p.fecha)}</TableCell>
                      <TableCell>{p.cantidadPagos}</TableCell>
                      <TableCell>{formatMoney(p.totalMonto)}</TableCell>
                    </TableRow>
                  ))}

                  {pagosDiarios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No hay pagos registrados en el rango seleccionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Cartera por cobrador */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cartera por cobrador
            </Typography>
            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Cobrador</TableCell>
                    <TableCell>Préstamos</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Mora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carteraPorCobrador.map((c) => (
                    <TableRow key={c.cobrador}>
                      <TableCell>{c.cobrador}</TableCell>
                      <TableCell>{c.cantidadPrestamos}</TableCell>
                      <TableCell>{formatMoney(c.saldo)}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {formatMoney(c.saldoEnMora)}
                          {c.saldo > 0 && (
                            <Chip
                              size="small"
                              label={`${Math.round(
                                (c.saldoEnMora / c.saldo) * 100
                              )}%`}
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}

                  {carteraPorCobrador.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay datos de cartera por cobrador.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportesPage;
