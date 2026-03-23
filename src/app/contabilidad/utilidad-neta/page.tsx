"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useGastosCaja, usePagos as useCajaPagos } from "../../../hooks/useCaja";
import type { Gasto } from "../../../services/gastosApi";
import type { Pago as CajaPago } from "../../../services/cajaApi";

function isoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const formatMoney = (v?: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
    : "L. 0.00";

const sumMontoPagos = (pagos: CajaPago[]) =>
  pagos.reduce((acc, p) => acc + (typeof p.montoPago === "number" ? p.montoPago : 0), 0);

const sumMontoGastos = (gastos: Gasto[]) =>
  gastos.reduce((acc, g) => acc + (typeof g.monto === "number" ? g.monto : 0), 0);

type GastoCategoriaRow = {
  categoria: string;
  cantidad: number;
  total: number;
};

export default function UtilidadNetaPage() {
  const now = new Date();
  const hoy = isoDate(now);
  const inicioMes = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const [fechaInicio, setFechaInicio] = useState(inicioMes);
  const [fechaFin, setFechaFin] = useState(hoy);

  const { data: pagosResp, loading: loadingPagos, error: errorPagos } = useCajaPagos(
    fechaInicio,
    fechaFin
  );
  const pagos = pagosResp?.pagos ?? [];
  const totalIngresos = useMemo(() => sumMontoPagos(pagos), [pagos]);

  const { data: gastos, loading: loadingGastos, error: errorGastos } = useGastosCaja(
    undefined,
    fechaInicio,
    fechaFin
  );
  const totalGastos = useMemo(() => sumMontoGastos(gastos), [gastos]);

  const utilidadNeta = useMemo(() => totalIngresos - totalGastos, [totalIngresos, totalGastos]);

  const gastosPorCategoria = useMemo<GastoCategoriaRow[]>(() => {
    const map = new Map<string, { cantidad: number; total: number }>();
    for (const g of gastos) {
      const raw = typeof g.tipoGasto === "string" ? g.tipoGasto.trim() : "";
      const categoria = raw || "Sin categoría";
      const monto = typeof g.monto === "number" && Number.isFinite(g.monto) ? g.monto : 0;
      const cur = map.get(categoria) ?? { cantidad: 0, total: 0 };
      cur.cantidad += 1;
      cur.total += monto;
      map.set(categoria, cur);
    }
    return Array.from(map.entries())
      .map(([categoria, v]) => ({ categoria, cantidad: v.cantidad, total: v.total }))
      .sort((a, b) => b.total - a.total);
  }, [gastos]);

  const loading = loadingPagos || loadingGastos;
  const error = errorPagos || errorGastos;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h6">Utilidad neta</Typography>
            <Typography variant="caption" color="text.secondary">
              Ingresos por financiamientos (pagos) – gastos registrados (sin desembolsos).
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              label="Desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="Hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Chip size="small" label={`Ingresos: ${formatMoney(totalIngresos)}`} />
            <Chip size="small" label={`Gastos: ${formatMoney(totalGastos)}`} />
            <Chip
              size="small"
              color={utilidadNeta >= 0 ? "success" : "error"}
              label={`Utilidad neta: ${formatMoney(utilidadNeta)}`}
            />
          </Box>
        </Box>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Typography variant="subtitle1">Gastos por categoría</Typography>
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Cargando…
                  </Typography>
                </Box>
              ) : null}
            </Box>

            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gastosPorCategoria.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          No hay gastos en el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {gastosPorCategoria.map((row) => (
                    <TableRow key={row.categoria} hover>
                      <TableCell>{row.categoria}</TableCell>
                      <TableCell align="right">{row.cantidad.toLocaleString("es-HN")}</TableCell>
                      <TableCell align="right">{formatMoney(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Resumen</Typography>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label={`Total ingresos (pagos): ${formatMoney(totalIngresos)}`} />
              <Chip label={`Total gastos: ${formatMoney(totalGastos)}`} />
              <Chip
                color={utilidadNeta >= 0 ? "success" : "error"}
                label={`Utilidad neta: ${formatMoney(utilidadNeta)}`}
              />
              <Typography variant="caption" color="text.secondary">
                Nota: “DESEMBOLSO” se excluye de gastos para no distorsionar la utilidad.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
