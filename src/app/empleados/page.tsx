'use client';

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
  IconButton,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { useEmpleados, EstadoEmpleadoFiltro } from "../../hooks/useEmpleados";
import EditIcon from "@mui/icons-material/Edit";  // Asegúrate de importar el ícono
import { apiFetch } from "../../lib/api";

const EmpleadosPage: React.FC = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoEmpleadoFiltro>("TODOS");
  const [rol, setRol] = useState("");
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  const { data, loading, refresh } = useEmpleados({
    busqueda,
    estado,
    rol,
  });

  const handleBusquedaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setBusqueda(e.target.value);

  const handleEstadoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setEstado(e.target.value as EstadoEmpleadoFiltro);

  const handleRolChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setRol(e.target.value);

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || "").toUpperCase();
    let color: "default" | "success" | "warning" | "error" = "default";

    if (val === "ACTIVO") color = "success";
    else if (val === "INACTIVO") color = "warning";

    return (
      <Chip size="small" label={val || "—"} color={color} variant="outlined" />
    );
  };

  const renderRolChip = (rol?: string) => {
    const val = rol || "";
    let color: "default" | "primary" | "secondary" | "info" = "default";

    if (val.toLowerCase().includes("gerente")) color = "primary";
    else if (val.toLowerCase().includes("asesor")) color = "info";
    else if (val.toLowerCase().includes("cobrador")) color = "secondary";

    return (
      <Chip size="small" label={val || "—"} color={color} variant="outlined" />
    );
  };

  // Cambiar estado (Activar/Desactivar) usando apiFetch, similar a clientes
  const toggleEstado = async (
    id: string,
    codigoUsuario: string | undefined,
    estadoActual: boolean,
  ) => {
    try {
      const identifier = codigoUsuario ?? id;
      setUpdatingCode(identifier);

      await apiFetch(`/empleados/estado/${identifier}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: !estadoActual  }),
      });

      // Recargar para reflejar cambios: preferimos `refresh()` del hook
      if (typeof refresh === 'function') await refresh();
      else window.location.reload();
    } catch (err: unknown) {
      console.error('Error al cambiar estado del empleado:', err);
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      alert(msg);
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Filtros */}
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            label="Buscar"
            value={busqueda}
            onChange={handleBusquedaChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            select
            label="Estado"
            value={estado}
            onChange={handleEstadoChange}
            InputLabelProps={{ shrink: true }}
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
            variant="outlined"
            label="Rol"
            value={rol}
            onChange={handleRolChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 2 }}>
          <Button
            fullWidth
            variant="contained"
            component={Link}
            href="/empleados/nuevo"
            sx={{
              height: "40px",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            + CREAR
          </Button>
        </Grid>
      </Grid>

      {/* Tabla */}
      <Paper
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.5,
            borderBottom: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 16 16"
            style={{ color: "#38bdf8" }}
          >
            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z" />
            <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          </svg>
          <Typography variant="h6" fontSize={16} fontWeight={600}>
            Empleados
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
              />
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
            </svg>
          </button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(148,163,184,0.08)" }}>
                  <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre Completo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron empleados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {data.map((empleado) => (
                  <TableRow
                    key={empleado._id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "rgba(56,189,248,0.04)" },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell>{empleado.codigoUsuario || "—"}</TableCell>
                    <TableCell>{empleado.usuario || "—"}</TableCell>
                    <TableCell>{empleado.nombreCompleto}</TableCell>
                    <TableCell>{renderRolChip(empleado.rol)}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {empleado.email || "—"}
                    </TableCell>
                    <TableCell>{empleado.telefono || "—"}</TableCell>
                    <TableCell>
                      {renderEstadoChip((typeof empleado.estado === 'boolean' ? empleado.estado : !!empleado.estado) ? "ACTIVO" : "INACTIVO")}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="text"
                          component={Link}
                          href={`/empleados/${empleado.codigoUsuario}?edit=false`}  // Ver (View)
                        >
                          Ver
                        </Button>
                        <Tooltip title="Editar" arrow>
                          <IconButton
                            size="small"
                            component={Link}
                            href={`/empleados/${empleado.codigoUsuario}?edit=true`}
                            aria-label="Editar"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Button
                          size="small"
                          variant="outlined"
                          color={(typeof empleado.estado === 'boolean' ? empleado.estado : !!empleado.estado) ? 'error' : 'success'}
                          onClick={() => toggleEstado(empleado._id, empleado.codigoUsuario, (typeof empleado.estado === 'boolean' ? empleado.estado : !!empleado.estado))}
                          disabled={updatingCode === (empleado.codigoUsuario ?? empleado._id)}
                        >
                          {updatingCode === (empleado.codigoUsuario ?? empleado._id) ? (
                            <>
                              <CircularProgress size={16} sx={{ mr: 1 }} />
                              Procesando...
                            </>
                          ) : (
                            empleado.estado ? 'Desactivar' : 'Activar'
                          )}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Mostrando {data.length} empleado(s)
      </Typography>
    </Box>
  );
};

export default EmpleadosPage;
