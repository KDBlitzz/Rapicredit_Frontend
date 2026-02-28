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
} from "@mui/material";
import { useCobradores } from "../../hooks/useCobradores";
import { CuadresFilters, TipoMovimientoCuadre, useCuadres } from "../../hooks/useCuadres";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const movimientosTabs: { value: TipoMovimientoCuadre | "RESUMEN"; label: string }[] = [
  { value: "RESUMEN", label: "Resumen" },
  { value: "COBRO", label: "Cobros" },
  { value: "DESEMBOLSO", label: "Desembolsos" },
  { value: "GASTO", label: "Gastos" },
];

export default function CuadresPage() {
  const hoy = todayISO();

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [asesorId, setAsesorId] = useState<string | "TODOS">("TODOS");
  const [tab, setTab] = useState<TipoMovimientoCuadre | "RESUMEN">("RESUMEN");

  const { data: cobradores } = useCobradores({ busqueda: "", estado: "TODOS", zona: "" });

  const filtrosCuadres: CuadresFilters = useMemo(
    () => ({ fechaInicio, fechaFin, asesorId, tipo: tab === "RESUMEN" ? "TODOS" : tab }),
    [fechaInicio, fechaFin, asesorId, tab]
  );

  const { data: registros, loading, error } = useCuadres(filtrosCuadres);

  const selectedAsesorNombre = useMemo(() => {
    if (asesorId === "TODOS") return "Todos los asesores";
    const a = cobradores.find((c) => c._id === asesorId);
    return a ? a.nombreCompleto : "Asesor";
  }, [asesorId, cobradores]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    // El hook ya reacciona a cambios de filtros; aquí solo evitamos submit real.
  };

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const resumenPorAsesor = useMemo(() => {
    const map = new Map<
      string,
      {
        asesorId?: string;
        asesorNombre: string;
        cobros: number;
        totalCobros: number;
        desembolsos: number;
        totalDesembolsos: number;
        gastos: number;
        totalGastos: number;
      }
    >();

    for (const r of registros) {
      const key = r.asesorId || "SIN_ASESOR";
      const baseNombre = r.asesorNombre || "Sin asesor";
      if (!map.has(key)) {
        map.set(key, {
          asesorId: r.asesorId,
          asesorNombre: baseNombre,
          cobros: 0,
          totalCobros: 0,
          desembolsos: 0,
          totalDesembolsos: 0,
          gastos: 0,
          totalGastos: 0,
        });
      }
      const agg = map.get(key)!;
      if (r.tipo === "COBRO") {
        agg.cobros += 1;
        agg.totalCobros += r.monto;
      } else if (r.tipo === "DESEMBOLSO") {
        agg.desembolsos += 1;
        agg.totalDesembolsos += r.monto;
      } else if (r.tipo === "GASTO") {
        agg.gastos += 1;
        agg.totalGastos += r.monto;
      }
    }

    return Array.from(map.values());
  }, [registros]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Encabezado y filtros principales */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6">Cuadre de caja</Typography>
          <Typography variant="caption" color="text.secondary">
            Registra desembolsos, gastos y cobros por asesor para cuadrar el efectivo
            contra los depósitos del sistema.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleBuscar}
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
          <Button type="submit" variant="outlined" size="small" disabled={loading}>
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Tabs para tipo de vista */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Vistas de cuadre"
        >
          {movimientosTabs.map((t) => (
            <Tab key={t.value} label={t.label} value={t.value} />
          ))}
        </Tabs>
      </Paper>

      {loading && (
        <Typography variant="caption" color="text.secondary">
          Cargando registros de cuadre…
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      {/* Panel RESUMEN: totales por asesor */}
      {tab === "RESUMEN" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2">Resumen por asesor</Typography>
            <Chip
              size="small"
              label={`${selectedAsesorNombre} · ${fechaInicio} a ${fechaFin}`}
            />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Asesor</TableCell>
                  <TableCell align="right">Cobros (efectivo)</TableCell>
                  <TableCell align="right">Desembolsos</TableCell>
                  <TableCell align="right">Gastos</TableCell>
                  <TableCell align="right">Efectivo neto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumenPorAsesor.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Aún no hay datos. Esta tabla se conectará al backend de cuadres
                      para mostrar cobros, desembolsos y gastos por asesor.
                    </TableCell>
                  </TableRow>
                )}

                {resumenPorAsesor.map((r) => {
                  const efectivoNeto = r.totalCobros - r.totalDesembolsos - r.totalGastos;
                  return (
                    <TableRow key={r.asesorId || r.asesorNombre}>
                      <TableCell>{r.asesorNombre}</TableCell>
                      <TableCell align="right">{formatMoney(r.totalCobros)}</TableCell>
                      <TableCell align="right">{formatMoney(r.totalDesembolsos)}</TableCell>
                      <TableCell align="right">{formatMoney(r.totalGastos)}</TableCell>
                      <TableCell align="right">{formatMoney(efectivoNeto)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Panel COBROS: vista de cobros por asesor */}
      {tab === "COBRO" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Cobros registrados ({selectedAsesorNombre})
              </Typography>
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Asesor</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Referencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registros.filter((r) => r.tipo === "COBRO").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Aquí se mostrarán todos los cobros en efectivo por asesor
                          para el rango de fechas seleccionado.
                        </TableCell>
                      </TableRow>
                    )}

                    {registros
                      .filter((r) => r.tipo === "COBRO")
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.fecha.slice(0, 10)}</TableCell>
                          <TableCell>{r.asesorNombre || "—"}</TableCell>
                          <TableCell align="right">{formatMoney(r.monto)}</TableCell>
                          <TableCell>{r.referencia || ""}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Registrar cobro de efectivo
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Préstamo / código cliente"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monto cobrado"
                    type="number"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue={hoy}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Referencia / recibo"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" select label="Origen del efectivo">
                    <MenuItem value="EFECTIVO_RUTA">Efectivo en ruta</MenuItem>
                    <MenuItem value="DEPOSITO_BANCO">Depósito en banco</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" sx={{ borderRadius: 999 }}>
                    Registrar cobro
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Panel DESEMBOLSOS: registro de desembolsos por asesor */}
      {tab === "DESEMBOLSO" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Desembolsos registrados ({selectedAsesorNombre})
              </Typography>
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Asesor</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Referencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registros.filter((r) => r.tipo === "DESEMBOLSO").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Aquí se verán los desembolsos entregados por cada asesor
                          (efectivo que sale de caja).
                        </TableCell>
                      </TableRow>
                    )}

                    {registros
                      .filter((r) => r.tipo === "DESEMBOLSO")
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.fecha.slice(0, 10)}</TableCell>
                          <TableCell>{r.asesorNombre || "—"}</TableCell>
                          <TableCell align="right">{formatMoney(r.monto)}</TableCell>
                          <TableCell>{r.referencia || ""}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Registrar desembolso
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Préstamo a desembolsar"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Asesor que entrega"
                    value={asesorId}
                    onChange={(e) => setAsesorId(e.target.value as string | "TODOS")}
                  >
                    <MenuItem value="TODOS">— Seleccionar asesor —</MenuItem>
                    {cobradores.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.nombreCompleto}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monto desembolsado"
                    type="number"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue={hoy}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label="Referencia / recibo" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" sx={{ borderRadius: 999 }}>
                    Registrar desembolso
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Panel GASTOS: registro de gastos por asesor */}
      {tab === "GASTO" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Gastos registrados ({selectedAsesorNombre})
              </Typography>
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Asesor</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell>Detalle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registros.filter((r) => r.tipo === "GASTO").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Aquí verás todos los gastos cargados por asesor
                          (gasolina, viáticos, otros) para cuadrar la ruta.
                        </TableCell>
                      </TableRow>
                    )}

                    {registros
                      .filter((r) => r.tipo === "GASTO")
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.fecha.slice(0, 10)}</TableCell>
                          <TableCell>{r.asesorNombre || "—"}</TableCell>
                          <TableCell>{r.categoriaGasto || "—"}</TableCell>
                          <TableCell align="right">{formatMoney(r.monto)}</TableCell>
                          <TableCell>{r.descripcion || ""}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Registrar gasto de ruta
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Asesor"
                    value={asesorId}
                    onChange={(e) => setAsesorId(e.target.value as string | "TODOS")}
                  >
                    <MenuItem value="TODOS">— Seleccionar asesor —</MenuItem>
                    {cobradores.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.nombreCompleto}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monto del gasto"
                    type="number"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue={hoy}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Categoría"
                    defaultValue="GASOLINA"
                  >
                    <MenuItem value="GASOLINA">Gasolina</MenuItem>
                    <MenuItem value="VIATICOS">Viáticos</MenuItem>
                    <MenuItem value="ALIMENTACION">Alimentación</MenuItem>
                    <MenuItem value="OTROS">Otros</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Detalle / comentario"
                    multiline
                    minRows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" sx={{ borderRadius: 999 }}>
                    Registrar gasto
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
