'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEmpleadoActual } from '../../../hooks/useEmpleadoActual';
import { useCierreMensual } from '../../../hooks/useCierreMensual';
import { parseDateInput } from '../../../lib/dateRange';

const pad2 = (n: number) => String(n).padStart(2, '0');

const isoDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

const capitalizeFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const formatMoney = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v)
    ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    : '—';

const formatCount = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('es-HN') : '—';

const formatPercent = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v)
    ? `${v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    : '—';

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-HN');
};

export default function CierreMensualPage() {
  const now = new Date();
  const defaultDesde = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultHasta = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const { empleado } = useEmpleadoActual();

  const [fechaInicioInput, setFechaInicioInput] = useState(defaultDesde);
  const [fechaFinInput, setFechaFinInput] = useState(defaultHasta);
  const [submitted, setSubmitted] = useState<{ desde: string; hasta: string } | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const { data, loading, error } = useCierreMensual(submitted?.desde, submitted?.hasta, {
    enabled: !!submitted,
    refreshKey,
  });

  const periodLabel = useMemo(() => {
    const start = (() => {
      if (data?.periodo.desde) {
        const d = new Date(data.periodo.desde);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (submitted?.desde) {
        const d = parseDateInput(submitted.desde);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      return null;
    })();

    const end = (() => {
      if (data?.periodo.hasta) {
        const d = new Date(data.periodo.hasta);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      if (submitted?.hasta) {
        const d = parseDateInput(submitted.hasta);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      return null;
    })();

    if (!start || !end) return '—';

    const fmt = new Intl.DateTimeFormat('es-HN', { month: 'long', year: 'numeric' });
    const startLabel = capitalizeFirst(fmt.format(start));
    const endLabel = capitalizeFirst(fmt.format(end));

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return startLabel;
    }
    return `${startLabel} — ${endLabel}`;
  }, [data?.periodo.desde, data?.periodo.hasta, submitted?.desde, submitted?.hasta]);

  const usuarioLabel = useMemo(() => {
    return empleado?.nombreCompleto || empleado?.usuario || '—';
  }, [empleado?.nombreCompleto, empleado?.usuario]);

  const isValidRange = useMemo(() => {
    if (!fechaInicioInput || !fechaFinInput) return false;
    const start = parseDateInput(fechaInicioInput);
    const end = parseDateInput(fechaFinInput);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start.getTime() <= end.getTime();
  }, [fechaInicioInput, fechaFinInput]);

  const handleGenerar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidRange) return;

    setSubmitted({ desde: fechaInicioInput, hasta: fechaFinInput });
    setGeneratedAt(new Date());
    setRefreshKey(Date.now());
  };

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
          <Typography variant="h6">Cierre mensual</Typography>
          <Typography variant="caption" color="text.secondary">
            Genera un reporte financiero consolidado del periodo.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleGenerar}
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
            Generar cierre
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Generando cierre…
          </Typography>
        </Box>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!submitted && !data ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona un rango de fechas y presiona “Generar cierre” para ver el resumen.
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
                  Periodo del cierre
                </Typography>
                <Typography>{periodLabel}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de generación
                </Typography>
                <Typography>
                  {generatedAt ? generatedAt.toLocaleString('es-HN') : new Date().toLocaleString('es-HN')}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Usuario que generó
                </Typography>
                <Typography>{usuarioLabel}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Rango
                </Typography>
                <Typography>
                  {formatDate(data.periodo.desde)} — {formatDate(data.periodo.hasta)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Resumen financiero
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cartera total colocada
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.carteraTotalColocada)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total cobrado
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.totalCobrado)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Capital cobrado
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.capitalCobrado)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Intereses generados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.interesesGenerados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Intereses cobrados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.interesesCobrados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ingresos por multas
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.ingresosPorMultas)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Gastos del periodo
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.gastosPeriodo)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Utilidad neta
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.utilidadNeta)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Indicadores de cartera
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cartera activa al cierre
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.indicadores.carteraActivaAlCierre)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cartera en mora
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.indicadores.carteraEnMora)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Porcentaje de mora
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatPercent(data.indicadores.porcentajeMora)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad de préstamos desembolsados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadPrestamosDesembolsados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad de préstamos cerrados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadPrestamosCerrados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad de pagos recibidos
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadPagosRecibidos)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
