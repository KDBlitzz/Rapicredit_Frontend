"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useCobradorDetalle } from "../../../hooks/useCobradorDetalle";

const CobradorDetallePage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const { data, loading } = useCobradorDetalle(id);

  if (loading || !data) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  const {
    codigo,
    nombreCompleto,
    telefono,
    correo,
    zona,
    estado,
    fechaRegistro,
    cantidadPrestamos,
    saldoCartera,
    saldoEnMora,
    prestamos,
    abonosRecientes,
  } = data;

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const renderEstadoChip = () => {
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
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6">{nombreCompleto}</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
            {renderEstadoChip()}
            <Typography variant="caption" color="text.secondary">
              Código: {codigo || "—"} · Registrado:{" "}
              {fechaRegistro ? formatDate(fechaRegistro) : "-"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="contained"
            component={Link}
            href="/prestamos"
          >
            Ver préstamos
          </Button>
          <Button size="small" variant="outlined">
            Editar cobrador
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Datos del cobrador */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Datos del cobrador
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Nombre completo
                </Typography>
                <Typography>{nombreCompleto}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Código
                </Typography>
                <Typography>{codigo || "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Teléfono
                </Typography>
                <Typography>{telefono || "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Correo
                </Typography>
                <Typography>{correo || "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Zona
                </Typography>
                <Typography>{zona || "—"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Resumen de cartera */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cartera asignada
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Préstamos
                </Typography>
                <Typography>{cantidadPrestamos}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Saldo total
                </Typography>
                <Typography>{formatMoney(saldoCartera)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Saldo en mora
                </Typography>
                <Typography>{formatMoney(saldoEnMora)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  % mora
                </Typography>
                <Typography>
                  {saldoCartera > 0
                    ? `${Math.round((saldoEnMora / saldoCartera) * 100)}%`
                    : "—"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Préstamos y abonos recientes */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Préstamos a cargo
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Zona</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prestamos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.codigoFinanciamiento}</TableCell>
                      <TableCell>{p.clienteNombre}</TableCell>
                      <TableCell>{p.zona || "—"}</TableCell>
                      <TableCell>{formatMoney(p.saldoCapital)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={p.estadoFinanciamiento}
                          color={
                            p.estadoFinanciamiento === "EN_MORA"
                              ? "error"
                              : p.estadoFinanciamiento === "PAGADO"
                              ? "success"
                              : "info"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(p.fechaVencimiento)}</TableCell>
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

                  {prestamos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay préstamos asignados a este cobrador.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Abonos recientes
            </Typography>
            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Préstamo</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Método</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {abonosRecientes.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{formatDate(a.fecha)}</TableCell>
                      <TableCell>{a.codigoFinanciamiento}</TableCell>
                      <TableCell>{a.clienteNombre}</TableCell>
                      <TableCell>{formatMoney(a.monto)}</TableCell>
                      <TableCell>{a.metodoPago || "—"}</TableCell>
                    </TableRow>
                  ))}

                  {abonosRecientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay abonos registrados para este cobrador.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CobradorDetallePage;
