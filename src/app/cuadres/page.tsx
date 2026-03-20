"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  MenuItem,
  Button,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  usePagosPorAsesor,
  usePagos,
  useCuadre,
  useMoraDetallada,
  useGastosCaja,
  useDesembolsosCaja,
} from "../../hooks/useCaja";
import { usePrestamos } from "../../hooks/usePrestamos";
import type { Pago } from "../../services/cajaApi";
import { empleadosApi, type EmpleadoMongo } from "../../services/empleadosApi";
import { gastosApi } from "../../services/gastosApi";
import { parseDateInput, toOffsetISOString } from "../../lib/dateRange";
import { useEmpleadoActual } from "../../hooks/useEmpleadoActual";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const tabs = [
  { value: "RESUMEN", label: "Resumen" },
  { value: "PAGOS", label: "Pagos" },
  { value: "DESEMBOLSOS", label: "Desembolsos" },
  { value: "GASTOS", label: "Gastos" },
  { value: "MORA", label: "Mora Detallada" },
];

const COMPROBANTE_STORAGE_KEY = "rapicredit:comprobanteAbono";

const normalizeCodigo = (v: string) => String(v || "").trim().toUpperCase();

export default function CuadresPage() {
  const router = useRouter();
  const hoy = todayISO();

  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [asesorId, setAsesorId] = useState<string | "TODOS">("TODOS");
  const [tab, setTab] = useState<"RESUMEN" | "PAGOS" | "DESEMBOLSOS" | "GASTOS" | "MORA">("RESUMEN");
  const [refreshKey, setRefreshKey] = useState(0);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const [savingGasto, setSavingGasto] = useState(false);
  const [savingDesembolso, setSavingDesembolso] = useState(false);

  const [gastoForm, setGastoForm] = useState({
    fecha: hoy,
    asesorId: "",
    monto: "",
    categoria: "",
    descripcion: "",
    referencia: "",
    origen: "EFECTIVO" as "EFECTIVO" | "BANCO",
  });

  const [desembolsoForm, setDesembolsoForm] = useState({
    fecha: hoy,
    asesorId: "",
    monto: "",
    descripcion: "",
    referencia: "",
  });

  const { empleado: empleadoActual } = useEmpleadoActual();
  const rolActual = (empleadoActual?.rol || "").toLowerCase();
  const isAsesor = rolActual === "asesor";

  const {
    data: prestamosAll,
    loading: loadingPrestamos,
    error: errorPrestamos,
  } = usePrestamos({ busqueda: "", estado: "TODOS" }, { refreshKey: undefined });

  type PrestamoOption = { codigoPrestamo: string; clienteNombre: string };
  const prestamoOptions = useMemo((): PrestamoOption[] => {
    return (prestamosAll ?? [])
      .filter((p) => !!p.codigoPrestamo)
      .map((p) => ({
        codigoPrestamo: String(p.codigoPrestamo).trim(),
        clienteNombre: String(p.clienteNombre || "—").trim(),
      }))
      .filter((x) => !!x.codigoPrestamo)
      .sort((a, b) => a.codigoPrestamo.localeCompare(b.codigoPrestamo, "es"));
  }, [prestamosAll]);

  const prestamoOptionByCodigo = useMemo(() => {
    const m = new Map<string, PrestamoOption>();
    for (const opt of prestamoOptions) {
      const key = normalizeCodigo(opt.codigoPrestamo);
      if (!key) continue;
      if (!m.has(key)) m.set(key, opt);
    }
    return m;
  }, [prestamoOptions]);

  const [asesores, setAsesores] = useState<EmpleadoMongo[]>([]);
  const [loadingAsesores, setLoadingAsesores] = useState(false);
  const [errorAsesores, setErrorAsesores] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingAsesores(true);
      setErrorAsesores(null);
      try {
        const res = await empleadosApi.list({ includeInactivos: false });
        const users = Array.isArray(res.users) ? res.users : [];

        const finalList = users.filter((u) => {
          const rol = String(u.rol || "").trim().toLowerCase();
          return rol !== "caja";
        });

        finalList.sort((a, b) =>
          String(a.nombreCompleto || a.usuario || a.codigoUsuario || "").localeCompare(
            String(b.nombreCompleto || b.usuario || b.codigoUsuario || ""),
            "es"
          )
        );

        if (!cancelled) setAsesores(finalList);
      } catch (err: unknown) {
        if (!cancelled) {
          setAsesores([]);
          setErrorAsesores(err instanceof Error ? err.message : "Error cargando asesores");
        }
      } finally {
        if (!cancelled) setLoadingAsesores(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAsesor = useMemo(() => {
    if (asesorId === "TODOS") return null;
    return asesores.find((a) => a._id === asesorId) || null;
  }, [asesorId, asesores]);

  // Hook para pagos por asesor específico
  const cobradorIdActual = asesorId === "TODOS" ? undefined : (asesorId as string);
  const { data: pagosPorAsesor, loading: loadingPagoAsesor, error: errorPagoAsesor } = 
    usePagosPorAsesor(cobradorIdActual, fechaInicio, fechaFin, refreshKey);

  // Hook para todos los pagos
  const { data: pagosTodos, loading: loadingPagosTodos, error: errorPagosTodos } = 
    usePagos(fechaInicio, fechaFin, refreshKey);

  // Hook para cuadre general
  const { data: cuadreData, loading: loadingCuadre, error: errorCuadre } = 
    useCuadre(fechaInicio, fechaFin, refreshKey);

  // Hooks para gastos y desembolsos
  const codigoCobradorIdActual = asesorId === "TODOS" ? undefined : (selectedAsesor?.codigoUsuario || undefined);

  const { data: gastosData, loading: loadingGastos, error: errorGastos } = useGastosCaja(
    codigoCobradorIdActual,
    fechaInicio,
    fechaFin,
    refreshKey
  );

  const { data: desembolsosData, loading: loadingDesembolsos, error: errorDesembolsos } = useDesembolsosCaja(
    codigoCobradorIdActual,
    fechaInicio,
    fechaFin,
    refreshKey
  );

  // Hook para mora detallada
  const { data: moraData, loading: loadingMora, error: errorMora } = 
    useMoraDetallada(cobradorIdActual, undefined, refreshKey);

  const selectedAsesorNombre = useMemo(() => {
    if (asesorId === "TODOS") return "Todos los asesores";
    const a = asesores.find((c) => c._id === asesorId);
    return a?.nombreCompleto || a?.usuario || a?.codigoUsuario || "Asesor";
  }, [asesorId, asesores]);

  useEffect(() => {
    if (asesorId === "TODOS") return;
    const id = asesorId as string;

    setGastoForm((prev) => ({ ...prev, asesorId: id }));
    setDesembolsoForm((prev) => ({ ...prev, asesorId: id }));
  }, [asesorId]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    // Forzar recarga incluso si los filtros no cambian
    setRefreshKey((k) => k + 1);
  };

  const resolveAsesorNombre = (id?: string, nombre?: string) => {
    if (nombre) return nombre;
    if (!id) return "—";
    const a = asesores.find((c) => c._id === id || c.codigoUsuario === id);
    return a?.nombreCompleto || a?.usuario || a?.codigoUsuario || "—";
  };

  const handleSubmitDesembolso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!desembolsoForm.fecha || !desembolsoForm.asesorId || !desembolsoForm.monto) {
      setSnackbarMsg("Completa fecha, asesor y monto");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const monto = Number(String(desembolsoForm.monto).replace(",", "."));
    if (!Number.isFinite(monto) || monto <= 0) {
      setSnackbarMsg("El monto debe ser mayor a 0");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSavingDesembolso(true);
    try {
      const codigoRegistradoPor = empleadoActual?.codigoUsuario;
      if (!codigoRegistradoPor) {
        throw new Error("No se pudo identificar el usuario logueado");
      }

      const asesor = asesores.find((a) => a._id === desembolsoForm.asesorId) || null;
      const codigoCobradorId = asesor?.codigoUsuario;
      if (!codigoCobradorId) {
        throw new Error("El asesor seleccionado no tiene codigoUsuario");
      }

      await gastosApi.create({
        codigoGasto: `DES-${Date.now()}`,
        fechaGasto: toOffsetISOString(parseDateInput(desembolsoForm.fecha)),
        tipoGasto: "DESEMBOLSO",
        descripcion: (desembolsoForm.descripcion || "").trim() || undefined,
        monto,
        codigoCobradorId,
        codigoPrestamo: (desembolsoForm.referencia || "").trim() || undefined,
        codigoRegistradoPor,
      });

      setSnackbarMsg("Desembolso registrado");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setRefreshKey((k) => k + 1);
      setDesembolsoForm((prev) => ({ ...prev, monto: "", descripcion: "", referencia: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo registrar el desembolso";
      setSnackbarMsg(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSavingDesembolso(false);
    }
  };

  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gastoForm.fecha || !gastoForm.asesorId || !gastoForm.monto) {
      setSnackbarMsg("Completa fecha, asesor y monto");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const monto = Number(String(gastoForm.monto).replace(",", "."));
    if (!Number.isFinite(monto) || monto <= 0) {
      setSnackbarMsg("El monto debe ser mayor a 0");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSavingGasto(true);
    try {
      const codigoRegistradoPor = empleadoActual?.codigoUsuario;
      if (!codigoRegistradoPor) {
        throw new Error("No se pudo identificar el usuario logueado");
      }

      const asesor = asesores.find((a) => a._id === gastoForm.asesorId) || null;
      const codigoCobradorId = asesor?.codigoUsuario;
      if (!codigoCobradorId) {
        throw new Error("El asesor seleccionado no tiene codigoUsuario");
      }

      const tipoGasto = (gastoForm.categoria || "").trim() || "GASTO";
      const descripcionParts = [
        (gastoForm.descripcion || "").trim(),
        gastoForm.origen ? `Origen: ${gastoForm.origen}` : "",
      ].filter(Boolean);

      await gastosApi.create({
        codigoGasto: `GAS-${Date.now()}`,
        fechaGasto: toOffsetISOString(parseDateInput(gastoForm.fecha)),
        tipoGasto,
        descripcion: descripcionParts.join(" | ") || undefined,
        monto,
        codigoCobradorId,
        codigoPrestamo: (gastoForm.referencia || "").trim() || undefined,
        codigoRegistradoPor,
      });

      setSnackbarMsg("Gasto registrado");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setRefreshKey((k) => k + 1);
      setGastoForm((prev) => ({ ...prev, monto: "", categoria: "", descripcion: "", referencia: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo registrar el gasto";
      setSnackbarMsg(msg);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSavingGasto(false);
    }
  };

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (d?: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("es-HN");
  };

  const resolveAsesorNombrePorCodigoUsuario = (codigoUsuario?: string) => {
    if (!codigoUsuario) return "—";
    const a = asesores.find((x) => x.codigoUsuario === codigoUsuario);
    return a?.nombreCompleto || a?.usuario || a?.codigoUsuario || codigoUsuario;
  };

  const resolveAsesorNombrePorReferencia = (ref?: string) => {
    if (!ref) return undefined;
    const normalized = String(ref).trim();
    if (!normalized) return undefined;
    const a = asesores.find((x) => x._id === normalized || x.codigoUsuario === normalized);
    return a?.nombreCompleto || a?.usuario || a?.codigoUsuario;
  };

  const asRecord = (v: unknown): Record<string, unknown> | null => {
    if (!v || typeof v !== "object") return null;
    return v as Record<string, unknown>;
  };

  const getPagoCobradorId = (pago: Pago): string | undefined => {
    const raw = pago?.cobradorId;
    if (!raw) return undefined;
    if (typeof raw === "string") return raw;
    const rec = asRecord(raw);
    if (rec) {
      const id = rec["_id"] ?? rec["id"] ?? rec["codigoUsuario"];
      return id != null ? String(id) : undefined;
    }
    return undefined;
  };

  const getPagoCobradorNombre = (pago: Pago): string | undefined => {
    const asesorRecord = asRecord((pago as Record<string, unknown>)["asesor"]);
    if (asesorRecord) {
      const n = asesorRecord["nombreCompleto"] ?? asesorRecord["usuario"] ?? asesorRecord["codigoUsuario"];
      if (typeof n === "string" && n.trim()) return n;
      const fromAsesorRef = resolveAsesorNombrePorReferencia(
        String(asesorRecord["codigoUsuario"] ?? asesorRecord["id"] ?? "")
      );
      if (fromAsesorRef) return fromAsesorRef;
    }

    const cobradorRaw = pago?.cobradorId;
    const cobradorRecord = asRecord(cobradorRaw);
    if (cobradorRecord) {
      const n =
        cobradorRecord["nombreCompleto"] ??
        cobradorRecord["usuario"] ??
        cobradorRecord["codigoUsuario"];
      if (typeof n === "string" && n.trim()) return n;
    }

    const pagoRec = pago as Record<string, unknown>;
    const posiblesRefs = [
      getPagoCobradorId(pago),
      typeof pagoRec["codigoRegistradoPor"] === "string" ? String(pagoRec["codigoRegistradoPor"]) : undefined,
      typeof pagoRec["registradoPor"] === "string" ? String(pagoRec["registradoPor"]) : undefined,
      typeof pagoRec["usuarioRegistro"] === "string" ? String(pagoRec["usuarioRegistro"]) : undefined,
      typeof pagoRec["creadoPor"] === "string" ? String(pagoRec["creadoPor"]) : undefined,
    ].filter(Boolean) as string[];

    for (const ref of posiblesRefs) {
      const resolved = resolveAsesorNombrePorReferencia(ref);
      if (resolved) return resolved;
    }

    const registradoPorRecord = asRecord(pagoRec["registradoPor"]);
    if (registradoPorRecord) {
      const n =
        registradoPorRecord["nombreCompleto"] ??
        registradoPorRecord["usuario"] ??
        registradoPorRecord["codigoUsuario"];
      if (typeof n === "string" && n.trim()) return n;
      const resolved = resolveAsesorNombrePorReferencia(
        String(registradoPorRecord["codigoUsuario"] ?? registradoPorRecord["id"] ?? "")
      );
      if (resolved) return resolved;
    }

    return undefined;
  };

  const getPagoClienteLabel = (pago: Pago): string => {
    const raw = pago?.clienteId;
    if (!raw) return "—";
    if (typeof raw === "string") return raw;
    const rec = asRecord(raw);
    if (rec) {
      const codigo = typeof rec["codigoCliente"] === "string" ? rec["codigoCliente"] : "";
      const identidad = typeof rec["identidadCliente"] === "string" ? rec["identidadCliente"] : "";
      return [codigo, identidad].filter(Boolean).join(" · ") || "—";
    }
    return "—";
  };

  const getPagoPrestamoLabel = (pago: Pago): string => {
    const raw = pago?.prestamoId;
    if (!raw) return "—";
    if (typeof raw === "string") return raw;
    const rec = asRecord(raw);
    if (rec) {
      const codigo = rec["codigoPrestamo"];
      if (typeof codigo === "string" && codigo.trim()) return codigo;
    }
    return "—";
  };

  const pagosResp = asesorId === "TODOS" ? pagosTodos : pagosPorAsesor;
  const pagosData = useMemo(() => pagosResp?.pagos ?? [], [pagosResp]);
  const pagosLoading = asesorId === "TODOS" ? loadingPagosTodos : loadingPagoAsesor;
  const pagosError = asesorId === "TODOS" ? errorPagosTodos : errorPagoAsesor;

  const totalPagos = useMemo(
    () =>
      pagosData.reduce(
        (acc, p) => acc + (typeof p.montoPago === "number" ? p.montoPago : 0),
        0
      ),
    [pagosData]
  );

  const totalGastos = useMemo(
    () => gastosData.reduce((acc, g) => acc + (typeof g.monto === "number" ? g.monto : 0), 0),
    [gastosData]
  );
  const totalDesembolsos = useMemo(
    () => desembolsosData.reduce((acc, d) => acc + (typeof d.monto === "number" ? d.monto : 0), 0),
    [desembolsosData]
  );

  const cuadreTotales = useMemo(() => {
    if (!cuadreData) return null;
    if (asesorId === "TODOS") return cuadreData.totales;
    const row = cuadreData.porAsesor.find((r) => r.cobradorId === asesorId || r.asesor?.id === asesorId);
    if (!row) return null;
    return {
      cantidadPagos: row.cantidadPagos,
      totalMonto: row.totalMonto,
      totalMora: row.totalMora,
      totalInteres: row.totalInteres,
      totalCapital: row.totalCapital,
    };
  }, [asesorId, cuadreData]);

  const cuadrePorAsesor = useMemo(() => {
    if (!cuadreData) return [];
    if (asesorId === "TODOS") return cuadreData.porAsesor;
    return cuadreData.porAsesor.filter((r) => r.cobradorId === asesorId || r.asesor?.id === asesorId);
  }, [asesorId, cuadreData]);

  const cuadrePorMetodo = useMemo(() => {
    if (!cuadreData) return [];
    if (asesorId !== "TODOS") return [];
    return cuadreData.porMetodo;
  }, [asesorId, cuadreData]);

  const moraDetalleRows = useMemo(() => {
    const groups = moraData?.porAsesor ?? [];
    const rows: Array<{
      key: string;
      asesorNombre: string;
      cliente: string;
      codigoPrestamo: string;
      fechaVencimiento?: string;
      saldoCapital?: number;
      moraPlan?: number;
      moraCobrada?: number;
      totalPago?: number;
      ultimoPago?: string | null;
      depositoAnticipado?: number;
      haPagado?: boolean;
    }> = [];

    for (const g of groups) {
      const asesorNombre = g.asesor?.nombreCompleto || g.asesor?.usuario || g.asesor?.codigoUsuario || "—";
      for (const d of g.detalle || []) {
        const clienteCodigo = d.cliente?.codigoCliente || "";
        const clienteId = d.cliente?.identidadCliente || "";
        const cliente = [clienteCodigo, clienteId].filter(Boolean).join(" · ") || "—";
        rows.push({
          key: `${d.prestamoId}-${clienteCodigo}-${d.fechaVencimiento}`,
          asesorNombre,
          cliente,
          codigoPrestamo: d.codigoPrestamo,
          fechaVencimiento: d.fechaVencimiento,
          saldoCapital: d.saldoCapital,
          moraPlan: d.totalMoraPlan,
          moraCobrada: d.totalMoraCobrada,
          totalPago: d.totalPago,
          ultimoPago: d.ultimoPago,
          depositoAnticipado: d.depositoAnticipado,
          haPagado: d.haPagado,
        });
      }
    }

    return rows;
  }, [moraData]);

  // Estados de carga y error
  const isLoading =
    (tab === "PAGOS" && pagosLoading) ||
    (tab === "DESEMBOLSOS" && loadingDesembolsos) ||
    (tab === "GASTOS" && loadingGastos) ||
    (tab === "RESUMEN" && loadingCuadre) ||
    (tab === "MORA" && loadingMora);

  const currentError =
    (tab === "PAGOS" && pagosError) ||
    (tab === "DESEMBOLSOS" && errorDesembolsos) ||
    (tab === "GASTOS" && errorGastos) ||
    (tab === "RESUMEN" && errorCuadre) ||
    (tab === "MORA" && errorMora);

  if (isAsesor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No tienes acceso a la vista de cuadres.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Encabezado */}
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Cuadre de Caja
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pagos, desembolsos y gastos por asesor para cuadre de caja
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleBuscar}
          sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}
        >
          <TextField
            type="date"
            size="small"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <TextField
            select
            size="small"
            label="Asesor"
            value={asesorId}
            onChange={(e) => setAsesorId(e.target.value as string | "TODOS")}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="TODOS">Todos los asesores</MenuItem>
            {loadingAsesores && <MenuItem disabled value="__loading">Cargando asesores...</MenuItem>}
            {errorAsesores && <MenuItem disabled value="__error">{errorAsesores}</MenuItem>}
            {asesores.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.nombreCompleto || c.usuario || c.codigoUsuario || c._id}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="outlined" size="small" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : "Actualizar"}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ p: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Vistas de cuadre"
        >
          {tabs.map((t) => (
            <Tab key={t.value} label={t.label} value={t.value} />
          ))}
        </Tabs>
      </Paper>

      {/* Error Messages */}
      {currentError && (
        <Alert severity="error">
          {currentError}
        </Alert>
      )}

      {/* RESUMEN: Cuadre General */}
      {tab === "RESUMEN" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : cuadreData ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Resumen del Cuadre
                </Typography>
                <Chip
                  size="small"
                  label={`${formatDate(cuadreData.desde || undefined)} - ${formatDate(
                    cuadreData.hasta || undefined
                  )}`}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.primary.main, 0.18)
                          : "primary.light",
                    })}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Cantidad de Pagos
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {cuadreTotales?.cantidadPagos ?? 0}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.success.main, 0.18)
                          : "success.light",
                    })}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Total Monto
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatMoney(cuadreTotales?.totalMonto ?? 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.common.white, 0.06)
                          : "grey.100",
                    })}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Capital
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatMoney(cuadreTotales?.totalCapital ?? 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.common.white, 0.06)
                          : "grey.100",
                    })}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Interés
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatMoney(cuadreTotales?.totalInteres ?? 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 1,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.error.main, 0.18)
                          : "error.light",
                    })}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Mora
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatMoney(cuadreTotales?.totalMora ?? 0)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {cuadrePorMetodo.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Desglose por Método
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={(theme) => ({
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? alpha(theme.palette.common.white, 0.06)
                                : "grey.100",
                          })}
                        >
                          <TableCell>Método</TableCell>
                          <TableCell align="right">Cantidad Pagos</TableCell>
                          <TableCell align="right">Total Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cuadrePorMetodo.map((m) => (
                          <TableRow key={String(m.metodoPago)}>
                            <TableCell>{String(m.metodoPago)}</TableCell>
                            <TableCell align="right">{m.cantidadPagos}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatMoney(m.totalMonto)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {cuadrePorAsesor.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Desglose por Asesor
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={(theme) => ({
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? alpha(theme.palette.common.white, 0.06)
                                : "grey.100",
                          })}
                        >
                          <TableCell>Asesor</TableCell>
                          <TableCell align="right">Cantidad Pagos</TableCell>
                          <TableCell align="right">Total Monto</TableCell>
                          <TableCell align="right">Capital</TableCell>
                          <TableCell align="right">Interés</TableCell>
                          <TableCell align="right">Mora</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cuadrePorAsesor.map((d) => (
                          <TableRow key={d.cobradorId}>
                            <TableCell>
                              {d.asesor?.nombreCompleto || resolveAsesorNombre(d.cobradorId)}
                            </TableCell>
                            <TableCell align="right">{d.cantidadPagos}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatMoney(d.totalMonto)}
                            </TableCell>
                            <TableCell align="right">{formatMoney(d.totalCapital)}</TableCell>
                            <TableCell align="right">{formatMoney(d.totalInteres)}</TableCell>
                            <TableCell align="right">{formatMoney(d.totalMora)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          ) : (
            <Alert severity="info">No hay datos de cuadre para este período</Alert>
          )}
        </Box>
      )}

      {/* PAGOS */}
      {tab === "PAGOS" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Pagos - {selectedAsesorNombre}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip size="small" label={`${pagosData.length} registros`} />
              <Chip size="small" color="primary" label={formatMoney(totalPagos)} />
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pagosData.length === 0 ? (
            <Alert severity="info">No hay pagos registrados para este filtro</Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow
                    sx={(theme) => ({
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.common.white, 0.06)
                          : "grey.100",
                    })}
                  >
                    <TableCell>Fecha</TableCell>
                    {asesorId === "TODOS" && <TableCell>Asesor</TableCell>}
                    <TableCell>Cliente</TableCell>
                    <TableCell>Préstamo</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Comprobante</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosData.map((pago, idx) => {
                    const estado = String(pago.estado ?? "—");
                    const monto = typeof pago.montoPago === "number" ? pago.montoPago : 0;
                    const canOpenComprobante = Boolean(pago?.numeroComprobante || pago?._id);
                    return (
                      <TableRow key={String(pago._id ?? `${idx}`)}>
                        <TableCell>{formatDate(pago.fechaPago)}</TableCell>
                        {asesorId === "TODOS" && (
                          <TableCell>{getPagoCobradorNombre(pago) || "—"}</TableCell>
                        )}
                        <TableCell>{getPagoClienteLabel(pago)}</TableCell>
                        <TableCell>{getPagoPrestamoLabel(pago)}</TableCell>
                        <TableCell>{String(pago.metodoPago ?? "—")}</TableCell>
                        <TableCell>
                          {canOpenComprobante ? (
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => {
                                try {
                                  const recibo = String(pago.numeroComprobante || pago._id || "").trim();
                                  const asesorNombre = (getPagoCobradorNombre(pago) || "—").toUpperCase();
                                  const clienteLabel = String(getPagoClienteLabel(pago) || "—").toUpperCase();
                                  const codigoPrestamo = String(getPagoPrestamoLabel(pago) || "");

                                  const comprobante = {
                                    pagoId: pago._id ? String(pago._id) : undefined,
                                    recibo: recibo || String(Date.now()).slice(-5),
                                    codigoPrestamo,
                                    fecha: String(pago.fechaPago || new Date().toISOString()),
                                    cliente: clienteLabel,
                                    asesor: asesorNombre,
                                    metodoPago: String(pago.metodoPago || "").toUpperCase(),
                                    referencia: pago.numeroComprobante ? String(pago.numeroComprobante) : undefined,
                                    observaciones: pago.observaciones ? String(pago.observaciones) : undefined,
                                    monto,
                                    saldoPendiente: undefined,
                                    cuotasPendientes: undefined,
                                    cuotasPagadas: [
                                      {
                                        numero: 1,
                                        cuota: 0,
                                        pago: monto,
                                        multa: 0,
                                      },
                                    ],
                                  };
                                  sessionStorage.setItem(COMPROBANTE_STORAGE_KEY, JSON.stringify(comprobante));
                                } catch {
                                  // ignore
                                }
                                router.push("/pagos/comprobante");
                              }}
                            >
                              {String(pago.numeroComprobante ?? "Ver")}
                            </Button>
                          ) : (
                            String(pago.numeroComprobante ?? "—")
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatMoney(monto)}
                        </TableCell>
                      <TableCell>
                        <Chip
                          label={estado}
                          size="small"
                          color={estado.toLowerCase() === "completado" ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* DESEMBOLSOS */}
      {tab === "DESEMBOLSOS" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Registrar desembolso
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmitDesembolso}
                sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={desembolsoForm.fecha}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                />

                <TextField
                  select
                  size="small"
                  label="Asesor"
                  value={desembolsoForm.asesorId}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, asesorId: e.target.value }))
                  }
                >
                  <MenuItem value="">Selecciona un asesor</MenuItem>
                  {asesores.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.nombreCompleto || c.usuario || c.codigoUsuario || c._id}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Monto"
                  value={desembolsoForm.monto}
                  inputProps={{ inputMode: "decimal" }}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    if (normalized !== "" && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
                    setDesembolsoForm((prev) => ({ ...prev, monto: normalized }));
                  }}
                />

                <TextField
                  size="small"
                  label="Descripción"
                  value={desembolsoForm.descripcion}
                  onChange={(e) =>
                    setDesembolsoForm((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />

                <Autocomplete
                  options={prestamoOptions}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.codigoPrestamo)}
                  loading={loadingPrestamos}
                  loadingText="Cargando préstamos…"
                  noOptionsText={errorPrestamos ? "Sin acceso a préstamos" : "Sin resultados"}
                  value={prestamoOptionByCodigo.get(normalizeCodigo(desembolsoForm.referencia)) ?? null}
                  inputValue={desembolsoForm.referencia}
                  onInputChange={(_e, v) => setDesembolsoForm((prev) => ({ ...prev, referencia: v }))}
                  onChange={(_e, opt) => {
                    if (typeof opt === "string") {
                      setDesembolsoForm((prev) => ({ ...prev, referencia: opt }));
                      return;
                    }

                    setDesembolsoForm((prev) => ({ ...prev, referencia: opt?.codigoPrestamo || "" }));
                  }}
                  renderOption={(props, opt) => {
                    if (typeof opt === "string") {
                      return (
                        <Box component="li" {...props}>
                          {opt}
                        </Box>
                      );
                    }

                    return (
                      <Box component="li" {...props} sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {opt.codigoPrestamo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.clienteNombre}
                        </Typography>
                      </Box>
                    );
                  }}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Código préstamo"
                      placeholder="Ej: P-2026-001"
                      helperText="Opcional: selecciona o escribe el código del préstamo"
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={savingDesembolso}
                >
                  {savingDesembolso ? <CircularProgress size={20} /> : "Registrar"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Desembolsos - {selectedAsesorNombre}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={`${desembolsosData.length} registros`} />
                  <Chip size="small" color="warning" label={formatMoney(totalDesembolsos)} />
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : desembolsosData.length === 0 ? (
                <Alert severity="info">No hay desembolsos para este filtro</Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow
                        sx={(theme) => ({
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? alpha(theme.palette.common.white, 0.06)
                              : "grey.100",
                        })}
                      >
                        <TableCell>Fecha</TableCell>
                        <TableCell>Asesor</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Código préstamo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {desembolsosData.map((d, idx) => (
                        <TableRow key={String(d._id ?? d.codigoGasto ?? `${idx}`)}>
                          <TableCell>{formatDate(d.fechaGasto)}</TableCell>
                          <TableCell>{resolveAsesorNombrePorCodigoUsuario(d.codigoCobradorId)}</TableCell>
                          <TableCell>{(d.descripcion as string) || "—"}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatMoney(typeof d.monto === "number" ? d.monto : 0)}
                          </TableCell>
                          <TableCell>{(d.codigoPrestamo as string) || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* GASTOS */}
      {tab === "GASTOS" && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Registrar gasto
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmitGasto}
                sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={gastoForm.fecha}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, fecha: e.target.value }))}
                />

                <TextField
                  select
                  size="small"
                  label="Asesor"
                  value={gastoForm.asesorId}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, asesorId: e.target.value }))}
                >
                  <MenuItem value="">Selecciona un asesor</MenuItem>
                  {asesores.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.nombreCompleto || c.usuario || c.codigoUsuario || c._id}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  label="Monto"
                  value={gastoForm.monto}
                  inputProps={{ inputMode: "decimal" }}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(",", ".");
                    if (normalized !== "" && !/^\d*\.?\d{0,2}$/.test(normalized)) return;
                    setGastoForm((prev) => ({ ...prev, monto: normalized }));
                  }}
                />

                <TextField
                  select
                  size="small"
                  label="Origen"
                  value={gastoForm.origen}
                  onChange={(e) =>
                    setGastoForm((prev) => ({ ...prev, origen: e.target.value as "EFECTIVO" | "BANCO" }))
                  }
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="BANCO">Banco</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  label="Categoría"
                  value={gastoForm.categoria}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, categoria: e.target.value }))}
                />

                <TextField
                  size="small"
                  label="Descripción"
                  value={gastoForm.descripcion}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                />

                <Autocomplete
                  options={prestamoOptions}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.codigoPrestamo)}
                  loading={loadingPrestamos}
                  loadingText="Cargando préstamos…"
                  noOptionsText={errorPrestamos ? "Sin acceso a préstamos" : "Sin resultados"}
                  value={prestamoOptionByCodigo.get(normalizeCodigo(gastoForm.referencia)) ?? null}
                  inputValue={gastoForm.referencia}
                  onInputChange={(_e, v) => setGastoForm((prev) => ({ ...prev, referencia: v }))}
                  onChange={(_e, opt) => {
                    if (typeof opt === "string") {
                      setGastoForm((prev) => ({ ...prev, referencia: opt }));
                      return;
                    }

                    setGastoForm((prev) => ({ ...prev, referencia: opt?.codigoPrestamo || "" }));
                  }}
                  renderOption={(props, opt) => {
                    if (typeof opt === "string") {
                      return (
                        <Box component="li" {...props}>
                          {opt}
                        </Box>
                      );
                    }

                    return (
                      <Box component="li" {...props} sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {opt.codigoPrestamo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.clienteNombre}
                        </Typography>
                      </Box>
                    );
                  }}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Código préstamo"
                      placeholder="Ej: P-2026-001"
                      helperText="Opcional: selecciona o escribe el código del préstamo"
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  disabled={savingGasto}
                >
                  {savingGasto ? <CircularProgress size={20} /> : "Registrar"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Gastos - {selectedAsesorNombre}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip size="small" label={`${gastosData.length} registros`} />
                  <Chip size="small" color="error" label={formatMoney(totalGastos)} />
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : gastosData.length === 0 ? (
                <Alert severity="info">No hay gastos para este filtro</Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow
                        sx={(theme) => ({
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? alpha(theme.palette.common.white, 0.06)
                              : "grey.100",
                        })}
                      >
                        <TableCell>Fecha</TableCell>
                        <TableCell>Asesor</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Código préstamo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gastosData.map((g, idx) => (
                        <TableRow key={String(g._id ?? g.codigoGasto ?? `${idx}`)}>
                          <TableCell>{formatDate(g.fechaGasto)}</TableCell>
                          <TableCell>{resolveAsesorNombrePorCodigoUsuario(g.codigoCobradorId)}</TableCell>
                          <TableCell>{(g.tipoGasto as string) || "—"}</TableCell>
                          <TableCell>{(g.descripcion as string) || "—"}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatMoney(typeof g.monto === "number" ? g.monto : 0)}
                          </TableCell>
                          <TableCell>{(g.codigoPrestamo as string) || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* MORA DETALLADA */}
      {tab === "MORA" && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Mora Detallada - {selectedAsesorNombre}
            </Typography>
            <Chip size="small" label={`${moraDetalleRows.length} registros`} />
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : moraDetalleRows.length === 0 ? (
            <Alert severity="success">
              ¡Excelente! No hay mora registrada para este filtro
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow
                    sx={(theme) => ({
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? alpha(theme.palette.common.white, 0.06)
                          : "grey.100",
                    })}
                  >
                    <TableCell>Asesor</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Préstamo</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell align="right">Mora plan</TableCell>
                    <TableCell align="right">Mora cobrada</TableCell>
                    <TableCell align="right">Total pago</TableCell>
                    <TableCell>Último pago</TableCell>
                    <TableCell align="right">Dep. anticipado</TableCell>
                    <TableCell>Ha pagado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {moraDetalleRows.map((row, idx) => (
                    <TableRow key={row.key || String(idx)}>
                      <TableCell>{row.asesorNombre}</TableCell>
                      <TableCell>{row.cliente}</TableCell>
                      <TableCell>{row.codigoPrestamo || "—"}</TableCell>
                      <TableCell>{formatDate(row.fechaVencimiento)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "warning.main" }}>
                        {formatMoney(row.moraPlan ?? 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                        {formatMoney(row.moraCobrada ?? 0)}
                      </TableCell>
                      <TableCell align="right">{formatMoney(row.totalPago ?? 0)}</TableCell>
                      <TableCell>{row.ultimoPago ? formatDate(row.ultimoPago) : "—"}</TableCell>
                      <TableCell align="right">{formatMoney(row.depositoAnticipado ?? 0)}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.haPagado ? "Sí" : "No"}
                          size="small"
                          color={row.haPagado ? "success" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
