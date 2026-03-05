"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

type CuotaPagada = {
  numero: number;
  cuota: number;
  pago: number;
  multa: number;
};

export type ComprobanteAbonoData = {
  // Identificadores
  recibo?: string;
  codigoPrestamo?: string;

  // Datos del comprobante
  fecha?: string; // ISO o string libre
  cliente?: string;
  asesor?: string;

  monto?: number;
  saldoPendiente?: number;
  cuotasPendientes?: number;

  cuotasPagadas?: CuotaPagada[];
};

const STORAGE_KEY = "rapicredit:comprobanteAbono";

const COMPANY = {
  nombre: "RAPICREDIT S DE R.L DE C.V",
  rtn: "0501-9022-387459",
  telefono: "9694-1932",
  correo: "RAPICREDIT.HN@HOTMAIL.COM",
  direccion: "BARRIO EL CENTRO, CALLE PRINCIPAL, EL PROGRESO YORO",
} as const;

const formatMoney = (v?: number) =>
  v != null && Number.isFinite(v)
    ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
    : "L. 0.00";

const formatTicketDate = (input?: string) => {
  const d = (() => {
    if (!input) return new Date();
    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  })();

  const months = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];
  const day = d.getDate();
  const monthName = months[d.getMonth()] ?? "";
  const year = d.getFullYear();
  return `${day} DE ${monthName} DE ${year}`;
};

const toSpanishWords = (n: number): string => {
  const num = Math.floor(Math.abs(n));

  const units = [
    "CERO",
    "UN",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
  ];
  const teens: Record<number, string> = {
    10: "DIEZ",
    11: "ONCE",
    12: "DOCE",
    13: "TRECE",
    14: "CATORCE",
    15: "QUINCE",
    16: "DIECISEIS",
    17: "DIECISIETE",
    18: "DIECIOCHO",
    19: "DIECINUEVE",
  };
  const tens: Record<number, string> = {
    20: "VEINTE",
    30: "TREINTA",
    40: "CUARENTA",
    50: "CINCUENTA",
    60: "SESENTA",
    70: "SETENTA",
    80: "OCHENTA",
    90: "NOVENTA",
  };
  const hundreds: Record<number, string> = {
    100: "CIEN",
    200: "DOSCIENTOS",
    300: "TRESCIENTOS",
    400: "CUATROCIENTOS",
    500: "QUINIENTOS",
    600: "SEISCIENTOS",
    700: "SETECIENTOS",
    800: "OCHOCIENTOS",
    900: "NOVECIENTOS",
  };

  const under100 = (x: number): string => {
    if (x < 10) return units[x] ?? "";
    if (x >= 10 && x < 20) return teens[x] ?? "";
    if (x >= 20 && x < 30) {
      if (x === 20) return tens[20];
      const u = x - 20;
      if (u === 1) return "VEINTIUN";
      return `VEINTI${(units[u] ?? "").toLowerCase()}`.toUpperCase();
    }
    const t = Math.floor(x / 10) * 10;
    const u = x % 10;
    if (!u) return tens[t] ?? "";
    return `${tens[t] ?? ""} Y ${units[u] ?? ""}`.trim();
  };

  const under1000 = (x: number): string => {
    if (x < 100) return under100(x);
    if (x === 100) return "CIEN";
    const h = Math.floor(x / 100) * 100;
    const r = x % 100;
    const hText = h === 100 ? "CIENTO" : hundreds[h] ?? "";
    if (!r) return hText;
    return `${hText} ${under100(r)}`.trim();
  };

  if (num < 1000) return under1000(num);

  const thousands = Math.floor(num / 1000);
  const rest = num % 1000;

  const thText = thousands === 1 ? "MIL" : `${under1000(thousands)} MIL`;
  if (!rest) return thText;
  return `${thText} ${under1000(rest)}`.trim();
};

const toLempirasText = (monto: number) => {
  const entero = Math.floor(monto);
  const words = toSpanishWords(entero);
  const moneda = entero === 1 ? "LEMPIRA" : "LEMPIRAS";
  return `${words} ${moneda}`.trim();
};

const generateRecibo = () => String(Math.floor(10000 + Math.random() * 90000));

export default function ComprobanteAbonoPage() {
  const [stored, setStored] = useState<ComprobanteAbonoData | null>(null);

  const fallbackData = useMemo<ComprobanteAbonoData>(() => {
    return {
      recibo: "37527",
      fecha: new Date("2026-03-02").toISOString(),
      cliente: "DIGNA EMERITA TREJO CARDONA",
      asesor: "CRISTIAN",
      monto: 781,
      saldoPendiente: 0,
      cuotasPendientes: 0,
      cuotasPagadas: [{ numero: 24, cuota: 751, pago: 781, multa: 30 }],
    };
  }, []);

  const data: Required<ComprobanteAbonoData> = useMemo(() => {
    const merged: ComprobanteAbonoData = {
      ...fallbackData,
      ...(stored ?? {}),
    };

    return {
      recibo: merged.recibo || generateRecibo(),
      codigoPrestamo: merged.codigoPrestamo || "",
      fecha: merged.fecha || new Date().toISOString(),
      cliente: merged.cliente || "—",
      asesor: merged.asesor || "—",
      monto: Number.isFinite(merged.monto) ? Number(merged.monto) : 0,
      saldoPendiente: Number.isFinite(merged.saldoPendiente) ? Number(merged.saldoPendiente) : 0,
      cuotasPendientes: Number.isFinite(merged.cuotasPendientes) ? Number(merged.cuotasPendientes) : 0,
      cuotasPagadas:
        Array.isArray(merged.cuotasPagadas) && merged.cuotasPagadas.length
          ? merged.cuotasPagadas
          : [{ numero: 1, cuota: 0, pago: Number.isFinite(merged.monto) ? Number(merged.monto) : 0, multa: 0 }],
    };
  }, [fallbackData, stored]);

  const totalEnLetras = useMemo(() => toLempirasText(data.monto), [data.monto]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ComprobanteAbonoData;
      setStored(parsed);
    } catch {
      // Ignorar
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const mod = await import("jspdf");
    const doc = new mod.jsPDF({ unit: "mm", format: [80, 200] });

    const centerX = 40;
    let y = 6;

    const line = () => {
      doc.setDrawColor(0);
      doc.line(5, y, 75, y);
      y += 4;
    };

    doc.setFontSize(9);
    doc.text(COMPANY.nombre, centerX, y, { align: "center" });
    y += 4;
    doc.setFontSize(8);
    doc.text(`RTN: ${COMPANY.rtn}`, centerX, y, { align: "center" });
    y += 4;
    doc.text(`TELEFONO: ${COMPANY.telefono}`, centerX, y, { align: "center" });
    y += 4;
    doc.text(`CORREO: ${COMPANY.correo}`, centerX, y, { align: "center" });
    y += 4;

    const dirLines = doc.splitTextToSize(COMPANY.direccion, 68);
    doc.text(dirLines, centerX, y, { align: "center" });
    y += dirLines.length * 4;

    y += 2;
    line();

    doc.setFontSize(9);
    doc.text("ORIGINAL", centerX, y, { align: "center" });
    y += 5;

    doc.setFontSize(8);
    doc.text(`FECHA: ${formatTicketDate(data.fecha)}`, 5, y);
    y += 4;
    doc.text(`RECIBO: ${data.recibo}`, 5, y);
    y += 4;
    doc.text(`CLIENTE: ${data.cliente}`, 5, y);
    y += 4;
    doc.text(`MONTO DEL PAGO: ${formatMoney(data.monto)}`, 5, y);
    y += 4;
    doc.text(`ASESOR: ${data.asesor}`, 5, y);
    y += 4;
    doc.text(`SALDO PENDIENTE: ${formatMoney(data.saldoPendiente)}`, 5, y);
    y += 4;
    doc.text(`CUOTAS PENDIENTES: ${data.cuotasPendientes}`, 5, y);
    y += 4;
    doc.text(`TOTAL EN LETRAS: ${totalEnLetras}`, 5, y);
    y += 6;

    line();

    doc.setFontSize(9);
    doc.text("CUOTAS PAGADAS", centerX, y, { align: "center" });
    y += 5;

    doc.setFontSize(8);
    doc.text("#", 5, y);
    doc.text("CUOTA", 15, y);
    doc.text("PAGO", 38, y);
    doc.text("MULTA", 58, y);
    y += 3;
    line();

    data.cuotasPagadas.forEach((c) => {
      doc.text(String(c.numero), 5, y);
      doc.text(formatMoney(c.cuota).replace("L. ", "L "), 15, y);
      doc.text(formatMoney(c.pago).replace("L. ", "L "), 38, y);
      doc.text(formatMoney(c.multa).replace("L. ", "L "), 58, y);
      y += 4;
    });

    doc.save(`comprobante-${data.recibo}.pdf`);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box className="no-print" sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2, flexWrap: "wrap" }}>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Imprimir
        </Button>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => void handleDownloadPdf()}>
          Descargar PDF
        </Button>
      </Box>

      <Box
        sx={(theme) => ({
          maxWidth: 360,
          mx: "auto",
          bgcolor: "background.paper",
          color: "text.primary",
          border: `1px solid ${theme.palette.divider}`,
          p: 2,
          "@media print": {
            border: "none",
            boxShadow: "none",
            maxWidth: "100%",
            mx: 0,
            p: 0,
          },
        })}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: "center" }}>
          {COMPANY.nombre}
        </Typography>
        <Typography variant="caption" sx={{ display: "block", textAlign: "center" }}>
          RTN: {COMPANY.rtn}
        </Typography>
        <Typography variant="caption" sx={{ display: "block", textAlign: "center" }}>
          TELEFONO: {COMPANY.telefono}
        </Typography>
        <Typography variant="caption" sx={{ display: "block", textAlign: "center" }}>
          CORREO: {COMPANY.correo}
        </Typography>
        <Typography variant="caption" sx={{ display: "block", textAlign: "center" }}>
          {COMPANY.direccion}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" sx={{ textAlign: "center", fontWeight: 700 }}>
          ORIGINAL
        </Typography>

        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ display: "block" }}>
            FECHA: {formatTicketDate(data.fecha)}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            RECIBO: {data.recibo}
          </Typography>
          {data.codigoPrestamo ? (
            <Typography variant="caption" sx={{ display: "block" }}>
              PRESTAMO: {data.codigoPrestamo}
            </Typography>
          ) : null}
          <Typography variant="caption" sx={{ display: "block" }}>
            CLIENTE: {data.cliente}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            MONTO DEL PAGO: {formatMoney(data.monto)}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            ASESOR: {data.asesor}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            SALDO PENDIENTE: {formatMoney(data.saldoPendiente)}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            CUOTAS PENDIENTES: {data.cuotasPendientes}
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            TOTAL EN LETRAS: {totalEnLetras}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" sx={{ textAlign: "center", fontWeight: 700, mb: 1 }}>
          CUOTAS PAGADAS
        </Typography>

        <Table size="small" sx={{ "& td, & th": { p: 0.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CUOTA</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>PAGO</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>MULTA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.cuotasPagadas.map((c) => (
              <TableRow key={c.numero}>
                <TableCell>{c.numero}</TableCell>
                <TableCell>{formatMoney(c.cuota).replace("L. ", "L ")}</TableCell>
                <TableCell>{formatMoney(c.pago).replace("L. ", "L ")}</TableCell>
                <TableCell>{formatMoney(c.multa).replace("L. ", "L ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </Box>
  );
}
