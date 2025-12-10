"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { useEmpleadoDetalle } from "../../../hooks/useEmpleadoDetalle";

const EmpleadoDetallePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: empleado, loading, error } = useEmpleadoDetalle(id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    usuario: "",
    nombreCompleto: "",
    rol: "",
    email: "",
    telefono: "",
    estado: "ACTIVO",
  });

  useEffect(() => {
    if (empleado) {
      setFormData({
        codigo: empleado.codigo || "",
        usuario: empleado.usuario || "",
        nombreCompleto: empleado.nombreCompleto || "",
        rol: empleado.rol || "",
        email: empleado.email || "",
        telefono: empleado.telefono || "",
        estado: empleado.estado || "ACTIVO",
      });
    }
  }, [empleado]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 🔹 Llamada al backend para actualizar empleado
      // await apiFetch(`/empleados/${id}`, {
      //   method: "PUT",
      //   body: JSON.stringify(formData),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Actualizar empleado:", formData);

      setEditing(false);
    } catch (err: any) {
      console.error("Error actualizando empleado:", err);
    } finally {
      setSaving(false);
    }
  };

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || "").toUpperCase();
    let color: "default" | "success" | "warning" = "default";

    if (val === "ACTIVO") color = "success";
    else if (val === "INACTIVO") color = "warning";

    return (
      <Chip size="small" label={val || "—"} color={color} variant="outlined" />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!empleado) {
    return (
      <Alert severity="warning">Empleado no encontrado</Alert>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {editing ? "Editar Empleado" : "Detalle de Empleado"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {empleado.codigo} - {empleado.usuario}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {!editing && (
              <Button variant="outlined" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
            {editing && (
              <>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : "Guardar"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Código"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Usuario"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Nombre Completo"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="email"
              variant="outlined"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              variant="outlined"
              label="Estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="ACTIVO">Activo</MenuItem>
              <MenuItem value="INACTIVO">Inactivo</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estado actual
              </Typography>
              {renderEstadoChip(formData.estado)}
            </Box>
          </Grid>
        </Grid>

        {!editing && (
          <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid rgba(148,163,184,0.2)" }}>
            <Typography variant="caption" color="text.secondary">
              Fecha de registro: {empleado.fechaRegistro || "N/A"}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={() => router.push("/empleados")}>
            Volver a lista
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmpleadoDetallePage;
