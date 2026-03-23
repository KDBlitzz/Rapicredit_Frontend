'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import { useCuadre, useGastosCaja, usePagos as useCajaPagos } from '../../hooks/useCaja';
import { useEstadoCuentaContabilidad } from '../../hooks/useEstadoCuentaContabilidad';
import { EstadoPrestamoFiltro, usePrestamos } from '../../hooks/usePrestamos';
import type { Pago as CajaPago } from '../../services/cajaApi';
import type { Gasto } from '../../services/gastosApi';

type TabKey = 'INGRESOS' | 'EGRESOS' | 'PRESTAMOS' | 'INTERESES' | 'ESTADO_CUENTA';

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null;

function isoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const formatMoney = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v)
    ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    : 'L. 0.00';

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-HN');
};

const formatCount = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('es-HN') : '—';

const formatPct = (v?: number | null) =>
  typeof v === 'number' && Number.isFinite(v) ? `${v.toFixed(2)}%` : '—';

const pickString = (...vals: unknown[]): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
};

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const getCodigoPrestamoFromCajaPago = (p: CajaPago): string => {
  const raw = p.prestamoId as unknown;
  if (isRecord(raw)) {
    return String(raw.codigoPrestamo || '').trim() || '—';
  }
  return '—';
};

const getClienteCodigoFromCajaPago = (p: CajaPago): string => {
  const raw = p.clienteId as unknown;
  if (isRecord(raw)) {
    return String(raw.codigoCliente || '').trim() || '—';
  }
  return '—';
};

const getClienteIdentidadFromCajaPago = (p: CajaPago): string => {
  const raw = p.clienteId as unknown;
  if (isRecord(raw)) {
    return String(raw.identidadCliente || '').trim() || '—';
  }
  return '—';
};

const getAsesorNombreFromCajaPago = (p: CajaPago): string => {
  const raw = p.cobradorId as unknown;
  if (isRecord(raw)) {
    const nombre = pickString(raw.nombreCompleto, raw.usuario, raw.codigoUsuario);
    return nombre || '—';
  }
  return '—';
};

const sumMontoPagos = (pagos: CajaPago[]) =>
  pagos.reduce((acc, p) => acc + (typeof p.montoPago === 'number' ? p.montoPago : 0), 0);

const sumMontoGastos = (gastos: Gasto[]) =>
  gastos.reduce((acc, g) => acc + (typeof g.monto === 'number' ? g.monto : 0), 0);

export default function ContabilidadPage() {
  const now = new Date();
  const hoy = isoDate(now);
  const inicioMes = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const [tab, setTab] = useState<TabKey>('INGRESOS');

  const [fechaInicio, setFechaInicio] = useState(inicioMes);
  const [fechaFin, setFechaFin] = useState(hoy);

  const [estadoCuentaRefreshKey, setEstadoCuentaRefreshKey] = useState<number>(0);

  const { data: pagosResp, loading: loadingPagos, error: errorPagos } = useCajaPagos(
    fechaInicio,
    fechaFin
  );
  const pagos = pagosResp?.pagos ?? [];
  const totalIngresos = useMemo(() => sumMontoPagos(pagos), [pagos]);

  const { data: gastos, loading: loadingGastos, error: errorGastos } = useGastosCaja(
    undefined,
    fechaInicio,
    fechaFin
  );
  const totalEgresos = useMemo(() => sumMontoGastos(gastos), [gastos]);

  const { data: cuadre, loading: loadingCuadre, error: errorCuadre } = useCuadre(fechaInicio, fechaFin);

  const [busquedaPrestamo, setBusquedaPrestamo] = useState('');
  const [estadoPrestamo, setEstadoPrestamo] = useState<EstadoPrestamoFiltro>('TODOS');
  const {
    data: prestamos,
    loading: loadingPrestamos,
    error: errorPrestamos,
  } = usePrestamos(
    { busqueda: busquedaPrestamo, estado: estadoPrestamo },
    { refreshKey: undefined }
  );

  const {
    data: estadoCuentaData,
    loading: loadingEstadoCuenta,
    error: errorEstadoCuenta,
    generatedAt: estadoCuentaGeneratedAt,
  } = useEstadoCuentaContabilidad(fechaInicio, fechaFin, {
    enabled: tab === 'ESTADO_CUENTA',
    refreshKey: estadoCuentaRefreshKey,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6">Contabilidad</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="Hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Chip size="small" label={`Ingresos: ${formatMoney(totalIngresos)}`} />
            <Chip size="small" label={`Egresos: ${formatMoney(totalEgresos)}`} />
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v as TabKey)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="INGRESOS" label="Ingresos" />
          <Tab value="EGRESOS" label="Egresos" />
          <Tab value="PRESTAMOS" label="Préstamos" />
          <Tab value="INTERESES" label="Intereses" />
          <Tab value="ESTADO_CUENTA" label="Estado de cuenta" />
        </Tabs>
      </Paper>

      {tab === 'INGRESOS' ? (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Ingresos (pagos)</Typography>
            <Chip size="small" label={`Registros: ${pagos.length}`} />
            <Chip size="small" label={`Total: ${formatMoney(totalIngresos)}`} />
          </Box>

          {loadingPagos ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">Cargando ingresos…</Typography>
            </Box>
          ) : null}
          {errorPagos ? <Alert severity="error">{errorPagos}</Alert> : null}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Código préstamo</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Asesor/Cobrador</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Comprobante</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((p) => {
                  const codigoPrestamo = getCodigoPrestamoFromCajaPago(p);
                  const cliente = `${getClienteCodigoFromCajaPago(p)} · ${getClienteIdentidadFromCajaPago(p)}`;
                  const asesor = getAsesorNombreFromCajaPago(p);
                  const fecha = formatDate(p.fechaPago);
                  const metodo = String(p.metodoPago || '—');
                  const comprobante = String(p.numeroComprobante || '—');
                  const monto = typeof p.montoPago === 'number' ? p.montoPago : 0;

                  return (
                    <TableRow key={String(p._id || `${fecha}-${codigoPrestamo}-${comprobante}-${monto}`)}>
                      <TableCell>{fecha}</TableCell>
                      <TableCell>{codigoPrestamo}</TableCell>
                      <TableCell>{cliente}</TableCell>
                      <TableCell>{asesor}</TableCell>
                      <TableCell>{metodo}</TableCell>
                      <TableCell>{comprobante}</TableCell>
                      <TableCell align="right">{formatMoney(monto)}</TableCell>
                    </TableRow>
                  );
                })}

                {!loadingPagos && pagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="caption" color="text.secondary">
                        No hay ingresos en el rango seleccionado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}

      {tab === 'EGRESOS' ? (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Egresos (gastos)</Typography>
            <Chip size="small" label={`Registros: ${gastos.length}`} />
            <Chip size="small" label={`Total: ${formatMoney(totalEgresos)}`} />
          </Box>

          {loadingGastos ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">Cargando egresos…</Typography>
            </Box>
          ) : null}
          {errorGastos ? <Alert severity="error">{errorGastos}</Alert> : null}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Cobrador</TableCell>
                  <TableCell>Código préstamo</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gastos.map((g) => {
                  const fecha = formatDate(g.fechaGasto);
                  const tipo = String(g.tipoGasto || '—');
                  const desc = String(g.descripcion || '—');
                  const cobrador = String(g.codigoCobradorId || '—');
                  const codigoPrestamo = String(g.codigoPrestamo || '—');
                  const monto = typeof g.monto === 'number' ? g.monto : 0;

                  return (
                    <TableRow key={String(g._id || `${fecha}-${tipo}-${monto}-${cobrador}`)}>
                      <TableCell>{fecha}</TableCell>
                      <TableCell>{tipo}</TableCell>
                      <TableCell>{desc}</TableCell>
                      <TableCell>{cobrador}</TableCell>
                      <TableCell>{codigoPrestamo}</TableCell>
                      <TableCell align="right">{formatMoney(monto)}</TableCell>
                    </TableRow>
                  );
                })}

                {!loadingGastos && gastos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="caption" color="text.secondary">
                        No hay egresos en el rango seleccionado.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}

      {tab === 'PRESTAMOS' ? (
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2">Préstamos</Typography>
              <Chip size="small" label={`Registros: ${prestamos.length}`} />
            </Box>
          </Box>

          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Buscar"
                placeholder="Código, cliente, identidad…"
                value={busquedaPrestamo}
                onChange={(e) => setBusquedaPrestamo(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Estado"
                value={estadoPrestamo}
                onChange={(e) => setEstadoPrestamo(e.target.value as EstadoPrestamoFiltro)}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="VIGENTE">Vigentes</MenuItem>
                <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                <MenuItem value="MORA">En mora</MenuItem>
                <MenuItem value="CERRADO">Cerrados</MenuItem>
                <MenuItem value="RECHAZADO">Rechazados</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {loadingPrestamos ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">
                Cargando préstamos…
              </Typography>
            </Box>
          ) : null}
          {errorPrestamos ? <Alert severity="error">{errorPrestamos}</Alert> : null}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Capital</TableCell>
                  <TableCell>Intereses</TableCell>
                  <TableCell>Pagado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prestamos.map((p) => {
                  const estado = String(p.estadoPrestamo || '').toUpperCase() || '—';
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.codigoPrestamo}</TableCell>
                      <TableCell>{p.clienteNombre}</TableCell>
                      <TableCell>
                        <Chip size="small" label={estado} variant="outlined" />
                      </TableCell>
                      <TableCell>{formatMoney(p.capitalSolicitado ?? 0)}</TableCell>
                      <TableCell>{formatMoney(p.totalIntereses ?? 0)}</TableCell>
                      <TableCell>{formatMoney(p.totalPagado ?? 0)}</TableCell>
                    </TableRow>
                  );
                })}

                {!loadingPrestamos && prestamos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="caption" color="text.secondary">
                        No hay préstamos para los filtros seleccionados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}

      {tab === 'INTERESES' ? (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Intereses (resumen por rango)</Typography>
            <Chip size="small" label={`Pagos: ${cuadre?.totales.cantidadPagos ?? 0}`} />
            <Chip size="small" label={`Interés: ${formatMoney(cuadre?.totales.totalInteres ?? 0)}`} />
            <Chip size="small" label={`Capital: ${formatMoney(cuadre?.totales.totalCapital ?? 0)}`} />
            <Chip size="small" label={`Mora: ${formatMoney(cuadre?.totales.totalMora ?? 0)}`} />
            <Chip size="small" label={`Total: ${formatMoney(cuadre?.totales.totalMonto ?? 0)}`} />
          </Box>

          {loadingCuadre ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">
                Cargando resumen…
              </Typography>
            </Box>
          ) : null}
          {errorCuadre ? <Alert severity="error">{errorCuadre}</Alert> : null}

          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Intereses por asesor
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asesor</TableCell>
                    <TableCell align="right">Interés</TableCell>
                    <TableCell align="right">Capital</TableCell>
                    <TableCell align="right">Mora</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cuadre?.porAsesor ?? []).map((a) => {
                    const nombre =
                      a.asesor?.nombreCompleto ||
                      a.asesor?.usuario ||
                      a.asesor?.codigoUsuario ||
                      '—';
                    return (
                      <TableRow key={String(a.cobradorId || nombre)}>
                        <TableCell>{nombre}</TableCell>
                        <TableCell align="right">{formatMoney(a.totalInteres ?? 0)}</TableCell>
                        <TableCell align="right">{formatMoney(a.totalCapital ?? 0)}</TableCell>
                        <TableCell align="right">{formatMoney(a.totalMora ?? 0)}</TableCell>
                        <TableCell align="right">{formatMoney(a.totalMonto ?? 0)}</TableCell>
                      </TableRow>
                    );
                  })}

                  {!loadingCuadre && (cuadre?.porAsesor ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="caption" color="text.secondary">
                          No hay datos de intereses para el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      ) : null}

      {tab === 'ESTADO_CUENTA' ? (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2">Estado de cuenta (mensual)</Typography>
              <Chip size="small" label={`Meses: ${formatCount(estadoCuentaData?.rows.length ?? 0)}`} />
              {estadoCuentaData?.source ? <Chip size="small" variant="outlined" label={`Fuente: ${estadoCuentaData.source}`} /> : null}
            </Box>

            <Button
              size="small"
              variant="text"
              disabled={loadingEstadoCuenta}
              onClick={() => setEstadoCuentaRefreshKey(Date.now())}
            >
              Actualizar
            </Button>
          </Box>

          {loadingEstadoCuenta ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">
                Cargando estado de cuenta…
              </Typography>
            </Box>
          ) : null}
          {errorEstadoCuenta ? <Alert severity="error">{errorEstadoCuenta}</Alert> : null}
          {estadoCuentaData?.source === 'mock' ? (
            <Alert severity="info" sx={{ mb: 1 }}>
              Backend no disponible o sin endpoint: mostrando datos de ejemplo.
            </Alert>
          ) : null}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Generado: {estadoCuentaGeneratedAt ? estadoCuentaGeneratedAt.toLocaleString('es-HN') : '—'}
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
                {(estadoCuentaData?.rows ?? []).map((r, idx) => (
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

                {!loadingEstadoCuenta && (estadoCuentaData?.rows ?? []).length === 0 ? (
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
      ) : null}
    </Box>
  );
}
