"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type EmpleadoAuthShape = {
  estado?: boolean;
  rol?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      const empleado = (await login(user.trim(), pass)) as EmpleadoAuthShape;

      // Si el backend incluye estado y viene inactivo, bloqueamos.
      if (Object.prototype.hasOwnProperty.call(empleado, "estado")) {
        const estadoVal = empleado.estado;
        if (estadoVal === false) {
          await logout();
          throw new Error("Empleado inactivo");
        }
      }

      showTemporaryMessage(setSuccessMessage, "¡Ingreso exitoso!", 800);

      const rolActual = String(empleado.rol || "").trim().toLowerCase();
      const destinoInicio = rolActual === "caja" ? "/cuadres" : "/dashboard";

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
        minHeight: "100vh",
        backgroundColor: "#e7eef5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-40vmin",
          left: "-45vmin",
          width: "105vmin",
          height: "105vmin",
          borderRadius: "50%",
          backgroundColor: "#5db4ea",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "-60vmin",
          right: "-50vmin",
          width: "110vmin",
          height: "110vmin",
          borderRadius: "50%",
          backgroundColor: "#123782",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: "-30vmin",
          left: "-10vmin",
          width: "130vmin",
          height: "62vmin",
          borderTopLeftRadius: "58% 100%",
          borderTopRightRadius: "58% 100%",
          backgroundColor: "#edf3fa",
          pointerEvents: "none",
        }}
      />

      <Card
        sx={{
          width: "min(92vw, 380px)",
          borderRadius: "22px",
          background: "#ffffff",
          boxShadow: "0 35px 55px rgba(4, 35, 78, 0.18)",
          position: "relative",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 92,
            backgroundColor: "#245dcb",
            borderBottomLeftRadius: "50% 28px",
            borderBottomRightRadius: "50% 28px",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 33,
            left: "50%",
            transform: "translateX(-50%)",
            width: 62,
            height: 62,
            borderRadius: "50%",
            backgroundColor: "#f8fbff",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Box
            component="img"
            src="/img/logo2.png"
            alt="RapiCredit"
            sx={{ width: 34, height: 34, objectFit: "contain" }}
          />
        </Box>

        <CardContent
          sx={{
            pt: "118px !important",
            px: "30px !important",
            pb: "34px !important",
          }}
        >
          <Typography
            textAlign="center"
            color="#8f8f8f"
            fontWeight={600}
            mb={4.3}
            sx={{
              fontSize: "2.05rem",
              letterSpacing: 0.2,
            }}
          >
            Welcome Back
          </Typography>

          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.7}>
              <TextField
                placeholder="Username"
                fullWidth
                value={user}
                onChange={(e) => setUser(e.target.value)}
                disabled={loading}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "999px",
                    backgroundColor: "#ececef",
                    "& fieldset": { border: 0 },
                    "& input": {
                      py: 1.55,
                      px: 3,
                      color: "#8c8c8c",
                      fontSize: "1.05rem",
                    },
                  },
                }}
              />

              <TextField
                placeholder="Password"
                type="password"
                fullWidth
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                disabled={loading}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "999px",
                    backgroundColor: "#ececef",
                    "& fieldset": { border: 0 },
                    "& input": {
                      py: 1.55,
                      px: 3,
                      color: "#8c8c8c",
                      fontSize: "1.05rem",
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.45,
                  borderRadius: "999px",
                  fontWeight: 700,
                  fontSize: "1.12rem",
                  letterSpacing: 0.2,
                  textTransform: "none",
                  background: "#245dcb",
                  boxShadow: "none",
                  ":hover": { background: "#1f53b5", boxShadow: "none" },
                }}
              >
                {loading ? "Validando..." : "Sign In"}
              </Button>
            </Stack>
          </Box>

          <Typography
            textAlign="center"
            color="#979797"
            mt={5.5}
            fontSize="0.84rem"
            fontWeight={600}
          >
            Need an account? Sign up{" "}
            <Link
              href="#"
              underline="always"
              sx={{
                color: "#2f58bd",
                fontWeight: 700,
                textUnderlineOffset: "2px",
              }}
            >
              here
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
