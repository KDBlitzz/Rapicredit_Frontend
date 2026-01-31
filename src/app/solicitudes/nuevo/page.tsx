'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Snackbar,
  Alert,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { useClientes, ClienteResumen } from '../../../hooks/useClientes';
import { useEmpleados, Empleado } from '../../../hooks/useEmpleados';
import { useTasasInteres, TasaInteres } from '../../../hooks/useTasasInteres';
import { useFrecuenciasPago, FrecuenciaPago } from '../../../hooks/useFrecuenciasPago';
import { useClienteDetalle } from '../../../hooks/useClienteDetalle';

type EstadoInicial = 'REGISTRADA';

const NuevoSolicitudPage: React.FC = () => {
  const router = useRouter();

  const hoy = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    capitalSolicitado: '',
    plazoCuotas: '',
    finalidadCredito: '',
    fechaSolicitud: hoy,
    observaciones: '',
  });

  // Cargar opciones de clientes y cobradores
  const { data: clientes, loading: loadingClientes } = useClientes({
    busqueda: '',
    estado: 'ACTIVO',
  });

  const { data: cobradores, loading: loadingCobradores } = useEmpleados({
    busqueda: '',
    estado: 'ACTIVO',
    rol: '',
  });

  const { data: tasas, loading: loadingTasas } = useTasasInteres();
  const { data: frecuencias } = useFrecuenciasPago();

  const [selectedCliente, setSelectedCliente] = useState<ClienteResumen | null>(null);
  const [selectedCobrador, setSelectedCobrador] = useState<Empleado | null>(null);
  const [selectedTasa, setSelectedTasa] = useState<TasaInteres | null>(null);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaPago | null>(null);

  // Detalle del cliente seleccionado para completar datos adicionales
  // Usa codigoCliente porque el backend busca por código, no por ObjectId
  const selectedClienteCodigo = selectedCliente?.codigoCliente || '';
  const { data: clienteDetalle } = useClienteDetalle(selectedClienteCodigo);

  // Generador local de códigos estilo S001, S002… (persistido en localStorage)
  const nextCodigoSolicitud = () => {
    try {
      if (typeof window !== 'undefined') {
        const key = 'solicitudes_seq';
        const prev = parseInt(window.localStorage.getItem(key) || '0', 10);
        const next = Number.isFinite(prev) ? prev + 1 : 1;
        window.localStorage.setItem(key, String(next));
        return `SOL-${String(next).padStart(3, '0')}`;
      }
    } catch {}
    // Fallback si localStorage no está disponible
    const rnd = Math.floor(Math.random() * 999) + 1;
    return `SOL-${String(rnd).padStart(3, '0')}`;
  };

  // Resolver el ObjectId de Mongo del empleado (vendedor/usuario creador)
  const isMongoObjectId = (v?: string | null) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
  const resolveEmpleadoMongoId = async (emp: Empleado | null): Promise<string | null> => {
    if (!emp) return null;
    // If already a 24-hex, use it directly
    if (isMongoObjectId(emp._id)) return emp._id;

    const code = emp.codigoUsuario || emp.usuario || null;
    if (!code) return null;

    // Try to fetch full list of empleados and find matching record to get real _id
    const listCandidates = [`/empleados/codigos`, `/empleados`];
    for (const ep of listCandidates) {
      try {
        const res: any = await apiFetch<any>(ep);

        let all: any[] = [];
        if (Array.isArray(res)) {
          all = res;
        } else if (res && (Array.isArray(res.activos) || Array.isArray(res.inactivos))) {
          all = [
            ...(Array.isArray(res.activos) ? res.activos : []),
            ...(Array.isArray(res.inactivos) ? res.inactivos : []),
          ];
        } else if (typeof res === 'object' && res !== null) {
          all = Object.values(res).flat().filter(Boolean) as any[];
        }

        const match = all.find((a: any) => {
          const c = a.codigoUsuario ?? a.usuario ?? a._id ?? a.id ?? '';
          return String(c) === String(code);
        }) || all.find((a: any) => String(a._id ?? a.id ?? '') === String(emp._id));

        const mongoId = String(match?._id ?? match?.id ?? '');
        if (isMongoObjectId(mongoId)) return mongoId;
      } catch {
        // continue to next candidate
      }
    }

    // As a last attempt, try common detail endpoints by code
    const detailCandidates = [
      `/empleados/codigo/${code}`,
      `/empleados/by-codigo/${code}`,
      `/empleados/${code}`,
    ];
    for (const ep of detailCandidates) {
      try {
        const res: any = await apiFetch<any>(ep);
        const mongoId = String(res?._id ?? res?.id ?? '');
        if (isMongoObjectId(mongoId)) return mongoId;
      } catch {
        // ignore and continue
      }
    }

    return null;
  };

  // Etiquetas de opción
  const getClienteLabel = (c: ClienteResumen | null) => {
    if (!c) return '';
    return [c.codigoCliente, c.nombreCompleto, c.identidadCliente]
      .filter(Boolean)
      .join(' • ');
  };

  const getCobradorLabel = (v: Empleado | null) => {
    if (!v) return '';
    return [v.codigoUsuario, v.nombreCompleto].filter(Boolean).join(' • ');
  };

  const getTasaLabel = (t: TasaInteres | null) => {
    if (!t) return '';
    const pct = t.porcentajeInteres != null ? `${t.porcentajeInteres}%` : undefined;
    return pct ? `${t.nombre} - ${pct}` : t.nombre;
  };

  const getFrecuenciaLabel = (f: FrecuenciaPago | null) => {
    if (!f) return '';
    return [f.nombre, f.dias != null ? `${f.dias} días` : undefined]
      .filter(Boolean)
      .join(' • ');
  };

  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<'success' | 'error'>('success');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!selectedCliente?.id) {
      setSnackbarSeverity('error');
      setSnackbarMsg('Debes seleccionar un cliente.');
      setSnackbarOpen(true);
      return false;
    }

    if (!selectedCobrador?._id) {
      setSnackbarSeverity('error');
      setSnackbarMsg('Debes seleccionar un cobrador.');
      setSnackbarOpen(true);
      return false;
    }

    if (!form.capitalSolicitado.trim() || Number(form.capitalSolicitado) <= 0) {
      setSnackbarSeverity('error');
      setSnackbarMsg('El capital solicitado debe ser mayor a cero.');
      setSnackbarOpen(true);
      return false;
    }

    if (!selectedTasa?._id) {
      setSnackbarSeverity('error');
      setSnackbarMsg('Debes seleccionar una tasa de interés.');
      setSnackbarOpen(true);
      return false;
    }

    if (!selectedFrecuencia?._id) {
      setSnackbarSeverity('error');
      setSnackbarMsg('Debes seleccionar una frecuencia de pago.');
      setSnackbarOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      // Mapear la frecuencia (Días/Semanas/Quincenas/Meses) al enum del backend
      const frecuenciaEnum = (() => {
        const nombre = selectedFrecuencia?.nombre;
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

      // Completar datos extra desde el cliente
      const datosNegocio = clienteDetalle
        ? {
            nombre: clienteDetalle.negocioNombre || undefined,
            tipo: clienteDetalle.negocioTipo || undefined,
            telefono: clienteDetalle.negocioTelefono || undefined,
            direccion: clienteDetalle.negocioDireccion || undefined,
            departamento: clienteDetalle.negocioDepartamento || undefined,
            municipio: clienteDetalle.negocioMunicipio || undefined,
            zonaResidencial: clienteDetalle.negocioZonaResidencial || undefined,
            fotos: clienteDetalle.negocioFotos || undefined,
          }
        : {};

      const datosConyuge = clienteDetalle
        ? {
            nombre: clienteDetalle.conyugeNombre || undefined,
            telefono: clienteDetalle.conyugeTelefono || undefined,
          }
        : {};

      const referenciasPersonales = clienteDetalle?.referencias
        ? clienteDetalle.referencias.map((r) => ({ referencia: r }))
        : [];

      // Generar código estilo S001 usando secuencia local
      const codigoSolicitud = nextCodigoSolicitud();

      // Resolver IDs de vendedor/usuario creador como ObjectId
      const vendedorMongoId = await resolveEmpleadoMongoId(selectedCobrador);
      if (!vendedorMongoId) {
        throw new Error('No se pudo resolver el ID de vendedor (ObjectId).');
      }

      const payload = {
        codigoSolicitud,
        clienteId: selectedCliente?.id,
        vendedorId: vendedorMongoId,

        capitalSolicitado: Number(form.capitalSolicitado),
        tasInteresId: selectedTasa?._id || null,
        // Algunos controladores exigen el valor numérico además del id
        tasaInteres: selectedTasa?.porcentajeInteres ?? undefined,
        frecuenciaPago: frecuenciaEnum,
        plazoCuotas: form.plazoCuotas ? Number(form.plazoCuotas) : 1,

        fechaSolicitud: form.fechaSolicitud,
        finalidadCredito: form.finalidadCredito || 'Sin especificar',

        datosNegocio,
        datosConyuge,
        referenciasPersonales,
        garantias: [],

        estadoSolicitud: 'REGISTRADA' as EstadoInicial,
        observaciones: form.observaciones || '',
        // Usuario creador igual al vendedor seleccionado (hasta tener auth real)
        usuarioCreacionId: vendedorMongoId,
      };

      await apiFetch<any>('/solicitudes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSnackbarSeverity('success');
      setSnackbarMsg('Solicitud registrada correctamente.');
      setSnackbarOpen(true);
      router.push('/solicitudes');
    } catch (err: unknown) {
      console.error(err);
      setSnackbarSeverity('error');
      const msg = err instanceof Error ? err.message : 'Error al registrar la solicitud.';
      setSnackbarMsg(msg);
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/solicitudes');
  };

  const handleCloseSnackbar = (
    _: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  return (
    <>
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
            <Typography variant="h6">Nueva solicitud</Typography>
            <Typography variant="caption" color="text.secondary">
              Registra la solicitud de crédito antes de generar un préstamo.
            </Typography>
          </Box>
        </Box>

        {/* Formulario */}
        <Paper sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Grid container spacing={2}>
              {/* Cliente y cobrador */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  options={clientes}
                  loading={loadingClientes}
                  value={selectedCliente}
                  onChange={(_, val) =>
                    setSelectedCliente(val as ClienteResumen | null)
                  }
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : getClienteLabel(option as ClienteResumen)
                  }
                  isOptionEqualToValue={(opt, val) =>
                    (opt as ClienteResumen).id === (val as ClienteResumen).id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      placeholder="Buscar cliente…"
                      required
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  size="small"
                  options={cobradores}
                  loading={loadingCobradores}
                  value={selectedCobrador as unknown}
                  onChange={(_, val) =>
                    setSelectedCobrador(val as Empleado | null)
                  }
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : getCobradorLabel(option as Empleado)
                  }
                  isOptionEqualToValue={(opt, val) =>
                    (opt as Empleado)._id === (val as Empleado)._id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cobrador"
                      placeholder="Buscar cobrador…"
                      required
                    />
                  )}
                />
              </Grid>

              {/* Capital */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Capital solicitado"
                  name="capitalSolicitado"
                  value={form.capitalSolicitado}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: 'decimal' }}
                  required
                />
              </Grid>

              {/* Fecha y comentario */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Fecha de solicitud"
                  type="date"
                  name="fechaSolicitud"
                  value={form.fechaSolicitud}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Observaciones (opcional)"
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  placeholder="Notas internas sobre la solicitud…"
                />
              </Grid>
            </Grid>

            {/* Parámetros financieros (combobox) */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Parámetros financieros
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      size="small"
                      options={tasas}
                      loading={loadingTasas}
                      value={selectedTasa as any}
                      onChange={(_, val) =>
                        setSelectedTasa(val as TasaInteres | null)
                      }
                      getOptionLabel={(option) =>
                        typeof option === 'string'
                          ? option
                          : getTasaLabel(option as TasaInteres)
                      }
                      isOptionEqualToValue={(opt, val) =>
                        (opt as TasaInteres)._id ===
                        (val as TasaInteres)._id
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tasa de interés"
                          placeholder="Selecciona tasa…"
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      size="small"
                      options={frecuencias}
                      value={selectedFrecuencia as any}
                      onChange={(_, val) =>
                        setSelectedFrecuencia(val as FrecuenciaPago | null)
                      }
                      getOptionLabel={(option) =>
                        typeof option === 'string'
                          ? option
                          : getFrecuenciaLabel(option as FrecuenciaPago)
                      }
                      isOptionEqualToValue={(opt, val) =>
                        (opt as FrecuenciaPago)._id ===
                        (val as FrecuenciaPago)._id
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Frecuencia de pago"
                          placeholder="Selecciona frecuencia…"
                          required
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Botones */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                mt: 1,
              }}
            >
              <Button onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar solicitud'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NuevoSolicitudPage;
