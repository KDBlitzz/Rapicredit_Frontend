// src/app/clientes/[id]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import Link from 'next/link';
import { useClienteDetalle } from '../../../hooks/useClienteDetalle';

const ClienteDetallePage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const { data, loading, error } = useClienteDetalle(id);

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

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
          No se pudo cargar la información del cliente.
        </Typography>
      </Box>
    );
  }

  const {
    codigoCliente,
    nombreCompleto,
    identidadCliente,
    email,
    telefono,
    actividad,
    nacionalidad,
    RTN,
    estadoCivil,
    nivelEducativo,
    sexo,
    fechaNacimiento,

    departamentoResidencia,
    municipioResidencia,
    zonaResidencialCliente,
    direccion,
    tipoVivienda,
    antiguedadVivenda,

    conyugeNombre,
    conyugeTelefono,

    limiteCredito,
    tasaCliente,
    frecuenciaPago,
    estadoDeuda,
    referencias,

    negocioNombre,
    negocioTipo,
    negocioTelefono,
    negocioDireccion,

    documentosFotos,
    negocioFotos,
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
            Cliente {codigoCliente || ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {nombreCompleto}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={actividad ? 'ACTIVO' : 'INACTIVO'}
            color={actividad ? 'success' : 'default'}
            variant="outlined"
          />
          <Button size="small" variant="outlined" component={Link} href="/clientes">
            Volver a lista
          </Button>
        </Box>
      </Box>

      {/* Datos principales */}
      <Grid container spacing={2}>
        {/* Info personal */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Información personal
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Nombre completo
                </Typography>
                <Typography>{nombreCompleto}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Identidad
                </Typography>
                <Typography>{identidadCliente}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Nacionalidad
                </Typography>
                <Typography>{nacionalidad}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  RTN
                </Typography>
                <Typography>{RTN || 'No registrado'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Estado civil
                </Typography>
                <Typography>{estadoCivil}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Nivel educativo
                </Typography>
                <Typography>{nivelEducativo}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Sexo
                </Typography>
                <Typography>{sexo}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha nacimiento
                </Typography>
                <Typography>{formatDate(fechaNacimiento)}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography>{email}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Teléfonos
                </Typography>
                <List dense>
                  {telefono.map((t, idx) => (
                    <ListItem key={idx} sx={{ py: 0 }}>
                      <ListItemText primary={t} />
                    </ListItem>
                  ))}
                  {telefono.length === 0 && (
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText primary="Sin teléfonos registrados" />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Dirección / vivienda / cónyuge */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Dirección y vivienda
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Departamento
                </Typography>
                <Typography>{departamentoResidencia}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Municipio
                </Typography>
                <Typography>{municipioResidencia}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Zona residencial
                </Typography>
                <Typography>{zonaResidencialCliente}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Dirección
                </Typography>
                <Typography>{direccion}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Tipo de vivienda
                </Typography>
                <Typography>{tipoVivienda}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Antigüedad vivienda (años)
                </Typography>
                <Typography>{antiguedadVivenda}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos del cónyuge
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Nombre
                </Typography>
                <Typography>{conyugeNombre || 'No registrado'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Teléfono
                </Typography>
                <Typography>{conyugeTelefono || 'No registrado'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Financieros / referencias / negocio */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Información financiera
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Límite de crédito
                </Typography>
                <Typography>
                  L.{' '}
                  {limiteCredito.toLocaleString('es-HN', {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Tasa cliente
                </Typography>
                <Typography>{tasaCliente}%</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Frecuencia de pago
                </Typography>
                <Typography>{frecuenciaPago}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Estado de deuda
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {estadoDeuda.map((e, idx) => (
                    <Chip key={idx} size="small" label={e} variant="outlined" />
                  ))}
                  {estadoDeuda.length === 0 && (
                    <Typography variant="body2">Sin estado registrado</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Referencias
            </Typography>
            <List dense>
              {referencias.map((r, idx) => (
                <ListItem key={idx} sx={{ py: 0 }}>
                  <ListItemText primary={r} />
                </ListItem>
              ))}
              {referencias.length === 0 && (
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="Sin referencias registradas" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Negocio y documentos */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos del negocio
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Nombre del negocio
                </Typography>
                <Typography>{negocioNombre || 'No registrado'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Tipo de negocio
                </Typography>
                <Typography>{negocioTipo || 'No registrado'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Teléfono del negocio
                </Typography>
                <Typography>{negocioTelefono || 'No registrado'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Dirección del negocio
                </Typography>
                <Typography>{negocioDireccion || 'No registrada'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Fotografías
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Documentos
            </Typography>
            <List dense>
              {(documentosFotos || []).map((f, idx) => (
                <ListItem key={idx} sx={{ py: 0 }}>
                  <ListItemText primary={f} />
                </ListItem>
              ))}
              {(!documentosFotos || documentosFotos.length === 0) && (
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="Sin fotos de documentos" />
                </ListItem>
              )}

            </List>
            <Typography variant="caption" color="text.secondary">
              Negocio
            </Typography>
            <List dense>
              {(negocioFotos || []).map((f, idx) => (
                <ListItem key={idx} sx={{ py: 0 }}>
                  <ListItemText primary={f} />
                </ListItem>
              ))}
              {(!negocioFotos || negocioFotos.length === 0) && (
                <ListItem sx={{ py: 0 }}>
                  <ListItemText primary="Sin fotos del negocio" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClienteDetallePage;
