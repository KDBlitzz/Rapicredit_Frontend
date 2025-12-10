"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
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
import { useCobradores, EstadoCobradorFiltro } from "../../hooks/useCobradores";

const CobradoresPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoCobradorFiltro>("TODOS");
  const [zona, setZona] = useState("");

  const { data, loading, error } = useCobradores({
    busqueda,
    estado,
    zona,
  });

  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setBusqueda(e.target.value);

  const handleEstadoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setEstado(e.target.value as EstadoCobradorFiltro);

  const handleZonaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setZona(e.target.value);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || "").toUpperCase();
    let color: "default" | "success" | "warning" | "error" = "default";

    if (val === "ACTIVO") color = "success";
    else if (val === "INACTIVO") color = "warning";

    return (
      <Chip size="small" label={val || "—"} color={color} variant="outlined" />
    );
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
            placeholder="Nombre, código, teléfono, correo…"
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
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Zona"
            placeholder="Zona Centro, Norte…"
            value={zona}
            onChange={handleZonaChange}
          />
        </Grid>
        <Grid
          size={{ xs: 12, sm: 12, md: 2 }}
          sx={{ display: "flex", justifyContent: { md: "flex-end" } }}
        >
          <Button
            variant="contained"
            fullWidth
            sx={{ borderRadius: 999, mt: { xs: 1, md: 0 } }}
            component={Link}
            href="/cobradores/nuevo"
          >
            + Nuevo cobrador
          </Button>
        </Grid>
      </Grid>

      {/* Estado */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando cobradores…
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
          <Typography variant="subtitle2">Listado de cobradores</Typography>
          <Chip size="small" label={`Total: ${data.length}`} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Zona</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Cartera</TableCell>
                <TableCell>Mora</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.codigo || "-"}</TableCell>
                    <TableCell>{c.nombreCompleto}</TableCell>
                    <TableCell>{c.zona || "—"}</TableCell>
                    <TableCell>{c.telefono || "—"}</TableCell>
                    <TableCell>{c.correo || "—"}</TableCell>
                    <TableCell>{renderEstadoChip(c.estado)}</TableCell>
                    <TableCell>{formatMoney(c.saldoCartera ?? 0)}</TableCell>
                    <TableCell>{formatMoney(c.saldoEnMora ?? 0)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        component={Link}
                        href={`/cobradores/${c._id}`}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && (!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay cobradores que cumplan con los filtros actuales.
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

export default CobradoresPage;
