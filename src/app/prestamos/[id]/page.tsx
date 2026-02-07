"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../hooks/usePrestamoDetalle";

const PrestamoDetallePage: React.FC = () => {
  const params = useParams();
  // En esta ruta el "id" realmente es el código del préstamo (ej: P-2026-001)
  const codigoPrestamo = params?.id as string;

  const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, 0);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || "").toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";

    if (val === "VIGENTE") color = "success";
    else if (val === "PENDIENTE") color = "warning";
    else if (val === "CERRADO") color = "default";
    else if (val === "RECHAZADO") color = "error";

    return <Chip size="small" label={val || "—"} color={color} variant="outlined" />;
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">No se pudo cargar la información del préstamo.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
        <Box>
          <Typography variant="h6">Préstamo {data.codigoPrestamo || ""}</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
            {renderEstadoChip(data.estadoPrestamo)}
            <Typography variant="caption" color="text.secondary">
              Cliente: {data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {data.cliente && (
            <Button size="small" variant="outlined" component={Link} href={`/clientes/${data.cliente.id}`}>
              Ver cliente
            </Button>
          )}
          <Button size="small" variant="outlined" component={Link} href="/prestamos">
            Volver a lista
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Datos del préstamo</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Capital</Typography>
                <Typography>{formatMoney(data.capitalSolicitado)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Cuota fija</Typography>
                <Typography>{formatMoney(data.cuotaFija)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Plazo (cuotas)</Typography>
                <Typography>{data.plazoCuotas}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Frecuencia</Typography>
                <Typography>{data.frecuenciaPago || "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Desembolso</Typography>
                <Typography>{formatDate(data.fechaDesembolso)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Vencimiento</Typography>
                <Typography>{formatDate(data.fechaVencimiento)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total intereses</Typography>
                <Typography>{data.totalIntereses != null ? formatMoney(data.totalIntereses) : "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total pagado</Typography>
                <Typography>{data.totalPagado != null ? formatMoney(data.totalPagado) : "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                <Typography>{data.observaciones || "—"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Estado</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Estado</Typography>
                <Typography>{data.estadoPrestamo || "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Activo</Typography>
                <Typography>{data.activo === false ? "No" : "Sí"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrestamoDetallePage;
