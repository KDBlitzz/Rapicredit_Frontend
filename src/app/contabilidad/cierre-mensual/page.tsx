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
import { cierreMensualApi } from '../../../services/cierreMensualApi';

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
  const d = parseDateInput(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-HN');
};

const extractBackendHtmlError = (html: string): string | null => {
  const raw = String(html || '').trim();
  if (!raw) return null;
  const looksLikeHtml = /<!doctype\s+html|<html[\s>]/i.test(raw);
  if (!looksLikeHtml) return null;

  const pre = /<pre[^>]*>([\s\S]*?)<\/pre>/i.exec(raw)?.[1] ?? raw;
  const withBreaks = pre.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
  const text = withBreaks.replace(/<[^>]+>/g, '').trim();
  if (!text) return null;
  return text.split('\n').slice(0, 12).join('\n');
};

export default function CierreMensualPage() {
  const now = new Date();
  const defaultDesde = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultHasta = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const { empleado } = useEmpleadoActual();

  const [fechaInicioInput, setFechaInicioInput] = useState(defaultDesde);
  const [fechaFinInput, setFechaFinInput] = useState(defaultHasta);
  const [submitted, setSubmitted] = useState<{ anio: number; mes: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [uiError, setUiError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const { data, loading, error, generatedAt } = useCierreMensual(submitted?.anio, submitted?.mes, {
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

  const isValidRange = useMemo(() => {
    if (!fechaInicioInput || !fechaFinInput) return false;
    const start = parseDateInput(fechaInicioInput);
    const end = parseDateInput(fechaFinInput);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start.getTime() <= end.getTime();
  }, [fechaInicioInput, fechaFinInput]);

  const handleGenerar = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);
    if (!isValidRange) return;

    const start = parseDateInput(fechaInicioInput);
    const end = parseDateInput(fechaFinInput);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setUiError('Periodo inválido: verifica las fechas');
      return;
    }

    if (start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth()) {
      setUiError('El rango debe estar dentro del mismo mes y año.');
      return;
    }

    const anio = start.getFullYear();
    const mes = start.getMonth() + 1;

    setSubmitted({ anio, mes });
    setRefreshKey(Date.now());
  };

  const handlePdf = async () => {
    if (!data || exportingPdf) return;
    setUiError(null);
    setExportingPdf(true);

    try {
      const blob = await cierreMensualApi.getPdf({ anio: data.periodo.anio, mes: data.periodo.mes });

      // Validación rápida: un PDF debería iniciar con "%PDF".
      const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      const isPdf = header.length >= 4 && header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;

      if (!isPdf) {
        const text = await blob.text();
        const extracted = extractBackendHtmlError(text);
        setUiError(extracted ?? 'El backend no devolvió un PDF válido.');
        return;
      }

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al descargar PDF';
      setUiError(extractBackendHtmlError(msg) ?? msg);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExcel = async () => {
    if (!data || exportingExcel) return;
    setUiError(null);
    setExportingExcel(true);

    try {
      const blob = await cierreMensualApi.getExcel({ anio: data.periodo.anio, mes: data.periodo.mes });

      // XLSX es un ZIP: normalmente inicia con "PK".
      const header = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
      const isZip = header.length >= 2 && header[0] === 0x50 && header[1] === 0x4b;

      if (!isZip) {
        const text = await blob.text();
        const extracted = extractBackendHtmlError(text);
        setUiError(extracted ?? 'El backend no devolvió un Excel (.xlsx) válido.');
        return;
      }

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `cierre-mensual-${data.periodo.anio}-${pad2(data.periodo.mes)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al descargar Excel';
      setUiError(extractBackendHtmlError(msg) ?? msg);
    } finally {
      setExportingExcel(false);
    }
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
          <Button
            type="button"
            variant="outlined"
            size="small"
            disabled={!data || loading || exportingPdf}
            onClick={handlePdf}
          >
            PDF
          </Button>
          <Button
            type="button"
            variant="outlined"
            size="small"
            disabled={!data || loading || exportingExcel}
            onClick={handleExcel}
          >
            Excel
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

      {errorToShow ? <Alert severity="error">{errorToShow}</Alert> : null}

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
                <Typography>{monthLabel}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de generación
                </Typography>
                <Typography>{generatedAt ? generatedAt.toLocaleString('es-HN') : '—'}</Typography>
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
