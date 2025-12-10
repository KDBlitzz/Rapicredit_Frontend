'use client';

import { Box, Grid, Paper, Typography } from '@mui/material';

export default function ConfiguracionPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Usuarios y roles</Typography>
            <Typography variant="caption" color="text.secondary">
              Aquí podrías consumir <code>/api/users</code> con los roles que definimos.
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Parámetros del sistema</Typography>
            <Typography variant="caption" color="text.secondary">
              Tasas, frecuencias, gastos, etc. desde tus endpoints existentes.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
