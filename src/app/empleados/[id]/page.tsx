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
  // Chip,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter, useParams } from "next/navigation";
import { useEmpleadoDetalle } from "../../../hooks/useEmpleadoDetalle";
import { apiFetch } from "../../../lib/api";

const EmpleadoDetallePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { data: empleado, loading, error } = useEmpleadoDetalle(id);

  // Determinamos si estamos en modo edición
  const qs = new URLSearchParams(window.location.search);
  const isEditMode = qs.get("edit") === "1" || qs.get("edit") === "true";

  const [editing, setEditing] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const countryCodes = [
    { code: '+1', name: '🇺🇸 Estados Unidos' },
    { code: '+52', name: '🇲🇽 México' },
    { code: '+54', name: '🇦🇷 Argentina' },
    { code: '+55', name: '🇧🇷 Brasil' },
    { code: '+56', name: '🇨🇱 Chile' },
    { code: '+57', name: '🇨🇴 Colombia' },
    { code: '+58', name: '🇻🇪 Venezuela' },
    { code: '+51', name: '🇵🇪 Perú' },
    { code: '+503', name: '🇸🇻 El Salvador' },
    { code: '+504', name: '🇭🇳 Honduras' },
    { code: '+505', name: '🇳🇮 Nicaragua' },
    { code: '+506', name: '🇨🇷 Costa Rica' },
    { code: '+507', name: '🇵🇦 Panamá' },
    { code: '+508', name: '🇬🇹 Guatemala' },
    { code: '+509', name: '🇭🇹 Haití' },
    { code: '+591', name: '🇧🇴 Bolivia' },
    { code: '+592', name: '🇬🇾 Guyana' },
    { code: '+593', name: '🇪🇨 Ecuador' },
    { code: '+595', name: '🇵🇾 Paraguay' },
    { code: '+598', name: '🇺🇾 Uruguay' },
    { code: '+599', name: '🇨🇼 Curazao' },
  ];

  type Permiso = { codigoPermiso: string; permiso: string };
  const [permisosBD, setPermisosBD] = useState<Permiso[]>([]);

  const [formData, setFormData] = useState({
    codigoUsuario: "",
    usuario: "",
    nombreCompleto: "",
    rol: "",
    email: "",
    telefonoPais: "+504",
    telefono: "",
    password: "",
    estado: "ACTIVO",
    permisos: [] as string[],
  });

  // Cargar permisos del backend (lista)
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    fetch(`${apiUrl}/permisos/`)
      .then((res) => res.json())
      .then((data) => {
        const permisos = (data || []).map((p: { codigoPermiso: string; permiso: string }) => ({
          codigoPermiso: p.codigoPermiso,
          permiso: p.permiso,
        }));
        setPermisosBD(permisos);
      })
      .catch(() => setPermisosBD([]));
  }, []);

  useEffect(() => {
    if (!empleado) return;

    const telefonoStr = empleado.telefono || "";
    // Intentar extraer el código de país si viene en el string
    const match = telefonoStr.match(/^(\+\d{1,3})\s*(\d{4})?-?(\d{4})?$/);
    const pais = match?.[1] || formData.telefonoPais;
    const digits = telefonoStr.replace(/\D/g, "").slice(-8); // tomar últimos 8 dígitos

    // Normalizar rol desde posibles campos y ajustar capitalización a las opciones del Select
    const rawRol = (empleado.rol || (empleado as unknown as { role?: string; cargo?: string; puesto?: string }).role || (empleado as unknown as { cargo?: string }).cargo || (empleado as unknown as { puesto?: string }).puesto || "").trim();
    const normalizedRol = rawRol
      ? rawRol.toLowerCase() === 'gerente'
        ? 'Gerente'
        : rawRol.toLowerCase() === 'supervisor'
        ? 'Supervisor'
        : rawRol.toLowerCase() === 'asesor'
        ? 'Asesor'
        : rawRol
      : '';

    setFormData((prev) => ({
      ...prev,
      codigoUsuario: empleado.codigoUsuario || "",
      usuario: empleado.usuario || "",
      nombreCompleto: empleado.nombreCompleto || "",
      rol: normalizedRol,
      email: empleado.email || "",
      telefonoPais: pais,
      telefono: digits,
      estado: (typeof empleado.estado === 'boolean' ? empleado.estado : !!empleado.actividad) ? "ACTIVO" : "INACTIVO",
      permisos: Array.isArray((empleado as unknown as { permisos?: string[] }).permisos)
        ? (empleado as unknown as { permisos?: string[] }).permisos || []
        : [],
      // No mostramos la contraseña real por seguridad; queda vacía para indicar "sin cambio"
      password: "",
    }));
  }, [empleado, formData.telefonoPais]);

  const applyRoleDefaults = (role: string) => {
    const r = role.trim().toLowerCase();
    // Defaults basados en crear empleado
    const supervisorDefaults: string[] = [
      'C001','C002','C003',
      'f001','F002','F003','F004','F005','F006','F007','F008','F009','F010','F011','F012','F013','F014','F015','F016','F017',
      'S001','S002',
    ];
    const asesorDefaults: string[] = [
      'C001','C002',
      'f001','F002','F003','F004','F005','F006','F007','F008','F009',
      'S003',
    ];

    if (r === 'gerente') {
      setFormData((prev) => ({
        ...prev,
        rol: role,
        permisos: permisosBD.map((p) => p.codigoPermiso),
      }));
    } else if (r === 'supervisor') {
      setFormData((prev) => ({
        ...prev,
        rol: role,
        permisos: supervisorDefaults,
      }));
    } else if (r === 'asesor') {
      setFormData((prev) => ({
        ...prev,
        rol: role,
        permisos: asesorDefaults,
      }));
    }
  };

  const validatePassword = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    if (!hasMinLength) { setPasswordError("La contraseña debe tener al menos 8 caracteres"); return false; }
    if (!hasUpperCase) { setPasswordError("La contraseña debe contener al menos una mayúscula"); return false; }
    if (!hasNumber) { setPasswordError("La contraseña debe contener al menos un número"); return false; }
    setPasswordError(null);
    return true;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "telefono") {
      const digits = value.replace(/\D/g, "").slice(0, 8);
      setFormData({ ...formData, telefono: digits });
      return;
    }
    if (name === 'rol') {
      setFormData({ ...formData, rol: value as string });
      applyRoleDefaults(String(value));
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (name === "password") {
      if (value) { validatePassword(value); } else { setPasswordError(null); }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Construir payload como en crear
      const payload = {
        // No modificar codigoUsuario vía payload en update
        usuario: formData.usuario,
        nombreCompleto: formData.nombreCompleto,
        rol: formData.rol,
        email: formData.email,
        telefono: `${formData.telefonoPais} ${formData.telefono}`,
        // password opcional al editar: solo si se cambió
        ...(formData.password ? { password: formData.password } : {}),
        permisos: formData.permisos,
        // Actualización usa 'actividad' boolean
        actividad: formData.estado === "ACTIVO",
      };

      // Actualizar por _id (preferido). Si no hay _id, intentar con el id del path.
      const byId = (empleado && (empleado as unknown as { _id?: string })._id) || undefined;
      const targetId = id;

      await apiFetch(`/empleados/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditing(false);
    } catch (err: unknown) {
      console.error("Error actualizando empleado:", err);
      alert(err instanceof Error ? err.message : "Error actualizando empleado");
    } finally {
      setSaving(false);
    }
  };

  // Estado chip no usado actualmente; mantener UI limpia

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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              required
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
              select
              required
              variant="outlined"
              label="Rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Seleccione un rol</MenuItem>
              <MenuItem value="Asesor">Asesor</MenuItem>
              <MenuItem value="Supervisor">Supervisor</MenuItem>
              <MenuItem value="Gerente">Gerente</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small" disabled={!editing}>
              <InputLabel id="permisos-label">Permisos</InputLabel>
              <Select
                labelId="permisos-label"
                multiple
                value={formData.permisos}
                label="Permisos"
                MenuProps={{ PaperProps: { style: { maxHeight: 320, width: 320 } } }}
                onChange={(e) => {
                  const vals = e.target.value as string[];
                  setFormData((prev) => ({ ...prev, permisos: vals }));
                }}
                renderValue={(selected) => `${(selected as string[]).length} permisos seleccionados`}
              >
                {permisosBD.map((perm) => (
                  <MenuItem key={perm.codigoPermiso} value={perm.codigoPermiso}>
                    <Checkbox checked={formData.permisos.includes(perm.codigoPermiso)} />
                    <ListItemText primary={perm.permiso} />
                  </MenuItem>
                ))}
              </Select>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button size="small" variant="outlined" disabled={!editing}
                  onClick={() => setFormData((prev) => ({ ...prev, permisos: [] }))}>
                  Quitar todos
                </Button>
              </Box>
            </FormControl>
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl sx={{ minWidth: 140 }} size="small" disabled={!editing}>
                <InputLabel id="empleado-country-code">País</InputLabel>
                <Select
                  labelId="empleado-country-code"
                  value={formData.telefonoPais}
                  label="País"
                  onChange={(e) => {
                    const synthetic = {
                      target: { name: 'telefonoPais', value: String(e.target.value) },
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleChange(synthetic);
                  }}
                >
                  {countryCodes.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                value={formData.telefono}
                onChange={handleChange}
                name="telefono"
                placeholder="XXXX-XXXX"
                size="small"
                sx={{ flex: 1 }}
                helperText="Ingrese solo 8 números"
                error={formData.telefono.replace(/[^\d]/g, '').length !== 8 && formData.telefono.length > 0}
                inputProps={{ inputMode: 'numeric', pattern: '\\d{8}', maxLength: 8, required: true }}
                disabled={!editing}
              />
            </Box>
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
            <TextField
              fullWidth
              required
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
              label="Contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={!editing}
              InputLabelProps={{ shrink: true }}
              error={!!passwordError}
              helperText={passwordError || 'Dejar en blanco para no cambiar'}
              type={showPassword ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={!editing}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
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
