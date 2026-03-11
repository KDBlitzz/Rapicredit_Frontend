"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import { apiFetch } from "@/lib/api";
import { useEmpleadoActual } from "@/hooks/useEmpleadoActual";
import { usePrestamoDetalle } from "@/hooks/usePrestamoDetalle";

type CuotaPagada = {
  numero: number;
  cuota: number;
  pago: number;
  multa: number;
};

export type ComprobanteAbonoData = {
  // Identificadores
  pagoId?: string;
  recibo?: string;
  codigoPrestamo?: string;

  // Datos del comprobante
  fecha?: string; // ISO o string libre
  cliente?: string;
  asesor?: string;
  metodoPago?: string;
  referencia?: string;
  observaciones?: string;

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

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

const getNested = (v: unknown, keys: string[]): unknown => {
  let cur: unknown = v;
  for (const k of keys) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
};

const asString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v == null) return undefined;
  return String(v);
};

const asNumber = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const normalize = (v: string) => v.trim().toLowerCase();

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

  if (num < 1_000_000) {
    const thousands = Math.floor(num / 1000);
    const rest = num % 1000;

    const thText = thousands === 1 ? "MIL" : `${under1000(thousands)} MIL`;
    if (!rest) return thText;
    return `${thText} ${under1000(rest)}`.trim();
  }

  // Millones (hasta 999,999,999)
  const millions = Math.floor(num / 1_000_000);
  const rest = num % 1_000_000;

  const mText = millions === 1 ? "UN MILLON" : `${toSpanishWords(millions)} MILLONES`;
  if (!rest) return mText;
  if (rest < 1000) return `${mText} ${under1000(rest)}`.trim();

  const thousands = Math.floor(rest / 1000);
  const tail = rest % 1000;
  const thText = thousands === 1 ? "MIL" : `${under1000(thousands)} MIL`;
  if (!tail) return `${mText} ${thText}`.trim();
  return `${mText} ${thText} ${under1000(tail)}`.trim();
};

const toLempirasText = (monto: number) => {
  const totalCentavos = Math.round(Math.abs(monto) * 100);
  const entero = Math.floor(totalCentavos / 100);
  const centavos = totalCentavos % 100;

  const words = toSpanishWords(entero);
  const moneda = entero === 1 ? "LEMPIRA" : "LEMPIRAS";
  const centText = `${String(centavos).padStart(2, "0")}/100`;

  const sign = monto < 0 ? "MENOS " : "";
  return `${sign}${words} ${moneda} CON ${centText}`.trim();
};

const safeParseStorage = (raw: string | null): ComprobanteAbonoData | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ComprobanteAbonoData;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const extractArray = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (!isRecord(res)) return [];
  const candidates = ["pagos", "items", "results", "data"];
  for (const k of candidates) {
    const v = res[k];
    if (Array.isArray(v)) return v;
  }
  return [];
};

const matchesPagoRef = (p: unknown, ref: string): boolean => {
  if (!ref.trim()) return false;
  const target = normalize(ref);

  const candidates = [
    asString(getNested(p, ["_id"])) ?? undefined,
    asString(getNested(p, ["id"])) ?? undefined,
    asString(getNested(p, ["codigoPago"])) ?? undefined,
    asString(getNested(p, ["codigo"])) ?? undefined,
    asString(getNested(p, ["numeroComprobante"])) ?? undefined,
    asString(getNested(p, ["recibo"])) ?? undefined,
    asString(getNested(p, ["referencia"])) ?? undefined,
    asString(getNested(p, ["numeroRecibo"])) ?? undefined,
    asString(getNested(p, ["pagoId"])) ?? undefined,
  ]
    .filter((x): x is string => !!x)
    .map(normalize);

  return candidates.some((c) => c === target);
};

const mapPagoToComprobante = (p: unknown, refFallback?: string): ComprobanteAbonoData => {
  const pagoId =
    asString(getNested(p, ["_id"])) ||
    asString(getNested(p, ["id"])) ||
    asString(getNested(p, ["pagoId"])) ||
    undefined;

  const codigoPrestamo =
    asString(getNested(p, ["codigoPrestamo"])) ||
    asString(getNested(p, ["codigoFinanciamiento"])) ||
    asString(getNested(p, ["prestamoId", "codigoPrestamo"])) ||
    asString(getNested(p, ["prestamoId", "codigoFinanciamiento"])) ||
    asString(getNested(p, ["prestamo", "codigoPrestamo"])) ||
    undefined;

  const fecha =
    asString(getNested(p, ["fechaPago"])) ||
    asString(getNested(p, ["fecha"])) ||
    asString(getNested(p, ["createdAt"])) ||
    undefined;

  const monto =
    asNumber(getNested(p, ["montoPago"])) ??
    asNumber(getNested(p, ["monto"])) ??
    asNumber(getNested(p, ["montoAbono"])) ??
    undefined;

  const metodoPago =
    asString(getNested(p, ["metodoPago"])) ||
    asString(getNested(p, ["medioPago"])) ||
    asString(getNested(p, ["formaPago"])) ||
    undefined;

  const referencia =
    asString(getNested(p, ["numeroComprobante"])) ||
    asString(getNested(p, ["referencia"])) ||
    asString(getNested(p, ["recibo"])) ||
    undefined;

  const recibo =
    referencia ||
    asString(getNested(p, ["codigoPago"])) ||
    asString(getNested(p, ["codigo"])) ||
    pagoId ||
    (refFallback ? String(refFallback) : undefined);

  const clienteNombre =
    asString(getNested(p, ["clienteNombre"])) ||
    asString(getNested(p, ["cliente", "nombreCompleto"])) ||
    asString(getNested(p, ["clienteId", "nombreCompleto"])) ||
    undefined;

  const clienteCodigo =
    asString(getNested(p, ["clienteCodigo"])) ||
    asString(getNested(p, ["codigoCliente"])) ||
    asString(getNested(p, ["cliente", "codigoCliente"])) ||
    asString(getNested(p, ["clienteId", "codigoCliente"])) ||
    undefined;

  const clienteIdentidad =
    asString(getNested(p, ["clienteIdentidad"])) ||
    asString(getNested(p, ["identidadCliente"])) ||
    asString(getNested(p, ["cliente", "identidadCliente"])) ||
    asString(getNested(p, ["clienteId", "identidadCliente"])) ||
    undefined;

  const cliente =
    (clienteNombre && clienteNombre.trim())
      ? clienteNombre
      : [clienteCodigo, clienteIdentidad].filter(Boolean).join(" · ") || undefined;

  const asesor =
    asString(getNested(p, ["cobradorId", "nombreCompleto"])) ||
    asString(getNested(p, ["cobrador", "nombreCompleto"])) ||
    asString(getNested(p, ["asesor", "nombreCompleto"])) ||
    asString(getNested(p, ["asesorNombre"])) ||
    asString(getNested(p, ["asesor"])) ||
    undefined;

  const saldoPendiente =
    asNumber(getNested(p, ["saldoPendiente"])) ??
    asNumber(getNested(p, ["saldo"])) ??
    asNumber(getNested(p, ["saldoActual"])) ??
    undefined;

  const cuotasPendientes = asNumber(getNested(p, ["cuotasPendientes"]));

  const observaciones = asString(getNested(p, ["observaciones"])) ?? undefined;

  const cuotasRaw =
    (getNested(p, ["cuotasPagadas"]) as unknown) ??
    (getNested(p, ["detalleCuotas"]) as unknown) ??
    (getNested(p, ["cuotas"]) as unknown);

  const cuotasPagadas: CuotaPagada[] | undefined = Array.isArray(cuotasRaw)
    ? cuotasRaw
        .map((c, idx) => {
          const numero =
            asNumber(getNested(c, ["numero"])) ??
            asNumber(getNested(c, ["numeroCuota"])) ??
            asNumber(getNested(c, ["cuotaNumero"])) ??
            idx + 1;

          const cuota = asNumber(getNested(c, ["cuota"])) ?? asNumber(getNested(c, ["cuotaFija"])) ?? 0;
          const pago = asNumber(getNested(c, ["pago"])) ?? asNumber(getNested(c, ["montoPago"])) ?? 0;
          const multa = asNumber(getNested(c, ["multa"])) ?? asNumber(getNested(c, ["mora"])) ?? 0;

          return { numero, cuota, pago, multa };
        })
        .filter((x) => Number.isFinite(x.numero))
    : undefined;

  return {
    pagoId,
    recibo: recibo?.trim() || undefined,
    codigoPrestamo: codigoPrestamo?.trim() || undefined,
    fecha,
    cliente: cliente?.trim() || undefined,
    asesor: asesor?.trim() || undefined,
    metodoPago: metodoPago?.trim() || undefined,
    referencia: referencia?.trim() || undefined,
    observaciones: observaciones?.trim() || undefined,
    monto,
    saldoPendiente,
    cuotasPendientes: cuotasPendientes != null ? Number(cuotasPendientes) : undefined,
    cuotasPagadas: cuotasPagadas && cuotasPagadas.length ? cuotasPagadas : undefined,
  };
};

async function resolveComprobanteByRef(ref: string): Promise<ComprobanteAbonoData | null> {
  const target = String(ref || "").trim();
  if (!target) return null;

  // 1) Intentar rutas puntuales (si existen en el backend)
  const candidates = [
    `/pagos/${encodeURIComponent(target)}`,
    `/pagos/id/${encodeURIComponent(target)}`,
    `/pagos/comprobante/${encodeURIComponent(target)}`,
  ];

  for (const path of candidates) {
    try {
      const res = await apiFetch<unknown>(path, { silent: true });
      if (res) return mapPagoToComprobante(res, target);
    } catch {
      // ignora 404 u otros para probar siguientes
    }
  }

  // 2) Fallback: listar pagos y buscar coincidencia local
  try {
    const list = await apiFetch<unknown>("/pagos", { silent: true });
    const raw = extractArray(list);
    const found = raw.find((p) => matchesPagoRef(p, target));
    return found ? mapPagoToComprobante(found, target) : null;
  } catch {
    return null;
  }
}

export default function ComprobanteAbonoView({ refId }: { refId?: string }) {
  const router = useRouter();
  const { firebaseUser } = useEmpleadoActual();

  const [stored, setStored] = useState<ComprobanteAbonoData | null>(null);
  const [remote, setRemote] = useState<ComprobanteAbonoData | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [errorRemote, setErrorRemote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const fromSession = safeParseStorage(sessionStorage.getItem(STORAGE_KEY));
      const fromLocal = safeParseStorage(localStorage.getItem(STORAGE_KEY));
      setStored(fromSession ?? fromLocal);
    } catch {
      setStored(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const ref = String(refId || "").trim();
      if (!ref) return;

      // Evitar llamadas a API si no hay sesión: el comprobante puede ser usado solo con storage.
      if (!firebaseUser) {
        setErrorRemote(null);
        return;
      }

      setLoadingRemote(true);
      setErrorRemote(null);
      try {
        const res = await resolveComprobanteByRef(ref);
        if (cancelled) return;

        if (res) {
          setRemote(res);
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res));
          } catch {
            // ignore
          }
        } else {
          setRemote(null);
          setErrorRemote("No se encontró el comprobante solicitado");
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "No se pudo cargar el comprobante";
        setRemote(null);
        setErrorRemote(msg);
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, refId]);

  const base = remote ?? stored;

  const shouldLoadPrestamo = useMemo(() => {
    if (!firebaseUser) return false;
    if (!base?.codigoPrestamo) return false;
    // Solo si necesitamos completar campos importantes
    if (base.saldoPendiente == null) return true;
    if (base.cuotasPendientes == null) return true;
    if (!Array.isArray(base.cuotasPagadas) || base.cuotasPagadas.length === 0) return true;
    return false;
  }, [base?.codigoPrestamo, base?.cuotasPagadas, base?.cuotasPendientes, base?.saldoPendiente, firebaseUser]);

  const prestamoCodigo = shouldLoadPrestamo ? String(base?.codigoPrestamo || "") : "";
  const { data: prestamoDetalle } = usePrestamoDetalle(prestamoCodigo);

  const data = useMemo<Required<ComprobanteAbonoData> | null>(() => {
    if (!base) return null;

    const monto = Number.isFinite(base.monto) ? Number(base.monto) : 0;

    const recibo = (base.recibo || base.referencia || base.pagoId || "").trim();
    const codigoPrestamo = String(base.codigoPrestamo || "").trim();

    const saldoFromPrestamo =
      prestamoDetalle?.saldo ?? prestamoDetalle?.saldoActual ?? prestamoDetalle?.saldoPendiente;

    const saldoPendiente = Number.isFinite(base.saldoPendiente)
      ? Number(base.saldoPendiente)
      : Number.isFinite(saldoFromPrestamo)
        ? Number(saldoFromPrestamo)
        : 0;

    const cuotasPagadas: CuotaPagada[] = (() => {
      if (Array.isArray(base.cuotasPagadas) && base.cuotasPagadas.length) {
        const mapped = base.cuotasPagadas
          .map((c, idx) => {
            const numero = Number.isFinite(c.numero) ? Number(c.numero) : idx + 1;
            const cuota = Number.isFinite(c.cuota) ? Number(c.cuota) : 0;
            const pago = Number.isFinite(c.pago) ? Number(c.pago) : 0;
            const multa = Number.isFinite(c.multa) ? Number(c.multa) : 0;
            return { numero, cuota, pago, multa };
          })
          .filter((c) => Number.isFinite(c.numero));

        if (mapped.length) return mapped;
      }

      const cuotaDefault = Number.isFinite(prestamoDetalle?.cuotaFija) ? Number(prestamoDetalle?.cuotaFija) : 0;
      return [{ numero: 1, cuota: cuotaDefault, pago: monto, multa: 0 }];
    })();

    const cuotasPendientes = (() => {
      if (Number.isFinite(base.cuotasPendientes)) return Number(base.cuotasPendientes);

      const cuotaFija =
        (Number.isFinite(prestamoDetalle?.cuotaFija) ? Number(prestamoDetalle?.cuotaFija) : undefined) ??
        (cuotasPagadas[0]?.cuota || 0);

      if (!Number.isFinite(saldoPendiente) || saldoPendiente <= 0) return 0;
      if (!Number.isFinite(cuotaFija) || cuotaFija <= 0) return 0;

      const est = Math.ceil(saldoPendiente / cuotaFija);
      return Math.max(0, est);
    })();

    const safeUpper = (s?: string) => (s && s.trim() ? s.trim().toUpperCase() : "—");

    return {
      pagoId: base.pagoId ? String(base.pagoId) : "",
      recibo: recibo || "—",
      codigoPrestamo,
      fecha: base.fecha || new Date().toISOString(),
      cliente: safeUpper(base.cliente),
      asesor: safeUpper(base.asesor),
      metodoPago: safeUpper(base.metodoPago),
      referencia: base.referencia ? String(base.referencia) : "",
      observaciones: base.observaciones ? String(base.observaciones) : "",
      monto,
      saldoPendiente,
      cuotasPendientes,
      cuotasPagadas,
    };
  }, [base, prestamoDetalle?.cuotaFija, prestamoDetalle?.saldo, prestamoDetalle?.saldoActual, prestamoDetalle?.saldoPendiente]);

  const totalEnLetras = useMemo(() => (data ? toLempirasText(data.monto) : ""), [data]);

  const hasData = !!data;

  const handlePrint = () => {
    if (!hasData) return;
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!data) return;

    const mod = await import("jspdf");
    const doc = new mod.jsPDF({ unit: "mm", format: [80, 200] });

    const centerX = 40;
    let y = 6;

    const line = () => {
      doc.setDrawColor(0);
      doc.line(5, y, 75, y);
      y += 4;
    };

    const writeWrap = (text: string, x: number, maxWidth: number, align?: "left" | "center" | "right") => {
      const lines = doc.splitTextToSize(text, maxWidth);
      // jsPDF soporta array de lineas
      doc.text(lines, x, y, align ? { align } : undefined);
      y += lines.length * 4;
    };

    doc.setFontSize(9);
    writeWrap(COMPANY.nombre, centerX, 70, "center");
    doc.setFontSize(8);
    writeWrap(`RTN: ${COMPANY.rtn}`, centerX, 70, "center");
    writeWrap(`TELEFONO: ${COMPANY.telefono}`, centerX, 70, "center");
    writeWrap(`CORREO: ${COMPANY.correo}`, centerX, 70, "center");
    writeWrap(COMPANY.direccion, centerX, 68, "center");

    y += 2;
    line();

    doc.setFontSize(9);
    writeWrap("ORIGINAL", centerX, 70, "center");
    y += 1;

    doc.setFontSize(8);
    writeWrap(`FECHA: ${formatTicketDate(data.fecha)}`, 5, 70);
    writeWrap(`RECIBO: ${data.recibo}`, 5, 70);
    if (data.codigoPrestamo) writeWrap(`PRESTAMO: ${data.codigoPrestamo}`, 5, 70);
    writeWrap(`CLIENTE: ${data.cliente}`, 5, 70);
    writeWrap(`MONTO DEL PAGO: ${formatMoney(data.monto)}`, 5, 70);
    if (data.metodoPago && data.metodoPago !== "—") writeWrap(`METODO: ${data.metodoPago}`, 5, 70);
    if (data.referencia && data.referencia.trim() && data.referencia.trim() !== data.recibo.trim()) {
      writeWrap(`REFERENCIA: ${data.referencia}`, 5, 70);
    }
    writeWrap(`ASESOR: ${data.asesor}`, 5, 70);
    writeWrap(`SALDO PENDIENTE: ${formatMoney(data.saldoPendiente)}`, 5, 70);
    writeWrap(`CUOTAS PENDIENTES: ${data.cuotasPendientes}`, 5, 70);
    writeWrap(`TOTAL EN LETRAS: ${totalEnLetras}`, 5, 70);
    if (data.observaciones && data.observaciones.trim()) {
      writeWrap(`OBS: ${data.observaciones}`, 5, 70);
    }

    y += 1;
    line();

    doc.setFontSize(9);
    writeWrap("CUOTAS PAGADAS", centerX, 70, "center");
    y += 1;

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

    doc.save(`comprobante-${data.recibo || "sin-recibo"}.pdf`);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        className="no-print"
        sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2, flexWrap: "wrap" }}
      >
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
          Regresar
        </Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!hasData || loadingRemote}>
          {loadingRemote ? <CircularProgress size={18} /> : "Imprimir"}
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => void handleDownloadPdf()}
          disabled={!hasData || loadingRemote}
        >
          Descargar PDF
        </Button>
      </Box>

      {errorRemote ? (
        <Alert severity="warning" sx={{ maxWidth: 560, mx: "auto", mb: 2 }}>
          {errorRemote}
        </Alert>
      ) : null}

      {!hasData ? (
        <Alert severity="info" sx={{ maxWidth: 560, mx: "auto" }}>
          No hay un comprobante disponible para mostrar.
        </Alert>
      ) : null}

      {data ? (
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
            {data.metodoPago && data.metodoPago !== "—" ? (
              <Typography variant="caption" sx={{ display: "block" }}>
                METODO: {data.metodoPago}
              </Typography>
            ) : null}
            {data.referencia && data.referencia.trim() && data.referencia.trim() !== data.recibo.trim() ? (
              <Typography variant="caption" sx={{ display: "block" }}>
                REFERENCIA: {data.referencia}
              </Typography>
            ) : null}
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
            {data.observaciones && data.observaciones.trim() ? (
              <Typography variant="caption" sx={{ display: "block" }}>
                OBS: {data.observaciones}
              </Typography>
            ) : null}
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
      ) : null}

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
