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
} from '@mui/material';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import {
  useClientes,
  EstadoClienteFiltro,
} from '../../hooks/useClientes';

const ClientesPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoClienteFiltro>('TODOS');

  const { data, loading, error } = useClientes({ busqueda, estado });

  // Local override of actividad to simulate activate/deactivate without backend
  const [actividadOverrides, setActividadOverrides] = useState<Record<string, boolean>>({});

  const getActividad = (id: string, original: boolean) =>
    actividadOverrides[id] ?? original;

  const toggleActividad = (id: string, original: boolean) => {
    const current = actividadOverrides[id] ?? original;
    setActividadOverrides((prev) => ({ ...prev, [id]: !current }));
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
                        <Button
                          size="small"
                          variant="text"
                          component={Link}
                          href={`/clientes/${c.id}`}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          component={Link}
                          href={`/clientes/${c.id}?edit=1`}
                          startIcon={<EditIcon fontSize="small" />}
                          aria-label="Editar"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          color={getActividad(c.id, c.actividad) ? 'error' : 'success'}
                          onClick={() => toggleActividad(c.id, c.actividad)}
                        >
                          {getActividad(c.id, c.actividad) ? 'Desactivar Cliente' : 'Activar Cliente'}
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
    </Box>
  );
};

export default ClientesPage;
