"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../hooks/usePrestamoDetalle";
import { apiFetch } from "../../../lib/api";
import { useTasasInteres, TasaInteres } from "../../../hooks/useTasasInteres";
import { useFrecuenciasPago, FrecuenciaPago } from "../../../hooks/useFrecuenciasPago";
import { usePermisos } from "../../../hooks/usePermisos";

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;
const asNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const PrestamoDetallePage: React.FC = () => {
  const params = useParams();
  // En esta ruta el "id" realmente es el código del préstamo (ej: P-2026-001)
  const codigoPrestamo = params?.id as string;

  const searchParams = useSearchParams();
  const initialEditMode = useMemo(() => {
    const v = (searchParams?.get("edit") || "").toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }, [searchParams]);

  const [reloadKey, setReloadKey] = useState(0);
  const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, reloadKey);

  const { empleado, hasPermiso } = usePermisos();
  const rolActual = (empleado?.rol || "").toLowerCase();
  const isGerente = rolActual === "gerente";
  const canEditarPrestamo = hasPermiso("F002");

  const [editMode, setEditMode] = useState<boolean>(initialEditMode);
  const [saving, setSaving] = useState(false);

  const { data: tasas } = useTasasInteres();
  const { data: frecuencias } = useFrecuenciasPago();

  const [selectedTasa, setSelectedTasa] = useState<TasaInteres | null>(null);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaPago | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  const amortizacionRows = useMemo(() => {
    const raw = Array.isArray(data?.amortizacionPreview) ? data.amortizacionPreview : [];

    return raw
      .map((item, index) => {
        if (!isRecord(item)) return null;

        const cuotaNumero =
          asNumber(item.numeroCuota) ??
          asNumber(item.cuotaNumero) ??
          asNumber(item.nroCuota) ??
          index + 1;

        const interes = asNumber(item.interes) ?? 0;
        const capital = asNumber(item.capital) ?? 0;
        const cuota = asNumber(item.cuota) ?? capital + interes;
        const saldo = asNumber(item.saldoCapital) ?? asNumber(item.saldo) ?? 0;
        const estadoCuota = String(item.estadoCuota ?? "PENDIENTE").toUpperCase();

        return {
          id: String(item._id ?? item.id ?? `cuota-${cuotaNumero}`),
          cuotaNumero,
          fechaProgramada: typeof item.fechaProgramada === "string" ? item.fechaProgramada : undefined,
          interes,
          capital,
          cuota,
          saldo,
          estadoCuota,
        };
      })
      .filter(
        (x): x is {
          id: string;
          cuotaNumero: number;
          fechaProgramada: string | undefined;
          interes: number;
          capital: number;
          cuota: number;
          saldo: number;
          estadoCuota: string;
        } => x !== null
      )
      .sort((a, b) => a.cuotaNumero - b.cuotaNumero);
  }, [data?.amortizacionPreview]);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const tasaInteresLabel = useMemo(() => {
    const raw = selectedTasa?.porcentajeInteres ?? data?.tasaInteresAnual;
    if (raw == null) return "—";

    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return "—";

    const porcentaje = numeric <= 1 ? numeric * 100 : numeric;
    const decimal = numeric <= 1 ? numeric : numeric / 100;

    const porcentajeLabel = porcentaje.toLocaleString("es-HN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    const decimalLabel = decimal.toLocaleString("es-HN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });

    return `${porcentajeLabel}% (${decimalLabel})`;
  }, [selectedTasa, data]);

  const renderEstadoChip = (estado?: string) => {
    const val = (estado || "").toUpperCase();
    let color: "default" | "success" | "warning" | "error" | "info" = "info";

    if (val === "VIGENTE") color = "success";
    else if (val === "PENDIENTE") color = "warning";
    else if (val === "CERRADO") color = "default";
    else if (val === "RECHAZADO") color = "error";

    return <Chip size="small" label={val || "—"} color={color} variant="outlined" />;
  };

  useEffect(() => {
    if (!data) return;

    if (data.tasaInteresId) {
      const match = tasas.find((t) => String(t._id) === String(data.tasaInteresId) || String(t.codigoTasa ?? "") === String(data.tasaInteresId));
      const next = match ?? ({ _id: data.tasaInteresId, nombre: data.tasaInteresNombre ?? "Tasa actual" } as TasaInteres);
      setSelectedTasa((prev) => (prev && String(prev._id) === String(next._id) ? prev : next));
    }

    if (data.frecuenciaPago) {
      const raw = String(data.frecuenciaPago).toUpperCase();
      const normalized = raw === "DIARIO" ? "DIARIA" : raw;
      const nombre = (() => {
        if (normalized === "DIARIA") return "Días";
        if (normalized === "SEMANAL") return "Semanas";
        if (normalized === "QUINCENAL") return "Quincenas";
        if (normalized === "MENSUAL") return "Meses";
        return null;
      })();
      const match = nombre ? frecuencias.find((f) => String(f.nombre) === nombre) : null;
      setSelectedFrecuencia(match ?? null);
    }
  }, [data, tasas, frecuencias]);

  const onCancelEdit = () => {
    if (saving) return;
    setEditMode(false);
    setReloadKey((k) => k + 1);
  };

  const onSave = async () => {
    if (!data?.codigoPrestamo) return;

    if (!canEditarPrestamo) {
      setToastSeverity("error");
      setToastMessage("No tienes permisos para editar préstamos.");
      setToastOpen(true);
      return;
    }

    if (!selectedFrecuencia?.nombre) {
      setToastSeverity("error");
      setToastMessage("Debes seleccionar una frecuencia de pago.");
      setToastOpen(true);
      return;
    }


    const frecuenciaEnum = (() => {
      switch (selectedFrecuencia.nombre) {
        case "Días":
          return "DIARIA";
        case "Semanas":
          return "SEMANAL";
        case "Quincenas":
          return "QUINCENAL";
        case "Meses":
          return "MENSUAL";
        default:
          return null;
      }
    })();

    const frecuenciaActualEnum = (() => {
      const raw = String(data.frecuenciaPago || "").toUpperCase();
      return raw === "DIARIO" ? "DIARIA" : raw;
    })();

    const changedFrecuencia = frecuenciaEnum !== frecuenciaActualEnum;
    if (!frecuenciaEnum) {
      setToastSeverity("error");
      setToastMessage("Frecuencia de pago inválida.");
      setToastOpen(true);
      return;
    }

    setSaving(true);
    try {
      if (!changedFrecuencia) {
        setToastSeverity("info");
        setToastMessage("No hay cambios para guardar.");
        setToastOpen(true);
        return;
      }

      await apiFetch(`/prestamos/id/${encodeURIComponent(data.id)}/cambiar-frecuencia`, {
        method: "POST",
        body: JSON.stringify({ nuevaFrecuencia: frecuenciaEnum }),
      });

      setToastSeverity("success");
      setToastMessage("Préstamo actualizado.");
      setToastOpen(true);
      setEditMode(false);
      setReloadKey((k) => k + 1);
    } catch (e: unknown) {
      setToastSeverity("error");
      const msg = e instanceof Error ? e.message : "No se pudo actualizar el préstamo.";
      setToastMessage(msg);
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">No se pudo cargar la información del préstamo.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
        <Box>
          <Typography variant="h6">Préstamo {data.codigoPrestamo || ""}</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
            {renderEstadoChip(data.estadoPrestamo)}
            <Typography variant="caption" color="text.secondary">
              Cliente: {data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {isGerente && (
            <Button
              size="small"
              variant="outlined"
              component={Link}
              href={`/prestamos/${encodeURIComponent(data.codigoPrestamo)}/documentos`}
            >
              Contrato y pagaré
            </Button>
          )}
          {editMode && canEditarPrestamo ? (
            <>
              <Button size="small" variant="contained" onClick={onSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelEdit} disabled={saving}>
                Cancelar
              </Button>
            </>
          ) : (
            canEditarPrestamo ? (
              <Button size="small" variant="contained" onClick={() => setEditMode(true)}>
                Editar
              </Button>
            ) : null
          )}

          <Button size="small" variant="outlined" component={Link} href="/prestamos">
            Volver a lista
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Datos del préstamo</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <>
                  <Typography variant="caption" color="text.secondary">Capital</Typography>
                  <Typography>{formatMoney(data.capitalSolicitado)}</Typography>
                </>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Tasa de interés</Typography>
                <Typography>{tasaInteresLabel}</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Frecuencia de pago"
                    value={selectedFrecuencia?.nombre ?? ""}
                    onChange={(e) => {
                      const nombre = e.target.value;
                      const match = frecuencias.find((f) => String(f.nombre) === String(nombre));
                      setSelectedFrecuencia(match ?? null);
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Selecciona una frecuencia</em>
                    </MenuItem>
                    {frecuencias.map((f) => (
                      <MenuItem key={String(f._id)} value={String(f.nombre)}>
                        {String(f.nombre)}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <>
                    <Typography variant="caption" color="text.secondary">Frecuencia de pago</Typography>
                    <Typography>{data.frecuenciaPago || "—"}</Typography>
                  </>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Cuota fija</Typography>
                <Typography>{formatMoney(data.cuotaFija)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <>
                  <Typography variant="caption" color="text.secondary">Plazo (cuotas)</Typography>
                  <Typography>{data.plazoCuotas}</Typography>
                </>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <>
                  <Typography variant="caption" color="text.secondary">Desembolso</Typography>
                  <Typography>{formatDate(data.fechaDesembolso)}</Typography>
                </>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <>
                  <Typography variant="caption" color="text.secondary">Vencimiento</Typography>
                  <Typography>{formatDate(data.fechaVencimiento)}</Typography>
                </>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total intereses</Typography>
                <Typography>{data.totalIntereses != null ? formatMoney(data.totalIntereses) : "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total pagado</Typography>
                <Typography>{data.totalPagado != null ? formatMoney(data.totalPagado) : "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Saldo Pendiente por Pagar
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "1.1rem", color: "primary.main" }}>
                  {(() => {
                    // Usar saldoPendiente si está disponible
                    if (data.saldoPendiente != null) {
                      return formatMoney(data.saldoPendiente);
                    }
                    // Si no, intentar con saldo o saldoActual
                    if (data.saldo != null) {
                      return formatMoney(data.saldo);
                    }
                    if (data.saldoActual != null) {
                      return formatMoney(data.saldoActual);
                    }
                    // Si no están disponibles, calcular: (capital + intereses) - pagado
                    const capital = data.capitalSolicitado ?? 0;
                    const intereses = data.totalIntereses ?? 0;
                    const pagado = data.totalPagado ?? 0;
                    const totalAPagar = capital + intereses;
                    const pendiente = totalAPagar - pagado;
                    return formatMoney(pendiente);
                  })()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                <Typography>{data.observaciones || "—"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Estado</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Estado</Typography>
                <Typography>{data.estadoPrestamo || "—"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Activo</Typography>
                <Typography>{data.activo === false ? "No" : "Sí"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Tabla de amortización
        </Typography>

        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Cuota</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Interés</TableCell>
                <TableCell>Capital</TableCell>
                <TableCell>Cuota</TableCell>
                <TableCell>Saldo</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {amortizacionRows.map((row) => {
                const getEstadoColor = (estado: string) => {
                  switch (estado) {
                    case "PAGADA":
                      return "success";
                    case "ATRASADA":
                      return "error";
                    case "PARCIAL":
                      return "warning";
                    default:
                      return "default";
                  }
                };

                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.cuotaNumero}</TableCell>
                    <TableCell>{formatDate(row.fechaProgramada)}</TableCell>
                    <TableCell>{formatMoney(row.interes)}</TableCell>
                    <TableCell>{formatMoney(row.capital)}</TableCell>
                    <TableCell>{formatMoney(row.cuota)}</TableCell>
                    <TableCell>{formatMoney(row.saldo)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.estadoCuota}
                        color={getEstadoColor(row.estadoCuota) as any}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}

              {amortizacionRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay cuotas de amortización para este préstamo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} variant="filled" sx={{ width: "100%" }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrestamoDetallePage;
