'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
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
import { useEstadoFinanciera } from '../../../hooks/useEstadoFinanciera';

const formatMoney = (v: number) => `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (v: number) => v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EstadoFinancieraPage() {
  const now = new Date();
  const defaultAnio = now.getFullYear();
  const defaultMes = now.getMonth() + 1;

  const [anioInput, setAnioInput] = useState<number>(defaultAnio);
  const [mesInput, setMesInput] = useState<number>(defaultMes);
  const [submitted, setSubmitted] = useState<{ anio: number; mes: number } | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useEstadoFinanciera(submitted?.anio, submitted?.mes);

  const isValid = useMemo(() => {
    if (!Number.isInteger(anioInput) || anioInput < 2000 || anioInput > 3000) return false;
    if (!Number.isInteger(mesInput) || mesInput < 1 || mesInput > 12) return false;
    return true;
  }, [anioInput, mesInput]);

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!isValid) {
      setUiError('Período inválido: verifica año/mes.');
      return;
    }

    setSubmitted({ anio: anioInput, mes: mesInput });
  };

  const errorToShow = uiError || error;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Estado financiera (mensual)</Typography>

      <Paper sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleConsultar} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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

          <Button type="submit" size="small" variant="contained" disabled={loading || !isValid}>
            Consultar
          </Button>

          <Button type="button" size="small" variant="text" disabled={loading || !submitted} onClick={refetch}>
            Refrescar
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando…
          </Typography>
        </Box>
      ) : null}

      {errorToShow ? <Alert severity="error">{errorToShow}</Alert> : null}

      {!submitted && !data ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Selecciona año y mes y presiona “Consultar”.
          </Typography>
        </Paper>
      ) : null}

      {data ? (
        <>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Resumen
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
              <Typography variant="body2">Período: {data.periodo.anio}-{String(data.periodo.mes).padStart(2, '0')} ({data.periodo.desde} a {data.periodo.hasta})</Typography>
              <Typography variant="body2">Ingresos totales: {formatMoney(data.resumen.ingresosTotales)}</Typography>
              <Typography variant="body2">Gastos totales: {formatMoney(data.resumen.gastosTotales)}</Typography>
              <Typography variant="body2">Utilidad neta: {formatMoney(data.resumen.utilidadNeta)}</Typography>
              <Typography variant="body2">Recuperación total: {formatMoney(data.resumen.recuperacionTotal)}</Typography>
              <Typography variant="body2">Total cartera: {formatMoney(data.resumen.totalCartera)}</Typography>
              <Typography variant="body2">Número préstamos: {data.resumen.numeroPrestamos}</Typography>
              <Typography variant="body2">Nuevos: {data.resumen.nuevos}</Typography>
              <Typography variant="body2">Recurrentes: {data.resumen.recurrentes}</Typography>
              <Typography variant="body2">Tasa interés promedio mensual: {formatNumber(data.resumen.tasaInteresPromedioMensual)}%</Typography>
              <Typography variant="body2">% utilidad: {formatNumber(data.resumen.porcentajeUtilidad)}%</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Préstamos del mes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha desembolso</TableCell>
                    <TableCell align="right">Tasa anual</TableCell>
                    <TableCell align="right">Capital</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.detalle.prestamosDelMes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.codigoPrestamo}</TableCell>
                      <TableCell>{p.clienteId}</TableCell>
                      <TableCell>{p.fechaDesembolso}</TableCell>
                      <TableCell align="right">{formatNumber(p.tasaInteresAnual)}</TableCell>
                      <TableCell align="right">{formatMoney(p.capitalSolicitado)}</TableCell>
                      <TableCell>{p.estadoPrestamo}</TableCell>
                    </TableRow>
                  ))}
                  {data.detalle.prestamosDelMes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="caption" color="text.secondary">
                          Sin datos.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Pagos del mes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código pago</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Interés</TableCell>
                    <TableCell align="right">Mora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.detalle.pagosDelMes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.codigoPago}</TableCell>
                      <TableCell>{p.fechaPago}</TableCell>
                      <TableCell align="right">{formatMoney(p.montoPago)}</TableCell>
                      <TableCell align="right">{formatMoney(p.aplicadoAInteres)}</TableCell>
                      <TableCell align="right">{formatMoney(p.aplicadoAMora)}</TableCell>
                    </TableRow>
                  ))}
                  {data.detalle.pagosDelMes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="caption" color="text.secondary">
                          Sin datos.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Gastos del mes
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código gasto</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.detalle.gastosDelMes.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>{g.codigoGasto}</TableCell>
                      <TableCell>{g.fechaGasto}</TableCell>
                      <TableCell>{g.tipoGasto}</TableCell>
                      <TableCell>{g.descripcion}</TableCell>
                      <TableCell align="right">{formatMoney(g.monto)}</TableCell>
                    </TableRow>
                  ))}
                  {data.detalle.gastosDelMes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="caption" color="text.secondary">
                          Sin datos.
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
