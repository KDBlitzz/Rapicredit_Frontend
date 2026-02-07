"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import Link from "next/link";
import { usePrestamos, EstadoPrestamoFiltro } from "../../hooks/usePrestamos";

const PrestamosPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoPrestamoFiltro>("TODOS");

  const { data, loading, error } = usePrestamos({
    busqueda,
    estado,
  });

  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setBusqueda(e.target.value);

  const handleEstadoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setEstado(e.target.value as EstadoPrestamoFiltro);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const renderEstadoChip = (estado: string) => {
    const val = estado.toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";

    if (val === "VIGENTE") color = "success";
    else if (val === "PENDIENTE") color = "warning";
    else if (val === "CERRADO") color = "default";
    else if (val === "RECHAZADO") color = "error";

    return <Chip size="small" label={val} color={color} variant="outlined" />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Filtros */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
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
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="VIGENTE">Vigentes</MenuItem>
            <MenuItem value="PENDIENTE">Pendientes</MenuItem>
            <MenuItem value="CERRADO">Cerrados</MenuItem>
            <MenuItem value="RECHAZADO">Rechazados</MenuItem>
          </TextField>
        </Grid>

        <Grid
          size={{ xs: 12, sm: 12, md: 5 }}
          sx={{ display: "flex", justifyContent: { md: "flex-end" } }}
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

      {/* Estado */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando préstamos…
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
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2">Listado de préstamos</Typography>
          <Chip size="small" label={`Total: ${data.length}`} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Cuotas</TableCell>
                <TableCell>Capital</TableCell>
                <TableCell>Cuota fija</TableCell>
                <TableCell>Desembolso</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.codigoPrestamo}</TableCell>
                    <TableCell>{p.clienteNombre}</TableCell>
                    <TableCell>{renderEstadoChip(p.estadoPrestamo)}</TableCell>
                    <TableCell>{p.frecuenciaPago || "—"}</TableCell>
                    <TableCell>{p.plazoCuotas ?? 0}</TableCell>
                    <TableCell>{formatMoney(p.capitalSolicitado ?? 0)}</TableCell>
                    <TableCell>{formatMoney(p.cuotaFija ?? 0)}</TableCell>
                    <TableCell>{formatDate(p.fechaDesembolso)}</TableCell>
                    <TableCell>{formatDate(p.fechaVencimiento)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        component={Link}
                        href={`/prestamos/${encodeURIComponent(p.codigoPrestamo)}`}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay préstamos que cumplan con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}

              {loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
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

export default PrestamosPage;
