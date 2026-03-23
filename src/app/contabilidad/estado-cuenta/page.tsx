'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
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
import { parseDateInput } from '../../../lib/dateRange';

const pad2 = (n: number) => String(n).padStart(2, '0');

const isoDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

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
  const hoy = isoDate(now);
  const inicioMes = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const { empleado } = useEmpleadoActual();

  const [fechaInicioInput, setFechaInicioInput] = useState(inicioMes);
  const [fechaFinInput, setFechaFinInput] = useState(hoy);
  const [submittedRange, setSubmittedRange] = useState<{ desde: string; hasta: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uiError, setUiError] = useState<string | null>(null);

  const usuarioLabel = useMemo(() => {
    return empleado?.nombreCompleto || empleado?.usuario || '—';
  }, [empleado?.nombreCompleto, empleado?.usuario]);

  const isValidRange = useMemo(() => {
    if (!fechaInicioInput || !fechaFinInput) return false;
    const d1 = parseDateInput(fechaInicioInput);
    const d2 = parseDateInput(fechaFinInput);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;
    return d1.getTime() <= d2.getTime();
  }, [fechaInicioInput, fechaFinInput]);

  const { data, loading, error, generatedAt } = useEstadoCuentaContabilidad(
    submittedRange?.desde,
    submittedRange?.hasta,
    {
      enabled: !!submittedRange,
      refreshKey,
    }
  );

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!isValidRange) {
      setUiError('Rango de fechas inválido: verifica desde/hasta.');
      return;
    }

    setSubmittedRange({ desde: fechaInicioInput, hasta: fechaFinInput });
    setRefreshKey(Date.now());
  };

  const errorToShow = uiError || error;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Typography variant="h6">Estado de cuenta</Typography>
          <Typography variant="caption" color="text.secondary">
            Estado de cuenta consolidado por mes (Contabilidad).
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleConsultar}
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <TextField
            type="date"
            size="small"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={fechaInicioInput}
            onChange={(e) => setFechaInicioInput(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={fechaFinInput}
            onChange={(e) => setFechaFinInput(e.target.value)}
          />
          <Button type="submit" variant="contained" size="small" disabled={loading || !isValidRange}>
            Consultar
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando estado de cuenta…
          </Typography>
        </Box>
      ) : null}

      {errorToShow ? <Alert severity="error">{errorToShow}</Alert> : null}

      {data?.source === 'mock' ? (
        <Alert severity="info">
          Backend no disponible o sin endpoint: mostrando datos de ejemplo para poder hostear la pantalla.
        </Alert>
      ) : null}

      {!submittedRange && !data ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona un rango y presiona “Consultar” para ver el resumen mensual.
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
                  Rango
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
