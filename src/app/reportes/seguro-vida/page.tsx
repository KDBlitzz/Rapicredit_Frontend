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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";

const SeguroVidaPage: React.FC = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoy);
  const [tipoReporte, setTipoReporte] = useState("nuevos"); // nuevos, vigentes, finalizados
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
        totalPrestamosAsegurados: 98,
        montoTotalAsegurado: 2450000,
        primaTotal: 12250,
        montoPorPagar: 12250,
        prestamos: [
          {
            id: 1,
            cliente: "Ana María González",
            identidad: "0801-1988-22222",
            numeroPrestamo: "P-2024-001",
            monto: 25000,
            plazoMeses: 12,
            edad: 36,
            prima: 125,
            fechaInicio: "2024-01-15",
            fechaVencimiento: "2025-01-15",
            estado: "Vigente",
          },
          {
            id: 2,
            cliente: "Roberto Carlos Hernández",
            identidad: "0801-1975-33333",
            numeroPrestamo: "P-2024-002",
            monto: 35000,
            plazoMeses: 24,
            edad: 49,
            prima: 175,
            fechaInicio: "2024-02-01",
            fechaVencimiento: "2026-02-01",
            estado: "Vigente",
          },
          {
            id: 3,
            cliente: "Sofía Ramírez López",
            identidad: "0801-1995-44444",
            numeroPrestamo: "P-2024-003",
            monto: 18000,
            plazoMeses: 6,
            edad: 29,
            prima: 90,
            fechaInicio: "2024-02-15",
            fechaVencimiento: "2024-08-15",
            estado: "Vigente",
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
    const colorMap: Record<string, "success" | "warning" | "error" | "default"> = {
      "Vigente": "success",
      "Por vencer": "warning",
      "Vencido": "error",
      "Finalizado": "default",
    };
    return <Chip label={estado} size="small" color={colorMap[estado] || "default"} />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Reporte de Seguro de Vida
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Genera el reporte de préstamos asegurados para la compañía de seguros.
          Incluye la información de clientes, montos asegurados, primas y vigencias de las pólizas.
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
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select
              value={tipoReporte}
              label="Tipo de Reporte"
              onChange={(e) => setTipoReporte(e.target.value)}
            >
              <MenuItem value="nuevos">Pólizas Nuevas</MenuItem>
              <MenuItem value="vigentes">Pólizas Vigentes</MenuItem>
              <MenuItem value="finalizados">Pólizas Finalizadas</MenuItem>
              <MenuItem value="todos">Todas</MenuItem>
            </Select>
          </FormControl>
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
                    Préstamos Asegurados
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {data.totalPrestamosAsegurados}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Monto Total Asegurado
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {formatMoney(data.montoTotalAsegurado)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Prima Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: "primary.main" }}>
                    {formatMoney(data.primaTotal)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Monto por Pagar
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: "warning.main" }}>
                    {formatMoney(data.montoPorPagar)}
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

          {/* Tabla de préstamos asegurados */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(148,163,184,0.25)" }}>
              <Typography variant="h6">Detalle de Pólizas de Seguro</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Identidad</TableCell>
                    <TableCell>No. Préstamo</TableCell>
                    <TableCell align="right">Monto Asegurado</TableCell>
                    <TableCell align="center">Plazo (meses)</TableCell>
                    <TableCell align="center">Edad</TableCell>
                    <TableCell align="right">Prima</TableCell>
                    <TableCell>Inicio Póliza</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.prestamos.map((prestamo: any) => (
                    <TableRow key={prestamo.id} hover>
                      <TableCell>{prestamo.cliente}</TableCell>
                      <TableCell>{prestamo.identidad}</TableCell>
                      <TableCell>{prestamo.numeroPrestamo}</TableCell>
                      <TableCell align="right">{formatMoney(prestamo.monto)}</TableCell>
                      <TableCell align="center">{prestamo.plazoMeses}</TableCell>
                      <TableCell align="center">{prestamo.edad}</TableCell>
                      <TableCell align="right">{formatMoney(prestamo.prima)}</TableCell>
                      <TableCell>{formatDate(prestamo.fechaInicio)}</TableCell>
                      <TableCell>{formatDate(prestamo.fechaVencimiento)}</TableCell>
                      <TableCell>{getEstadoChip(prestamo.estado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Alert severity="info">
            Este reporte debe ser enviado mensualmente a la compañía de seguros para el cálculo
            de primas y actualización de pólizas de vida sobre los préstamos vigentes.
          </Alert>
        </>
      )}
    </Box>
  );
};

export default SeguroVidaPage;
