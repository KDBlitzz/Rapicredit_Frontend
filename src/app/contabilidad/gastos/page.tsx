'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
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
import { usePagos, useGastosCaja } from '../../../hooks/useCaja';
import { usePrestamos } from '../../../hooks/usePrestamos';
import { empleadosApi, type EmpleadoMongo } from '../../../services/empleadosApi';
import { gastosApi, type Gasto } from '../../../services/gastosApi';
import { parseDateInput, toOffsetISOString } from '../../../lib/dateRange';
import type { Pago as CajaPago } from '../../../services/cajaApi';

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

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-HN');
};

const sumMontoPagos = (pagos: CajaPago[]) =>
  pagos.reduce((acc, p) => acc + (typeof p.montoPago === 'number' ? p.montoPago : 0), 0);

const sumMontoGastos = (gastos: Gasto[]) =>
  gastos.reduce((acc, g) => acc + (typeof g.monto === 'number' ? g.monto : 0), 0);

type PrestamoOption = { codigoPrestamo: string; clienteNombre: string };

export default function GastosContabilidadPage() {
  const now = new Date();
  const hoy = isoDate(now);
  const inicioMes = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const { empleado } = useEmpleadoActual();

  const [fechaInicio, setFechaInicio] = useState(inicioMes);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const { data: pagosResp, loading: loadingPagos, error: errorPagos } = usePagos(
    fechaInicio,
    fechaFin,
    refreshKey
  );
  const pagos = useMemo(() => pagosResp?.pagos ?? [], [pagosResp]);
  const totalIngresos = useMemo(() => sumMontoPagos(pagos), [pagos]);

  const { data: gastos, loading: loadingGastos, error: errorGastos } = useGastosCaja(
    undefined,
    fechaInicio,
    fechaFin,
    refreshKey
  );
  const totalGastos = useMemo(() => sumMontoGastos(gastos), [gastos]);

  const utilidadNeta = useMemo(() => totalIngresos - totalGastos, [totalIngresos, totalGastos]);

  const [empleados, setEmpleados] = useState<EmpleadoMongo[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [errorEmpleados, setErrorEmpleados] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingEmpleados(true);
      setErrorEmpleados(null);
      try {
        const res = await empleadosApi.list({ includeInactivos: false });
        const users = Array.isArray(res.users) ? res.users : [];

        const finalList = users
          .filter((u) => String(u.rol || '').trim().toLowerCase() !== 'caja')
          .sort((a, b) =>
            String(a.nombreCompleto || a.usuario || a.codigoUsuario || '').localeCompare(
              String(b.nombreCompleto || b.usuario || b.codigoUsuario || ''),
              'es'
            )
          );

        if (!cancelled) setEmpleados(finalList);
      } catch (err: unknown) {
        if (!cancelled) {
          setEmpleados([]);
          setErrorEmpleados(err instanceof Error ? err.message : 'Error cargando cobradores');
        }
      } finally {
        if (!cancelled) setLoadingEmpleados(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cobradoresByCodigo = useMemo(() => {
    const m = new Map<string, EmpleadoMongo>();
    for (const e of empleados) {
      const codigo = String(e.codigoUsuario || '').trim();
      if (!codigo) continue;
      if (!m.has(codigo)) m.set(codigo, e);
    }
    return m;
  }, [empleados]);

  const { data: prestamosAll } = usePrestamos({ busqueda: '', estado: 'TODOS' }, { refreshKey: undefined });

  const prestamoOptions = useMemo((): PrestamoOption[] => {
    return (prestamosAll ?? [])
      .filter((p) => !!p.codigoPrestamo)
      .map((p) => ({
        codigoPrestamo: String(p.codigoPrestamo).trim(),
        clienteNombre: String(p.clienteNombre || '—').trim(),
      }))
      .filter((x) => !!x.codigoPrestamo)
      .sort((a, b) => a.codigoPrestamo.localeCompare(b.codigoPrestamo, 'es'));
  }, [prestamosAll]);

  const [form, setForm] = useState({
    fecha: hoy,
    categoria: '',
    descripcion: '',
    monto: '',
    codigoCobradorId: '',
    codigoPrestamo: '',
  });

  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const error = errorPagos || errorGastos || errorEmpleados;
  const loading = loadingPagos || loadingGastos;

  const gastosSorted = useMemo(() => {
    const copy = [...gastos];
    copy.sort((a, b) => {
      const da = new Date(String(a.fechaGasto || '')).getTime();
      const db = new Date(String(b.fechaGasto || '')).getTime();
      return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
    });
    return copy;
  }, [gastos]);

  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, { cantidad: number; total: number }>();
    for (const g of gastos) {
      const raw = typeof g.tipoGasto === 'string' ? g.tipoGasto.trim() : '';
      const categoria = raw || 'Sin categoría';
      const monto = typeof g.monto === 'number' && Number.isFinite(g.monto) ? g.monto : 0;
      const cur = map.get(categoria) ?? { cantidad: 0, total: 0 };
      cur.cantidad += 1;
      cur.total += monto;
      map.set(categoria, cur);
    }

    return Array.from(map.entries())
      .map(([categoria, v]) => ({ categoria, cantidad: v.cantidad, total: v.total }))
      .sort((a, b) => b.total - a.total);
  }, [gastos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'monto') {
      const normalized = value.replace(',', '.');
      if (normalized !== '' && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
      setForm((prev) => ({ ...prev, monto: normalized }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fecha || !form.monto) {
      setSnackbarMsg('Completa fecha y monto');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const monto = Number(form.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      setSnackbarMsg('El monto debe ser mayor a 0');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const codigoRegistradoPor = empleado?.codigoUsuario;
    if (!codigoRegistradoPor) {
      setSnackbarMsg('No se pudo identificar el usuario logueado');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const tipoGasto = (form.categoria || '').trim() || 'GASTO';
    const descripcion = (form.descripcion || '').trim() || undefined;

    const codigoCobradorId = String(form.codigoCobradorId || '').trim() || undefined;
    const codigoPrestamo = String(form.codigoPrestamo || '').trim() || undefined;

    setSaving(true);
    try {
      await gastosApi.create({
        codigoGasto: `GAS-${Date.now()}`,
        fechaGasto: toOffsetISOString(parseDateInput(form.fecha)),
        tipoGasto,
        descripcion,
        monto,
        codigoCobradorId,
        codigoPrestamo,
        codigoRegistradoPor,
      });

      setSnackbarMsg('Gasto registrado');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setRefreshKey(Date.now());
      setForm((prev) => ({ ...prev, monto: '', descripcion: '' }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar el gasto';
      setSnackbarMsg(msg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const resolveCobradorLabel = (codigo?: string | null) => {
    const key = String(codigo || '').trim();
    if (!key) return '—';
    const e = cobradoresByCodigo.get(key);
    return e?.nombreCompleto || e?.usuario || e?.codigoUsuario || key;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6">Gastos operativos</Typography>
            <Typography variant="caption" color="text.secondary">
              Registro de gastos por categoría y comparación contra ingresos (pagos) para evaluar rentabilidad.
            </Typography>
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
            <Chip size="small" label={`Gastos: ${formatMoney(totalGastos)}`} />
            <Chip
              size="small"
              color={utilidadNeta >= 0 ? 'success' : 'error'}
              label={`Utilidad neta: ${formatMoney(utilidadNeta)}`}
            />
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Cargando…
            </Typography>
          </Box>
        ) : null}

        {error ? <Alert sx={{ mt: 1 }} severity="error">{error}</Alert> : null}
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }} component="form" onSubmit={handleSubmit}>
            <Typography variant="subtitle1">Registrar gasto</Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                label="Fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                size="small"
                label="Categoría"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                placeholder="Ej: Combustible, Viáticos"
              />

              <TextField
                size="small"
                label="Descripción"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
              />

              <TextField
                size="small"
                label="Monto"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                inputMode="decimal"
              />

              <TextField
                size="small"
                select
                label="Vincular a cobrador (opcional)"
                name="codigoCobradorId"
                value={form.codigoCobradorId}
                onChange={handleChange}
                helperText={loadingEmpleados ? 'Cargando cobradores…' : undefined}
              >
                <MenuItem value="">Sin cobrador</MenuItem>
                {loadingEmpleados ? <MenuItem disabled value="__loading">Cargando…</MenuItem> : null}
                {errorEmpleados ? <MenuItem disabled value="__error">{errorEmpleados}</MenuItem> : null}
                {empleados
                  .filter((e) => !!e.codigoUsuario)
                  .map((e) => (
                    <MenuItem key={e._id} value={String(e.codigoUsuario)}>
                      {e.nombreCompleto || e.usuario || e.codigoUsuario}
                    </MenuItem>
                  ))}
              </TextField>

              <Autocomplete
                options={prestamoOptions}
                getOptionLabel={(opt) => `${opt.codigoPrestamo} — ${opt.clienteNombre}`}
                value={
                  form.codigoPrestamo
                    ? prestamoOptions.find((o) => o.codigoPrestamo === form.codigoPrestamo) || null
                    : null
                }
                onChange={(_e, opt) => {
                  setForm((prev) => ({ ...prev, codigoPrestamo: opt?.codigoPrestamo || '' }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Vincular a financiamiento (opcional)"
                    placeholder="Busca por código de préstamo"
                  />
                )}
                clearOnEscape
              />

              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Gastos por categoría</Typography>
            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gastosPorCategoria.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          No hay gastos en el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {gastosPorCategoria.map((row) => (
                    <TableRow key={row.categoria} hover>
                      <TableCell>{row.categoria}</TableCell>
                      <TableCell align="right">{row.cantidad.toLocaleString('es-HN')}</TableCell>
                      <TableCell align="right">{formatMoney(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Detalle de gastos</Typography>
            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Cobrador</TableCell>
                    <TableCell>Financiamiento</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gastosSorted.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No hay gastos en el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {gastosSorted.map((g, idx) => (
                    <TableRow key={String(g._id ?? g.codigoGasto ?? idx)} hover>
                      <TableCell>{formatDate(g.fechaGasto as string)}</TableCell>
                      <TableCell>{String(g.tipoGasto || '—')}</TableCell>
                      <TableCell>{String(g.descripcion || '—')}</TableCell>
                      <TableCell>{resolveCobradorLabel(g.codigoCobradorId as string)}</TableCell>
                      <TableCell>{String(g.codigoPrestamo || '—')}</TableCell>
                      <TableCell align="right">{formatMoney(typeof g.monto === 'number' ? g.monto : null)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled">
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
