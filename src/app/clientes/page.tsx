// src/app/clientes/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { apiFetch } from '../../lib/api';
import CloseIcon from '@mui/icons-material/Close';
import { useClienteDetalle } from '../../hooks/useClienteDetalle';
import {
  useClientes,
  EstadoClienteFiltro,
} from '../../hooks/useClientes';

const ClientesPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoClienteFiltro>('TODOS');
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewerStep, setViewerStep] = useState(0);
  const [confirmCliente, setConfirmCliente] = useState<{
    id: string;
    codigo?: string;
    estado: boolean;
  } | null>(null);

  const { data, loading, error, refresh } = useClientes({ busqueda, estado });

  // Local override of actividad to simulate activate/deactivate without backend
  const [actividadOverrides, setActividadOverrides] = useState<Record<string, boolean>>({});

  const getActividad = (id: string, original: boolean) =>
    actividadOverrides[id] ?? original;

  const toggleActividad = (id: string, original: boolean) => {
    const current = actividadOverrides[id] ?? original;
    setActividadOverrides((prev) => ({ ...prev, [id]: !current }));
  };

  const handleOpenViewer = (codigoCliente: string) => {
    setViewerId(codigoCliente);
    setViewerStep(0);
  };

  const handleCloseViewer = () => {
    setViewerId(null);
    setViewerStep(0);
  };


  
  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setBusqueda(e.target.value);

  const handleEstadoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setEstado(e.target.value as EstadoClienteFiltro);

  const handleActivarDesactivar = async (
    id: string,
    codigoCliente: string | undefined,
    estado: boolean,
  ) => {
    try {
      // Llamada al backend para actualizar estado
      // Preferir `codigoCliente` en la URL si se proporciona (backend suele usar ese identificador),
      // en caso contrario, usar el _id interno.
      const identifier = codigoCliente ?? id;
      await apiFetch(`/clientes/activo/${identifier}`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });

      // Remover override optimista y recargar la lista desde el servidor
      setActividadOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        if (codigoCliente) delete next[codigoCliente];
        return next;
      });

      if (typeof refresh === 'function') await refresh();
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error);
    }
  };

  const renderActividadChip = (activo: boolean) => {
    return (
      <Chip
        size="small"
        label={activo ? 'ACTIVO' : 'INACTIVO'}
        color={activo ? 'success' : 'error'}
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Filtros y header */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, nombre, identidad…"
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Estado"
            value={estado}
            onChange={handleEstadoChange}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="ACTIVO">Activos</MenuItem>
            <MenuItem value="INACTIVO">Inactivos</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 5 }}
          sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}
        >
          <Button
            variant="contained"
            sx={{ borderRadius: 999, mt: { xs: 1, md: 0 } }}
            component={Link}
            href="/clientes/nuevo"
          >
            + Nuevo cliente
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando clientes…
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Listado de clientes</Typography>
          <Chip size="small" label={`Total: ${data.length}`} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Identidad</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.codigoCliente}</TableCell>
                    <TableCell>{c.nombreCompleto}</TableCell>
                    <TableCell>{c.identidadCliente || '—'}</TableCell>
                    <TableCell>{c.telefonoPrincipal || '—'}</TableCell>
                    <TableCell>{renderActividadChip(getActividad(c.id, c.actividad))}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button size="small" variant="text" onClick={() => handleOpenViewer(c.codigoCliente)}>Ver</Button>
                        <Button
                          size="small"
                          variant="text"
                          component={Link}
                          href={`/clientes/${c.codigoCliente}?edit=1`}
                          startIcon={<EditIcon fontSize="small" />}
                          aria-label="Editar"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          color={getActividad(c.id, c.actividad) ? "error" : "success"}
                          onClick={() => {
                            const nuevoEstado = !getActividad(c.id, c.actividad);
                            // Abrir confirmación para ambos casos (activar/desactivar)
                            setConfirmCliente({ id: c.id, codigo: c.codigoCliente, estado: nuevoEstado });
                          }}
                        >
                          {getActividad(c.id, c.actividad) ? "Desactivar" : "Activar"}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay clientes que cumplan con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Confirmación para activar/desactivar cliente */}
      <Dialog open={Boolean(confirmCliente)} onClose={() => setConfirmCliente(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmCliente?.estado === false
            ? '¿Desea desactivar este cliente?'
            : '¿Desea activar este cliente?'}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmCliente(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={confirmCliente?.estado === false ? 'error' : 'success'}
            onClick={async () => {
              if (confirmCliente) {
                await handleActivarDesactivar(confirmCliente.id, confirmCliente.codigo, confirmCliente.estado);
              }
              setConfirmCliente(null);
            }}
          >
            {confirmCliente?.estado === false ? 'Desactivar' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Viewer dialog (read-only client detail) */}
      <Dialog open={Boolean(viewerId)} onClose={handleCloseViewer} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Ver cliente</span>
          <IconButton size="small" onClick={handleCloseViewer} aria-label="Cerrar"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewerId ? <ClientViewer id={viewerId} step={viewerStep} onStepChange={setViewerStep} /> : null}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => setViewerStep((s) => Math.max(0, s - 1))} disabled={viewerStep === 0}>Anterior</Button> 
          <Button endIcon={<ArrowForwardIosIcon />} onClick={() => setViewerStep((s) => s + 1)} disabled={viewerStep === 3} >Siguiente</Button>
          <Button onClick={handleCloseViewer}>Cerrar</Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
};

function ClientViewer({ id, step, onStepChange }: { id: string; step: number; onStepChange: (n: number) => void }) {
  const { data, loading, error } = useClienteDetalle(id);
  const steps = ['Información Personal', 'Dirección y Cónyuge', 'Financieros', 'Referencias y Negocio'];

  // Estilos para TextField en modo visor: sin hover/focus en el borde,
  // pero permitiendo selección de texto con el mouse.
  const viewerTextFieldSx = {
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    // Línea inferior para separar campos
    pb: 0.5,
    borderBottom: '1px solid',
    borderColor: 'divider',
  } as const;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data) return <Typography>No encontrado</Typography>;

  const phoneList: string[] = Array.isArray(data.telefono) ? data.telefono : (data.telefono ? [String(data.telefono)] : []);

  const splitReferencia = (r: string) => {
    const parts = r.split(' - ');
    if (parts.length === 2) {
      const mName = parts[0].match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (mName) {
        return { nombre: mName[1].trim(), parentesco: mName[2].trim(), telefono: parts[1].trim() };
      }
      // Nuevo formato: "Parentesco - +504 99999999"
      return { nombre: '', parentesco: parts[0].trim(), telefono: parts[1].trim() };
    }
    return { nombre: '', parentesco: '', telefono: r.trim() };
  };

  const fotosDocs: string[] = Array.isArray((data as any).fotosDocs)
    ? (data as any).fotosDocs
    : Array.isArray((data as any).documentosFotos)
    ? (data as any).documentosFotos
    : [];

  const fotosNegocio: string[] = Array.isArray((data as any).fotosNegocio)
    ? (data as any).fotosNegocio
    : Array.isArray((data as any).negocioFotos)
    ? (data as any).negocioFotos
    : [];
  const fotosDireccion: string[] = Array.isArray((data as any).fotosDireccion)
    ? (data as any).fotosDireccion
    : Array.isArray((data as any).direccionFotos)
    ? (data as any).direccionFotos
    : [];
  const fotosDireccionConyuge: string[] = Array.isArray((data as any).fotosDireccionConyuge)
    ? (data as any).fotosDireccionConyuge
    : Array.isArray((data as any).conyugeDireccionFotos)
    ? (data as any).conyugeDireccionFotos
    : [];

  const formatDateOnly = (value: unknown) => {
    if (!value) return '—';
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (str.includes('T')) return str.split('T')[0];
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return str;
  };

  return (
    <Box>
      <Stepper activeStep={step} alternativeLabel>
        {steps.map((s) => (
          <Step key={s}><StepLabel>{s}</StepLabel></Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {step === 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Código" value={data.codigoCliente || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Nombre completo" value={data.nombreCompleto || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Identidad" value={data.identidadCliente || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Nacionalidad" value={data.nacionalidad || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="RTN" value={(data as any).RTN || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Email" value={data.email || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Sexo" value={data.sexo || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Fecha de nacimiento" value={formatDateOnly(data.fechaNacimiento)} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />

            {/* Teléfonos dinámicos */}
            {phoneList.length > 0 ? (
              phoneList.map((p, i) => (
                <TextField
                  key={`phone-${i}`}
                  label={`Teléfono ${i + 1}`}
                  value={p}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  sx={viewerTextFieldSx}
                />
              ))
            ) : (
              <TextField label="Teléfono" value={'—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            )}
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Departamento" value={data.departamentoResidencia || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Municipio" value={data.municipioResidencia || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Zona residencial" value={data.zonaResidencialCliente || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Dirección" value={data.direccion || '—'} InputProps={{ readOnly: true }} margin="normal" fullWidth sx={{ gridColumn: { xs: '1', sm: '1 / span 2' }, ...viewerTextFieldSx }} />
            <TextField label="Nombre del cónyuge" value={data.conyugeNombre || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Teléfono del cónyuge" value={data.conyugeTelefono || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Límite de crédito" value={String(data.limiteCredito ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Venta diaria" value={String((data as any).ventaDiaria ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Capacidad de pago" value={String((data as any).capacidadPago ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Parentesco del propietario" value={String((data as any).parentescoPropietario ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Estado de deuda" value={data.riesgoMora || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            <TextField label="Cliente activo" value={data.actividad === false ? 'INACTIVO' : 'ACTIVO'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 2 }}>
            {/* Referencias: mostrar parentesco + teléfono por referencia */}
            <Box>
              <Typography variant="subtitle2">Referencias</Typography>
              {(Array.isArray(data.referencias) ? data.referencias : []).map((r: string, i: number) => {
                const s = splitReferencia(r);
                return (
                  <Box key={`ref-${i}`} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField label={`Parentesco ${i + 1}`} value={s.parentesco || '—'} InputProps={{ readOnly: true }} size="small" sx={{ minWidth: 200, ...viewerTextFieldSx }} />
                    <TextField label={`Teléfono referencia ${i + 1}`} value={s.telefono || '—'} InputProps={{ readOnly: true }} size="small" sx={{ flex: 1, ...viewerTextFieldSx }} />
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2">Datos del negocio</Typography>
              <TextField label="Nombre del negocio" value={data.negocioNombre || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Tipo" value={data.negocioTipo || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Teléfono negocio" value={data.negocioTelefono || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Departamento" value={data.negocioDepartamento || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Municipio" value={data.negocioMunicipio || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Zona" value={data.negocioZonaResidencial || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Parentesco del propietario" value={String((data as any).parentescoPropietario ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Teléfono del pariente (negocio)" value={(data as any).negocioParentescoTelefono || '—'} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Venta diaria" value={String((data as any).ventaDiaria ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
              <TextField label="Capacidad de pago" value={String((data as any).capacidadPago ?? '—')} InputProps={{ readOnly: true }} margin="normal" sx={viewerTextFieldSx} />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2">Fotografías de documentos</Typography>
              {fotosDocs.length > 0 ? (
                fotosDocs.map((f, idx) => (
                  <Typography key={`doc-${idx}`} variant="body2">{f}</Typography>
                ))
              ) : (
                <Typography variant="body2">—</Typography>
              )}

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Foto(s) de dirección</Typography>
              {fotosDireccion.length > 0 ? (
                fotosDireccion.map((f, idx) => (
                  <Typography key={`dir-${idx}`} variant="body2">{f}</Typography>
                ))
              ) : (
                <Typography variant="body2">—</Typography>
              )}

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Foto(s) de dirección del cónyuge</Typography>
              {fotosDireccionConyuge.length > 0 ? (
                fotosDireccionConyuge.map((f, idx) => (
                  <Typography key={`dirc-${idx}`} variant="body2">{f}</Typography>
                ))
              ) : (
                <Typography variant="body2">—</Typography>
              )}

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Fotografías del negocio</Typography>
              {fotosNegocio.length > 0 ? (
                fotosNegocio.map((f, idx) => (
                  <Typography key={`neg-${idx}`} variant="body2">{f}</Typography>
                ))
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ClientesPage;
