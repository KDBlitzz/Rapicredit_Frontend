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
import { useRouter } from "next/navigation";
import { apiFetch } from '../../../lib/api';

// Lista de códigos de país igual al formulario de clientes
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

const NuevoEmpleadoPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);


  const [formData, setFormData] = useState({
    codigoUsuario: "",
    nombreCompleto: "",
    rol: "",
    email: "",
    telefonoPais: "+504",
    telefono: "",
    usuario: "",
    password: "",
    estado: "ACTIVO",
    permisos: [] as string[],
  });

  type Permiso = { codigoPermiso: string; permiso: string };
  const [permisosBD, setPermisosBD] = useState<Permiso[]>([]);

  // Obtener el siguiente código disponible basado en los empleados existentes
  const getNextEmployeeCode = async (): Promise<string> => {
    // Usar el mismo endpoint que la lista: /empleados/codigos
    const res = await apiFetch<any>("/empleados/codigos");

    // Normalizar posibles formas de respuesta
    let codigos: string[] = [];

    if (Array.isArray(res)) {
      codigos = res
        .map((e: any) => String(e?.codigoUsuario ?? "").trim())
        .filter(Boolean);
    } else if (res && (Array.isArray(res.activos) || Array.isArray(res.inactivos))) {
      const activos = Array.isArray(res.activos) ? res.activos : [];
      const inactivos = Array.isArray(res.inactivos) ? res.inactivos : [];
      codigos = [...activos, ...inactivos]
        .map((e: any) => String(e?.codigoUsuario ?? "").trim())
        .filter(Boolean);
    } else if (res && Array.isArray(res.empleado)) {
      // Soporte para forma { empleado: [] }
      codigos = res.empleado
        .map((e: any) => String(e?.codigoUsuario ?? "").trim())
        .filter(Boolean);
    }

    const nums = codigos
      .map((c) => {
        const m = /^E(\d+)$/.exec(c);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    const max = nums.length ? Math.max(...nums) : 0;
    return `E${String(max + 1).padStart(3, "0")}`;
  };

  React.useEffect(() => {
    let cancelled = false;

    const loadPermisos = async () => {
      try {
        const data = await apiFetch<any>(`/permisos/`); // ✅ usa apiFetch (manda token)

        const permisos = (data || []).map((p: any) => ({
          codigoPermiso: p.codigoPermiso,
          permiso: p.permiso,
        }));

        if (!cancelled) setPermisosBD(permisos);
      } catch (err) {
        console.error("Error cargando permisos:", err);
        if (!cancelled) setPermisosBD([]);
      }
    };

    loadPermisos();

    return () => {
      cancelled = true;
    };
  }, []);

  // Al montar, calcular el siguiente código y asignarlo al formulario
  // 🔹 ESTE ES EL useEffect CORRECTO PARA ASIGNAR EL NEXT EMPLEADO
  React.useEffect(() => {
    let cancelled = false;

    const loadNextCode = async () => {
      try {
        const nextCode = await getNextEmployeeCode();

        if (!cancelled) {
          setFormData((prev) => ({
            ...prev,
            codigoUsuario: nextCode, // ✅ AQUÍ, ESTE CAMPO
          }));
        }
      } catch (err) {
        console.error("Error obteniendo código de empleado", err);
      }
    };

    loadNextCode();

    return () => {
      cancelled = true;
    };
  }, []);


  // Mapeo de permisos por rol (resumen según especificación)
  // Supervisor: usar los códigos de permiso del backend
  const supervisorDefaults: string[] = [
    // Clientes
    'C001', // Ver/Buscar cliente
    'C002', // Ver perfil de cliente
    'C003', // Gestionar clientes
    // Créditos (subset amplio)
    'F001', // Ver/Buscar créditos (nota: puede venir en minúscula)
    'F002', // Gestionar créditos
    'F003', // Ver el perfil de un crédito
    'F004', // Calcular cuota de crédito
    'F005', // Aplicar Pago
    'F006', // Ver detalle de movimiento de crédito
    'F007', // Ver detalle de cuota
    'F008', // Consulta resumen de crédito
    'F009', // Transacción aplicar pago
    'F010', // Aprobar/Rechazar crédito
    'F011', // Agregar Aval
    'F012', // Cambiar monto de crédito
    'F013', // Cambiar plazo de crédito
    'F014', // Cambiar tasa de crédito
    'F015', // Desembolsar un crédito
    'F016', // Calcular Cuota de Crédito (duplicado semántico, incluimos por si backend separa)
    'F017', // Cambiar Cartera a un Crédito
    // Seguridad
    'S001', // Agregar/Editar carteras de usuario
    'S002', // Sucursales por usuario
  ];

  // Asesor: códigos según backend (subset más limitado)
  const asesorDefaults: string[] = [
    // Clientes
    'C001', // Ver/Buscar cliente
    'C002', // Ver perfil de cliente
    // Créditos
    'F001', // Ver/Buscar créditos
    'F002', // Gestionar créditos
    'F003', // Ver el perfil de un crédito
    'F004', // Calcular cuota de crédito
    'F005', // Aplicar Pago
    'F006', // Ver detalle de movimiento de crédito
    'F007', // Ver detalle de cuota
    'F008', // Consulta resumen de crédito
    'F009', // Transacción aplicar pago
    // Seguridad
    'S003', // Actualizar y editar permisos de mis usuarios (si no corresponde para asesor, se puede quitar)
  ];

  // Cajer@: permisos limitados a operaciones de caja
  const cajaDefaults: string[] = [
    'PERM-CAJA-001', // Ver pagos por asesor
    'PERM-CAJA-002', // Ver pagos de todos los asesores
    'PERM-CAJA-003', // Ver mora detallada
    'PERM-CAJA-004', // Realizar cuadre de caja
  ];

  const applyRoleDefaults = (role: string) => {
    if (!role) return;
    const r = role.trim().toLowerCase();
    if (r === 'gerente') {
      // Gerente: todos los permisos del backend
      setFormData((prev) => ({
        ...prev,
        rol: role,
        permisos: permisosBD.map((p) => p.codigoPermiso),
      }));
    } else if (r === 'supervisor') {
      setFormData((prev) => ({ ...prev, rol: role, permisos: supervisorDefaults }));
    } else if (r === 'asesor') {
      setFormData((prev) => ({ ...prev, rol: role, permisos: asesorDefaults }));
    } else if (r === 'caja') {
      setFormData((prev) => ({ ...prev, rol: role, permisos: cajaDefaults }));
    }
  };

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
    // Restrict phone input to digits only and max length 8
    if (name === "telefono") {
      const digits = value.replace(/\D/g, "").slice(0, 8);
      setFormData({ ...formData, telefono: digits });
    } else {
      // Si se cambia el rol, auto-llenar permisos según rol
      if (name === 'rol') {
        // actualizar rol primero
        setFormData({ ...formData, rol: value as string });
        applyRoleDefaults(String(value));
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }

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

    const friendlyBackendMessage = (message: string) => {
      const m = String(message || "").toLowerCase();

      const looksLikeDuplicate =
        m.includes("duplic") ||
        m.includes("unique") ||
        m.includes("ya existe") ||
        m.includes("ya está") ||
        m.includes("ya esta") ||
        m.includes("registrad") ||
        m.includes("exist");

      if (looksLikeDuplicate && (m.includes("email") || m.includes("correo"))) {
        return "Este correo ya está registrado.";
      }
      if (
        looksLikeDuplicate &&
        (m.includes("tel") || m.includes("telefono") || m.includes("teléfono") || m.includes("phone"))
      ) {
        return "Este teléfono ya está registrado.";
      }

      return message;
    };

    // Si por alguna razón no está el código, no bloquear: se recalcula más abajo

    if (!formData.permisos || formData.permisos.length === 0) {
      setError("Seleccione al menos un permiso");
      setLoading(false);
      return;
    }

    const email = formData.email.trim();
    if (!email) {
      setError("El correo es obligatorio");
      setLoading(false);
      return;
    }

    // Validar teléfono obligatorio: exactamente 8 dígitos
    const phoneDigits = formData.telefono.replace(/\D/g, "");
    if (phoneDigits.length !== 8) {
      setError("Ingrese un teléfono válido de 8 dígitos");
      setLoading(false);
      return;
    }

    if (formData.password && !validatePassword(formData.password)) {
      setLoading(false);
      return;
    }

    try {
      // Recalcular el código por si cambió el estado en el backend
      const nextCode = await getNextEmployeeCode();
      const payload = {
        codigoUsuario: nextCode,           // ✅ asegurar código único
        usuario: formData.usuario,
        nombreCompleto: formData.nombreCompleto,
        rol: formData.rol,
        email,
        telefono: `${formData.telefonoPais} ${phoneDigits}`, // ✅ normalizado
        password: formData.password,                   // ✅ (ASÍ SE LLAMA EN TU SCHEMA)
        permisos: formData.permisos,
        estado: formData.estado === "ACTIVO",      // ✅ boolean
      };

      await apiFetch("/empleados/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push("/empleados");
    } catch (err: any) {
      console.error("Error creando empleado:", err);
      const rawMsg = err?.message || "Error al crear empleado";
      setError(friendlyBackendMessage(rawMsg));
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
            {/* Código de empleado oculto: se autogenera y no se muestra */}

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
                <MenuItem value="Caja">Caja</MenuItem>
              </TextField>
            </Grid>
            {/* Permisos colocados inmediatamente debajo del rol para cohesión visual en mobile */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small" error={false}>
                <InputLabel id="permisos-label">Permisos</InputLabel>
                <Select
                  labelId="permisos-label"
                  multiple
                  value={formData.permisos}
                  label="Permisos"
                  MenuProps={{
                    PaperProps: { style: { maxHeight: 320, width: 320 } },
                  }}
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
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setFormData((prev) => ({ ...prev, permisos: [] }))}
                  >
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
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl sx={{ minWidth: 140 }} size="small">
                  <InputLabel id="empleado-country-code">País</InputLabel>
                  <Select
                    labelId="empleado-country-code"
                    value={formData.telefonoPais}
                    label="País"
                    onChange={(e) => handleChange({
                      //// @ts-expect-error next mui types
                      target: { name: 'telefonoPais', value: e.target.value },
                    } as any)}
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
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '\\d{8}',
                    maxLength: 8,
                    required: true,
                  }}
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
                variant="outlined"
                label="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                error={!!passwordError}
                helperText={passwordError}
                type={showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
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