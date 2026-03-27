"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import {
  impresionCarterasApi,
  type CarteraAsesorGrupo,
  type EstadoRegistro,
  type TipoCartera,
} from "../../../services/impresionCarterasApi";
import { useImpresionCarteras } from "../../../hooks/useImpresionCarteras";
import { useEmpleadoActual } from "../../../hooks/useEmpleadoActual";

const now = new Date();
const first = new Date(now.getFullYear(), now.getMonth(), 1);

const toIso = (d: Date) => d.toISOString().slice(0, 10);
const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-HN", { year: "numeric", month: "short", day: "2-digit" });
};

const money = (n?: number) =>
  `L ${Number(n || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const tipoLabel: Record<TipoCartera, string> = {
  activa: "Activa",
  "por-cobrar": "Por-Cobrar",
  mora: "Mora",
};

const estadoChipColor = (estado: string): "success" | "warning" | "default" => {
  const up = estado.toUpperCase();
  if (up === "NUEVO") return "success";
  if (up === "RENOVADO") return "warning";
  return "default";
};

const ImpresionCarterasPage: React.FC = () => {
  const [tipo, setTipo] = useState<TipoCartera>("activa");
  const [desde, setDesde] = useState(toIso(first));
  const [hasta, setHasta] = useState(toIso(now));
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<EstadoRegistro>("TODOS");
  const [asesorId, setAsesorId] = useState<string>("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const { empleado } = useEmpleadoActual();

  const { data, loading, error, reload } = useImpresionCarteras({ desde, hasta, q, asesorId, estado });
  const rolActual = (empleado?.rol || "").toLowerCase();
  const isAsesor = rolActual === "asesor";

  const asesores = useMemo(() => data?.asesores ?? [], [data]);

  const filteredAsesores = useMemo(() => {
    if (tipo === "mora") {
      // En mora priorizamos asesores con interes alto como aproximacion de cartera morosa
      return [...asesores].sort((a, b) => b.interes - a.interes);
    }

    if (tipo === "por-cobrar") {
      return [...asesores].sort((a, b) => b.totalConInteres - a.totalConInteres);
    }

    return asesores;
  }, [asesores, tipo]);

  if (isAsesor) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          No tienes permisos para ver la impresión de carteras.
        </Alert>
      </Box>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput.trim());
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const openPdf = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setActionError(null);
    setExportingPdf(true);

    try {
      const blob = await impresionCarterasApi.getPdf(tipo, { desde, hasta, q, asesorId, estado });
      const isPdf = await impresionCarterasApi.isPdf(blob);
      if (!isPdf) throw new Error("El backend no devolvio un PDF valido");
      openPdf(blob);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error al generar PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (exportingExcel) return;
    setActionError(null);
    setExportingExcel(true);

    try {
      const blob = await impresionCarterasApi.getExcel(tipo, { desde, hasta, q, asesorId, estado });
      const isExcel = await impresionCarterasApi.isExcel(blob);
      if (!isExcel) throw new Error("El backend no devolvio un Excel valido");

      const file = `carteras-${tipo}-${hasta}.xlsx`;
      downloadBlob(blob, file);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error al exportar Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          background: "linear-gradient(135deg, rgba(18,65,52,0.75), rgba(15,32,34,0.95))",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.05 }}>
              Impresion de carteras
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Registro de prestamos por asesor con impresion PDF y exportacion Excel.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end" alignItems="stretch">
              <ToggleButtonGroup
                exclusive
                value={tipo}
                onChange={(_e, value) => value && setTipo(value)}
                size="small"
                color="primary"
              >
                <ToggleButton value="activa">Activa</ToggleButton>
                <ToggleButton value="por-cobrar">Por-Cobrar</ToggleButton>
                <ToggleButton value="mora">Mora</ToggleButton>
              </ToggleButtonGroup>

              <Button variant="contained" startIcon={<PrintIcon />} onClick={() => void handleExportPdf()} disabled={exportingPdf}>
                Imprimir PDF
              </Button>

              <Button variant="outlined" startIcon={<DescriptionIcon />} onClick={() => void handleExportExcel()} disabled={exportingExcel}>
                Exportar Excel
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Desde"
              InputLabelProps={{ shrink: true }}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Hasta"
              InputLabelProps={{ shrink: true }}
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
            <Chip
              icon={<CalendarMonthIcon />}
              label={`Periodo: ${formatDate(desde)} - ${formatDate(hasta)}`}
              variant="outlined"
              sx={{ width: "100%", justifyContent: "flex-start" }}
            />
          </Grid>
        </Grid>

        <Box component="form" onSubmit={handleSearch} sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por cliente o asesor"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Buscar
          </Button>
          <Button
            type="button"
            variant="text"
            onClick={() => {
              setSearchInput("");
              setQ("");
              reload();
            }}
          >
            Limpiar
          </Button>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          <Chip label="Todos" color={!asesorId ? "primary" : "default"} onClick={() => setAsesorId("")} />
          {asesores.map((a) => (
            <Chip
              key={a.asesorId}
              icon={<PersonIcon />}
              label={a.asesorNombre}
              color={asesorId === a.asesorId ? "primary" : "default"}
              onClick={() => setAsesorId(a.asesorId)}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          {(["TODOS", "NUEVO", "RENOVADO"] as EstadoRegistro[]).map((x) => (
            <Chip
              key={x}
              label={x}
              color={estado === x ? "success" : "default"}
              variant={estado === x ? "filled" : "outlined"}
              onClick={() => setEstado(x)}
            />
          ))}
        </Stack>
      </Paper>

      <Grid container spacing={1}>
        <Grid size={{ xs: 6, md: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Registros</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{data?.total.registros ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Nuevos</Typography>
            <Typography variant="h6" sx={{ color: "success.main", fontWeight: 800 }}>{data?.total.nuevos ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Renovados</Typography>
            <Typography variant="h6" sx={{ color: "warning.main", fontWeight: 800 }}>{data?.total.renovados ?? 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Monto</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{money(data?.total.monto)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Total + Interes</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{money(data?.total.totalConInteres)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Card variant="outlined"><CardContent>
            <Typography variant="caption" color="text.secondary">Interes</Typography>
            <Typography variant="h6" sx={{ color: "error.main", fontWeight: 800 }}>{money(data?.total.interes)}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="caption" color="text.secondary">Cargando reporte de carteras...</Typography>
        </Box>
      ) : null}

      {!loading && filteredAsesores.length === 0 ? (
        <Alert severity="info">No hay registros para los filtros seleccionados.</Alert>
      ) : null}

      <Stack spacing={1.5}>
        {filteredAsesores.map((grupo: CarteraAsesorGrupo) => (
          <Paper key={grupo.asesorId} sx={{ p: 1.5, borderRadius: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1,
                mb: 1,
                borderRadius: 2,
                bgcolor: "rgba(16,185,129,0.18)",
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>{grupo.asesorNombre}</Typography>
              <Typography variant="body2" color="text.secondary">{grupo.registros} prestamos</Typography>
            </Box>

            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Chip label={`Monto ${money(grupo.monto)}`} variant="outlined" sx={{ width: "100%" }} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Chip label={`TL+INT ${money(grupo.totalConInteres)}`} variant="outlined" sx={{ width: "100%" }} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Chip label={`Interes ${money(grupo.interes)}`} variant="outlined" sx={{ width: "100%" }} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Chip label={`${grupo.nuevos} nuevos / ${grupo.renovados} renovados`} variant="outlined" sx={{ width: "100%" }} />
              </Grid>
            </Grid>

            <Grid container spacing={1}>
              {grupo.prestamos.map((p) => (
                <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: p.estado === "NUEVO" ? "success.main" : p.estado === "RENOVADO" ? "warning.main" : "rgba(148,163,184,0.25)",
                    }}
                  >
                    <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{p.clienteNombre}</Typography>
                          <Typography variant="caption" color="text.secondary">{formatDate(p.fecha)}</Typography>
                        </Box>
                        <Chip size="small" label={p.estado} color={estadoChipColor(p.estado)} variant="outlined" />
                      </Box>

                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 6 }}>
                          <Paper variant="outlined" sx={{ p: 1 }}>
                            <Typography variant="caption" color="text.secondary">Monto</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{money(p.monto)}</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Paper variant="outlined" sx={{ p: 1 }}>
                            <Typography variant="caption" color="text.secondary">TL+INT</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{money(p.totalConInteres)}</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Paper variant="outlined" sx={{ p: 1 }}>
                            <Typography variant="caption" color="text.secondary">Intereses</Typography>
                            <Typography sx={{ fontWeight: 700, color: "error.main" }}>{money(p.interes)}</Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Paper variant="outlined" sx={{ p: 1 }}>
                            <Typography variant="caption" color="text.secondary">Cuota</Typography>
                            <Typography sx={{ fontWeight: 700, color: "success.main" }}>{money(p.cuota)}</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))}
      </Stack>

      <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(16,185,129,0.28)" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Total del mes - {tipoLabel[tipo]}
        </Typography>

        <Grid container spacing={1}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Monto total</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{money(data?.total.monto)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">TL+INT</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{money(data?.total.totalConInteres)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Intereses</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{money(data?.total.interes)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Registros</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{data?.total.registros ?? 0}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ImpresionCarterasPage;
