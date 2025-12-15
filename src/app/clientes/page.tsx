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

  const { data, loading, error } = useClientes({ busqueda, estado });

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
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, nombre, identidad…"
            value={busqueda}
            onChange={handleBusquedaChange}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
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

        <Grid size={{ xs: 12, sm: 12, md: 5 }}
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
                <TableCell>Departamento</TableCell>
                <TableCell>Municipio</TableCell>
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
                    <TableCell>{c.departamentoResidencia || '—'}</TableCell>
                    <TableCell>{c.municipioResidencia || '—'}</TableCell>
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
                          color={getActividad(c.id, c.actividad) ? 'error' : 'success'}
                          onClick={() => toggleActividad(c.id, c.actividad)}
                        >
                          {getActividad(c.id, c.actividad) ? 'Desactivar' : 'Activar'}
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
          <Button endIcon={<ArrowForwardIosIcon />} onClick={() => setViewerStep((s) => s + 1)}>Siguiente</Button>
          <Button onClick={handleCloseViewer}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function ClientViewer({ id, step, onStepChange }: { id: string; step: number; onStepChange: (n: number) => void }) {
  const { data, loading, error } = useClienteDetalle(id);
  const steps = ['Información Personal', 'Dirección y Cónyuge', 'Financieros', 'Referencias y Negocio'];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data) return <Typography>No encontrado</Typography>;

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
            <TextField label="Código" value={data.codigoCliente || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Nombre completo" value={data.nombreCompleto || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Identidad" value={data.identidadCliente || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Email" value={data.email || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Sexo" value={data.sexo || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Fecha de nacimiento" value={data.fechaNacimiento || '—'} InputProps={{ readOnly: true }} margin="normal" />
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Departamento" value={data.departamentoResidencia || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Municipio" value={data.municipioResidencia || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Zona residencial" value={data.zonaResidencialCliente || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Dirección" value={data.direccion || '—'} InputProps={{ readOnly: true }} margin="normal" fullWidth sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }} />
            <TextField label="Nombre del cónyuge" value={data.conyugeNombre || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Teléfono del cónyuge" value={data.conyugeTelefono || '—'} InputProps={{ readOnly: true }} margin="normal" />
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Límite de crédito" value={String(data.limiteCredito ?? '—')} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Tasa (%)" value={String(data.tasaCliente ?? '—')} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Frecuencia" value={data.frecuenciaPago || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Estado de deuda" value={data.riesgoMora || (data.estadoDeuda?.[0] ?? '—')} InputProps={{ readOnly: true }} margin="normal" />
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Nombre del negocio" value={data.negocioNombre || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Tipo" value={data.negocioTipo || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Teléfono negocio" value={data.negocioTelefono || '—'} InputProps={{ readOnly: true }} margin="normal" />
            <TextField label="Dirección negocio" value={data.negocioDireccion || '—'} InputProps={{ readOnly: true }} margin="normal" />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ClientesPage;
