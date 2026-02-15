'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { useTasasInteres, TasaInteres } from '../../../hooks/useTasasInteres';
import { useFrecuenciasPago, FrecuenciaPago } from '../../../hooks/useFrecuenciasPago';

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null;

const asString = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v;
  if (v == null) return undefined;
  return String(v);
};

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

interface SolicitudHistorialItem {
  id: string;
  fecha?: string;
  accion: string;
  usuario?: string;
  comentario?: string;
}

interface SolicitudDetalle {
  id: string;
  codigoSolicitud: string;
  fechaSolicitud?: string;
  capitalSolicitado?: number;   // mapeamos también montoSolicitado
  plazoCuotas?: number | null;  // mapeamos también plazoMeses
  finalidadCredito?: string | null; // mapeamos también producto
  estadoSolicitud: string;
  observaciones?: string | null; // mapeamos también comentario
  historial?: SolicitudHistorialItem[];
  vendedorId?: string | null;
  frecuenciaPago?: string | null;
  tasaInteresId?: string | null;
  tasaInteresNombre?: string | null;
}

const SolicitudDetallePage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const searchParams = useSearchParams();

  const initialEditMode = useMemo(() => {
    const v = (searchParams?.get('edit') || '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }, [searchParams]);

  const [data, setData] = useState<SolicitudDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [editMode, setEditMode] = useState<boolean>(initialEditMode);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    capitalSolicitado: '',
    plazoCuotas: '',
    finalidadCredito: '',
    observaciones: '',
    fechaSolicitud: '',
  });

  const { data: tasas } = useTasasInteres();
  const { data: frecuencias } = useFrecuenciasPago();

  const [selectedTasa, setSelectedTasa] = useState<TasaInteres | null>(null);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaPago | null>(null);

  const tasaOptions = useMemo(() => {
    if (!selectedTasa?._id) return tasas;
    const exists = tasas.some((t) => String(t._id) === String(selectedTasa._id));
    return exists ? tasas : [selectedTasa, ...tasas];
  }, [tasas, selectedTasa]);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : 'L. 0.00';

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

  const renderEstadoChip = (estado: string) => {
    const val = (estado || '').toUpperCase();
    let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'info';

    if (val === 'REGISTRADA') color = 'info';
    else if (val === 'EN_REVISION') color = 'warning';
    else if (val === 'APROBADA') color = 'success';
    else if (val === 'RECHAZADA') color = 'error';

    return (
      <Chip size="small" label={val || '—'} color={color} variant="outlined" />
    );
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<unknown>(`/solicitudes/${id}`);

        if (cancelled || !res) return;
        if (!isRecord(res)) throw new Error('Respuesta inválida del servidor');

        const rawHist = res['historial'];
        const historial: SolicitudHistorialItem[] = Array.isArray(rawHist)
          ? rawHist.map((h: unknown, idx: number) => {
              const ho = isRecord(h) ? h : ({} as UnknownRecord);
              return {
                id: String(ho['id'] ?? ho['_id'] ?? idx),
                fecha: asString(ho['fecha']),
                accion: String(ho['accion'] ?? ''),
                usuario: asString(ho['usuario']),
                comentario: asString(ho['comentario']),
              };
            })
          : [];

        const detalle: SolicitudDetalle = {
          id: String(res['_id'] ?? res['id'] ?? id),
          codigoSolicitud: String(res['codigoSolicitud'] ?? ''),
          fechaSolicitud: asString(res['fechaSolicitud']),

          // Soporta tanto los nombres viejos como los nuevos
          capitalSolicitado:
            asNumber(res['capitalSolicitado']) ?? asNumber(res['montoSolicitado']) ?? 0,
          plazoCuotas: (asNumber(res['plazoCuotas']) ?? asNumber(res['plazoMeses']) ?? null) as number | null,
          finalidadCredito: asString(res['finalidadCredito']) ?? asString(res['producto']) ?? null,
          estadoSolicitud: String(res['estadoSolicitud'] ?? res['estado'] ?? 'REGISTRADA'),
          observaciones: asString(res['observaciones']) ?? asString(res['comentario']) ?? null,
          historial,
          vendedorId: String(res['vendedorId'] ?? res['cobradorId'] ?? '') || null,
          frecuenciaPago: asString(res['frecuenciaPago']) ?? null,
          tasaInteresId: (() => {
            const raw = res['tasaInteresId'] ?? res['tasInteresId'];
            if (isRecord(raw)) return asString(raw['_id'] ?? raw['id'] ?? raw['codigoTasa']) ?? null;
            return asString(raw) ?? null;
          })(),
          tasaInteresNombre: (() => {
            const raw = res['tasaInteresId'] ?? res['tasInteresId'];
            if (!isRecord(raw)) return null;
            return asString(raw['nombre']) ?? null;
          })(),
        };

        if (!cancelled) {
          setData(detalle);
        }
      } catch (err: unknown) {
        console.error('Error cargando solicitud:', err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar la solicitud.';
          setError(msg);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  useEffect(() => {
    if (!data) return;
    const dateValue = (() => {
      const raw = data.fechaSolicitud;
      if (!raw) return '';
      try {
        // raw normalmente viene como ISO; para input date necesitamos YYYY-MM-DD
        const iso = typeof raw === 'string' ? raw : String(raw);
        return iso.length >= 10 ? iso.slice(0, 10) : '';
      } catch {
        return '';
      }
    })();

    setForm({
      capitalSolicitado: data.capitalSolicitado != null ? String(data.capitalSolicitado) : '',
      plazoCuotas: data.plazoCuotas != null ? String(data.plazoCuotas) : '',
      finalidadCredito: data.finalidadCredito ? String(data.finalidadCredito) : '',
      observaciones: data.observaciones ? String(data.observaciones) : '',
      fechaSolicitud: dateValue,
    });

    if (data.tasaInteresId) {
      const match = tasas.find(
        (t) => String(t._id) === String(data.tasaInteresId) || String(t.codigoTasa ?? '') === String(data.tasaInteresId)
      );

      const next: TasaInteres =
        match ??
        ({
          _id: data.tasaInteresId,
          nombre: data.tasaInteresNombre ?? 'Tasa actual',
        } as TasaInteres);

      setSelectedTasa((prev) => {
        if (prev && String(prev._id) === String(next._id)) return prev;
        return next;
      });
    }
    if (data.frecuenciaPago) {
      const fromEnum = (() => {
        const v = String(data.frecuenciaPago).toUpperCase();
        if (v === 'DIARIO') return 'Días';
        if (v === 'SEMANAL') return 'Semanas';
        if (v === 'QUINCENAL') return 'Quincenas';
        if (v === 'MENSUAL') return 'Meses';
        return data.frecuenciaPago;
      })();

      const match = frecuencias.find((f) => String(f.nombre) === String(fromEnum));
      setSelectedFrecuencia(match ?? null);
    }
  }, [data, tasas, frecuencias]);

  const onChangeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCancelEdit = () => {
    if (saving) return;
    setEditMode(false);
    // reset al estado actual
    if (data) {
      const dateValue = data.fechaSolicitud ? String(data.fechaSolicitud).slice(0, 10) : '';
      setForm({
        capitalSolicitado: data.capitalSolicitado != null ? String(data.capitalSolicitado) : '',
        plazoCuotas: data.plazoCuotas != null ? String(data.plazoCuotas) : '',
        finalidadCredito: data.finalidadCredito ? String(data.finalidadCredito) : '',
        observaciones: data.observaciones ? String(data.observaciones) : '',
        fechaSolicitud: dateValue,
      });
    }
  };

  const onSave = async () => {
    if (!data) return;
    const codigo = data.codigoSolicitud || id;
    if (!codigo) return;

    const toFiniteNumber = (v: string): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const payload: Record<string, unknown> = {};
    if (form.capitalSolicitado.trim() !== '') {
      const n = toFiniteNumber(form.capitalSolicitado);
      if (n == null || n <= 0) {
        setToastSeverity('error');
        setToastMessage('El capital solicitado debe ser mayor a cero.');
        setToastOpen(true);
        return;
      }
      payload.capitalSolicitado = n;
    }

    payload.observaciones = form.observaciones ?? '';
    if (form.fechaSolicitud) payload.fechaSolicitud = form.fechaSolicitud;

    // Tasa y frecuencia
    if (!selectedTasa || !selectedTasa._id) {
      setToastSeverity('error');
      setToastMessage('Debes seleccionar una tasa de interés.');
      setToastOpen(true);
      return;
    }

    // Validación capital dentro del rango min/max de la tasa
    const capital = toFiniteNumber(form.capitalSolicitado);
    if (capital != null) {
      const min = Number(selectedTasa.capitalMin);
      const max = Number(selectedTasa.capitalMax);
      const hasMin = Number.isFinite(min) && min > 0;
      const hasMax = Number.isFinite(max) && max > 0;

      if (hasMin && capital < min) {
        setToastSeverity('error');
        setToastMessage(
          `El capital solicitado no puede ser menor a L. ${min.toLocaleString('es-HN', { minimumFractionDigits: 2 })} según la tasa seleccionada.`
        );
        setToastOpen(true);
        return;
      }
      if (hasMax && capital > max) {
        setToastSeverity('error');
        setToastMessage(
          `El capital solicitado no puede ser mayor a L. ${max.toLocaleString('es-HN', { minimumFractionDigits: 2 })} según la tasa seleccionada.`
        );
        setToastOpen(true);
        return;
      }
    }

    payload.tasaInteresId = selectedTasa._id;
    payload.tasInteresId = selectedTasa._id;
    const pct = selectedTasa.porcentajeInteres;
    if (pct != null) payload.tasaInteres = pct;

    if (!selectedFrecuencia || !selectedFrecuencia.nombre) {
      setToastSeverity('error');
      setToastMessage('Debes seleccionar una frecuencia de pago.');
      setToastOpen(true);
      return;
    }
    const nombre = selectedFrecuencia.nombre;
    const frecuenciaEnum = (() => {
      switch (nombre) {
        case 'Días':
          return 'DIARIO';
        case 'Semanas':
          return 'SEMANAL';
        case 'Quincenas':
          return 'QUINCENAL';
        case 'Meses':
          return 'MENSUAL';
        default:
          return null;
      }
    })();
    if (!frecuenciaEnum) {
      setToastSeverity('error');
      setToastMessage('Frecuencia de pago inválida.');
      setToastOpen(true);
      return;
    }
    payload.frecuenciaPago = frecuenciaEnum;

    setSaving(true);
    try {
      await apiFetch(`/solicitudes/${encodeURIComponent(codigo)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setToastSeverity('success');
      setToastMessage('Solicitud actualizada.');
      setToastOpen(true);
      setEditMode(false);
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity('error');
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar la solicitud.';
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">
          No se pudo cargar la información de la solicitud.
        </Typography>
      </Box>
    );
  }

  const {
    codigoSolicitud,
    fechaSolicitud,
    capitalSolicitado,
    estadoSolicitud,
    observaciones,
  } = data;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6">
            Solicitud {codigoSolicitud || ''}
          </Typography>
          <Box
            sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}
          >
            {renderEstadoChip(estadoSolicitud)}
            <Typography variant="caption" color="text.secondary">
              Fecha: {formatDate(fechaSolicitud)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {editMode ? (
            <>
              <Button size="small" variant="contained" onClick={onSave} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button size="small" variant="contained" onClick={() => setEditMode(true)}>
              Editar
            </Button>
          )}

          <Button size="small" variant="outlined" component={Link} href="/solicitudes">
            Volver a lista
          </Button>
        </Box>
      </Box>

      {/* Datos principales */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos de la solicitud
            </Typography>
            <Grid container spacing={1}>
              {/* Cliente y cobrador */}
              {editMode && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Fecha de solicitud"
                      type="date"
                      name="fechaSolicitud"
                      value={form.fechaSolicitud}
                      onChange={onChangeForm}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                {editMode ? (
                  <TextField
                    label="Capital solicitado"
                    fullWidth
                    size="small"
                    type="number"
                    name="capitalSolicitado"
                    value={form.capitalSolicitado}
                    onChange={onChangeForm}
                    inputProps={{ inputMode: 'decimal', step: '0.01' }}
                  />
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Capital solicitado
                    </Typography>
                    <Typography>{formatMoney(capitalSolicitado)}</Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Observaciones
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    name="observaciones"
                    value={form.observaciones}
                    onChange={onChangeForm}
                    placeholder="Observaciones"
                  />
                ) : (
                  <Typography>{observaciones || '—'}</Typography>
                )}
              </Grid>
              {editMode && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Parámetros financieros</Typography>
                </Grid>
              )}
              {editMode && (
                <>
                  {/* Tasa y frecuencia como selects simples por ahora */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Tasa de interés"
                      value={selectedTasa?._id ?? ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        const match = tasaOptions.find((t) => String(t._id) === String(id));
                        setSelectedTasa(match ?? null);
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Selecciona una tasa</em>
                      </MenuItem>
                      {tasaOptions.map((t) => (
                        <MenuItem key={String(t._id)} value={String(t._id)}>
                          {t.nombre} {t.porcentajeInteres != null ? `- ${t.porcentajeInteres}%` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Frecuencia de pago"
                      value={selectedFrecuencia?.nombre ?? ''}
                      onChange={(e) => {
                        const nombre = e.target.value;
                        const match = frecuencias.find((f) => String(f.nombre) === String(nombre));
                        setSelectedFrecuencia(match ?? null);
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Selecciona una frecuencia</em>
                      </MenuItem>
                      {frecuencias.map((f) => (
                        <MenuItem key={String(f._id)} value={String(f.nombre)}>
                          {String(f.nombre)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>

      </Grid>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SolicitudDetallePage;
