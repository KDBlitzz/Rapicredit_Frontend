"use client";

import { useState } from "react";
import {
    Box, Card, CardContent, TextField, Typography,
    Button, Stack, Alert, IconButton, InputAdornment, Link
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LoginPage() {
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const showTemporaryMessage = (setter: React.Dispatch<React.SetStateAction<string>>, message: string, duration = 2000) => {
        setter(message);
        setTimeout(() => setter(""), duration);
    };

    const handleLogin = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const res = await fetch(`${apiUrl}/empleados/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: user, password: pass }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("LOGIN FAIL:", res.status, data);
                showTemporaryMessage(setErrorMessage, "Credenciales Incorrectas");
                return;
            }

            localStorage.setItem("token", data.token);
            showTemporaryMessage(setSuccessMessage, "¡Ingreso exitoso!");

            // Redirigir después del mensaje
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500);

        } catch (error) {
            showTemporaryMessage(setErrorMessage, "Error de conexión con el servidor");
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

            {/* Logo en el fondo */}
            <Box
                component="img"
                src="/img/logo3.png" // <- reemplaza con la ruta de tu logo
                alt="Logo"
                sx={{
                    position: "absolute",
                    top: "10%",       // ajusta la altura
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 550,       // ajusta tamaño
                    opacity: 0.1,     // poca opacidad
                    pointerEvents: "none", // para que no interfiera con el login
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
                            label="Usuario"
                            fullWidth
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            InputLabelProps={{ style: { color: "#b9c4ff" } }}
                            inputProps={{ style: { color: "white" } }}
                            sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(76,117,255,0.35)" }, "&:hover fieldset": { borderColor: "rgba(76,117,255,0.55)" } } }}
                        />

                        <TextField
                            label="Contraseña"
                            type={showPass ? "text" : "password"}
                            fullWidth
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            InputLabelProps={{ style: { color: "#b9c4ff" } }}
                            inputProps={{ style: { color: "white" } }}
                            sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(76,117,255,0.35)" }, "&:hover fieldset": { borderColor: "rgba(76,117,255,0.55)" } } }}
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
                            sx={{ mt: 1, py: 1.3, borderRadius: 2, fontWeight: 700, background: "#3A6DFF", ":hover": { background: "#5C86FF" }, boxShadow: "0 0 12px rgba(76,117,255,0.35)" }}
                        >
                            Entrar
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
