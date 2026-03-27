"use client";

import { useState } from "react";
import {
  Box, Card, CardContent, TextField, Typography,
  Button, Stack, Alert, IconButton, InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const showTemporaryMessage = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    message: string,
    duration = 2000
  ) => {
    setter(message);
    setTimeout(() => setter(""), duration);
  };

  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const empleado = await login(user.trim(), pass);

      // Si el backend incluye estado y viene inactivo, bloqueamos.
      if (Object.prototype.hasOwnProperty.call(empleado, "estado") && isRecord(empleado)) {
        const estadoVal = empleado.estado;
        if (estadoVal === false) {
          await logout();
          throw new Error("Empleado inactivo");
        }
      }

      showTemporaryMessage(setSuccessMessage, "¡Ingreso exitoso!", 800);

      const rolActual = isRecord(empleado)
        ? String(empleado.rol || "").trim().toLowerCase()
        : "";
      const isContadora = rolActual === "contadora" || rolActual === "contador" || rolActual === "contabilidad";
      const destinoInicio = rolActual === "caja" ? "/cuadres" : isContadora ? "/contabilidad" : "/dashboard";

      //  navegación suave (evita carreras y recargas)
      router.push(destinoInicio);
    } catch (err: unknown) {
      console.error("LOGIN FAIL:", err);
      const errorObj = err as { code?: unknown; message?: unknown };
      const code = typeof errorObj?.code === "string" ? errorObj.code : "";
      const rawMsg = err instanceof Error ? err.message : typeof errorObj?.message === "string" ? errorObj.message : "";

      // Mantener mensajes de negocio
      if (rawMsg === "Empleado inactivo" || rawMsg === "No se encontró información del empleado" || rawMsg === "No se pudo completar el inicio de sesión") {
        showTemporaryMessage(setErrorMessage, rawMsg);
        return;
      }

      // Errores de Firebase Auth -> mensaje genérico
      if (code.startsWith("auth/") || rawMsg.includes("auth/")) {
        showTemporaryMessage(setErrorMessage, "Credenciales incorrectas");
        return;
      }

      showTemporaryMessage(setErrorMessage, rawMsg || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: "#060010",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        position: "relative",
      }}
    >
      <Box
        component="img"
        src="/img/logo3.png"
        alt="Logo"
        sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 550,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      />

      <Card
        sx={{
          width: 420,
          borderRadius: 4,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(7px)",
          border: "1px solid rgba(76,117,255,0.35)",
          boxShadow: "0 0 25px rgba(76,117,255,0.18)",
        }}
      >
        <CardContent>
          <Typography variant="h5" textAlign="center" color="white" fontWeight={700} mb={1}>
            Iniciar Sesión
          </Typography>

          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
            <TextField
              label="Usuario (email)"
              fullWidth
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={loading}
              InputLabelProps={{ style: { color: "#b9c4ff" } }}
              inputProps={{ style: { color: "white" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(76,117,255,0.35)" },
                  "&:hover fieldset": { borderColor: "rgba(76,117,255,0.55)" }
                }
              }}
            />

            <TextField
              label="Contraseña"
              type={showPass ? "text" : "password"}
              fullWidth
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              disabled={loading}
              InputLabelProps={{ style: { color: "#b9c4ff" } }}
              inputProps={{ style: { color: "white" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(76,117,255,0.35)" },
                  "&:hover fieldset": { borderColor: "rgba(76,117,255,0.55)" }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton sx={{ color: "white" }} onClick={() => setShowPass(!showPass)}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              size="large"
                type="submit"
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.3,
                borderRadius: 2,
                fontWeight: 700,
                background: "#3A6DFF",
                ":hover": { background: "#5C86FF" },
                boxShadow: "0 0 12px rgba(76,117,255,0.35)"
              }}
            >
              {loading ? "Validando…" : "Entrar"}
            </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
