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
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReplayIcon from "@mui/icons-material/Replay";
import { useEstadoCuentaDetalle, useEstadoCuentaSearch } from "../../../hooks/useEstadoCuenta";
import {
  estadoCuentaApi,
  isLikelyHtml,
  isLikelyPdf,
  openHtmlInNewWindow,
  revokeObjectUrlLater,
  toObjectUrl,
} from "../../../services/estadoCuentaApi";

type CuotaEstadoColor = "success" | "warning" | "error" | "info" | "default";

const formatMoney = (n?: number | null) =>
  `L ${Number(n || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const mapEstadoChipColor = (estado?: string): CuotaEstadoColor => {
  const e = String(estado || "").toUpperCase();
  if (e === "PAGADA") return "success";
  if (e === "PENDIENTE") return "warning";
  if (e.includes("VENCIDA")) return "error";
  if (e === "PARCIAL") return "info";
  return "default";
};

const EstadoCuentaPage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [term, setTerm] = useState("");
  const [selectedPrestamoId, setSelectedPrestamoId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [openingPrintable, setOpeningPrintable] = useState(false);

  const { data: resultados, loading: loadingSearch, error: errorSearch, reload: reloadSearch } = useEstadoCuentaSearch(term);
  const {
    data: detalle,
    loading: loadingDetalle,
    error: errorDetalle,
    reload: reloadDetalle,
  } = useEstadoCuentaDetalle(selectedPrestamoId);

  const handleBuscar = (event: React.FormEvent) => {
    event.preventDefault();
    setActionError(null);
    setTerm(searchText.trim());
  };

  const handleSelectPrestamo = (prestamoId: string) => {
    setActionError(null);
    setSelectedPrestamoId(prestamoId);
  };

  const handleVerMasRecientes = () => {
    setActionError(null);
    setSearchText("");
    setTerm("");
    reloadSearch();
  };

  const handleOpenPrintable = async () => {
    if (!selectedPrestamoId || openingPrintable) return;

    setActionError(null);
    setOpeningPrintable(true);

    try {
      const html = await estadoCuentaApi.getImprimibleHtml(selectedPrestamoId);
      if (!isLikelyHtml(html)) {
        throw new Error("El backend no devolvio una vista imprimible valida");
      }

      const opened = openHtmlInNewWindow(html, "Estado de Cuenta Imprimible");
      if (!opened) {
        throw new Error("No se pudo abrir la ventana de impresion. Revisa el bloqueador de ventanas.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al abrir vista imprimible";
      setActionError(message);
    } finally {
      setOpeningPrintable(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedPrestamoId || downloadingPdf) return;

    setActionError(null);
    setDownloadingPdf(true);

    try {
      const blob = await estadoCuentaApi.getPdf(selectedPrestamoId);
      const validPdf = await isLikelyPdf(blob);

      if (!validPdf) {
        const text = await blob.text();
        throw new Error(
          isLikelyHtml(text)
            ? "El backend respondio HTML en lugar de PDF. Revisa permisos o ruta del endpoint."
            : "El backend no devolvio un PDF valido."
        );
      }

      const url = toObjectUrl(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estado-cuenta-${selectedPrestamoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      revokeObjectUrlLater(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al descargar PDF";
      setActionError(message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const barras = useMemo(() => {
    const d = detalle?.distribucionPagos;
    if (!d) return null;

    return [
      { key: "capital", label: "Capital", value: Number(d.capital || 0), color: "#22c55e" },
      { key: "interes", label: "Interes", value: Number(d.interes || 0), color: "#f59e0b" },
      { key: "mora", label: "Mora", value: Number(d.mora || 0), color: "#f97316" },
    ];
  }, [detalle]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Estado de cuenta
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Buscar por cliente, codigo de cliente o codigo de prestamo para consultar, imprimir y descargar PDF.
        </Typography>

        <Box
          component="form"
          onSubmit={handleBuscar}
          sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por cliente, codigo cliente o prestamo"
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }}
          />
          <Button type="submit" variant="contained" disabled={loadingSearch}>
            Buscar
          </Button>
          <Button type="button" variant="outlined" onClick={handleVerMasRecientes} disabled={loadingSearch}>
            Recientes
          </Button>
        </Box>
      </Paper>

      {errorSearch ? <Alert severity="error">{errorSearch}</Alert> : null}
      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1, flexWrap: "wrap" }}>
          <Typography variant="subtitle2">Resultados</Typography>
          <Button size="small" variant="text" startIcon={<ReplayIcon />} onClick={reloadSearch}>
            Actualizar
          </Button>
        </Box>

        {loadingSearch ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="caption" color="text.secondary">
              Buscando prestamos...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1}>
            {resultados.map((item) => {
              const selected = selectedPrestamoId === item.prestamoId;

              return (
                <Grid key={item.prestamoId} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: selected ? "success.main" : "rgba(148,163,184,0.25)",
                      bgcolor: selected ? "rgba(16,185,129,0.12)" : "background.paper",
                    }}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack spacing={0.4}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.cliente.nombre || "Sin nombre"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(item.cliente.codigoCliente || "-") + " · " + item.codigoPrestamo}
                        </Typography>
                        <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Chip size="small" label={item.estadoPrestamo || "-"} variant="outlined" />
                          <Button size="small" onClick={() => handleSelectPrestamo(item.prestamoId)}>
                            Ver
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {!loadingSearch && resultados.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  No se encontraron resultados para la busqueda.
                </Typography>
              </Grid>
            ) : null}
          </Grid>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 1 }}>
          <Typography variant="subtitle2">Detalle de estado de cuenta</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled={!selectedPrestamoId || loadingDetalle || openingPrintable}
              onClick={() => void handleOpenPrintable()}
            >
              Imprimible
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<PictureAsPdfIcon />}
              disabled={!selectedPrestamoId || loadingDetalle || downloadingPdf}
              onClick={() => void handleDownloadPdf()}
            >
              PDF
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<ReplayIcon />}
              disabled={!selectedPrestamoId}
              onClick={reloadDetalle}
            >
              Recargar
            </Button>
          </Box>
        </Box>

        {loadingDetalle ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="caption" color="text.secondary">
              Cargando detalle del estado de cuenta...
            </Typography>
          </Box>
        ) : null}

        {errorDetalle ? <Alert severity="error">{errorDetalle}</Alert> : null}

        {!selectedPrestamoId ? (
          <Typography variant="caption" color="text.secondary">
            Selecciona un prestamo para ver su estado de cuenta.
          </Typography>
        ) : null}

        {detalle ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                background:
                  "linear-gradient(135deg, rgba(20,60,52,0.6) 0%, rgba(12,34,31,0.9) 100%)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detalle.cliente.nombre || "Cliente"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {(detalle.cliente.codigoCliente || "-") + " · " + detalle.prestamo.codigoPrestamo}
              </Typography>

              <Grid container spacing={1}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="caption" color="text.secondary">Fecha de apertura</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{formatDate(detalle.prestamo.fechaApertura)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="caption" color="text.secondary">Primer pago</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{formatDate(detalle.prestamo.primerPago)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="caption" color="text.secondary">Monto otorgado</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{formatMoney(detalle.prestamo.montoOtorgado)}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Paper variant="outlined" sx={{ p: 1.25 }}>
                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{detalle.prestamo.estadoPrestamo || "-"}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={1}>
              <Grid size={{ xs: 6, md: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="caption" color="text.secondary">Saldo actual</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatMoney(detalle.resumen.saldoActual)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="caption" color="text.secondary">Interes pendiente</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatMoney(detalle.resumen.interesPendiente)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="caption" color="text.secondary">Mora pendiente</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatMoney(detalle.resumen.moraPendiente)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="caption" color="text.secondary">Mora pagada</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatMoney(detalle.resumen.moraPagada)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="caption" color="text.secondary">Saldo capital</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatMoney(detalle.resumen.saldoCapital)}</Typography>
                </CardContent></Card>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="caption" color="text.secondary">Saldo total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatMoney(detalle.resumen.saldoTotal)}</Typography>
                </CardContent></Card>
              </Grid>
            </Grid>

            {barras ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Distribucion de cada pago
                </Typography>

                <Stack spacing={1.2}>
                  {barras.map((b) => (
                    <Box key={b.key}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.3 }}>
                        <Typography variant="body2">{b.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{b.value.toFixed(1)}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, b.value))}
                        sx={{
                          height: 10,
                          borderRadius: 999,
                          bgcolor: "rgba(148,163,184,0.2)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: b.color,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            ) : null}

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Detalle de todos los pagos
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: "success.main", fontWeight: 700 }}>
                Total pagado: {formatMoney(detalle.resumen.totalPagado)}
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Programada</TableCell>
                      <TableCell>Pago</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="right">Capital</TableCell>
                      <TableCell align="right">Interes</TableCell>
                      <TableCell align="right">Mora</TableCell>
                      <TableCell align="right">Pendiente</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detalle.cuotas.map((c) => {
                      const pendiente = c.pendienteCapital + c.pendienteInteres + c.pendienteMora;
                      return (
                        <TableRow key={c.numero}>
                          <TableCell>{c.numero}</TableCell>
                          <TableCell>
                            <Chip size="small" color={mapEstadoChipColor(c.estado)} label={c.estado} />
                          </TableCell>
                          <TableCell>{formatDate(c.fechaProgramada)}</TableCell>
                          <TableCell>{formatDate(c.fechaPago)}</TableCell>
                          <TableCell align="right">{formatMoney(c.monto)}</TableCell>
                          <TableCell align="right">{formatMoney(c.capital)}</TableCell>
                          <TableCell align="right">{formatMoney(c.interes)}</TableCell>
                          <TableCell align="right">{formatMoney(c.mora)}</TableCell>
                          <TableCell align="right">{formatMoney(pendiente)}</TableCell>
                        </TableRow>
                      );
                    })}

                    {detalle.cuotas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <Typography variant="caption" color="text.secondary">
                            No hay cuotas para mostrar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
};

export default EstadoCuentaPage;
