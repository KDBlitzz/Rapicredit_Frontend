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

  // Determinamos si estamos en modo edición — solo leer `window` en cliente
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const qs = new URLSearchParams(window.location.search);
    const isEditMode = qs.get("edit") === "1" || qs.get("edit") === "true";
    setEditing(isEditMode);
  }, []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const friendlyBackendMessage = (message: string) => {
    const original = String(message || "");
    const m = original.toLowerCase();

    const looksLikeDuplicate =
      m.includes("duplic") ||
      m.includes("unique") ||
      m.includes("ya existe") ||
      m.includes("ya está") ||
      m.includes("ya esta") ||
      m.includes("registrad") ||
      m.includes("exist");

    if (
      looksLikeDuplicate &&
      (m.includes("tel") || m.includes("telefono") || m.includes("teléfono") || m.includes("phone"))
    ) {
      return "Este teléfono ya está registrado.";
    }
    if (looksLikeDuplicate && (m.includes("email") || m.includes("correo"))) {
      return "Este correo ya está registrado.";
    }

    // Evitar mostrar URLs crudas (ej. localhost) en errores
    return original.replace(/https?:\/\/localhost:\d+\/?/gi, "").trim() || original;
  };

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

  // Cargar permisos del backend (lista) — usar apiFetch para incluir token
  useEffect(() => {
    let cancelled = false;

    const loadPermisos = async () => {
      try {
        const data = await apiFetch<unknown>(`/permisos/`);

        const permisos: Permiso[] = Array.isArray(data)
          ? data
              .map((p) => {
                if (!p || typeof p !== 'object') return null;
                const obj = p as Record<string, unknown>;
                const codigoPermiso = typeof obj.codigoPermiso === 'string' ? obj.codigoPermiso : '';
                const permiso = typeof obj.permiso === 'string' ? obj.permiso : '';
                if (!codigoPermiso || !permiso) return null;
                return { codigoPermiso, permiso } as const;
              })
              .filter((p): p is Permiso => p !== null)
          : [];

        if (!cancelled) setPermisosBD(permisos);
      } catch (err) {
        console.error('Error cargando permisos:', err);
        if (!cancelled) setPermisosBD([]);
      }
    };

    loadPermisos();
    return () => {
      cancelled = true;
    };
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
        : rawRol.toLowerCase() === 'caja'
        ? 'Caja'
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
      estado: (typeof empleado.estado === 'boolean' ? empleado.estado : !!empleado.estado) ? "ACTIVO" : "INACTIVO",
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
    const cajaDefaults: string[] = [
      'PERM-CAJA-001', // Ver pagos por asesor
      'PERM-CAJA-002', // Ver pagos de todos los asesores
      'PERM-CAJA-003', // Ver mora detallada
      'PERM-CAJA-004', // Realizar cuadre de caja
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
    } else if (r === 'caja') {
      setFormData((prev) => ({
        ...prev,
        rol: role,
        permisos: cajaDefaults,
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
    setSaveError(null);
    setSaving(true);
    try {
      const nombreCompleto = formData.nombreCompleto.trim();
      if (!nombreCompleto) {
        setSaveError("El nombre es obligatorio.");
        return;
      }

      const rol = formData.rol.trim();
      if (!rol) {
        setSaveError("El rol es obligatorio.");
        return;
      }

      const usuario = formData.usuario.trim();
      if (!usuario) {
        setSaveError("El usuario es obligatorio.");
        return;
      }

      const phoneDigits = formData.telefono.replace(/\D/g, "");
      if (phoneDigits.length !== 8) {
        setSaveError("Ingrese un teléfono válido de 8 dígitos.");
        return;
      }

      if (formData.password && !validatePassword(formData.password)) {
        return;
      }

      // Construir payload como en crear
      const password = formData.password.trim();
      const payload = {
        // No modificar codigoUsuario vía payload en update
        usuario,
        nombreCompleto,
        rol,
        email: formData.email,
        telefono: `${formData.telefonoPais} ${phoneDigits}`,
        // El backend actualmente falla si el campo no viene (undefined).
        // Enviar string vacío significa "no cambiar contraseña".
        password,
        permisos: formData.permisos,
        // Actualización usa 'actividad' boolean
        estado: formData.estado === "ACTIVO",
      };

      // Actualizar por _id (preferido). Si no hay _id, intentar con el id del path.
      //const byId = (empleado && (empleado as unknown as { _id?: string })._id) || undefined;
      //const targetId = byId || id;
      // Usar codigoUsuario en lugar de _id/UID
      const codigoUsuario =
        empleado?.codigoUsuario || formData.codigoUsuario || (typeof id === 'string' ? id : '');
      if (!codigoUsuario) {
        throw new Error("No se pudo determinar el codigoUsuario del empleado.");
      }
      await apiFetch(`/empleados/codigo/${codigoUsuario}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      // Evitar la llamada posterior que usa UID
      setEditing(false);
      return;
      // await apiFetch(`/empleados/codigo/${targetId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(payload),
      // });*/

      // setEditing(false);
    } catch (err: unknown) {
      console.error("Error actualizando empleado:", err);
      const rawMsg = err instanceof Error ? err.message : "Error actualizando empleado";
      setSaveError(friendlyBackendMessage(rawMsg));
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

        {saveError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        ) : null}

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
              <MenuItem value="Caja">Caja</MenuItem>
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
