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
import { useSolicitudes, EstadoSolicitudFiltro } from '../../hooks/useSolicitudes';

const SolicitudesPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoSolicitudFiltro>('TODAS');

  const { data, loading, error } = useSolicitudes({
    busqueda,
    estado,
  });

  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setBusqueda(e.target.value);

  const handleEstadoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setEstado(e.target.value as EstadoSolicitudFiltro);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : 'L. 0.00';

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-HN') : '-';

  const renderEstadoChip = (estado: string) => {
    const val = estado.toUpperCase();
    let color: 'default' | 'success' | 'warning' | 'error' | 'info' = 'info';

    if (val === 'REGISTRADA') color = 'info';
    else if (val === 'EN_REVISION') color = 'warning';
    else if (val === 'APROBADA') color = 'success';
    else if (val === 'RECHAZADA') color = 'error';

    return (
      <Chip size="small" label={val} color={color} variant="outlined" />
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Filtros y header */}
      <Grid container spacing={1}>
        <Grid size={{xs: 12, sm: 4, md: 4}}>

          <TextField
            fullWidth
            size="small"
            label="Buscar"
            placeholder="Código, cliente, identidad…"
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
            <MenuItem value="TODAS">Todas</MenuItem>
            <MenuItem value="REGISTRADA">Registradas</MenuItem>
            <MenuItem value="EN_REVISION">En revisión</MenuItem>
            <MenuItem value="APROBADA">Aprobadas</MenuItem>
            <MenuItem value="RECHAZADA">Rechazadas</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 5 }}
          sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}
        >
          <Button
            variant="contained"
            sx={{ borderRadius: 999, mt: { xs: 1, md: 0 } }}
            component={Link}
            href="/solicitudes/nuevo"
          >
            + Nueva solicitud
          </Button>
        </Grid>
      </Grid>

      {/* Estado de carga / error */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando solicitudes…
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      {/* Tabla */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Listado de solicitudes</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip size="small" label={`Total: ${data.length}`} />
            <Button size="small" variant="outlined">Calcular cuota</Button>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Monto (capital)</TableCell>
                <TableCell>Cobrador</TableCell>
                <TableCell>Cuota</TableCell>
                <TableCell>Estado</TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.codigoSolicitud}</TableCell>
                    <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                    <TableCell>{s.clienteNombre}</TableCell>
                    <TableCell>{formatMoney(s.capitalSolicitado ?? 0)}</TableCell>
                    <TableCell>{s.cobradorNombre || '—'}</TableCell>
                    <TableCell>{s.cuotaEstablecida != null ? formatMoney(s.cuotaEstablecida) : '—'}</TableCell>
                    <TableCell>
                      {renderEstadoChip(s.estadoSolicitud)}
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay solicitudes que cumplan con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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

export default SolicitudesPage;
