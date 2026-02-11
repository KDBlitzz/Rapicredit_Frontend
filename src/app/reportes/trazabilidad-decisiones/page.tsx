"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import Link from "next/link";
import { useTrazabilidadDecisiones } from "../../../hooks/useTrazabilidadDecisiones";

const TrazabilidadDecisionesPage: React.FC = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 7);
  const hace7Iso = hace7.toISOString().slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(hace7Iso);
  const [fechaFin, setFechaFin] = useState(hoy);

  const { data, loading, error } = useTrazabilidadDecisiones({
    fechaInicio,
    fechaFin,
  });

  const handleAplicarRango = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.toLocaleDateString("es-HN")} ${d.toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header y filtros */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6">Trazabilidad de decisiones</Typography>
          <Typography variant="caption" color="text.secondary">
            Consulta quién aprobó o rechazó solicitudes y otras decisiones,
            con fecha y hora exactas.
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleAplicarRango}
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            type="date"
            size="small"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <Button
            type="submit"
            variant="outlined"
            size="small"
            disabled={loading}
          >
            Aplicar
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">
            Cargando trazabilidad de decisiones…
          </Typography>
        </Box>
      )}

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Decisiones registradas
        </Typography>
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Fecha / hora</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Aprobado por</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Código / enlace</TableCell>
                <TableCell>Comentario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((item) => {
                  const tipo = (item.tipoEntidad || "").toUpperCase();
                  const isSolicitud = tipo === "SOLICITUD" || tipo === "SOLICITUDES";

                  const linkHref =
                    isSolicitud && item.entidadId
                      ? `/solicitudes/${item.entidadId}`
                      : undefined;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateTime(item.fecha)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.accion || ""}
                          color={
                            (item.accion || "").toUpperCase() === "APROBADA"
                              ? "success"
                              : (item.accion || "").toUpperCase() === "RECHAZADA"
                              ? "error"
                              : "info"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{item.aprobadoPor || "-"}</TableCell>
                      <TableCell>{item.tipoEntidad || "-"}</TableCell>
                      <TableCell>
                        {linkHref ? (
                          <Button
                            size="small"
                            component={Link}
                            href={linkHref}
                            variant="text"
                          >
                            {item.codigoEntidad || "Ver detalle"}
                          </Button>
                        ) : (
                          item.codigoEntidad || "-"
                        )}
                      </TableCell>
                      <TableCell>{item.comentario || "-"}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron decisiones en el rango seleccionado.
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

export default TrazabilidadDecisionesPage;
