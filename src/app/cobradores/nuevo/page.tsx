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
  Snackbar,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

type EstadoCobrador = "ACTIVO" | "INACTIVO";

const NuevoCobradorPage: React.FC = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    codigo: "",
    nombreCompleto: "",
    telefono: "",
    correo: "",
    zona: "",
    estado: "ACTIVO" as EstadoCobrador,
  });

  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.nombreCompleto.trim()) {
      setSnackbarSeverity("error");
      setSnackbarMsg("El nombre del cobrador es obligatorio.");
      setSnackbarOpen(true);
      return false;
    }

    if (form.correo && !form.correo.includes("@")) {
      setSnackbarSeverity("error");
      setSnackbarMsg("El correo no parece válido.");
      setSnackbarOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
        codigo: form.codigo || undefined,
        nombreCompleto: form.nombreCompleto,
        telefono: form.telefono || undefined,
        correo: form.correo || undefined,
        zona: form.zona || undefined,
        estado: form.estado,
      };

      await apiFetch("/cobradores", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSnackbarSeverity("success");
      setSnackbarMsg("Cobrador registrado correctamente.");
      setSnackbarOpen(true);
      router.push("/cobradores");
    } catch (err: any) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg("Error al registrar el cobrador.");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/cobradores");
  };

  const handleCloseSnackbar = (
    _: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="h6">Nuevo cobrador</Typography>
            <Typography variant="caption" color="text.secondary">
              Registra un nuevo usuario responsable de la gestión de cartera.
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Código (opcional)"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="Ej: COB-001"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Nombre completo"
                  name="nombreCompleto"
                  value={form.nombreCompleto}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Teléfono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="9999-9999"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Correo electrónico"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="correo@ejemplo.com"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Zona"
                  name="zona"
                  value={form.zona}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="Zona Centro, Norte…"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="ACTIVO">Activo</MenuItem>
                  <MenuItem value="INACTIVO">Inactivo</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
                mt: 1,
              }}
            >
              <Button onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cobrador"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NuevoCobradorPage;
