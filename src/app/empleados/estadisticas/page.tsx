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
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  useEmpleados,
  EstadoEmpleadoFiltro,
} from "../../../hooks/useEmpleados";
import { useEstadisticasEmpleado } from "../../../hooks/useEstadisticasEmpleado";

function pad(n: number) { return n < 10 ? `0${n}` : String(n); }
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startEndOfMonth(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { inicio: toISO(start), fin: toISO(end) };
}

const EstadisticasEmpleadosPage: React.FC = () => {
  const [estadoFiltro] = useState<EstadoEmpleadoFiltro>("ACTIVO");
  const [busquedaAsesor, setBusquedaAsesor] = useState("");

  const { data: empleados, loading: loadingEmpleados } = useEmpleados({
    busqueda: "",
    estado: estadoFiltro,
    rol: "",
  });

  const empleadosFiltrados = useMemo(() => {
    if (!busquedaAsesor.trim()) return empleados;
    const q = busquedaAsesor.trim().toLowerCase();
    return empleados.filter((e) =>
      e.codigoUsuario?.toLowerCase().includes(q) ||
      e.nombreCompleto.toLowerCase().includes(q) ||
      (e.usuario || '').toLowerCase().includes(q)
    );
  }, [empleados, busquedaAsesor]);

  const defaultPeriod = useMemo(() => startEndOfMonth(new Date()), []);
  const [fechaInicio, setFechaInicio] = useState(defaultPeriod.inicio);
  const [fechaFin, setFechaFin] = useState(defaultPeriod.fin);
  const [codigoUsuario, setCodigoUsuario] = useState<string>("");

  const { data, loading, error } = useEstadisticasEmpleado(
    codigoUsuario || undefined,
    fechaInicio,
    fechaFin,
  );

  const selectedNombre = useMemo(() => {
    const emp = empleados.find((e) => (e.codigoUsuario || "") === codigoUsuario);
    return emp?.nombreCompleto || "";
  }, [empleados, codigoUsuario]);

  const periodoLabel = useMemo(() => {
    const [iy, im, id] = (fechaInicio || "").split("-");
    const [fy, fm, fd] = (fechaFin || "").split("-");
    const ini = `${pad(Number(id))}/${pad(Number(im))}/${iy}`;
    const finStr = `${pad(Number(fd))}/${pad(Number(fm))}/${fy}`;
    return `${ini} - ${finStr}`;
  }, [fechaInicio, fechaFin]);

  const handleMesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // YYYY-MM
    const [yStr, mStr] = value.split("-");
    const y = Number(yStr);
    const m = Number(mStr) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    setFechaInicio(toISO(start));
    setFechaFin(toISO(end));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Filtros */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={empleadosFiltrados}
            getOptionLabel={(e) => `${e.nombreCompleto} (${e.codigoUsuario || 'sin código'})`}
            value={empleados.find((e) => e.codigoUsuario === codigoUsuario) || null}
            onChange={(_, newValue) => setCodigoUsuario(newValue?.codigoUsuario || "")}
            inputValue={busquedaAsesor}
            onInputChange={(_, newInputValue) => setBusquedaAsesor(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Buscar y seleccionar asesor" />}
            noOptionsText="Sin coincidencias"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Mes"
            type="month"
            value={(fechaInicio || "").slice(0, 7)}
            onChange={handleMesChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 1, md: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setFechaInicio((prev) => prev);
            }}
            sx={{ height: 40 }}
          >
            Buscar
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6">Estadísticas del Asesor</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={periodoLabel} size="small" />
        </Box>

        {loading || loadingEmpleados ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        ) : !data || !codigoUsuario ? (
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Seleccione un asesor y un mes para ver estadísticas.
          </Typography>
        ) : (
          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {/* KPI Cards */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Asesor</Typography>
              <Typography variant="h6">{selectedNombre || data.asesor?.nombreCompleto || data.asesor?.codigoUsuario || "—"}</Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`Renovaciones: ${data.renovaciones}`} size="small" />
                <Chip label={`Nuevos mes: ${data.nuevosMes}`} size="small" />
                <Chip label={`Nuevos inactivos: ${data.nuevosInactivos}`} size="small" />
                <Chip label={`Clientes en mora: ${data.clientesEnMora}`} size="small" />
                <Chip label={`% Mora: ${Number(data.moraPorcentaje || 0).toFixed(1)}%`} size="small" />
              </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Bonificaciones</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Concepto</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.bonificaciones || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography color="text.secondary">Sin bonificaciones</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {(data.bonificaciones || []).map((b, i) => (
                      <TableRow key={i}>
                        <TableCell>{b.concepto}</TableCell>
                        <TableCell align="right">{b.monto?.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}</TableCell>
                      </TableRow>
                    ))}
                    {typeof data.totalBonificaciones === "number" && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {data.totalBonificaciones.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 2, gridColumn: { xs: "1", sm: "1 / span 2" } }}>
              <Typography variant="subtitle2" color="text.secondary">Mora por rangos</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rango</TableCell>
                      <TableCell align="right">Clientes</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.moraPorRangos || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="text.secondary">Sin datos de mora por rangos</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {(data.moraPorRangos || []).map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.rango}</TableCell>
                        <TableCell align="right">{r.cantidadClientes}</TableCell>
                        <TableCell align="right">{r.saldo.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Cartera activa del asesor</Typography>
              <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <Chip label={`Clientes: ${data.carteraActiva.cantidadClientes}`} />
                <Chip label={`Prestamos: ${data.carteraActiva.cantidadPrestamos}`} />
                <Chip label={`Monto otorgado: ${data.carteraActiva.montoOtorgadoTotal.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}`} />
                <Chip label={`Saldo actual: ${data.carteraActiva.saldoActualTotal.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}`} />
                <Chip label={`Intereses cobrados: ${data.carteraActiva.interesesCobradosTotal.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}`} />
              </Box>
            </Paper>

            <Paper sx={{ p: 2, gridColumn: { xs: "1", sm: "1 / span 2" } }}>
              <Typography variant="subtitle2" color="text.secondary">Detalle de préstamos (intereses cobrados)</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Monto otorgado</TableCell>
                      <TableCell>Saldo actual</TableCell>
                      <TableCell>En mora</TableCell>
                      <TableCell>Intereses cobrados</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.prestamos || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography color="text.secondary">Sin préstamos</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {(data.prestamos || []).map((p, i) => (
                      <TableRow key={p.id || i}>
                        <TableCell>{p.cliente?.nombre || p.cliente?.codigoCliente || "—"}</TableCell>
                        <TableCell>{p.montoOtorgado.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}</TableCell>
                        <TableCell>{p.saldoActual.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}</TableCell>
                        <TableCell>{p.enMora ? "Sí" : "No"}</TableCell>
                        <TableCell>{Number(p.interesesCobradosTotal || 0).toLocaleString("es-HN", { style: "currency", currency: "HNL" })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper sx={{ p: 2, gridColumn: { xs: "1", sm: "1 / span 2" } }}>
              <Typography variant="subtitle2" color="text.secondary">Resumen globalizado del mes</Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`Clientes totales manejados: ${data.carteraActiva.cantidadClientes}`} />
                <Chip label={`Nuevos: ${data.nuevosMes}`} />
                <Chip label={`Renovaciones: ${data.renovaciones}`} />
                <Chip label={`En mora: ${data.clientesEnMora}`} />
                <Chip label={`Intereses cobrados (mes): ${data.carteraActiva.interesesCobradosTotal.toLocaleString("es-HN", { style: "currency", currency: "HNL" })}`} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Nota: Se presentan intereses cobrados, no devengados.
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EstadisticasEmpleadosPage;