"use client";

import React, { useMemo } from "react";
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
} from "@mui/material";
import Link from "next/link";
import { useDashboard } from "../../hooks/useDashboard";
import { usePrestamos } from "../../hooks/usePrestamos";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";

const DashboardPage: React.FC = () => {
  const { data, loading, error } = useDashboard();
  const prestamosAll = usePrestamos({ busqueda: "", estado: "TODOS" });
  const { empleado } = useEmpleadoActual();

  const rolActual = (empleado?.rol || "").toLowerCase();
  const isGerenteOSupervisor =
    rolActual.includes("gerente") || rolActual.includes("supervisor");
  const isAsesorRestringido =
    rolActual.includes("asesor") && !isGerenteOSupervisor;

  const { prestamosNuevosDelMes, prestamosCuota20 } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const list = prestamosAll.data ?? [];
    const nuevos = list.filter((p) => {
      if (!p.fechaDesembolso) return false;
      const t = Date.parse(String(p.fechaDesembolso));
      if (!Number.isFinite(t)) return false;
      return t >= monthStart.getTime() && t < nextMonthStart.getTime();
    }).length;

    // Interpretación simple: préstamos cuyo plazo es 20 cuotas.
    const cuota20 = list.filter((p) => Number(p.plazoCuotas) === 20).length;

    return { prestamosNuevosDelMes: nuevos, prestamosCuota20: cuota20 };
  }, [prestamosAll.data]);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "—";

  const formatPagoFecha = (iso?: string) => {
    if (!iso) return "—";
    const parsed = new Date(iso);
    if (!Number.isFinite(parsed.getTime())) return "—";

    return parsed.toLocaleTimeString("es-HN", {
      timeZone: "America/Tegucigalpa",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Typography variant="body2">No se pudo cargar el dashboard.</Typography>
      </Box>
    );
  }

  const {
    prestamosActivos,
    prestamosEnMora,
    prestamosPagados,
    montoTotalColocado,
    vencenEn7Dias,
    prestamosPendientesCobrarHoy,
    prestamosRecientes,
    pagosHoy,
    prestamosVencenHoy,
    cantidadPrestamosNuevosMes,
    prestamosNuevosMes,
    cantidadRenovacionesMes,
    renovacionesMes,
  } = data;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="h6">Dashboard</Typography>
        <Typography variant="caption" color="text.secondary">
          Resumen de la cartera y movimientos recientes.
        </Typography>
      </Box>

      {/* Tarjetas resumen */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Préstamos activos
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {prestamosActivos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Créditos vigentes
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              En mora
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {prestamosEnMora}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Préstamos vencidos
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Préstamos pagados
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {prestamosPagados}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Créditos cancelados
            </Typography>
          </Paper>
        </Grid>

        {!isAsesorRestringido && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Monto total colocado
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {formatMoney(montoTotalColocado)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Suma de capital inicial en cartera
              </Typography>
            </Paper>
          </Grid>
        )}

        {isAsesorRestringido && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Renovaciones del mes
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {typeof cantidadRenovacionesMes === "number" && !Number.isNaN(cantidadRenovacionesMes)
                  ? cantidadRenovacionesMes
                  : typeof renovacionesMes === "number" && !Number.isNaN(renovacionesMes)
                  ? renovacionesMes
                  : 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total de renovaciones registradas en el mes actual
              </Typography>
            </Paper>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Préstamos nuevos del mes
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {typeof cantidadPrestamosNuevosMes === "number" && !Number.isNaN(cantidadPrestamosNuevosMes)
                ? cantidadPrestamosNuevosMes
                : typeof prestamosNuevosMes === "number" && !Number.isNaN(prestamosNuevosMes)
                ? prestamosNuevosMes
                : prestamosAll.loading
                ? "—"
                : prestamosNuevosDelMes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Con fecha de desembolso en el mes actual
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Préstamos en su cuota 20
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {prestamosAll.loading ? "—" : prestamosCuota20}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Plazo configurado de 20 cuotas
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Alertas importantes */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Préstamos que vencen en los próximos 7 días
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
              <Typography variant="h6">{vencenEn7Dias}</Typography>
              <Typography variant="caption" color="text.secondary">
                créditos
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, bgcolor: "success.light", color: "success.contrastText" }}>
            <Typography variant="body2" fontWeight="medium">
              Préstamos pendientes a cobrar hoy
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
              <Typography variant="h6">{prestamosPendientesCobrarHoy}</Typography>
              <Typography variant="caption">
                cuotas vencen hoy
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de préstamos pendientes hoy */}
      {prestamosVencenHoy && prestamosVencenHoy.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
              Préstamos con cuota pendiente hoy
            </Typography>
            <ButtonLink href="/prestamos" label="Ver todos" />
          </Box>
          <TableContainer sx={{ maxHeight: 280 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Saldo</TableCell>
                  <TableCell>Cuota pendiente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha pago</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prestamosVencenHoy.map((p) => {
                  const clienteLabel =
                    p.cliente?.codigoCliente ||
                    p.cliente?.identidadCliente ||
                    p.cliente?.id ||
                    "—";

                  return (
                    <TableRow key={p.id} sx={{ bgcolor: "success.lighter" }}>
                      <TableCell>{p.codigo}</TableCell>
                      <TableCell>{clienteLabel}</TableCell>
                      <TableCell>{formatMoney(p.saldo)}</TableCell>
                      <TableCell>
                        <Typography fontWeight="bold" color="success.dark">
                          {formatMoney(p.cuotaPendiente)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={p.estado}
                          color="success"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(p.fechaProximoPago)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Grid container spacing={2}>
        {/* Préstamos recientes */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1,
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2">Préstamos recientes</Typography>
              <ButtonLink href="/prestamos" label="Ver todos" />
            </Box>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Desembolso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prestamosRecientes.map((p) => {
                    const clienteLabel =
                      p.cliente?.codigoCliente ||
                      p.cliente?.identidadCliente ||
                      p.cliente?.id ||
                      "—";
                    const clienteNombre =
                      p.cliente?.nombreCompleto ||
                      [p.cliente?.nombres, p.cliente?.apellidos].filter(Boolean).join(" ") ||
                      [p.cliente?.nombre, p.cliente?.apellido].filter(Boolean).join(" ") ||
                      "—";

                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.codigo}</TableCell>
                        <TableCell>{clienteLabel}</TableCell>
                        <TableCell>{clienteNombre}</TableCell>
                        <TableCell>{formatMoney(p.monto)}</TableCell>
                        <TableCell>{formatMoney(p.saldo)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={p.estado}
                            color={
                              p.estado === "EN_MORA"
                                ? "error"
                                : p.estado === "PAGADO"
                                ? "success"
                                : "info"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(p.fechaDesembolso)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {prestamosRecientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay préstamos recientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Pagos de hoy */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Pagos de hoy
            </Typography>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Préstamo</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosHoy.map((p) => {
                    const clienteLabel =
                      p.cliente?.codigoCliente ||
                      p.cliente?.identidadCliente ||
                      p.cliente?.id ||
                      "—";
                    const clienteNombre =
                      p.cliente?.nombreCompleto ||
                      [p.cliente?.nombres, p.cliente?.apellidos].filter(Boolean).join(" ") ||
                      [p.cliente?.nombre, p.cliente?.apellido].filter(Boolean).join(" ") ||
                      "—";

                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.codigoPrestamo || "—"}</TableCell>
                        <TableCell>{clienteLabel}</TableCell>
                        <TableCell>{clienteNombre}</TableCell>
                        <TableCell>{formatMoney(p.monto)}</TableCell>
                        <TableCell>{formatPagoFecha(p.fechaAbono)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {pagosHoy.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay pagos registrados para hoy.
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

// Botón de texto reutilizable
const ButtonLink = ({ href, label }: { href: string; label: string }) => (
  <Typography
    component={Link}
    href={href}
    sx={{
      fontSize: 12,
      textDecoration: "none",
      color: "primary.main",
      "&:hover": { textDecoration: "underline" },
    }}
  >
    {label}
  </Typography>
);

export default DashboardPage;
