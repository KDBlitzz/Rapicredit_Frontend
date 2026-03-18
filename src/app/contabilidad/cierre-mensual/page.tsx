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

const pad2 = (n: number) => String(n).padStart(2, '0');

const parseMonthInput = (value: string): { anio: number; mes: number } | null => {
  const m = /^\s*(\d{4})-(\d{2})\s*$/.exec(value);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  if (!Number.isFinite(anio) || !Number.isFinite(mes)) return null;
  if (mes < 1 || mes > 12) return null;
  return { anio, mes };
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
  const defaultMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

  const { empleado } = useEmpleadoActual();

  const [periodInput, setPeriodInput] = useState(defaultMonth);
  const [submitted, setSubmitted] = useState<{ anio: number; mes: number } | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const { data, loading, error } = useCierreMensual(submitted?.anio, submitted?.mes, {
    enabled: !!submitted,
    refreshKey,
  });

  const monthLabel = useMemo(() => {
    const anio = data?.periodo.anio ?? submitted?.anio;
    const mes = data?.periodo.mes ?? submitted?.mes;
    if (!anio || !mes) return '—';

    const label = new Intl.DateTimeFormat('es-HN', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(anio, mes - 1, 1));

    return capitalizeFirst(label);
  }, [data?.periodo.anio, data?.periodo.mes, submitted?.anio, submitted?.mes]);

  const usuarioLabel = useMemo(() => {
    return empleado?.nombreCompleto || empleado?.usuario || '—';
  }, [empleado?.nombreCompleto, empleado?.usuario]);

  const handleGenerar = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseMonthInput(periodInput);
    if (!parsed) return;

    setSubmitted(parsed);
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
            Genera un reporte financiero consolidado del mes.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleGenerar}
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <TextField
            type="month"
            size="small"
            label="Periodo"
            InputLabelProps={{ shrink: true }}
            value={periodInput}
            onChange={(e) => setPeriodInput(e.target.value)}
          />
          <Button type="submit" variant="contained" size="small" disabled={loading || !parseMonthInput(periodInput)}>
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
            Selecciona un mes y presiona “Generar cierre” para ver el resumen.
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
                  Mes y año del cierre
                </Typography>
                <Typography>{monthLabel}</Typography>
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
                    Cartera colocada
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
                    Multas cobradas
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.ingresosPorMultas)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Gastos del período
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
                    Saldo de cartera activa
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
                    Préstamos desembolsados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadPrestamosDesembolsados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Préstamos cerrados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadPrestamosCerrados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pagos recibidos
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
