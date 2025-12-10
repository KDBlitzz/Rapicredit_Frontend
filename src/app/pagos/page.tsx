'use client';

import { Box, Paper, Typography, Grid, TextField, MenuItem, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';

export default function PagosPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Registrar pago
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Código de préstamo" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Cliente (opcional)" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Monto" type="number" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Fecha" type="date" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Referencia / recibo" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" select label="Medio de pago">
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  <MenuItem value="DEPOSITO">Depósito</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="contained" sx={{ borderRadius: 999 }}>
                  Registrar pago
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Pagos del día</Typography>
              <Chip size="small" label="Hoy" />
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Hora</TableCell>
                    <TableCell>Préstamo</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Luego esto vendrá de <code>/api/abonos/hoy</code>.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
