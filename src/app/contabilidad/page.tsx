'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Button,
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
import { useCuadre, useGastosCaja, useMoraDetallada, usePagos as useCajaPagos } from '../../hooks/useCaja';
import { EstadoPrestamoFiltro, usePrestamos } from '../../hooks/usePrestamos';
import { usePrestamoDetalle } from '../../hooks/usePrestamoDetalle';
import type { MoraDetalleItem, Pago as CajaPago } from '../../services/cajaApi';
import type { Gasto } from '../../services/gastosApi';
import { parseDateInput } from '@/lib/dateRange';

type TabKey = 'INGRESOS' | 'EGRESOS' | 'PRESTAMOS' | 'INTERESES' | 'MORA' | 'ESTADO_CUENTA';

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null;

function isoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const formatMoney = (v?: number) =>
  typeof v === 'number' && Number.isFinite(v)
    ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    : 'L. 0.00';

const formatDate = (iso?: string) => {
  const d = parseApiDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('es-HN');
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const parseApiDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const s = String(iso).trim();
  if (!s) return null;

  const datePart = /^\s*(\d{4}-\d{2}-\d{2})/.exec(s)?.[1];
  const isPlainDate = !!datePart && s.length === 10;
  const isMidnightWithZone =
    !!datePart &&
    /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(s);

  // Muchas rutas mandan fechas "por día" como ISO a medianoche (a veces con 'Z').
  // Si las parseamos con `new Date()` se pueden correr un día por timezone. Aquí las
  // tratamos como fecha LOCAL (YYYY-MM-DD) para que UI y cálculos de días sean estables.
  if ((isPlainDate || isMidnightWithZone) && datePart) {
    return parseDateInput(datePart);
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysFromToday = (fechaVencimientoIso?: string) => {
  if (!fechaVencimientoIso) return 0;
  const venc = parseApiDate(fechaVencimientoIso);
  if (!venc) return 0;

  const hoy = startOfDay(new Date()).getTime();
  const v = startOfDay(venc).getTime();
  const diff = Math.floor((hoy - v) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const normalizeKey = (v: string) => String(v || '').trim().toUpperCase();

const pickString = (...vals: unknown[]): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
};

const looksLikeCodigoPrestamo = (v: string) => {
  const s = String(v || '').trim();
  if (!s) return false;
  // Formatos comunes:
  // - P-2026-001 (con año)
  // - PRE-000086 (correlativo con ceros)
  return /^[A-Z]{1,8}-\d{4}-\d{1,}$/i.test(s) || /^[A-Z]{1,8}-\d{5,}$/i.test(s);
};

const extractCodigoPrestamo = (text: string): string | undefined => {
  const s = String(text || '').trim();
  if (!s) return undefined;
  const m = /([A-Z]{1,8}-\d{4}-\d{1,}|[A-Z]{1,8}-\d{5,})/i.exec(s);
  return m?.[1]?.trim();
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
  const direct = pickString(p['codigoPrestamo'], p['prestamoCodigo'], p['codigo']);
  if (direct) return direct;

  const raw = p.prestamoId as unknown;
  if (typeof raw === 'string' && raw.trim()) {
    // A veces el backend envía el código directamente como string.
    // Si parece ObjectId, no podemos resolverlo aquí.
    const s = raw.trim();
    if (!/^[a-f\d]{24}$/i.test(s)) return s;
  }
  if (isRecord(raw)) {
    return String(raw.codigoPrestamo || '').trim() || '—';
  }
  return '—';
};

const getClienteCodigoFromCajaPago = (p: CajaPago): string => {
  const direct = pickString(p['codigoCliente'], p['clienteCodigo']);
  if (direct) return direct;

  const raw = p.clienteId as unknown;
  if (isRecord(raw)) {
    return String(raw.codigoCliente || '').trim() || '—';
  }
  return '—';
};

const getClienteIdentidadFromCajaPago = (p: CajaPago): string => {
  const direct = pickString(p['identidadCliente'], p['clienteIdentidad'], p['identidad']);
  if (direct) return direct;

  const raw = p.clienteId as unknown;
  if (isRecord(raw)) {
    return String(raw.identidadCliente || '').trim() || '—';
  }
  return '—';
};

const getClienteNombreFromCajaPago = (p: CajaPago): string => {
  const direct = pickString(p['clienteNombre'], p['nombreCliente'], p['nombreCompleto']);
  if (direct) return direct;

  const raw = p.clienteId as unknown;
  if (isRecord(raw)) {
    const nombreCompleto = pickString(raw.nombreCompleto);
    if (nombreCompleto) return nombreCompleto;
    const nombre = typeof raw.nombre === 'string' ? raw.nombre.trim() : '';
    const apellido = typeof raw.apellido === 'string' ? raw.apellido.trim() : '';
    const joined = [nombre, apellido].filter(Boolean).join(' ');
    if (joined) return joined;
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

  const { data: pagosResp, loading: loadingPagos, error: errorPagos } = useCajaPagos(
    fechaInicio,
    fechaFin
  );
  const pagos = useMemo(() => pagosResp?.pagos ?? [], [pagosResp?.pagos]);
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
    data: prestamosAll,
    loading: loadingPrestamos,
    error: errorPrestamos,
  } = usePrestamos({ busqueda: '', estado: 'TODOS' }, { refreshKey: undefined });

  const prestamosFiltrados = useMemo(() => {
    let filtered = [...prestamosAll];

    if (estadoPrestamo !== 'TODOS') {
      filtered = filtered.filter((p) => (p.estadoPrestamo || '').toUpperCase() === estadoPrestamo);
    }

    if (busquedaPrestamo.trim()) {
      const q = busquedaPrestamo.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        return (
          p.codigoPrestamo.toLowerCase().includes(q) ||
          p.clienteNombre.toLowerCase().includes(q) ||
          (p.clienteIdentidad || '').toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [prestamosAll, busquedaPrestamo, estadoPrestamo]);

  const prestamoByCodigo = useMemo(() => {
    const m = new Map<string, (typeof prestamosAll)[number]>();
    for (const p of prestamosAll) {
      const key = normalizeKey(p.codigoPrestamo);
      if (!key) continue;
      if (!m.has(key)) m.set(key, p);
    }
    return m;
  }, [prestamosAll]);

  const [moraDiasMinInput, setMoraDiasMinInput] = useState('1');
  const moraDiasMin = useMemo(() => {
    const n = Number(String(moraDiasMinInput || '').trim());
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.floor(n);
  }, [moraDiasMinInput]);

  const {
    data: moraData,
    loading: loadingMora,
    error: errorMora,
  } = useMoraDetallada(undefined, undefined, undefined, moraDiasMin);

  type MoraRow = {
    key: string;
    nombre: string;
    estatus: string;
    diasEnMora: number;
    fechaApertura?: string;
    fechaVencimiento?: string;
    saldoCapital: number;
    intereses: number;
    mora: number;
  };

  const moraRows = useMemo((): MoraRow[] => {
    const groups = moraData?.porAsesor ?? [];
    const rows: MoraRow[] = [];
    const seen = new Set<string>();

    for (const g of groups) {
      for (const d of g.detalle ?? []) {
        const codigoKey = normalizeKey((d as MoraDetalleItem).codigoPrestamo);
        const prestamo = codigoKey ? prestamoByCodigo.get(codigoKey) : undefined;
        const dRec = d as unknown as Record<string, unknown>;

        const nombre =
          prestamo?.clienteNombre ||
          (prestamo?.clienteCodigo ? String(prestamo.clienteCodigo) : '') ||
          (d.cliente?.codigoCliente ? String(d.cliente.codigoCliente) : '') ||
          '—';

        const estatus = String(prestamo?.estadoPrestamo || 'MORA').toUpperCase() || 'MORA';
        const fechaApertura =
          prestamo?.fechaDesembolso ||
          (typeof dRec['fechaApertura'] === 'string' ? String(dRec['fechaApertura']) : undefined) ||
          (typeof dRec['fechaDesembolso'] === 'string' ? String(dRec['fechaDesembolso']) : undefined) ||
          undefined;

        const fechaVencimiento =
          (d as MoraDetalleItem).fechaVencimiento ||
          prestamo?.fechaVencimiento ||
          (typeof dRec['fechaVencimiento'] === 'string' ? String(dRec['fechaVencimiento']) : undefined) ||
          undefined;

        const diasEnMoraFromBackend = asNumber(
          dRec['diasEnMora'] ??
            dRec['diasMora'] ??
            dRec['dias_mora'] ??
            dRec['dias_en_mora']
        );
        const diasEnMora = Math.max(0, Math.floor(diasEnMoraFromBackend ?? daysFromToday(fechaVencimiento)));
        const saldoCapital =
          typeof (d as MoraDetalleItem).saldoCapital === 'number'
            ? (d as MoraDetalleItem).saldoCapital
            : (prestamo?.saldoCapital ?? 0);

        const intereses =
          asNumber(dRec['intereses'] ?? dRec['interes'] ?? dRec['totalInteres'] ?? dRec['totalIntereses']) ??
          (typeof prestamo?.totalIntereses === 'number' ? prestamo.totalIntereses : 0);

        const mora =
          typeof (d as MoraDetalleItem).totalMoraPlan === 'number' ? (d as MoraDetalleItem).totalMoraPlan : 0;

        const key = codigoKey || String((d as MoraDetalleItem).prestamoId || `${nombre}-${fechaVencimiento || ''}`);
        if (!key || seen.has(key)) continue;
        seen.add(key);

        rows.push({
          key,
          nombre,
          estatus,
          diasEnMora,
          fechaApertura,
          fechaVencimiento,
          saldoCapital,
          intereses,
          mora,
        });
      }
    }

    rows.sort((a, b) => b.diasEnMora - a.diasEnMora);
    return rows;
  }, [moraData?.porAsesor, prestamoByCodigo]);

  const moraTotales = useMemo(() => {
    return moraRows.reduce(
      (acc, r) => {
        return {
          saldoCapital: acc.saldoCapital + (Number.isFinite(r.saldoCapital) ? r.saldoCapital : 0),
          intereses: acc.intereses + (Number.isFinite(r.intereses) ? r.intereses : 0),
          mora: acc.mora + (Number.isFinite(r.mora) ? r.mora : 0),
        };
      },
      { saldoCapital: 0, intereses: 0, mora: 0 }
    );
  }, [moraRows]);

  const [codigoPrestamoInput, setCodigoPrestamoInput] = useState('');
  const [codigoPrestamoQuery, setCodigoPrestamoQuery] = useState('');
  const [estadoCuentaReloadKey, setEstadoCuentaReloadKey] = useState(0);

  const {
    data: prestamoDetalle,
    loading: loadingEstadoCuenta,
    error: errorEstadoCuenta,
  } = usePrestamoDetalle(codigoPrestamoQuery, estadoCuentaReloadKey);

  const amortizacionRows = useMemo(() => {
    const raw = Array.isArray(prestamoDetalle?.amortizacionPreview)
      ? prestamoDetalle.amortizacionPreview
      : [];

    return raw
      .map((item, index) => {
        if (!isRecord(item)) return null;

        const cuotaNumero =
          asNumber(item.numeroCuota) ?? asNumber(item.cuotaNumero) ?? asNumber(item.nroCuota) ?? index + 1;

        const interes = asNumber(item.interes) ?? 0;
        const capital = asNumber(item.capital) ?? 0;
        const cuota = asNumber(item.cuota) ?? capital + interes;
        const saldo = asNumber(item.saldoCapital) ?? asNumber(item.saldo) ?? 0;

        return {
          id: String(item._id ?? item.id ?? `cuota-${cuotaNumero}`),
          cuotaNumero,
          fechaProgramada: typeof item.fechaProgramada === 'string' ? item.fechaProgramada : undefined,
          interes,
          capital,
          cuota,
          saldo,
        };
      })
      .filter(
        (x): x is {
          id: string;
          cuotaNumero: number;
          fechaProgramada: string | undefined;
          interes: number;
          capital: number;
          cuota: number;
          saldo: number;
        } => x !== null
      )
      .sort((a, b) => a.cuotaNumero - b.cuotaNumero);
    }, [prestamoDetalle]);

  const handleConsultarEstadoCuenta = () => {
    const codigo = codigoPrestamoInput.trim();
    setCodigoPrestamoQuery(codigo);
    setEstadoCuentaReloadKey((k) => k + 1);
  };

  const handleSelectPrestamo = (codigoPrestamo: string) => {
    const codigo = String(codigoPrestamo || '').trim();
    if (!codigo) return;

    setCodigoPrestamoInput(codigo);
    setCodigoPrestamoQuery(codigo);
    setEstadoCuentaReloadKey((k) => k + 1);
    setTab('ESTADO_CUENTA');
  };

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
            <Chip size="small" label={`Mora cobrada: ${formatMoney(cuadre?.totales.totalMora ?? 0)}`} />
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
          <Tab value="MORA" label="Mora" />
          <Tab value="ESTADO_CUENTA" label="Estado de cuenta" />
        </Tabs>
      </Paper>

      {tab === 'INGRESOS' ? (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Ingresos (pagos)</Typography>
            <Chip size="small" label={`Registros: ${pagos.length}`} />
            <Chip size="small" label={`Total: ${formatMoney(totalIngresos)}`} />
            <Chip size="small" label={`Ingresos por mora: ${formatMoney(cuadre?.totales.totalMora ?? 0)}`} />
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map((p) => {
                  const codigoPrestamo = getCodigoPrestamoFromCajaPago(p);
                  const codigoKey = normalizeKey(codigoPrestamo);
                  const prestamo = codigoKey ? prestamoByCodigo.get(codigoKey) : undefined;
                  const cliente = `${getClienteCodigoFromCajaPago(p)} · ${getClienteIdentidadFromCajaPago(p)}`;
                  const nombreCliente = prestamo?.clienteNombre || getClienteNombreFromCajaPago(p);
                  const fecha = formatDate(p.fechaPago);
                  const metodo = String(p.metodoPago || '—');
                  const monto = typeof p.montoPago === 'number' ? p.montoPago : 0;

                  return (
                    <TableRow key={String(p._id || `${fecha}-${codigoPrestamo}-${metodo}-${monto}`)}>
                      <TableCell>{fecha}</TableCell>
                      <TableCell>{codigoPrestamo}</TableCell>
                      <TableCell>{cliente}</TableCell>
                      <TableCell>{nombreCliente}</TableCell>
                      <TableCell>{metodo}</TableCell>
                      <TableCell align="right">{formatMoney(monto)}</TableCell>
                    </TableRow>
                  );
                })}

                {!loadingPagos && pagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
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
                  <TableCell>Referencia</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gastos.map((g) => {
                  const fecha = formatDate(g.fechaGasto);
                  const tipo = String(g.tipoGasto || '—');
                  const desc = String(g.descripcion || '—');
                  const cobrador = String(g.codigoCobradorId || '—');
                  const referencia = String(g.codigoPrestamo || '').trim() || '—';
                  const codigoExtraido = extractCodigoPrestamo(`${referencia} ${desc}`);
                  const codigoCandidato =
                    (codigoExtraido && looksLikeCodigoPrestamo(codigoExtraido) ? codigoExtraido : undefined) ||
                    (referencia !== '—' && looksLikeCodigoPrestamo(referencia) ? referencia : undefined);

                  const codigoKey = normalizeKey(codigoCandidato || '');
                  const prestamo = codigoKey ? prestamoByCodigo.get(codigoKey) : undefined;
                  const codigoPrestamo = prestamo?.codigoPrestamo || codigoCandidato || '—';
                  const monto = typeof g.monto === 'number' ? g.monto : 0;

                  return (
                    <TableRow key={String(g._id || `${fecha}-${tipo}-${monto}-${cobrador}`)}>
                      <TableCell>{fecha}</TableCell>
                      <TableCell>{tipo}</TableCell>
                      <TableCell>{desc}</TableCell>
                      <TableCell>{cobrador}</TableCell>
                      <TableCell>
                        {codigoPrestamo !== '—' ? (
                          <Button
                            size="small"
                            variant="text"
                            sx={{ minWidth: 0, p: 0, textTransform: 'none' }}
                            onClick={() => handleSelectPrestamo(codigoPrestamo)}
                          >
                            {codigoPrestamo}
                          </Button>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{referencia}</TableCell>
                      <TableCell align="right">{formatMoney(monto)}</TableCell>
                    </TableRow>
                  );
                })}

                {!loadingGastos && gastos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2">Préstamos</Typography>
              <Chip size="small" label={`Registros: ${prestamosFiltrados.length}`} />
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
              <Typography variant="caption" color="text.secondary">Cargando préstamos…</Typography>
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
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prestamosFiltrados.map((p) => {
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
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleSelectPrestamo(p.codigoPrestamo)}
                        >
                          Estado de cuenta
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loadingPrestamos && prestamosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
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
              <Typography variant="caption" color="text.secondary">Cargando resumen…</Typography>
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
                    const nombre = a.asesor?.nombreCompleto || a.asesor?.usuario || a.asesor?.codigoUsuario || '—';
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

      {tab === 'MORA' ? (
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
              <Typography variant="subtitle2">Reporte de mora</Typography>
              <Chip size="small" label={`${moraRows.length} registros`} />
            </Box>

            <TextField
              size="small"
              label="Días en mora (mínimo)"
              type="number"
              value={moraDiasMinInput}
              onChange={(e) => setMoraDiasMinInput(e.target.value)}
              inputProps={{ min: 1 }}
              helperText={`Mostrando a partir de ${moraDiasMin} día(s)`}
            />
          </Box>

          {loadingMora ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">
                Cargando mora…
              </Typography>
            </Box>
          ) : null}
          {errorMora ? <Alert severity="error">{errorMora}</Alert> : null}

          {!loadingMora && !errorMora && moraRows.length === 0 ? (
            <Alert severity="success">No hay préstamos en mora para este filtro.</Alert>
          ) : null}

          {moraRows.length > 0 ? (
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="right">Días en mora</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell align="right">Saldo capital</TableCell>
                    <TableCell align="right">Intereses</TableCell>
                    <TableCell align="right">Mora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {moraRows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.estatus}</TableCell>
                      <TableCell align="right">{r.diasEnMora}</TableCell>
                      <TableCell>{formatDate(r.fechaApertura)}</TableCell>
                      <TableCell>{formatDate(r.fechaVencimiento)}</TableCell>
                      <TableCell align="right">{formatMoney(r.saldoCapital)}</TableCell>
                      <TableCell align="right">{formatMoney(r.intereses)}</TableCell>
                      <TableCell align="right">{formatMoney(r.mora)}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Totales</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatMoney(moraTotales.saldoCapital)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatMoney(moraTotales.intereses)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatMoney(moraTotales.mora)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Paper>
      ) : null}

      {tab === 'ESTADO_CUENTA' ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Estado de cuenta (préstamo)
          </Typography>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleConsultarEstadoCuenta();
            }}
            sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}
          >
            <TextField
              size="small"
              label="Código de préstamo"
              placeholder="Ej: P-2026-001"
              value={codigoPrestamoInput}
              onChange={(e) => setCodigoPrestamoInput(e.target.value)}
            />
            <Button variant="contained" type="submit">
              Consultar
            </Button>
          </Box>

          {loadingEstadoCuenta ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="caption" color="text.secondary">Cargando estado de cuenta…</Typography>
            </Box>
          ) : null}
          {errorEstadoCuenta ? <Alert severity="error">{errorEstadoCuenta}</Alert> : null}

          {prestamoDetalle ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography>{prestamoDetalle.cliente?.nombreCompleto || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(prestamoDetalle.cliente?.codigoCliente || '—') + ' · ' + (prestamoDetalle.cliente?.identidadCliente || '—')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Préstamo</Typography>
                  <Typography>{prestamoDetalle.codigoPrestamo}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estado: {String(prestamoDetalle.estadoPrestamo || '—').toUpperCase()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Capital</Typography>
                  <Typography>{formatMoney(prestamoDetalle.capitalSolicitado)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cuota: {formatMoney(prestamoDetalle.cuotaFija)} · Plazo: {prestamoDetalle.plazoCuotas}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">Saldo</Typography>
                  <Typography>{formatMoney(prestamoDetalle.saldo ?? prestamoDetalle.saldoPendiente ?? prestamoDetalle.saldoActual ?? 0)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Desembolso: {formatDate(prestamoDetalle.fechaDesembolso)} · Vence: {formatDate(prestamoDetalle.fechaVencimiento)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : null}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Plan de pagos / amortización
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cuota</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Interés</TableCell>
                  <TableCell align="right">Capital</TableCell>
                  <TableCell align="right">Cuota</TableCell>
                  <TableCell align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {amortizacionRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.cuotaNumero}</TableCell>
                    <TableCell>{formatDate(r.fechaProgramada)}</TableCell>
                    <TableCell align="right">{formatMoney(r.interes)}</TableCell>
                    <TableCell align="right">{formatMoney(r.capital)}</TableCell>
                    <TableCell align="right">{formatMoney(r.cuota)}</TableCell>
                    <TableCell align="right">{formatMoney(r.saldo)}</TableCell>
                  </TableRow>
                ))}

                {!loadingEstadoCuenta && codigoPrestamoQuery && amortizacionRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="caption" color="text.secondary">
                        No hay plan de pagos disponible para este préstamo.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!codigoPrestamoQuery ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="caption" color="text.secondary">
                        Ingresa un código de préstamo para consultar.
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
