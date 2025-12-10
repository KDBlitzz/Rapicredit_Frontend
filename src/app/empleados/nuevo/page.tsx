"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import { useRouter } from "next/navigation";

const NuevoEmpleadoPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Generar código automático
  const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${random}`;
  };

  const [formData, setFormData] = useState({
    codigo: generateCode(),
    nombreCompleto: "",
    rol: "",
    email: "",
    telefono: "",
    usuario: "",
    password: "",
    estado: "ACTIVO",
  });

  const validatePassword = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    if (!hasUpperCase) {
      setPasswordError("La contraseña debe contener al menos una mayúscula");
      return false;
    }
    if (!hasNumber) {
      setPasswordError("La contraseña debe contener al menos un número");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === "password") {
      if (value) {
        validatePassword(value);
      } else {
        setPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar contraseña antes de enviar
    if (formData.password && !validatePassword(formData.password)) {
      setLoading(false);
      return;
    }

    try {
      // 🔹 Llamada al backend para crear empleado
      // await apiFetch("/empleados", {
      //   method: "POST",
      //   body: JSON.stringify(formData),
      // });

      // Simulación
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Crear empleado:", formData);

      router.push("/empleados");
    } catch (err: any) {
      console.error("Error creando empleado:", err);
      setError(err.message || "Error al crear empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Nuevo Empleado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete la información para registrar un nuevo empleado
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Código"
                name="codigo"
                value={formData.codigo}
                disabled
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                variant="outlined"
                label="Nombre Completo"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                required
                variant="outlined"
                label="Rol"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">Seleccione un rol</MenuItem>
                <MenuItem value="Asesor">Asesor</MenuItem>
                <MenuItem value="Supervisor">Supervisor</MenuItem>
                <MenuItem value="Gerente">Gerente</MenuItem>
              </TextField>
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
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                variant="outlined"
                label="Usuario"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                type="password"
                variant="outlined"
                label="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={!!passwordError}
                helperText={passwordError}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : "Guardar"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default NuevoEmpleadoPage;
