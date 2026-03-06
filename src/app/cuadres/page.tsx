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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useCobradores } from "../../hooks/useCobradores";
import { usePagosPorAsesor, usePagos, useCuadre, useMoraDetallada } from "../../hooks/useCaja";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const tabs = [
  { value: "RESUMEN", label: "Resumen General" },
  { value: "PAGOS_ASESOR", label: "Pagos por Asesor" },
  { value: "PAGOS_TODOS", label: "Todos los Pagos" },
  { value: "MORA", label: "Mora Detallada" },
];

export default function CuadresPage() {
  const hoy = todayISO();

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [asesorId, setAsesorId] = useState<string | "TODOS">("TODOS");
  const [tab, setTab] = useState<"RESUMEN" | "PAGOS_ASESOR" | "PAGOS_TODOS" | "MORA">("RESUMEN");

  const { data: cobradores } = useCobradores({ busqueda: "", estado: "TODOS", zona: "" });

  // Hook para pagos por asesor específico
  const cobradorIdActual = asesorId === "TODOS" ? undefined : (asesorId as string);
  const { data: pagosPorAsesor, loading: loadingPagoAsesor, error: errorPagoAsesor } = 
    usePagosPorAsesor(cobradorIdActual, fechaInicio, fechaFin);

  // Hook para todos los pagos
  const { data: pagosTodos, loading: loadingPagosTodos, error: errorPagosTodos } = 
    usePagos(fechaInicio, fechaFin);

  // Hook para cuadre general
  const { data: cuadreData, loading: loadingCuadre, error: errorCuadre } = 
    useCuadre(fechaInicio, fechaFin);

  // Hook para mora detallada
  const { data: moraData, loading: loadingMora, error: errorMora } = 
    useMoraDetallada(cobradorIdActual);

  const selectedAsesorNombre = useMemo(() => {
    if (asesorId === "TODOS") return "Todos los asesores";
    const a = cobradores.find((c) => c._id === asesorId);
    return a ? a.nombreCompleto : "Asesor";
  }, [asesorId, cobradores]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    // Los hooks ya reaccionan a cambios de filtros
  };

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (d?: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("es-HN");
  };

  // Estados de carga y error
  const isLoading = 
    (tab === "PAGOS_ASESOR" && loadingPagoAsesor) ||
    (tab === "PAGOS_TODOS" && loadingPagosTodos) ||
    (tab === "RESUMEN" && loadingCuadre) ||
    (tab === "MORA" && loadingMora);

  const currentError = 
    (tab === "PAGOS_ASESOR" && errorPagoAsesor) ||
    (tab === "PAGOS_TODOS" && errorPagosTodos) ||
    (tab === "RESUMEN" && errorCuadre) ||
    (tab === "MORA" && errorMora);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Encabezado */}
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Cuadre de Caja
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de pagos, cuadres y mora detallada
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleBuscar}
          sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}
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
          <TextField
            select
            size="small"
            label="Asesor"
            value={asesorId}
            onChange={(e) => setAsesorId(e.target.value as string | "TODOS")}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="TODOS">Todos los asesores</MenuItem>
            {cobradores.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.nombreCompleto}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="outlined" size="small" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : "Actualizar"}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Vistas de cuadre"
        >
          {tabs.map((t) => (
            <Tab key={t.value} label={t.label} value={t.value} />
          ))}
        </Tabs>
      </Paper>

      {/* Error Messages */}
      {currentError && (
        <Alert severity="error">
          {currentError}
        </Alert>
      )}

      {/* RESUMEN: Cuadre General */}
      {tab === "RESUMEN" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : cuadreData ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Resumen del Cuadre
                </Typography>
                <Chip size="small" label={`${formatDate(cuadreData.fecha)}`} />
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, bgcolor: "primary.light", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Pagos
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatMoney(cuadreData.totalPagos)}
                    </Typography>
                  </Paper>
                </Grid>
                
                {cuadreData.totalDesembolsos !== undefined && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Desembolsos
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatMoney(cuadreData.totalDesembolsos)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                
                {cuadreData.totalGastos !== undefined && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, bgcolor: "error.light", borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Gastos
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {formatMoney(cuadreData.totalGastos)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {cuadreData.detalleAdesores && cuadreData.detalleAdesores.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Desglose por Asesor
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.100" }}>
                          <TableCell>Asesor</TableCell>
                          <TableCell align="right">Cantidad Pagos</TableCell>
                          <TableCell align="right">Total Pagos</TableCell>
                          <TableCell align="right">Promedio</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cuadreData.detalleAdesores.map((d) => (
                          <TableRow key={d.cobradorId}>
                            <TableCell>{d.cobradorNombre}</TableCell>
                            <TableCell align="right">{d.countPagos}</TableCell>
                            <TableCell align="right">{formatMoney(d.totalPagos)}</TableCell>
                            <TableCell align="right">
                              {formatMoney(d.promedioPorPago)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          ) : (
            <Alert severity="info">No hay datos de cuadre para este período</Alert>
          )}
        </Box>
      )}

      {/* PAGOS POR ASESOR */}
      {tab === "PAGOS_ASESOR" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Pagos - {selectedAsesorNombre}
            </Typography>
            <Chip size="small" label={`${pagosPorAsesor.length} registros`} />
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pagosPorAsesor.length === 0 ? (
            <Alert severity="info">
              No hay pagos registrados para este filtro
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Préstamo</TableCell>
                    <TableCell align="right">Monto Principal</TableCell>
                    <TableCell align="right">Interés</TableCell>
                    <TableCell align="right">Mora</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosPorAsesor.map((pago) => (
                    <TableRow key={pago._id || pago.prestamoId}>
                      <TableCell>{formatDate(pago.fecha)}</TableCell>
                      <TableCell>{pago.clienteNombre || "—"}</TableCell>
                      <TableCell>{pago.prestamoId.slice(0, 8)}</TableCell>
                      <TableCell align="right">{formatMoney(pago.montoPrincipal)}</TableCell>
                      <TableCell align="right">{formatMoney(pago.montoInteres)}</TableCell>
                      <TableCell align="right">{formatMoney(pago.montoMora)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(pago.monto)}</TableCell>
                      <TableCell>
                        <Chip
                          label={pago.estado || "Completado"}
                          size="small"
                          color={pago.estado === "Completado" ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* TODOS LOS PAGOS */}
      {tab === "PAGOS_TODOS" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Todos los Pagos
            </Typography>
            <Chip size="small" label={`${pagosTodos.length} registros`} />
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pagosTodos.length === 0 ? (
            <Alert severity="info">
              No hay pagos registrados para este período
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Asesor</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Referencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosTodos.map((pago) => (
                    <TableRow key={pago._id || pago.prestamoId}>
                      <TableCell>{formatDate(pago.fecha)}</TableCell>
                      <TableCell>{pago.cobradorNombre || "—"}</TableCell>
                      <TableCell>{pago.clienteNombre || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(pago.monto)}</TableCell>
                      <TableCell>{pago.referencia || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* MORA DETALLADA */}
      {tab === "MORA" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Mora Detallada - {selectedAsesorNombre}
            </Typography>
            <Chip size="small" label={`${moraData.length} registros`} />
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : moraData.length === 0 ? (
            <Alert severity="success">
              ¡Excelente! No hay mora registrada para este filtro
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Asesor</TableCell>
                    <TableCell align="right">Cuotas Atrasadas</TableCell>
                    <TableCell align="right">Total Mora</TableCell>
                    <TableCell align="right">Días Atraso</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {moraData.map((mora) => (
                    <TableRow key={mora._id || mora.clienteId}>
                      <TableCell>{mora.clienteNombre || "—"}</TableCell>
                      <TableCell>{mora.cobradorNombre || "—"}</TableCell>
                      <TableCell align="right">{mora.cuotasAtrasadas}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                        {formatMoney(mora.totalMora)}
                      </TableCell>
                      <TableCell align="right">{mora.diasAtraso || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={mora.estadoPrestamo || "Activo"}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}
