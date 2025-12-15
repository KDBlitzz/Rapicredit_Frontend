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
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";

const PagoSARPage: React.FC = () => {
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
        totalEmpleados: 12,
        totalSalarios: 185000,
        totalAportacionPatronal: 13875, // 7.5% del total de salarios
        totalAportacionLaboral: 5550, // 3% del total de salarios
        totalAporteSAR: 19425,
        empleados: [
          {
            id: 1,
            nombre: "Carlos Méndez Rivera",
            identidad: "0801-1980-11111",
            cargo: "Gerente General",
            salario: 25000,
            aportacionPatronal: 1875, // 7.5%
            aportacionLaboral: 750, // 3%
            total: 2625,
            fechaIngreso: "2020-01-15",
          },
          {
            id: 2,
            nombre: "Laura Patricia Sánchez",
            identidad: "0801-1985-22222",
            cargo: "Contador",
            salario: 18000,
            aportacionPatronal: 1350,
            aportacionLaboral: 540,
            total: 1890,
            fechaIngreso: "2021-03-10",
          },
          {
            id: 3,
            nombre: "Jorge Luis Martínez",
            identidad: "0801-1990-33333",
            cargo: "Analista de Crédito",
            salario: 15000,
            aportacionPatronal: 1125,
            aportacionLaboral: 450,
            total: 1575,
            fechaIngreso: "2022-06-01",
          },
          {
            id: 4,
            nombre: "María Elena Rodríguez",
            identidad: "0801-1988-44444",
            cargo: "Cobrador",
            salario: 12000,
            aportacionPatronal: 900,
            aportacionLaboral: 360,
            total: 1260,
            fechaIngreso: "2021-08-15",
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Reporte de Pago al SAR
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Genera el reporte de aportaciones al Sistema de Ahorro para Retiro (SAR).
          Incluye las aportaciones patronales (7.5%) y laborales (3%) de todos los empleados
          para el cumplimiento de las obligaciones ante el Régimen de Aportaciones Privadas (RAP).
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
                    Total Empleados
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {data.totalEmpleados}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Salarios
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
                    {formatMoney(data.totalSalarios)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Aportación Patronal (7.5%)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: "primary.main" }}>
                    {formatMoney(data.totalAportacionPatronal)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total a Pagar al SAR
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mt: 1, color: "success.main" }}>
                    {formatMoney(data.totalAporteSAR)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Desglose de aportaciones */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Desglose de Aportaciones
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Aportación Patronal (7.5%)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "primary.main", mt: 1 }}>
                    {formatMoney(data.totalAportacionPatronal)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: "center", p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Aportación Laboral (3%)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "warning.main", mt: 1 }}>
                    {formatMoney(data.totalAportacionLaboral)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: "center", p: 2, bgcolor: "success.light", borderRadius: 2 }}>
                  <Typography variant="caption" color="success.dark">
                    Total a Depositar
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: "success.dark", mt: 1 }}>
                    {formatMoney(data.totalAporteSAR)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

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

          {/* Tabla de empleados */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(148,163,184,0.25)" }}>
              <Typography variant="h6">Detalle por Empleado</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Identidad</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell align="right">Salario Base</TableCell>
                    <TableCell align="right">Aporte Patronal (7.5%)</TableCell>
                    <TableCell align="right">Aporte Laboral (3%)</TableCell>
                    <TableCell align="right">Total Aporte</TableCell>
                    <TableCell>Fecha Ingreso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.empleados.map((empleado: any) => (
                    <TableRow key={empleado.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {empleado.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>{empleado.identidad}</TableCell>
                      <TableCell>
                        <Chip label={empleado.cargo} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{formatMoney(empleado.salario)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="primary">
                          {formatMoney(empleado.aportacionPatronal)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main">
                          {formatMoney(empleado.aportacionLaboral)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatMoney(empleado.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(empleado.fechaIngreso)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ p: 2, bgcolor: "rgba(56,189,248,0.1)", display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
                  Total General a Depositar:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {formatMoney(data.totalAporteSAR)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Alert severity="warning">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Recordatorio Importante:
            </Typography>
            <Typography variant="body2">
              Este reporte debe ser presentado mensualmente ante el RAP (Régimen de Aportaciones Privadas).
              El pago debe realizarse antes del día 10 de cada mes para evitar multas y recargos.
              La aportación patronal es del 7.5% y la laboral del 3% sobre el salario base de cada empleado.
            </Typography>
          </Alert>
        </>
      )}
    </Box>
  );
};

export default PagoSARPage;
