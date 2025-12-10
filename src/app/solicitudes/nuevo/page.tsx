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
// import { apiFetch } from '../../../lib/api';
import { useClientes, ClienteResumen } from '../../../hooks/useClientes';
import { useCobradores, Cobrador } from '../../../hooks/useCobradores';
import { useTasasInteres, TasaInteres } from '../../../hooks/useTasasInteres';
import { useFrecuenciasPago, FrecuenciaPago } from '../../../hooks/useFrecuenciasPago';

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

  const { data: cobradores, loading: loadingCobradores } = useCobradores({
    busqueda: '',
    estado: 'ACTIVO',
    zona: '',
  });

  const { data: tasas, loading: loadingTasas } = useTasasInteres();
  const { data: frecuencias } = useFrecuenciasPago();

  const [selectedCliente, setSelectedCliente] = useState<ClienteResumen | null>(null);
  const [selectedCobrador, setSelectedCobrador] = useState<Cobrador | null>(null);
  const [selectedTasa, setSelectedTasa] = useState<TasaInteres | null>(null);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaPago | null>(null);

  // Etiquetas de opción
  const getClienteLabel = (c: ClienteResumen | null) => {
    if (!c) return '';
    // nombreCompleto ya viene armado del hook
    return [c.codigoCliente, c.nombreCompleto, c.identidadCliente]
      .filter(Boolean)
      .join(' • ');
  };

  const getCobradorLabel = (v: Cobrador | null) => {
    if (!v) return '';
    return [v.nombreCompleto, v.correo].filter(Boolean).join(' • ');
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
      const payload = {
        // Enviar IDs directos según el esquema
        // OJO: useClientes ya mapea id = _id del backend si existe
        clienteId: selectedCliente?.id,
        cobradorId: selectedCobrador?._id,
        capitalSolicitado: Number(form.capitalSolicitado),
        plazoCuotas: form.plazoCuotas ? Number(form.plazoCuotas) : null,
        finalidadCredito: form.finalidadCredito || null,
        fechaSolicitud: form.fechaSolicitud,
        observaciones: form.observaciones || '',
        tasInteresId: selectedTasa?._id || null,
        frecuenciaPagoId: selectedFrecuencia?._id || null,
        estadoSolicitud: 'REGISTRADA' as EstadoInicial,
      };

      // Backend deshabilitado: simular guardado
      console.log('Solicitud (simulada) enviada:', payload);

      setSnackbarSeverity('success');
      setSnackbarMsg('Solicitud registrada correctamente.');
      setSnackbarOpen(true);
      router.push('/solicitudes');
    } catch (err: unknown) {
      console.error(err);
      setSnackbarSeverity('error');
      setSnackbarMsg('Error al registrar la solicitud.');
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
                    setSelectedCobrador(val as Cobrador | null)
                  }
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : getCobradorLabel(option as Cobrador)
                  }
                  isOptionEqualToValue={(opt, val) =>
                    (opt as Cobrador)._id === (val as Cobrador)._id
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

              {/* Capital y plazo */}
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
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Plazo en cuotas"
                  name="plazoCuotas"
                  value={form.plazoCuotas}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: 'numeric' }}
                  placeholder="Opcional"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Finalidad del crédito"
                  name="finalidadCredito"
                  value={form.finalidadCredito}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="Crédito personal, capital de trabajo…"
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
