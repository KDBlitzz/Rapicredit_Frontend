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
import { useIndicadoresFinancieros } from '../../../hooks/useIndicadoresFinancieros';
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
    ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    : '—';

const formatCount = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('es-HN') : '—';

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = parseDateInput(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-HN');
};

export default function IndicadoresFinancierosPage() {
  const now = new Date();
  const defaultFechaCorte = isoDate(now);

  const { empleado } = useEmpleadoActual();

  const [fechaCorteInput, setFechaCorteInput] = useState(defaultFechaCorte);
  const [submittedFechaCorte, setSubmittedFechaCorte] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [uiError, setUiError] = useState<string | null>(null);

  const { data, loading, error, generatedAt } = useIndicadoresFinancieros(submittedFechaCorte, {
    enabled: !!submittedFechaCorte,
    refreshKey,
  });

  const usuarioLabel = useMemo(() => {
    return empleado?.nombreCompleto || empleado?.usuario || '—';
  }, [empleado?.nombreCompleto, empleado?.usuario]);

  const isValidFechaCorte = useMemo(() => {
    if (!fechaCorteInput) return false;
    const d = parseDateInput(fechaCorteInput);
    return !Number.isNaN(d.getTime());
  }, [fechaCorteInput]);

  const handleGenerar = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!isValidFechaCorte) {
      setUiError('Fecha de corte inválida: verifica el valor.');
      return;
    }

    setSubmittedFechaCorte(fechaCorteInput);
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
          <Typography variant="h6">Indicadores financieros</Typography>
          <Typography variant="caption" color="text.secondary">
            Vista consolidada de intereses y capital por cobrar a una fecha de corte.
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
            label="Fecha de corte"
            InputLabelProps={{ shrink: true }}
            value={fechaCorteInput}
            onChange={(e) => setFechaCorteInput(e.target.value)}
          />
          <Button type="submit" variant="contained" size="small" disabled={loading || !isValidFechaCorte}>
            Consultar
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando indicadores…
          </Typography>
        </Box>
      ) : null}

      {errorToShow ? <Alert severity="error">{errorToShow}</Alert> : null}

      {!submittedFechaCorte && !data ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona una fecha de corte y presiona “Consultar” para ver el resumen.
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
                  Fecha de corte
                </Typography>
                <Typography>{formatDate(data.fechaCorte)}</Typography>
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
              Resumen
            </Typography>

            <Grid container spacing={2}>
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
                    Intereses devengados no cobrados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.interesesDevengadosNoCobrados)}
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
                    Intereses no cobrados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.interesesNoCobrados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Capital por cobrar
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatMoney(data.resumen.capitalPorCobrar)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Indicadores
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad de préstamos analizados
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadPrestamosAnalizados)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cantidad de cuotas analizadas
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {formatCount(data.indicadores.cantidadCuotasAnalizadas)}
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
