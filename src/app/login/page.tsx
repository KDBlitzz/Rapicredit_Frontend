"use client";

import { useState } from "react";
import {
  Box, Card, CardContent, TextField, Typography,
  Button, Stack, Alert, IconButton, InputAdornment, Link
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

    try {
      await signInWithEmailAndPassword(auth, user.trim(), pass);

      //  fuerza token refresh inmediato
      await auth.currentUser?.getIdToken(true);

      showTemporaryMessage(setSuccessMessage, "¡Ingreso exitoso!", 800);

      //  navegación suave (evita carreras y recargas)
      router.push("/dashboard");
    } catch (err: any) {
      console.error("LOGIN FAIL:", err);
      showTemporaryMessage(setErrorMessage, "Credenciales incorrectas");
    }
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

          <Stack spacing={2}>
            <TextField
              label="Usuario (email)"
              fullWidth
              value={user}
              onChange={(e) => setUser(e.target.value)}
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

            <Link underline="hover" sx={{ color: "#8fa6ff", textAlign: "right", fontSize: "0.9rem", cursor: "pointer" }}>
              ¿Olvidaste tu contraseña?
            </Link>

            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
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
              Entrar
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
