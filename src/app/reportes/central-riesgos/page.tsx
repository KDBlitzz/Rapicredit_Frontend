"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";

const CentralRiesgosPage: React.FC = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const formatMoney = (v?: number) =>
    v != null
      ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
      : "L. 0.00";

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulación de carga de datos
    setTimeout(() => {
      setData({
        totalPrestamos: 145,
        montoTotal: 2850000,
        prestamosMora: 23,
        montoMora: 485000,
        prestamos: [
          {
            id: 1,
            cliente: "Juan Pérez López",
            identidad: "0801-1990-12345",
            monto: 25000,
            saldo: 18500,
            diasMora: 0,
            estadoCredito: "Al día",
            fechaDesembolso: "2024-01-15",
          },
          {
            id: 2,
            cliente: "María Rodríguez García",
            identidad: "0801-1985-67890",
            monto: 15000,
            saldo: 12000,
            diasMora: 15,
            estadoCredito: "Mora leve",
            fechaDesembolso: "2024-02-10",
          },
          {
            id: 3,
            cliente: "Carlos Martínez Flores",
            identidad: "0801-1992-11111",
            monto: 30000,
            saldo: 22500,
            diasMora: 0,
            estadoCredito: "Al día",
            fechaDesembolso: "2024-01-20",
          },
        ],
      });
      setLoading(false);
    }, 1000);
  };

  const handleExportarXLSX = () => {
    alert("Exportando a XLSX... (Funcionalidad por implementar)");
  };

  const handleExportarPDF = () => {
    alert("Exportando a PDF... (Funcionalidad por implementar)");
  };

  const getEstadoChip = (estado: string) => {
    const colorMap: Record<string, "success" | "warning" | "error"> = {
      "Al día": "success",
      "Mora leve": "warning",
      "Mora grave": "error",
    };
    return <Chip label={estado} size="small" color={colorMap[estado] || "default"} />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Reporte Central de Riesgos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Genera el reporte de préstamos para enviar a la central de riesgos crediticios.
          Incluye información detallada de todos los créditos activos, estado de mora y comportamiento
          de pago de los clientes.
        </Typography>
      </Box>

      {/* Formulario de filtros */}
      <Paper sx={{ p: 3 }}>
        <Box
          component="form"
          onSubmit={handleGenerarReporte}
          sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
        >
          <TextField
            type="date"
            size="small"
            label="Fecha Inicio"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <TextField
            type="date"
            size="small"
            label="Fecha Fin"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Generando..." : "Generar Reporte"}
          </Button>
        </Box>
      </Paper>

      {/* Resumen */}
      {data && (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Préstamos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {data.totalPrestamos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Monto Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {formatMoney(data.montoTotal)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Préstamos en Mora
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: "error.main" }}>
                    {data.prestamosMora}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Monto en Mora
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: "error.main" }}>
                    {formatMoney(data.montoMora)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Acciones de exportación */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={handleExportarXLSX}
            >
              Exportar XLSX
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportarPDF}
            >
              Exportar PDF
            </Button>
          </Box>

          {/* Tabla de préstamos */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(148,163,184,0.25)" }}>
              <Typography variant="h6">Detalle de Préstamos</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Identidad</TableCell>
                    <TableCell align="right">Monto Original</TableCell>
                    <TableCell align="right">Saldo Actual</TableCell>
                    <TableCell align="center">Días Mora</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha Desembolso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.prestamos.map((prestamo: any) => (
                    <TableRow key={prestamo.id} hover>
                      <TableCell>{prestamo.cliente}</TableCell>
                      <TableCell>{prestamo.identidad}</TableCell>
                      <TableCell align="right">{formatMoney(prestamo.monto)}</TableCell>
                      <TableCell align="right">{formatMoney(prestamo.saldo)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={prestamo.diasMora}
                          size="small"
                          color={prestamo.diasMora > 0 ? "error" : "success"}
                        />
                      </TableCell>
                      <TableCell>{getEstadoChip(prestamo.estadoCredito)}</TableCell>
                      <TableCell>{formatDate(prestamo.fechaDesembolso)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Alert severity="info">
            Este reporte debe ser enviado mensualmente a la Central de Riesgos para mantener
            actualizado el historial crediticio de los clientes.
          </Alert>
        </>
      )}
    </Box>
  );
};

export default CentralRiesgosPage;
