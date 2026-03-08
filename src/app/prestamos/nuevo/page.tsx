"use client";

import React, { useEffect } from "react";
import { Box, Paper, Typography, Button, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import Link from "next/link";

const NuevoPrestamoPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/solicitudes");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 600,
        mx: "auto",
        mt: 4,
      }}
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Crear Préstamo
        </Typography>

        <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Información importante:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Los préstamos ahora se crean automáticamente al{" "}
            <strong>aprobar una solicitud</strong>.
          </Typography>
          <Typography variant="body2">
            Para crear un nuevo préstamo, primero debe registrar una solicitud de
            crédito.
          </Typography>
        </Alert>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
          <Button variant="contained" component={Link} href="/solicitudes/nuevo">
            Crear Nueva Solicitud
          </Button>
          <Button variant="outlined" component={Link} href="/solicitudes">
            Ver Solicitudes
          </Button>
          <Button variant="text" onClick={() => router.back()}>
            Volver
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 3 }}
        >
          Redirigiendo a solicitudes en 3 segundos...
        </Typography>
      </Paper>
    </Box>
  );
};

export default NuevoPrestamoPage;
