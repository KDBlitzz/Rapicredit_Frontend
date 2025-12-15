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
    else if (val === "EN_MORA") color = "error";
    else if (val === "PAGADO") color = "default";

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
            <MenuItem value="EN_MORA">En mora</MenuItem>
            <MenuItem value="PAGADO">Pagados</MenuItem>
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
                <TableCell>Monto</TableCell>
                <TableCell>Saldo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Desembolso</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Cobrador</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                data &&
                data.length > 0 &&
                data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.codigoFinanciamiento}</TableCell>
                    <TableCell>{p.clienteNombre}</TableCell>
                    <TableCell>{formatMoney(p.capitalInicial ?? 0)}</TableCell>
                    <TableCell>{formatMoney(p.saldoCapital ?? 0)}</TableCell>
                    <TableCell>
                      {renderEstadoChip(p.estadoFinanciamiento)}
                    </TableCell>
                    <TableCell>{formatDate(p.fechaDesembolso)}</TableCell>
                    <TableCell>{formatDate(p.fechaVencimiento)}</TableCell>
                    <TableCell>{p.cobradorNombre || "—"}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        component={Link}
                        href={`/prestamos/${p.id}`}
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
