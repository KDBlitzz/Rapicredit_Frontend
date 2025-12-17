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

  // Determinamos si estamos en modo edición
  const isEditMode = new URLSearchParams(window.location.search).get("edit") === "1";

  const [editing, setEditing] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    usuario: "",
    nombreCompleto: "",
    rol: "",
    email: "",
    telefono: "",
    actividad: "ACTIVO",
  });

  useEffect(() => {
    if (empleado) {
      setFormData({
        codigo: empleado.codigoUsuario || "",
        usuario: empleado.usuario || "",
        nombreCompleto: empleado.nombreCompleto || "",
        rol: empleado.rol || "",
        email: empleado.email || "",
        telefono: empleado.telefono || "",
        actividad: empleado.actividad ? "ACTIVO" : "INACTIVO",
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
      // Simulación de llamada al backend para actualizar el empleado
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
              {empleado.codigoUsuario} - {empleado.usuario}
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

        {/* Aquí se agregan los campos del formulario que pueden ser editados o solo vistos */}
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
          {/* Aquí siguen los demás campos del formulario */}
        </Grid>

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
