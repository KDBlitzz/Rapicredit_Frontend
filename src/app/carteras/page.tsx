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
} from "@mui/material";
import { apiFetch } from "@/lib/api";
import { useEmpleados, EstadoEmpleadoFiltro, Empleado } from "@/hooks/useEmpleados";

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
    estado: estadoAsesor,
    rol: "ASESOR",
  });

  // Selección para ver cartera
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<string>("");

  // Selección para reasignación en bloque
  const [fromAsesor, setFromAsesor] = useState<string>("");
  const [toAsesor, setToAsesor] = useState<string>("");
  const [includeInactivos, setIncludeInactivos] = useState<boolean>(true);

  const selectedAdvisor: Empleado | undefined = useMemo(
    () => asesores.find((a) => a._id === (asesorSeleccionado || fromAsesor)),
    [asesores, asesorSeleccionado, fromAsesor]
  );

  // Cartera del asesor seleccionado
  const [cartera, setCartera] = useState<ClienteCartera[]>([]);
  const [loadingCartera, setLoadingCartera] = useState<boolean>(false);
  const [errorCartera, setErrorCartera] = useState<string | null>(null);

  useEffect(() => {
    const id = asesorSeleccionado;
    if (!id) {
      setCartera([]);
      return;
    }

    const fetchCartera = async () => {
      setLoadingCartera(true);
      setErrorCartera(null);
      try {
        // Intentamos varios endpoints posibles
        const candidates = [
          `/carteras/asesor/${id}`,
          `/clientes?asesorId=${encodeURIComponent(id)}`,
        ];
        let result: any = null;
        let lastErr: any = null;
        for (const ep of candidates) {
          try {
            result = await apiFetch<any>(ep);
            if (result) break;
          } catch (e: any) {
            lastErr = e;
            const msg = String(e?.message || "").toLowerCase();
            if (msg.includes("404") || msg.includes("not found") || msg.includes("cannot get")) {
              continue;
            }
            break;
          }
        }
        if (!result) throw lastErr || new Error("No se pudo cargar cartera");

        // Mapeo flexible a ClienteCartera
        const mapped: ClienteCartera[] = (Array.isArray(result) ? result : result?.clientes || []).map((c: any) => ({
          id: String(c._id ?? c.id ?? ""),
          nombreCompleto:
            c.nombreCompleto || [c.nombre, c.apellido].filter(Boolean).join(" ") || c.razonSocial || "Cliente",
          estadoActual: (c.actividad === false || c.estado === false) ? "INACTIVO" : "ACTIVO",
          enMora: Boolean(c.enMora ?? c.mora ?? false),
          vencido: Boolean(c.vencido ?? false),
          castigado: Boolean(c.castigado ?? false),
          diasMora: Number(c.diasMora ?? c.dias_de_mora ?? 0),
          capitalDebe: Number(c.capitalDebe ?? c.capital_debe ?? c.saldoCapital ?? 0),
          interesesDebe: Number(c.interesesDebe ?? c.interes_debe ?? c.saldoInteres ?? 0),
          moraDebe: Number(c.moraDebe ?? c.saldoMora ?? 0),
          tienePrestamoActivo: Boolean(c.tienePrestamoActivo ?? c.prestamoActivo ?? false),
          ultimaFechaFinanciamiento: c.ultimaFechaFinanciamiento ?? c.lastFinanciamientoAt ?? null,
        }));

        setCartera(mapped);
      } catch (e: any) {
        console.error(e);
        setErrorCartera(e?.message || "Error cargando cartera");
        setCartera([]);
      } finally {
        setLoadingCartera(false);
      }
    };

    fetchCartera();
  }, [asesorSeleccionado]);

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

  const handleReassignAll = async () => {
    if (!fromAsesor || !toAsesor || fromAsesor === toAsesor) return;
    try {
      const payload = { fromUsuarioId: fromAsesor, toUsuarioId: toAsesor, includeInactivos };
      // Intentar endpoints comunes
      const candidates = [
        { path: "/carteras/reasignar", method: "POST" },
        { path: "/clientes/reasignar", method: "POST" },
      ];
      let ok = false;
      let lastErr: any = null;
      for (const c of candidates) {
        try {
          await apiFetch(c.path, { method: c.method, body: JSON.stringify(payload) });
          ok = true;
          break;
        } catch (e: any) {
          lastErr = e;
          const msg = String(e?.message || "").toLowerCase();
          if (msg.includes("404") || msg.includes("not found") || msg.includes("cannot")) continue;
          break;
        }
      }
      if (!ok) throw lastErr || new Error("No se pudo reasignar la cartera");
      // Actualizar vistas
      if (asesorSeleccionado === fromAsesor) {
        setAsesorSeleccionado(toAsesor);
      }
    } catch (e: any) {
      alert(e?.message || "Error en la reasignación");
      console.error(e);
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
                {!loadingAsesores && asesores.map((a) => (
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
        <Typography variant="h6" sx={{ mb: 2 }}>Reasignar cartera</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Desde asesor</InputLabel>
              <Select label="Desde asesor" value={fromAsesor} onChange={(e) => setFromAsesor(e.target.value)}>
                {asesores.map((a) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.nombreCompleto} {a.estado ? "(Activo)" : "(Inactivo)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Hacia asesor</InputLabel>
              <Select label="Hacia asesor" value={toAsesor} onChange={(e) => setToAsesor(e.target.value)}>
                {asesores.map((a) => (
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
                disabled={!fromAsesor || !toAsesor || fromAsesor === toAsesor}
                onClick={handleReassignAll}
              >
                Reasignar toda la cartera
              </Button>
              <Button
                variant={includeInactivos ? "contained" : "outlined"}
                onClick={() => setIncludeInactivos(!includeInactivos)}
              >
                {includeInactivos ? "Incluir inactivos" : "Excluir inactivos"}
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
