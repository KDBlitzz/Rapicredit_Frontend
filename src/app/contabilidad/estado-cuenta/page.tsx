'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEmpleadoActual } from '../../../hooks/useEmpleadoActual';
import { useEstadoCuentaContabilidad } from '../../../hooks/useEstadoCuentaContabilidad';

const formatMoney = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v)
    ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

const formatCount = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('es-HN') : '—';

const formatPct = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(2)}%` : '—';

export default function EstadoCuentaContabilidadPage() {
  const now = new Date();
  const defaultAnio = now.getFullYear();
  const defaultMes = now.getMonth() + 1;

  const { empleado } = useEmpleadoActual();

  const [anioInput, setAnioInput] = useState<number>(defaultAnio);
  const [mesInput, setMesInput] = useState<number>(defaultMes);
  const [submittedPeriodo, setSubmittedPeriodo] = useState<{ anio: number; mes: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uiError, setUiError] = useState<string | null>(null);

  const usuarioLabel = useMemo(() => {
    return empleado?.nombreCompleto || empleado?.usuario || '—';
  }, [empleado?.nombreCompleto, empleado?.usuario]);

  const isValidPeriodo = useMemo(() => {
    if (!Number.isInteger(anioInput) || anioInput < 2000 || anioInput > 3000) return false;
    if (!Number.isInteger(mesInput) || mesInput < 1 || mesInput > 12) return false;
    return true;
  }, [anioInput, mesInput]);

  const { data, loading, error, generatedAt } = useEstadoCuentaContabilidad(submittedPeriodo?.anio, submittedPeriodo?.mes, {
    enabled: !!submittedPeriodo,
    refreshKey,
  });

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!isValidPeriodo) {
      setUiError('Período inválido: verifica año/mes.');
      return;
    }

    setSubmittedPeriodo({ anio: anioInput, mes: mesInput });
    setRefreshKey(Date.now());
  };

  const errorToShow = uiError || error;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h6">Estado de cuenta</Typography>
        <Typography variant="caption" color="text.secondary">
          Usuario: {usuarioLabel}
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box
          component="form"
          onSubmit={handleConsultar}
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <TextField
            size="small"
            label="Año"
            type="number"
            value={anioInput}
            onChange={(e) => setAnioInput(Number(e.target.value))}
            inputProps={{ min: 2000, max: 3000 }}
            sx={{ width: 120 }}
          />

          <TextField
            size="small"
            select
            label="Mes"
            value={mesInput}
            onChange={(e) => setMesInput(Number(e.target.value))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value={1}>Enero</MenuItem>
            <MenuItem value={2}>Febrero</MenuItem>
            <MenuItem value={3}>Marzo</MenuItem>
            <MenuItem value={4}>Abril</MenuItem>
            <MenuItem value={5}>Mayo</MenuItem>
            <MenuItem value={6}>Junio</MenuItem>
            <MenuItem value={7}>Julio</MenuItem>
            <MenuItem value={8}>Agosto</MenuItem>
            <MenuItem value={9}>Septiembre</MenuItem>
            <MenuItem value={10}>Octubre</MenuItem>
            <MenuItem value={11}>Noviembre</MenuItem>
            <MenuItem value={12}>Diciembre</MenuItem>
          </TextField>

          <Button type="submit" variant="contained" size="small" disabled={loading || !isValidPeriodo}>
            Consultar
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando estado de cuenta…
          </Typography>
        </Box>
      ) : null}

      {errorToShow ? <Alert severity="error">{errorToShow}</Alert> : null}

      {!submittedPeriodo && !data ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona un año y un mes y presiona “Consultar” para ver el resumen mensual.
          </Typography>
        </Paper>
      ) : null}

      {data ? (
        <>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Encabezado
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Período
                </Typography>
                <Typography>
                  {data.fechaInicio} — {data.fechaFin}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de generación
                </Typography>
                <Typography>{generatedAt ? generatedAt.toLocaleString('es-HN') : '—'}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Usuario
                </Typography>
                <Typography>{usuarioLabel}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Resumen mensual
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>MESES</TableCell>
                    <TableCell align="right">INGRESOS TOTALES</TableCell>
                    <TableCell align="right">GASTOS TOTALES</TableCell>
                    <TableCell align="right">UTILIDAD NETA</TableCell>
                    <TableCell align="right">RECUPERACION TOTAL</TableCell>
                    <TableCell align="right">TOTAL CARTERA</TableCell>
                    <TableCell align="right">#PRESTAMOS</TableCell>
                    <TableCell align="right">NUEVOS</TableCell>
                    <TableCell align="right">RECURRENTES</TableCell>
                    <TableCell align="right">RESERVA MORA</TableCell>
                    <TableCell align="right">RESERVA LAB</TableCell>
                    <TableCell align="right">TASA INTERES PROMEDIO MENSUAL</TableCell>
                    <TableCell align="right">% DE UTILIDAD</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.rows.map((r, idx) => (
                    <TableRow key={`${r.mes}-${idx}`}>
                      <TableCell>{r.mes}</TableCell>
                      <TableCell align="right">{formatMoney(r.ingresosTotales)}</TableCell>
                      <TableCell align="right">{formatMoney(r.gastosTotales)}</TableCell>
                      <TableCell align="right">{formatMoney(r.utilidadNeta)}</TableCell>
                      <TableCell align="right">{formatMoney(r.recuperacionTotal)}</TableCell>
                      <TableCell align="right">{formatMoney(r.totalCartera)}</TableCell>
                      <TableCell align="right">{formatCount(r.cantidadPrestamos)}</TableCell>
                      <TableCell align="right">{formatCount(r.nuevos)}</TableCell>
                      <TableCell align="right">{formatCount(r.recurrentes)}</TableCell>
                      <TableCell align="right">{formatMoney(r.reservaMora)}</TableCell>
                      <TableCell align="right">{formatMoney(r.reservaLab)}</TableCell>
                      <TableCell align="right">{formatPct(r.tasaInteresPromedioMensual)}</TableCell>
                      <TableCell align="right">{formatPct(r.porcentajeUtilidad)}</TableCell>
                    </TableRow>
                  ))}

                  {!loading && data.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13}>
                        <Typography variant="caption" color="text.secondary">
                          No hay datos para el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
