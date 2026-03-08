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
import {
  usePagosPorAsesor,
  usePagos,
  useCuadre,
  useMoraDetallada,
  useGastosCaja,
  useDesembolsosCaja,
} from "../../hooks/useCaja";
import { apiFetch } from "../../lib/api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const tabs = [
  { value: "RESUMEN", label: "Resumen" },
  { value: "COBROS", label: "Cobros" },
  { value: "DESEMBOLSOS", label: "Desembolsos" },
  { value: "GASTOS", label: "Gastos" },
  { value: "MORA", label: "Mora Detallada" },
];

export default function CuadresPage() {
  const hoy = todayISO();

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [asesorId, setAsesorId] = useState<string | "TODOS">("TODOS");
  const [tab, setTab] = useState<"RESUMEN" | "COBROS" | "DESEMBOLSOS" | "GASTOS" | "MORA">("RESUMEN");
  const [refreshKey, setRefreshKey] = useState(0);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const [savingGasto, setSavingGasto] = useState(false);
  const [savingDesembolso, setSavingDesembolso] = useState(false);

  const [gastoForm, setGastoForm] = useState({
    fecha: hoy,
    asesorId: "",
    monto: "",
    categoria: "",
    descripcion: "",
    referencia: "",
    origen: "EFECTIVO" as "EFECTIVO" | "BANCO",
  });

  const [desembolsoForm, setDesembolsoForm] = useState({
    fecha: hoy,
    asesorId: "",
    monto: "",
    descripcion: "",
    referencia: "",
  });

  const { data: cobradores } = useCobradores({ busqueda: "", estado: "TODOS", zona: "" });

  // Hook para pagos por asesor específico
  const cobradorIdActual = asesorId === "TODOS" ? undefined : (asesorId as string);
  const { data: pagosPorAsesor, loading: loadingPagoAsesor, error: errorPagoAsesor } = 
    usePagosPorAsesor(cobradorIdActual, fechaInicio, fechaFin, refreshKey);

  // Hook para todos los pagos
  const { data: pagosTodos, loading: loadingPagosTodos, error: errorPagosTodos } = 
    usePagos(fechaInicio, fechaFin, refreshKey);

  // Hook para cuadre general
  const { data: cuadreData, loading: loadingCuadre, error: errorCuadre } = 
    useCuadre(fechaInicio, fechaFin, refreshKey);

  // Hooks para gastos y desembolsos
  const { data: gastosData, loading: loadingGastos, error: errorGastos } = useGastosCaja(
    cobradorIdActual,
    fechaInicio,
    fechaFin,
    refreshKey
  );

  const { data: desembolsosData, loading: loadingDesembolsos, error: errorDesembolsos } = useDesembolsosCaja(
    cobradorIdActual,
    fechaInicio,
    fechaFin,
    refreshKey
  );

  // Hook para mora detallada
  const { data: moraData, loading: loadingMora, error: errorMora } = 
    useMoraDetallada(cobradorIdActual, undefined, refreshKey);

  const moraRows = useMemo(() => (Array.isArray(moraData) ? moraData : []), [moraData]);

  const selectedAsesorNombre = useMemo(() => {
    if (asesorId === "TODOS") return "Todos los asesores";
    const a = cobradores.find((c) => c._id === asesorId);
    return a ? a.nombreCompleto : "Asesor";
  }, [asesorId, cobradores]);

  useEffect(() => {
    if (asesorId === "TODOS") return;
    const id = asesorId as string;

    setGastoForm((prev) => ({ ...prev, asesorId: id }));
    setDesembolsoForm((prev) => ({ ...prev, asesorId: id }));
  }, [asesorId]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    // Forzar recarga incluso si los filtros no cambian
    setRefreshKey((k) => k + 1);
  };

  const resolveAsesorNombre = (id?: string, nombre?: string) => {
    if (nombre) return nombre;
    if (!id) return "—";
    const a = cobradores.find((c) => c._id === id);
    return a?.nombreCompleto || "—";
  };

  const isRouteMissingLike = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      /\b404\b/i.test(msg) ||
      /\b405\b/i.test(msg) ||
      /not\s*found/i.test(msg) ||
      /cannot\s+(get|post|put|delete)/i.test(msg)
    );
  };

  type PostCandidate = { path: string; body: unknown };

  const postFirstAvailable = async (candidates: PostCandidate[]) => {
    let lastErr: unknown = null;
    for (const c of candidates) {
      try {
        await apiFetch(c.path, {
          method: "POST",
          body: JSON.stringify(c.body),
          silent: true,
        });
        return;
      } catch (e: unknown) {
        lastErr = e;
        if (isRouteMissingLike(e)) continue;
        throw e;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error("No se encontró una ruta válida para registrar");
  };

  const handleSubmitDesembolso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!desembolsoForm.fecha || !desembolsoForm.asesorId || !desembolsoForm.monto) {
      setSnackbarMsg("Completa fecha, asesor y monto");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const monto = Number(String(desembolsoForm.monto).replace(",", "."));
    if (!Number.isFinite(monto) || monto <= 0) {
      setSnackbarMsg("El monto debe ser mayor a 0");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSavingDesembolso(true);
    try {
      const payload = {
        cobradorId: desembolsoForm.asesorId,
        fecha: desembolsoForm.fecha,
        monto,
        descripcion: desembolsoForm.descripcion || undefined,
        referencia: desembolsoForm.referencia || undefined,
      };

      const payloadMovimiento = {
        tipo: "DESEMBOLSO",
        cobradorId: desembolsoForm.asesorId,
        asesorId: desembolsoForm.asesorId,
        fecha: desembolsoForm.fecha,
        monto,
        descripcion: desembolsoForm.descripcion || undefined,
        referencia: desembolsoForm.referencia || undefined,
      };

      await postFirstAvailable([
        { path: "/caja/desembolsos", body: payload },
        { path: "/caja/desembolso", body: payload },
        { path: "/cuadres/desembolsos", body: payload },
        { path: "/caja/movimientos", body: payloadMovimiento },
        { path: "/cuadres/movimientos", body: payloadMovimiento },
      ]);

      setSnackbarMsg("Desembolso registrado");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setRefreshKey((k) => k + 1);
      setDesembolsoForm((prev) => ({ ...prev, monto: "", descripcion: "", referencia: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo registrar el desembolso";
      setSnackbarMsg(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSavingDesembolso(false);
    }
  };

  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gastoForm.fecha || !gastoForm.asesorId || !gastoForm.monto) {
      setSnackbarMsg("Completa fecha, asesor y monto");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const monto = Number(String(gastoForm.monto).replace(",", "."));
    if (!Number.isFinite(monto) || monto <= 0) {
      setSnackbarMsg("El monto debe ser mayor a 0");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSavingGasto(true);
    try {
      const payload = {
        cobradorId: gastoForm.asesorId,
        fecha: gastoForm.fecha,
        monto,
        categoria: gastoForm.categoria || undefined,
        descripcion: gastoForm.descripcion || undefined,
        referencia: gastoForm.referencia || undefined,
        origen: gastoForm.origen || undefined,
      };

      const payloadMovimiento = {
        tipo: "GASTO",
        cobradorId: gastoForm.asesorId,
        asesorId: gastoForm.asesorId,
        fecha: gastoForm.fecha,
        monto,
        categoria: gastoForm.categoria || undefined,
        categoriaGasto: gastoForm.categoria || undefined,
        descripcion: gastoForm.descripcion || undefined,
        referencia: gastoForm.referencia || undefined,
        origen: gastoForm.origen || undefined,
      };

      await postFirstAvailable([
        { path: "/caja/gastos", body: payload },
        { path: "/cuadres/gastos", body: payload },
        { path: "/caja/movimientos", body: payloadMovimiento },
        { path: "/cuadres/movimientos", body: payloadMovimiento },
      ]);

      setSnackbarMsg("Gasto registrado");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setRefreshKey((k) => k + 1);
      setGastoForm((prev) => ({ ...prev, monto: "", categoria: "", descripcion: "", referencia: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo registrar el gasto";
      setSnackbarMsg(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSavingGasto(false);
    }
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

  const cobrosData = useMemo(() => {
    const raw = (asesorId === "TODOS" ? pagosTodos : pagosPorAsesor) as unknown;
    return Array.isArray(raw) ? (raw as typeof pagosTodos) : [];
  }, [asesorId, pagosTodos, pagosPorAsesor]);
  const cobrosLoading = asesorId === "TODOS" ? loadingPagosTodos : loadingPagoAsesor;
  const cobrosError = asesorId === "TODOS" ? errorPagosTodos : errorPagoAsesor;
  const totalCobros = useMemo(() => cobrosData.reduce((acc, p) => acc + (p.monto || 0), 0), [cobrosData]);

  const totalGastos = useMemo(() => gastosData.reduce((acc, g) => acc + (g.monto || 0), 0), [gastosData]);
  const totalDesembolsos = useMemo(
    () => desembolsosData.reduce((acc, d) => acc + (d.monto || 0), 0),
    [desembolsosData]
  );

  const efectivoNeto = useMemo(() => {
    if (!cuadreData) return 0;
    const desemb = cuadreData.totalDesembolsos ?? 0;
    const gastos = cuadreData.totalGastos ?? 0;
    return (cuadreData.totalPagos ?? 0) - desemb - gastos;
  }, [cuadreData]);

  // Estados de carga y error
  const isLoading =
    (tab === "COBROS" && cobrosLoading) ||
    (tab === "DESEMBOLSOS" && loadingDesembolsos) ||
    (tab === "GASTOS" && loadingGastos) ||
    (tab === "RESUMEN" && loadingCuadre) ||
    (tab === "MORA" && loadingMora);

  const currentError =
    (tab === "COBROS" && cobrosError) ||
    (tab === "DESEMBOLSOS" && errorDesembolsos) ||
    (tab === "GASTOS" && errorGastos) ||
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
            Cobros, desembolsos y gastos por asesor para cuadre de caja
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

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, bgcolor: "success.light", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Efectivo Neto
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatMoney(efectivoNeto)}
                    </Typography>
                  </Paper>
                </Grid>
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

      {/* COBROS */}
      {tab === "COBROS" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Cobros - {selectedAsesorNombre}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip size="small" label={`${cobrosData.length} registros`} />
              <Chip size="small" color="primary" label={formatMoney(totalCobros)} />
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : cobrosData.length === 0 ? (
            <Alert severity="info">No hay cobros registrados para este filtro</Alert>
          ) : asesorId === "TODOS" ? (
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
                  {cobrosData.map((pago) => (
                    <TableRow key={pago._id || pago.prestamoId}>
                      <TableCell>{formatDate(pago.fecha)}</TableCell>
                      <TableCell>{pago.cobradorNombre || "—"}</TableCell>
                      <TableCell>{pago.clienteNombre || "—"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatMoney(pago.monto)}
                      </TableCell>
                      <TableCell>{pago.referencia || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
                  {cobrosData.map((pago) => (
                    <TableRow key={pago._id || pago.prestamoId}>
                      <TableCell>{formatDate(pago.fecha)}</TableCell>
                      <TableCell>{pago.clienteNombre || "—"}</TableCell>
                      <TableCell>{pago.prestamoId ? pago.prestamoId.slice(0, 8) : "—"}</TableCell>
                      <TableCell align="right">{formatMoney(pago.montoPrincipal)}</TableCell>
                      <TableCell align="right">{formatMoney(pago.montoInteres)}</TableCell>
                      <TableCell align="right">{formatMoney(pago.montoMora)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatMoney(pago.monto)}
                      </TableCell>
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

      {/* DESEMBOLSOS */}
      {tab === "DESEMBOLSOS" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Registrar desembolso
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmitDesembolso}
                sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={desembolsoForm.fecha}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                />

                <TextField
                  select
                  size="small"
                  label="Asesor"
                  value={desembolsoForm.asesorId}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, asesorId: e.target.value }))
                  }
                >
                  <MenuItem value="">Selecciona un asesor</MenuItem>
                  {cobradores.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.nombreCompleto}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Monto"
                  value={desembolsoForm.monto}
                  inputProps={{ inputMode: "decimal" }}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    if (normalized !== "" && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
                    setDesembolsoForm((prev) => ({ ...prev, monto: normalized }));
                  }}
                />

                <TextField
                  size="small"
                  label="Descripción"
                  value={desembolsoForm.descripcion}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />

                <TextField
                  size="small"
                  label="Referencia"
                  value={desembolsoForm.referencia}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, referencia: e.target.value }))
                  }
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={savingDesembolso}
                >
                  {savingDesembolso ? <CircularProgress size={20} /> : "Registrar"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Desembolsos - {selectedAsesorNombre}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={`${desembolsosData.length} registros`} />
                  <Chip size="small" color="warning" label={formatMoney(totalDesembolsos)} />
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : desembolsosData.length === 0 ? (
                <Alert severity="info">No hay desembolsos para este filtro</Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Asesor</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Referencia</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {desembolsosData.map((d) => (
                        <TableRow key={d._id || `${d.cobradorId || ""}-${d.fecha}-${d.monto}`}
                        >
                          <TableCell>{formatDate(d.fecha)}</TableCell>
                          <TableCell>{resolveAsesorNombre(d.cobradorId, d.cobradorNombre)}</TableCell>
                          <TableCell>{d.descripcion || "—"}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatMoney(d.monto)}
                          </TableCell>
                          <TableCell>{d.referencia || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* GASTOS */}
      {tab === "GASTOS" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Registrar gasto
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmitGasto}
                sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={gastoForm.fecha}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, fecha: e.target.value }))}
                />

                <TextField
                  select
                  size="small"
                  label="Asesor"
                  value={gastoForm.asesorId}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, asesorId: e.target.value }))}
                >
                  <MenuItem value="">Selecciona un asesor</MenuItem>
                  {cobradores.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.nombreCompleto}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Monto"
                  value={gastoForm.monto}
                  inputProps={{ inputMode: "decimal" }}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    if (normalized !== "" && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
                    setGastoForm((prev) => ({ ...prev, monto: normalized }));
                  }}
                />

                <TextField
                  select
                  size="small"
                  label="Origen"
                  value={gastoForm.origen}
                  onChange={(e) =>
                    setGastoForm((prev) => ({ ...prev, origen: e.target.value as "EFECTIVO" | "BANCO" }))
                  }
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="BANCO">Banco</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  label="Categoría"
                  value={gastoForm.categoria}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, categoria: e.target.value }))}
                />

                <TextField
                  size="small"
                  label="Descripción"
                  value={gastoForm.descripcion}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                />

                <TextField
                  size="small"
                  label="Referencia"
                  value={gastoForm.referencia}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, referencia: e.target.value }))}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  disabled={savingGasto}
                >
                  {savingGasto ? <CircularProgress size={20} /> : "Registrar"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Gastos - {selectedAsesorNombre}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={`${gastosData.length} registros`} />
                  <Chip size="small" color="error" label={formatMoney(totalGastos)} />
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : gastosData.length === 0 ? (
                <Alert severity="info">No hay gastos para este filtro</Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Asesor</TableCell>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Origen</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Referencia</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gastosData.map((g) => (
                        <TableRow key={g._id || `${g.cobradorId || ""}-${g.fecha}-${g.monto}`}
                        >
                          <TableCell>{formatDate(g.fecha)}</TableCell>
                          <TableCell>{resolveAsesorNombre(g.cobradorId, g.cobradorNombre)}</TableCell>
                          <TableCell>{g.categoria || "—"}</TableCell>
                          <TableCell>{g.descripcion || "—"}</TableCell>
                          <TableCell>{g.origen || "—"}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatMoney(g.monto)}
                          </TableCell>
                          <TableCell>{g.referencia || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* MORA DETALLADA */}
      {tab === "MORA" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Mora Detallada - {selectedAsesorNombre}
            </Typography>
            <Chip size="small" label={`${moraRows.length} registros`} />
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : moraRows.length === 0 ? (
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
                  {moraRows.map((mora) => (
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
