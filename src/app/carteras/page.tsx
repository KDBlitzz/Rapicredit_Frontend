"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
} from "@mui/material";
import { apiFetch } from "@/lib/api";
import { useEmpleados, EstadoEmpleadoFiltro } from "@/hooks/useEmpleados";

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

// Tipos para la cartera por asesor
type EstadoCliente = "ACTIVO" | "INACTIVO";

interface ClienteCartera {
  id: string;
  nombreCompleto: string;
  estadoActual: EstadoCliente; // ACTIVO/INACTIVO
  enMora: boolean;
  vencido: boolean;
  castigado: boolean;
  diasMora: number;
  capitalDebe: number;
  interesesDebe: number;
  moraDebe: number;
  tienePrestamoActivo: boolean;
  // para clasificar nuevo/recurrente/nuevo por inactividad
  ultimaFechaFinanciamiento?: string | null;
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(n || 0);
  } catch {
    return `${n?.toFixed?.(2) ?? n}`;
  }
}

function classifyCliente(c: ClienteCartera) {
  // nuevo, recurrente, nuevo por inactividad (>30 días)
  if (!c.ultimaFechaFinanciamiento) return "Desconocido";
  const lastMs = Date.parse(c.ultimaFechaFinanciamiento);
  if (isNaN(lastMs)) return "Desconocido";
  const nowMs = Date.now();
  const diffDays = Math.floor((nowMs - lastMs) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) return "Nuevo por inactividad";
  // Suponemos: si tiene prestamo activo y diff <= 30, es recurrente; si no tiene, nuevo
  return c.tienePrestamoActivo ? "Recurrente" : "Nuevo";
}

export default function CarterasPage() {
  // Filtros de asesores
  const [estadoAsesor, setEstadoAsesor] = useState<EstadoEmpleadoFiltro>("TODOS");
  const [busquedaAsesor, setBusquedaAsesor] = useState("");
  const { data: asesores, loading: loadingAsesores, error: errorAsesores } = useEmpleados({
    busqueda: busquedaAsesor,
    // Cargamos TODOS para que Transferir siempre vea activos + inactivos.
    // El filtro de estado se aplica solo al combo de visualización.
    estado: "TODOS",
    rol: "ASESOR",
  });

  const asesoresParaVisualizar = useMemo(() => {
    if (estadoAsesor === "TODOS") return asesores;
    const expectActivo = estadoAsesor === "ACTIVO";
    return asesores.filter((a) => a.estado === expectActivo);
  }, [asesores, estadoAsesor]);

  // Selección para ver cartera
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<string>("");

  const codigoAsesorSeleccionado = useMemo(() => {
    if (!asesorSeleccionado) return "";
    const emp = asesores.find((a) => a._id === asesorSeleccionado);
    return emp?.codigoUsuario || asesorSeleccionado;
  }, [asesores, asesorSeleccionado]);

  // Selección para reasignación en bloque
  const [fromAsesor, setFromAsesor] = useState<string>("");
  const [toAsesor, setToAsesor] = useState<string>("");
  const [includeInactivos, setIncludeInactivos] = useState<boolean>(true);

  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Cartera del asesor seleccionado
  const [cartera, setCartera] = useState<ClienteCartera[]>([]);
  const [loadingCartera, setLoadingCartera] = useState<boolean>(false);
  const [errorCartera, setErrorCartera] = useState<string | null>(null);

  useEffect(() => {
    const id = asesorSeleccionado;
    const codigoAsesor = codigoAsesorSeleccionado;

    if (!id) {
      setCartera([]);
      return;
    }

    let cancelled = false;

    const fetchCartera = async () => {
      setLoadingCartera(true);
      setErrorCartera(null);
      setCartera([]);
      try {
        // Usar endpoint del backend para obtener los clientes asignados al empleado/asesor.
        // Backend: userRouter.get('/:codigoUsuario/clientes', ...)
        // Montado normalmente bajo /empleados (según tu indicación), pero dejamos fallback por si está bajo /user(s).
        const endpoints = [
          `/empleados/${encodeURIComponent(codigoAsesor)}/clientes`,
          `/users/${encodeURIComponent(codigoAsesor)}/clientes`,
          `/user/${encodeURIComponent(codigoAsesor)}/clientes`,
        ];

        let result: unknown | null = null;
        let lastErr: unknown | null = null;
        for (const ep of endpoints) {
          try {
            result = await apiFetch<unknown>(ep, { silent: true });
            break;
          } catch (e: unknown) {
            lastErr = e;
            const msg = getErrorMessage(e, "").toLowerCase();
            // Si es 404, probamos la siguiente ruta candidata
            if (msg.includes("404") || msg.includes("not found") || msg.includes("cannot")) continue;
            // Otros errores (401/403/500) los mostramos tal cual
            throw e;
          }
        }

        if (!result) {
          const raw = getErrorMessage(lastErr, "No se pudo cargar cartera");
          throw new Error(
            `No se encontró la ruta para obtener clientes por empleado. Rutas probadas: ${endpoints.join(", ")}\n` +
              `Detalle: ${raw}`
          );
        }

        // Mapeo flexible a ClienteCartera
        const container = asRecord(result);
        const rawList: unknown[] = Array.isArray(result)
          ? (result as unknown[])
          : Array.isArray(container["clientes"])
          ? (container["clientes"] as unknown[])
          : Array.isArray(container["data"])
          ? (container["data"] as unknown[])
          : [];

        const mapped: ClienteCartera[] = rawList.map((c: unknown) => {
          const rec = asRecord(c);

          const id = String(rec["_id"] ?? rec["id"] ?? "");
          const nombreCompleto =
            (typeof rec["nombreCompleto"] === "string" && rec["nombreCompleto"]) ||
            [rec["nombre"], rec["apellido"]].filter((x) => typeof x === "string" && x).join(" ") ||
            (typeof rec["razonSocial"] === "string" ? rec["razonSocial"] : "") ||
            "Cliente";

          const actividad = rec["actividad"];
          const estado = rec["estado"];
          const activo = rec["activo"];
          const estadoActual: EstadoCliente =
            actividad === false || estado === false || activo === false ? "INACTIVO" : "ACTIVO";

          return {
            id,
            nombreCompleto,
            estadoActual,
            enMora: Boolean((rec["enMora"] ?? rec["mora"]) ?? false),
            vencido: Boolean(rec["vencido"] ?? false),
            castigado: Boolean(rec["castigado"] ?? false),
            diasMora: Number(rec["diasMora"] ?? rec["dias_de_mora"] ?? 0),
            capitalDebe: Number(rec["capitalDebe"] ?? rec["capital_debe"] ?? rec["saldoCapital"] ?? 0),
            interesesDebe: Number(
              rec["interesesDebe"] ?? rec["interes_debe"] ?? rec["saldoInteres"] ?? 0,
            ),
            moraDebe: Number(rec["moraDebe"] ?? rec["saldoMora"] ?? 0),
            tienePrestamoActivo: Boolean(
              (rec["tienePrestamoActivo"] ?? rec["prestamoActivo"]) ?? false,
            ),
            ultimaFechaFinanciamiento:
              (typeof rec["ultimaFechaFinanciamiento"] === "string" && rec["ultimaFechaFinanciamiento"]) ||
              (typeof rec["lastFinanciamientoAt"] === "string" && rec["lastFinanciamientoAt"]) ||
              null,
          };
        });

        if (!cancelled) setCartera(mapped);
      } catch (e: unknown) {
        console.error(e);
        if (!cancelled) {
          setErrorCartera(getErrorMessage(e, "Error cargando cartera"));
          setCartera([]);
        }
      } finally {
        if (!cancelled) setLoadingCartera(false);
      }
    };

    fetchCartera();
    return () => {
      cancelled = true;
    };
  }, [asesorSeleccionado, codigoAsesorSeleccionado]);

  const resumen = useMemo(() => {
    const total = cartera.length;
    const activos = cartera.filter((c) => c.estadoActual === "ACTIVO").length;
    const inactivos = cartera.filter((c) => c.estadoActual === "INACTIVO").length;
    const enMora = cartera.filter((c) => c.enMora).length;
    const vencidos = cartera.filter((c) => c.vencido).length;
    const castigados = cartera.filter((c) => c.castigado).length;
    const categorias = cartera.reduce(
      (acc, c) => {
        const k = classifyCliente(c);
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { total, activos, inactivos, enMora, vencidos, castigados, categorias };
  }, [cartera]);

  const handleTransferirCartera = async () => {
    if (!fromAsesor || !toAsesor || fromAsesor === toAsesor) return;

    setTransferError(null);
    setTransferSuccess(null);
    setTransferLoading(true);

    try {
      const fromEmp = asesores.find((a) => a._id === fromAsesor);
      const toEmp = asesores.find((a) => a._id === toAsesor);

      const codigoActualEmpleado = fromEmp?.codigoUsuario;
      const codigoNuevoEmpleado = toEmp?.codigoUsuario;

      if (!codigoActualEmpleado) {
        throw new Error("El asesor origen no tiene 'codigoUsuario' disponible");
      }
      if (!codigoNuevoEmpleado) {
        throw new Error("El asesor destino no tiene 'codigoUsuario' disponible");
      }

      // En tu backend esta ruta viene de un router tipo userRouter.put('/transferir', ...)
      // pero el prefijo real puede variar según cómo se montó el router.
      // Probamos algunas rutas comunes SIN spamear la consola con 404.
      const endpoints = ["/user/transferir", "/users/transferir", "/empleados/transferir"];
      let done = false;
      let lastErr: unknown = null;
      for (const ep of endpoints) {
        try {
          await apiFetch(ep, {
            method: "PUT",
            body: JSON.stringify({ codigoActualEmpleado, codigoNuevoEmpleado }),
            silent: true,
          });
          done = true;
          break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = getErrorMessage(err, "").toLowerCase();
          if (msg.includes("404") || msg.includes("not found") || msg.includes("cannot")) {
            continue;
          }
          break;
        }
      }
      if (!done) {
        const raw = getErrorMessage(lastErr, "No se pudo transferir la cartera");
        const isNotFound = raw.toLowerCase().includes("404") || raw.toLowerCase().includes("not found") || raw.toLowerCase().includes("cannot");
        if (isNotFound) {
          throw new Error(
            `No se encontró la ruta de transferencia en el backend. Rutas probadas: ${endpoints.join(", ")}.\n` +
              `Detalle: ${raw}`
          );
        }
        throw lastErr ?? new Error("No se pudo transferir la cartera");
      }

      setTransferSuccess("Cartera transferida correctamente");

      // Si el usuario estaba visualizando al asesor origen, cambiar a destino
      if (asesorSeleccionado === fromAsesor) {
        setAsesorSeleccionado(toAsesor);
      }
    } catch (e: unknown) {
      console.error(e);
      setTransferError(getErrorMessage(e, "Error transfiriendo cartera"));
    } finally {
      setTransferLoading(false);
    }
  };

  const visibleCartera = useMemo(() => {
    return includeInactivos ? cartera : cartera.filter((c) => c.estadoActual === "ACTIVO");
  }, [cartera, includeInactivos]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Gestión de Carteras (Asesores)
      </Typography>

      {/* Filtros de asesores */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Estado asesor</InputLabel>
              <Select
                label="Estado asesor"
                value={estadoAsesor}
                onChange={(e) => setEstadoAsesor(e.target.value as EstadoEmpleadoFiltro)}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              label="Buscar asesor"
              value={busquedaAsesor}
              onChange={(e) => setBusquedaAsesor(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Asesor para visualizar cartera</InputLabel>
              <Select
                label="Asesor para visualizar cartera"
                value={asesorSeleccionado}
                onChange={(e) => setAsesorSeleccionado(e.target.value)}
              >
                {loadingAsesores && <MenuItem value=""><em>Cargando...</em></MenuItem>}
                {errorAsesores && <MenuItem value=""><em>Error</em></MenuItem>}
                {!loadingAsesores && asesoresParaVisualizar.map((a) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.nombreCompleto} {a.estado ? "(Activo)" : "(Inactivo)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Resumen y cartera */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Chip label={`Total: ${resumen.total}`} />
          <Chip label={`Activos: ${resumen.activos}`} color="success" variant="outlined" />
          <Chip label={`Inactivos: ${resumen.inactivos}`} color="default" variant="outlined" />
          <Chip label={`En mora: ${resumen.enMora}`} color="warning" variant="outlined" />
          <Chip label={`Vencidos: ${resumen.vencidos}`} color="error" variant="outlined" />
          <Chip label={`Castigados: ${resumen.castigados}`} color="error" />
          {Object.entries(resumen.categorias).map(([k, v]) => (
            <Chip key={k} label={`${k}: ${v}`} variant="outlined" />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant={includeInactivos ? "contained" : "outlined"}
            onClick={() => setIncludeInactivos(!includeInactivos)}
          >
            {includeInactivos ? "Mostrar solo activos" : "Mostrar activos + inactivos"}
          </Button>
        </Stack>

        {loadingCartera ? (
          <Stack direction="row" alignItems="center" spacing={1}><CircularProgress size={20} /> <Typography>Cargando cartera...</Typography></Stack>
        ) : errorCartera ? (
          <Typography color="error">{errorCartera}</Typography>
        ) : cartera.length === 0 ? (
          <Typography color="text.secondary">Este asesor no tiene clientes asignados</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>En mora</TableCell>
                <TableCell>Días mora</TableCell>
                <TableCell>Capital debe</TableCell>
                <TableCell>Intereses debe</TableCell>
                <TableCell>Mora debe</TableCell>
                <TableCell>Prestamo activo</TableCell>
                <TableCell>Clasificación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleCartera.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.nombreCompleto}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.estadoActual}
                      color={c.estadoActual === "ACTIVO" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {c.enMora ? <Chip label="En mora" color="warning" size="small" /> : <Chip label="Al día" size="small" />}
                    {c.vencido && <Chip sx={{ ml: 1 }} label="Vencido" color="error" size="small" />}
                    {c.castigado && <Chip sx={{ ml: 1 }} label="Castigado" color="error" size="small" />}
                  </TableCell>
                  <TableCell>{c.diasMora}</TableCell>
                  <TableCell>{formatCurrency(c.capitalDebe)}</TableCell>
                  <TableCell>{formatCurrency(c.interesesDebe)}</TableCell>
                  <TableCell>{formatCurrency(c.moraDebe)}</TableCell>
                  <TableCell>{c.tienePrestamoActivo ? "Sí" : "No"}</TableCell>
                  <TableCell>{classifyCliente(c)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Reasignación de cartera en bloque */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Transferir cartera</Typography>

        {transferError && <Alert severity="error" sx={{ mb: 2 }}>{transferError}</Alert>}
        {transferSuccess && <Alert severity="success" sx={{ mb: 2 }}>{transferSuccess}</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Desde asesor (inactivo)</InputLabel>
              <Select
                label="Desde asesor (inactivo)"
                value={fromAsesor}
                onChange={(e) => setFromAsesor(e.target.value)}
              >
                {asesores.filter((a) => !a.estado).map((a) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.nombreCompleto} {a.estado ? "(Activo)" : "(Inactivo)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Hacia asesor (activo)</InputLabel>
              <Select
                label="Hacia asesor (activo)"
                value={toAsesor}
                onChange={(e) => setToAsesor(e.target.value)}
              >
                {asesores.filter((a) => a.estado).map((a) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.nombreCompleto} {a.estado ? "(Activo)" : "(Inactivo)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                color="primary"
                disabled={transferLoading || !fromAsesor || !toAsesor || fromAsesor === toAsesor}
                onClick={handleTransferirCartera}
              >
                {transferLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} color="inherit" />
                    <span>Transfiriendo...</span>
                  </Stack>
                ) : (
                  "Transferir cartera"
                )}
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Box component="ul" sx={{ m: 0, pl: 2, color: "text.secondary" }}>
          <li>La reasignación la puede realizar Gerente o Supervisor.</li>
          <li>No puede haber clientes sin asesor; el backend debe validar asignación.</li>
          <li>Si un asesor queda inactivo, otro asesor puede dar seguimiento temporal.</li>
          <li>Clientes inactivos (&gt;30 días sin financiamiento) deben reflejarse en reporte de inactividad.</li>
        </Box>
      </Paper>
    </Box>
  );
}
