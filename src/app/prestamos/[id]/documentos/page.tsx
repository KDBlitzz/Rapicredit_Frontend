"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
	Box,
	Paper,
	Typography,
	CircularProgress,
	Grid,
	Divider,
	Alert,
	Button,
} from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../../hooks/usePrestamoDetalle";
import { usePermisos } from "../../../../hooks/usePermisos";
import { useTasasInteres } from "../../../../hooks/useTasasInteres";
import { apiFetch } from "../../../../lib/api";

const CLAUSULAS_CONTRATO_SIN_DESPLAZAMIENTO = [
	"PRIMERO: Información: Declara el Deudor, que previo a la suscripción del presente contrato ha recibido a su satisfacción por parte del acreedor, la información relacionada con el presente contrato de préstamo, intereses, comisiones pactadas, así como las consecuencias por el incumplimiento de la obligación.",
	"SEGUNDO: La suma de dinero entregada en calidad de préstamo a EL PRESTATARIO, deberá ser usada exclusivamente para CAPITAL DE TRABAJO, mediante el producto o servicio financiero denominado __________, siendo entendido que el cambio de destino de los fondos sin previa autorización de “RAPICREDIT, S DE R. L DE C.V”, dará derecho a esta para dar por vencida anticipadamente la obligación y para exigir su inmediato cumplimiento.",
	"CUARTO: La suma prestada deberá ser cancelada por EL PRESTATARIO, dentro de un plazo de _____ (   ) meses, contado a partir de la presente fecha, en cuotas mensuales de capital más intereses corrientes, durante la vigencia del presente contrato EL PRESTATARIO, se obliga a pagar puntualmente, en la fecha y cantidad establecida en el cronograma o plan de pagos convenido de mutuo acuerdo con “RAPICREDIT, S DE R. L DE C.V”, la tasa de interés que rige el presente contrato será calculada mensual sobre el saldo de capital adeudado.",
	"QUINTO: EL préstamo devengará intereses a partir de la fecha de suscripción del Contrato a una tasa mensual de _____ (  .  %), y una tasa de interés efectiva anual de _____ POR CIENTO ( . %), en caso de incumplimiento en las fechas de pago establecidas en el cronograma, la tasa de interés moratorio será del cinco por ciento (5%) mensual sobre el saldo de capital vencido.",
	"SEXTO: EL PRESTATARIO, autoriza a “RAPICREDIT, S DE R. L DE C.V”, a cobrar el tres por ciento (3%) en concepto de Comisión por otorgamiento y gestos administrativos, el cual será calculado sobre el monto desembolsado y será cobrado una sola vez al momento del desembolso.",
	"SEPTIMO: Modificación de intereses: Es entendido por EL DEUDOR, que la tasa de interés antes estipulada se podrá modificar según las condiciones del Mercado Financiero Nacional y la política crediticia de “RAPICREDIT, S DE R. L DE C.V”, con una notificación previa a su efectividad, de quince (15) días por el medio que “RAPICREDIT, S DE R. L DE C.V”, estime conveniente igualmente que cualquier ajuste resultante de la modificación de la tasa de interés, deberá ser cubierto por EL DEUDOR, quedando “RAPICREDIT, S DE R. L DE C.V”, autorizado para cobrar y efectuar tales ajustes.",
	"OCTAVO: Moneda: Es entendido que la cantidad de dinero prestado y sus intereses, deberá ser pagada por el deudor en moneda nacional.",
	"NOVENO: Fecha y Lugar de Pago: Es pactado que los pagos de capital, así como los intereses, deberán ser depositados en la fecha exacta de su vencimiento en las oficinas de “RAPICREDIT, S DE R. L DE C.V”, o a los promotores.",
	"DECIMO: Los mecanismos de cobro extrajudiciales y judicial a implementar, en caso de mora serán los siguientes: a) Al presentar mora de uno (1) a ocho (8) visitas por el personal “RAPICREDIT, S DE R. L DE C.V”, requerimiento de pago extrajudicial con intervalo de tres (3) días entres sí; firmada la primera por el Asesor de Negocios, la Segunda por el Gerente de la Agencia con copia a los fiadores y la tercera firmada por el Gerente de Negocios o los supervisores de zona copia a los fiadores; b) Al presentar mora mayor de treinta (30) días requerimiento extrajudicial firmado por Apoderado Legal; c) La falta de pago de dos (2) cuotas consecutivas o alternas de capital o intereses hará exigible el total el total de la obligación, aunque la misma no se encuentre vencida en su totalidad, y se trasladara al Apoderado Legal; d) En los casos de los créditos otorgados, por la naturaleza de los plazos Bimensual, Trimestral, Semestral, Anual o al Vencimiento, el incumplimiento en el pago de la primera cuota hará vencimiento, el cumplimiento en el pago de la primera cuanto hará exigible el total de la obligación y se trasladara al Apoderado Legal, aunque la misma no se encuentre vencida en su totalidad.",
	"DECIMO PRIMERO: “RAPICREDIT, S DE R. L DE C.V”, comunicara a EL PRESTATARIO, en forma previa a su aplicación cualquier modificación en las condiciones con treinta (30) días calendario de anticipación, previo a que la modificación entre en vigencia, a través de avisos escritos domicilio de los clientes, comunicados vía televisión, radio, periódico, medios electrónicos, avisos en su página web. La tasa de interés, las comisiones y precios que rigen este contrato podrá modificarse según las condiciones del mercado financiero nacional, previa notificación a los prestatarios con quince días de anticipación, Cualquier ajuste resultante de la modificación de la tasa de interés será cubierto por EL PRESTATARIO, quedando “RAPICREDIT, S DE R. L DE C.V”, autorizado para efectuar y cobrar tales ajustes; en este caso particular el usuario concluida la relación financiera puede decidir dar por terminado el contrato sin penalidad o comisión.",
	"DECIMO SEGUNDO: Intereses: si el crédito o su saldo se cobraren por la vía judicial los normales y moratorios se continuarán ajustando en la misma forma, modo, procedimiento y fechas establecidas para el cobro normal.",
	"DECIMO TERCERO: Cuando el pago de capital e intereses se efectúe con cheque de cualquier Banco del sistema financiero nacional estos serán recibidos SALVO BUEN COBRO y el cheque que sea devuelto por cualquier causa dará derecho a “RAPICREDIT, S DE R. L DE C.V”, a cargar a EL PRESTATARIO el valor del cheque devuelto más la comisión por devolución y los intereses dejados.",
	"DECIMO CUARTO: USO DE LA INFORMACIÓN: EL DEUDOR, y LOS AVALES SOLIDARIOS, autorizan a “RAPICREDIT, S DE R. L DE C.V”, a solicitar y dar información de sus obligaciones en el sistema financiero nacional, así como incorporar dicha información a la Central de Información Crediticia (CIC) u otra central de riesgos pública o privada, así como a financiadores del “RAPICREDIT, S DE R. L DE C.V”.",
	"DECIMO QUINTO: GARANTIA MOBILIARIA: Manifiesta EL DEUDOR, que acepta todas y cada una de las condiciones del presente contrato y que recibe a su entera satisfacción la cantidad de _____ (L. _____.00), en calidad de préstamo que así mismo para garantizar el cumplimiento de la obligación contraída, constituye garantía mobiliaria sin desplazamiento a favor de “RAPICREDIT, S DE R. L DE C.V”, sobre los siguientes bienes: ____________.",
	"DECIMO SEXTO: AUTORIZACION EXTRAORDINARIA: a) Es pactado y entendido por EL DEUDOR, que conforme al artículo 55 numeral 2 y 60 de la Ley de Garantías Mobiliarias, “RAPICREDIT, S DE R. L DE C.V”, queda autorizado para apropiarse directamente de la totalidad o parte de los bienes garantizadores, en caso de que la garantía se pueda volver inservible al permanecer en poder del deudor, o cuando por la mora en el cumplimiento de la obligación sea evidente que no tiene EL DEUDOR capacidad para enfrentar la obligación contraída. b) Autorización de débito a cuentas: EL DEUDOR, autoriza irrevocablemente a “RAPICREDIT, S DE R. L DE C.V”, para que debite de sus cuentas, depósitos a plazo o cualquier otro depósito que posea con EL DEUDOR, por el importe de los saldos deudores, intereses pactados, abonos a capital, comisiones, tarifas, seguros, cargos por administración y gestiones de cobro por mora derivados del presente préstamo.",
	"DECIMO SEPTIMO: DE LA EJECUCION DE LA GARANTIA: Es pactado y entendido que en caso de ejecución de los bienes garantizadores, la misma se efectuará en forma extrajudicial, con intervención de Notario, conforme al artículo 55 numeral 1 y 2 de la Ley de Garantías Mobiliarias, el cual será designado por “RAPICREDIT, S DE R. L DE C.V”, y se deberá seguir el procedimiento establecido en la relacionada Ley de Garantías Mobiliarias; conservando “RAPICREDIT, S DE R. L DE C.V”, la facultad de utilizar la vía judicial ordinaria según lo requieran las circunstancias para la ejecución de los bienes garantizadores.",
	"DECIMO OCTAVO: INSCRIPCION DE GARANTIA MOBILIARIA: Es pactado que EL DEUDOR, autoriza “RAPICREDIT, S DE R. L DE C.V”, para que presente el formulario de inscripción inicial y las enmiendas posteriores, incluido el Formulario de Ejecución que establece la ley, asumiendo los costos que los mismos generan y que serán deducidos del primer desembolso.",
	"DECIMO NOVENO: PROHIBICION DE GRAVAMEN: Es entendido por EL DEUDOR, que no podrá realizar ninguna transacción, venta o gravamen con terceros, sobre los bienes garantizadores, sin autorización de “RAPICREDIT, S DE R. L DE C.V”.",
	"VIGESIMO: EL PRESTATARIO o sus FIADORES SOLIDARIOS podrán pagar anticipadamente el principal adeudado en cuyo caso se aplicarán los pagos en el siguiente orden: 1) intereses moratorios si los hubiere, 2) intereses normales, 3) seguro de deuda y otros valores pendientes de pago hasta la fecha en que se haga la cancelación correspondiente, 4) capital.",
	"VIGESIMO PRIMERO: Adicionalmente al presente contrato y como un instrumento adicional de garantía de la obligación contraída, EL PRESTATARIO y sus FIADORES SOLIDARIOS, se comprometen a suscribir un PAGARE a favor de “RAPICREDIT, S DE R. L DE C.V”.",
	"VIGESIMO SEGUNDO: EL PRESTATARIO sin notificación previa, autoriza expresamente a “RAPICREDIT, S DE R. L DE C.V”, para ceder o descontar el préstamo formalizado en este contrato, así como también autoriza a “RAPICREDIT, S DE R. L DE C.V”, a endosar el título valor (PAGARE) a cualquier institución pública o privada nacional e internacional. Así mismo EL PRESTATARIO se compromete a hacer todos los pagos a que está obligado a favor de “RAPICREDIT, S DE R. L DE C.V”, o a quien eventualmente se le haya cedido el crédito libre de cualquier deducción, impuesto, tasa, carga, gravamen, retención o contribución.",
	"VIGESIMO TERCERO: EL PRESTATARIO y los FIADORES SOLIDARIOS autorizan a “RAPICREDIT, S DE R. L DE C.V”, a solicitar y dar información de sus obligaciones en el sistema financiero nacional, así como incorporar dicha información a la central de riesgos de la COMISION NACIONAL DE BANCA Y SEGUROS (CNBS), buros de crédito u otra central de riesgos pública o privada.",
	"VIGESIMO CUARTO: CARÁCTER DEL CONTRATO. De conformidad con el Artículo 166 de la Ley del Sistema Financiero Nacional, el estado de cuenta certificado por el Contador o la Contadora de “RAPICREDIT, S DE R. L DE C.V”, hará fe en juicio para establecer el saldo a cargo de EL PRESTATARIO y constituirá junto con el presente contrato título ejecutivo, sin necesidad de reconocimiento de firma ni de otro requisito previo alguno.",
	"VIGESIMO QUINTO: DEL SEGURO: EL PRESTATARIO y LOS FIADORES SOLIDARIOS deben suscribir y mantener un seguro de deuda por la cuantía y condiciones que le señale “RAPICREDIT, S DE R. L DE C.V”, con cualquier compañía aseguradora aceptada por “RAPICREDIT, S DE R. L DE C.V”, mientras existan deudas, nombrando beneficiario único e irrevocable a “RAPICREDIT, S DE R. L DE C.V”, dentro de los límites de su interés, como acreedor del PRESTATARIO y LOS FIADORES SOLIDARIOS asegurados.",
	"VIGESIMO SEXTO: DE LOS GASTOS. Serán por cuenta de EL PRESTATARIO y LOS FIADORES SOLIDARIOS las costas personales, procesales, y honorarios legales de todas las acciones que intente “RAPICREDIT, S DE R. L DE C.V”, en contra de EL PRESTATARIO y LOS FIADORES SOLIDARIOS, para la recuperación del crédito, serán también por su cuenta el pago de impuestos, tasas, y demás cargos derivados de este contrato.",
	"VIGESIMO SEPTIMO: Queda expresamente convenido que “RAPICREDIT, S DE R. L DE C.V”, podrá resolver este contrato de pleno derecho y acelerar el vencimiento de las obligaciones en que ha incurrido EL PRESTATARIO y los FIADORES SOLIDARIOS para con “RAPICREDIT, S DE R. L DE C.V”, y se considerarán de plazo vencido por incumplimiento por parte de EL PRESTATARIO y LOS FIADORES SOLIDARIOS en los siguientes casos: 1) Por incumplimiento o negativa de EL PRESTATARIO y LOS FIADORES SOLIDARIOS de satisfacer cualesquiera de las obligaciones, estipulaciones y condiciones de este contrato, o de las operaciones que se originen, contraten, o convengan en virtud del mismo; 2) Por utilizar o destinar los fondos del préstamo en una actividad diferente de la especificada en la primera parte del presente contrato; 3) Por el incumplimiento de pago de dos cuotas consecutivas (o de forma alterna) de capital, intereses o gastos que se causen u originen por este contrato; 4) En los casos de los créditos otorgados, por la naturaleza de los plazos bimensual, trimestral, semestral, anual o al vencimiento, el incumplimiento de pago de la primera cuota hará exigible el total de la obligación, aunque la misma no se encuentre vencida en su totalidad; 5) Por el incumplimiento en el pago de capital, intereses, gastos u otras obligaciones contratadas con otros acreedores y que a criterio de “RAPICREDIT, S DE R. L DE C.V”, pongan en peligro de perjuicio los intereses de “RAPICREDIT, S DE R. L DE C.V”.",
	"VIGESIMO OCTAVO: LEYES Y JURISDICCION LEGAL. En todo lo no previsto en el presente contrato se estará a lo previsto en el Código Civil, Código de Comercio y Código Procesal Civil y la resolución de cualquier controversia o conflicto entre las partes relacionado directa o indirectamente con este contrato ya sea de la naturaleza, interpretación, cumplimiento, ejecución o terminación del mismo en el Juzgado de Letras o de Paz competente del lugar donde se suscriba el presente contrato.",
	"VIGESIMO NOVENO: ACEPTACION. “RAPICREDIT, S DE R. L DE C.V”, y EL PRESTATARIO y FIADORES SOLIDARIOS manifiestan estar de acuerdo con todas y cada una de las cláusulas de este contrato y aceptan la totalidad de su contenido, comprometiéndose a su fiel cumplimiento, firmado para constancia con copias como sean en número las partes, en El Progreso departamento de Yoro a los _____ (  ) días del mes de __________ del año (202_). El cliente acepta y es consciente de haber recibido de parte de “RAPICREDIT, S DE R. L DE C.V”, la información completa y correspondiente a las deducciones consignadas en este contrato de préstamo en moneda nacional, así como la información sobre el debido proceso para interponer reclamos.",
] as const;

const LABEL_SHIFT_FOR_CON_DESPLAZAMIENTO: Record<string, string> = {
	QUINTO: "CUARTO",
	SEXTO: "QUINTO",
	SEPTIMO: "SEXTO",
	OCTAVO: "SEPTIMO",
	NOVENO: "OCTAVO",
	DECIMO: "NOVENO",
	"DECIMO PRIMERO": "DECIMO",
	"DECIMO SEGUNDO": "DECIMO PRIMERO",
	"DECIMO TERCERO": "DECIMO SEGUNDO",
	"DECIMO CUARTO": "DECIMO TERCERO",
	"DECIMO QUINTO": "DECIMO CUARTO",
	"DECIMO SEXTO": "DECIMO QUINTO",
	"DECIMO SEPTIMO": "DECIMO SEXTO",
	"DECIMO OCTAVO": "DECIMO SEPTIMO",
	"DECIMO NOVENO": "DECIMO OCTAVO",
	VIGESIMO: "DECIMO NOVENO",
};

const numeroALetrasES = (value: number): string => {
	const n = Math.trunc(Number.isFinite(value) ? value : 0);
	const toWordsUnder100 = (num: number): string => {
		switch (num) {
			case 0:
				return "CERO";
			case 1:
				return "UNO";
			case 2:
				return "DOS";
			case 3:
				return "TRES";
			case 4:
				return "CUATRO";
			case 5:
				return "CINCO";
			case 6:
				return "SEIS";
			case 7:
				return "SIETE";
			case 8:
				return "OCHO";
			case 9:
				return "NUEVE";
			case 10:
				return "DIEZ";
			case 11:
				return "ONCE";
			case 12:
				return "DOCE";
			case 13:
				return "TRECE";
			case 14:
				return "CATORCE";
			case 15:
				return "QUINCE";
			case 20:
				return "VEINTE";
			case 30:
				return "TREINTA";
			case 40:
				return "CUARENTA";
			case 50:
				return "CINCUENTA";
			case 60:
				return "SESENTA";
			case 70:
				return "SETENTA";
			case 80:
				return "OCHENTA";
			case 90:
				return "NOVENTA";
			default:
				break;
		}

		if (num < 20) {
			return `DIECI${toWordsUnder100(num - 10)}`;
		}
		if (num < 30) {
			return `VEINTI${toWordsUnder100(num - 20)}`;
		}
		const tens = Math.trunc(num / 10) * 10;
		const unit = num % 10;
		return `${toWordsUnder100(tens)} Y ${toWordsUnder100(unit)}`;
	};

	const toWordsUnder1000 = (num: number): string => {
		if (num < 100) return toWordsUnder100(num);
		if (num === 100) return "CIEN";
		const hundreds = Math.trunc(num / 100);
		const rest = num % 100;
		const hundredsWord = (() => {
			switch (hundreds) {
				case 1:
					return "CIENTO";
				case 2:
					return "DOSCIENTOS";
				case 3:
					return "TRESCIENTOS";
				case 4:
					return "CUATROCIENTOS";
				case 5:
					return "QUINIENTOS";
				case 6:
					return "SEISCIENTOS";
				case 7:
					return "SETECIENTOS";
				case 8:
					return "OCHOCIENTOS";
				case 9:
					return "NOVECIENTOS";
				default:
					return "";
			}
		})();
		if (!rest) return hundredsWord;
		return `${hundredsWord} ${toWordsUnder100(rest)}`;
	};

	const toWords = (num: number): string => {
		if (num === 0) return "CERO";
		if (num < 0) return `MENOS ${toWords(-num)}`;
		if (num < 1000) return toWordsUnder1000(num);

		const billions = Math.trunc(num / 1_000_000_000);
		const millions = Math.trunc((num % 1_000_000_000) / 1_000_000);
		const thousands = Math.trunc((num % 1_000_000) / 1000);
		const rest = num % 1000;

		const parts: string[] = [];
		if (billions) {
			parts.push(`${toWordsUnder1000(billions)} MIL MILLONES`);
		}
		if (millions) {
			if (millions === 1) parts.push("UN MILLON");
			else parts.push(`${toWordsUnder1000(millions)} MILLONES`);
		}
		if (thousands) {
			if (thousands === 1) parts.push("MIL");
			else parts.push(`${toWordsUnder1000(thousands)} MIL`);
		}
		if (rest) {
			parts.push(toWordsUnder1000(rest));
		}
		return parts.join(" ").trim();
	};

	const apocoparUno = (words: string): string => {
		return words
			.replace(/\bVEINTIUNO\b/g, "VEINTIUN")
			.replace(/\bUNO\b/g, "UN");
	};

	return apocoparUno(toWords(n)).replace(/\s+/g, " ").trim();
};

type SolicitudContratosResponse = {
	tipoContrato?: string;
	contratos?: string[];
	data?: {
		tipoContrato?: string;
		contratos?: string[];
	};
};

type ContratoPlantillaResponse = {
	tipo?: string;
	html?: string;
};

type NormalizedSolicitudContratos = {
	tipoContrato: string;
	contratos: string[];
};

const plantillaPathPorTipoContrato = (tipoContrato: string): string | null => {
	if (tipoContrato === "Contrato sin desplazamiento") {
		return "/contratos/plantillas/contrato-sin-desplazamiento";
	}
	if (tipoContrato === "Contrato con desplazamiento") {
		return "/contratos/plantillas/contrato-con-desplazamiento";
	}
	return null;
};

const escapeHtml = (value: unknown): string => {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
};

const getDeep = (obj: unknown, path: string): unknown => {
	const parts = path.split(".");
	let current: unknown = obj;
	for (const key of parts) {
		if (!current || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
};

const fillTemplateMustacheLike = (html: string, data: unknown): string => {
	return html.replace(/{{\s*([\w.]+)\s*}}/g, (_m, key) => {
		return escapeHtml(getDeep(data, key));
	});
};

const safeParseContrato = (raw: string): Record<string, unknown> => {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (parsed && typeof parsed === "object") {
			return parsed as Record<string, unknown>;
		}
		return {};
	} catch {
		return {};
	}
};

const getContratoHtmlFromRaw = (raw: string): string | null => {
	const trimmed = String(raw || "").trim();
	if (!trimmed) return null;
	if (/^<!doctype\s+html/i.test(trimmed) || /^<html/i.test(trimmed) || /^<div/i.test(trimmed) || /^<p/i.test(trimmed) || /^<table/i.test(trimmed)) {
		return trimmed;
	}

	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (parsed && typeof parsed === "object") {
			const maybeHtml = (parsed as Record<string, unknown>).html;
			if (typeof maybeHtml === "string" && maybeHtml.trim()) {
				return maybeHtml;
			}
		}
	} catch {
		return null;
	}

	return null;
};

const normalizeSolicitudContratos = (value: unknown): NormalizedSolicitudContratos | null => {
	if (!value || typeof value !== "object") return null;
	const root = value as Record<string, unknown>;
	const nested = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;

	const tipoContrato =
		typeof root.tipoContrato === "string"
			? root.tipoContrato
			: typeof nested?.tipoContrato === "string"
				? nested.tipoContrato
				: "";

	const contratosRaw =
		Array.isArray(root.contratos)
			? root.contratos
			: Array.isArray(nested?.contratos)
				? nested.contratos
				: [];

	const contratos = contratosRaw
		.map((item) => (typeof item === "string" ? item : null))
		.filter((item): item is string => Boolean(item));

	if (!tipoContrato || contratos.length === 0) return null;

	return {
		tipoContrato,
		contratos,
	};
};

const enrichContratoData = (contratoData: Record<string, unknown>, prestamoData: NonNullable<ReturnType<typeof usePrestamoDetalle>["data"]>) => {
	const clienteFallback = {
		nombreCompleto: prestamoData.cliente?.nombreCompleto || "",
		identidadCliente: prestamoData.cliente?.identidadCliente || "",
		codigoCliente: prestamoData.cliente?.codigoCliente || "",
	};

	const prestamoFallback = {
		codigoPrestamo: prestamoData.codigoPrestamo || "",
		capitalSolicitado: prestamoData.capitalSolicitado ?? "",
		cuotaFija: prestamoData.cuotaFija ?? "",
		plazoCuotas: prestamoData.plazoCuotas ?? "",
		estadoPrestamo: prestamoData.estadoPrestamo || "",
	};

	const solicitudFallback = {
		codigoSolicitud: prestamoData.solicitudCodigo || prestamoData.solicitudId || "",
		id: prestamoData.solicitudId || "",
	};

	const contratoCliente =
		contratoData.cliente && typeof contratoData.cliente === "object"
			? (contratoData.cliente as Record<string, unknown>)
			: {};
	const contratoPrestamo =
		contratoData.prestamo && typeof contratoData.prestamo === "object"
			? (contratoData.prestamo as Record<string, unknown>)
			: {};
	const contratoSolicitud =
		contratoData.solicitud && typeof contratoData.solicitud === "object"
			? (contratoData.solicitud as Record<string, unknown>)
			: {};

	return {
		cliente: { ...clienteFallback, ...contratoCliente },
		prestamo: { ...prestamoFallback, ...contratoPrestamo },
		solicitud: { ...solicitudFallback, ...contratoSolicitud },
		nombreCliente: String(contratoData.nombreCliente ?? clienteFallback.nombreCompleto),
		identidadCliente: String(contratoData.identidadCliente ?? clienteFallback.identidadCliente),
		codigoSolicitud: String(contratoData.codigoSolicitud ?? solicitudFallback.codigoSolicitud),
		codigoPrestamo: String(contratoData.codigoPrestamo ?? prestamoFallback.codigoPrestamo),
		capitalSolicitado: contratoData.capitalSolicitado ?? prestamoFallback.capitalSolicitado,
		cuotaFija: contratoData.cuotaFija ?? prestamoFallback.cuotaFija,
		plazoCuotas: contratoData.plazoCuotas ?? prestamoFallback.plazoCuotas,
		...contratoData,
	};
};

const PrestamoDocumentosPage: React.FC = () => {
	const params = useParams();
	const codigoPrestamo = params?.id as string;

	const { empleado, loading: loadingPermisos } = usePermisos();
	const rolActual = (empleado?.rol || "").toLowerCase();
	const isGerente = rolActual === "gerente";

	const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, 0);
	const { data: tasas } = useTasasInteres();
	type DocType = "sin" | "con" | "dacion" | "pagare";
	const [generatingDoc, setGeneratingDoc] = useState<DocType | null>(null);
	const [loadingContratosWeb, setLoadingContratosWeb] = useState(false);
	const [contratosWeb, setContratosWeb] = useState<string[]>([]);
	const [contratosWebError, setContratosWebError] = useState<string | null>(null);
	const [tipoContratoSolicitud, setTipoContratoSolicitud] = useState<string>("");
	const [selectedContratoIndex, setSelectedContratoIndex] = useState(0);
	const generating = generatingDoc !== null;

	const formatMoney = (v?: number) =>
		v != null
			? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
			: "L. 0.00";

	useEffect(() => {
		if (!data || !isGerente) {
			setLoadingContratosWeb(false);
			setContratosWeb([]);
			setContratosWebError(null);
			setTipoContratoSolicitud("");
			setSelectedContratoIndex(0);
			return;
		}

		let cancelled = false;

		const loadContratosWeb = async () => {
			setLoadingContratosWeb(true);
			setContratosWeb([]);
			setContratosWebError(null);
			setTipoContratoSolicitud("");

			try {
				const solicitudCandidates = [data.solicitudCodigo, data.solicitudId]
					.filter((value): value is string => Boolean(value && String(value).trim()))
					.map((value) => value.trim());

				if (data.solicitudId) {
					try {
						const byId = await apiFetch<unknown>(`/solicitudes/id/${encodeURIComponent(data.solicitudId)}`, { silent: true });
						if (byId && typeof byId === "object") {
							const codigoSolicitud = (byId as Record<string, unknown>).codigoSolicitud;
							if (typeof codigoSolicitud === "string" && codigoSolicitud.trim()) {
								solicitudCandidates.unshift(codigoSolicitud.trim());
							}
						}
					} catch {
						// endpoint puede no existir; seguimos con candidatos disponibles
					}
				}

				const uniqueSolicitudCandidates = Array.from(new Set(solicitudCandidates));

				if (uniqueSolicitudCandidates.length === 0) {
					throw new Error("El préstamo no tiene solicitud asociada para consultar contratos.");
				}

				let solicitudContratos: NormalizedSolicitudContratos | null = null;
				for (const solicitudRef of uniqueSolicitudCandidates) {
					try {
						const response = await apiFetch<SolicitudContratosResponse>(
							`/solicitudes/${encodeURIComponent(solicitudRef)}/contratos`,
							{ silent: true }
						);
						const normalized = normalizeSolicitudContratos(response);
						if (normalized) {
							solicitudContratos = normalized;
							break;
						}
					} catch {
						// si falla este candidate, intentamos el siguiente
					}
				}

				if (!solicitudContratos) {
					throw new Error("No se pudieron obtener contratos de la solicitud asociada.");
				}

				const tipoContrato = String(solicitudContratos.tipoContrato || "");
				const templatePath = plantillaPathPorTipoContrato(tipoContrato);

				if (!templatePath) {
					throw new Error("La solicitud no tiene tipo de contrato compatible para plantilla.");
				}

				const templateResponse = await apiFetch<ContratoPlantillaResponse>(templatePath);
				const templateHtml = typeof templateResponse?.html === "string" ? templateResponse.html : "";

				if (!templateHtml) {
					throw new Error("No se pudo cargar la plantilla del contrato.");
				}

				const contratosRaw = solicitudContratos.contratos;
				const contratosRenderizados = contratosRaw.map((rawContrato) => {
					const htmlDirecto = getContratoHtmlFromRaw(rawContrato);
					if (htmlDirecto) {
						return htmlDirecto;
					}

					const dataContrato = typeof rawContrato === "string" ? safeParseContrato(rawContrato) : {};
					const payload = enrichContratoData(dataContrato, data);
					return fillTemplateMustacheLike(templateHtml, payload);
				});

				if (cancelled) return;

				setContratosWeb(contratosRenderizados);
				setTipoContratoSolicitud(tipoContrato);
				setSelectedContratoIndex(0);
			} catch (err) {
				if (cancelled) return;
				const msg = err instanceof Error ? err.message : "No se pudieron cargar los contratos.";
				setContratosWeb([]);
				setTipoContratoSolicitud("");
				setContratosWebError(msg);
				setSelectedContratoIndex(0);
			} finally {
				if (!cancelled) {
					setLoadingContratosWeb(false);
				}
			}
		};

		loadContratosWeb();

		return () => {
			cancelled = true;
		};
	}, [data, isGerente]);

	const tasaInteresLabel = useMemo(() => {
		if (!data) return "—";

		const tasaPorCatalogo = tasas.find(
			(t) =>
				String(t._id) === String(data.tasaInteresId || "") ||
				String(t.codigoTasa || "") === String(data.tasaInteresId || "")
		);

		const nombre = data.tasaInteresNombre || tasaPorCatalogo?.nombre;
		const porcentaje =
			data.tasaInteresAnual ??
			tasaPorCatalogo?.porcentajeInteres;

		if (nombre && porcentaje != null) return `${nombre} (${porcentaje}%)`;
		if (nombre) return nombre;
		if (porcentaje != null) return `${porcentaje}%`;
		return data.tasaInteresId || "—";
	}, [data, tasas]);

	type PdfContext = {
		doc: import("jspdf").jsPDF;
		addTitle: (text: string) => void;
		addCentered: (text: string, opts?: { bold?: boolean }) => void;
		addParagraph: (text: string) => void;
		addFirmasContrato: () => void;
		addFirmasPagare: () => void;
		newPage: () => void;
	};

	const createPdfContext = async (): Promise<PdfContext> => {
		const { jsPDF } = await import("jspdf");
		const doc = new jsPDF({ unit: "mm", format: "letter" });
		doc.setFont("times", "normal");
		doc.setLineWidth(0.2);

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const marginX = 22;
		const marginTop = 18;
		const marginBottom = 18;
		const contentWidth = pageWidth - marginX * 2;
		const bottomY = pageHeight - marginBottom;

		const bodyFontSize = 10;
		const titleFontSize = 11;
		const lineHeight = 4.8;
		const paragraphGap = 2;

		let y = marginTop;

		const newPage = () => {
			doc.addPage();
			y = marginTop;
		};

		const ensureLine = () => {
			if (y + lineHeight > bottomY) newPage();
		};

		const wrapByWords = (text: string, firstWidth: number, nextWidth: number): string[] => {
			doc.setFont("times", "normal");
			doc.setFontSize(bodyFontSize);
			const words = String(text)
				.replace(/\s+/g, " ")
				.trim()
				.split(" ")
				.filter(Boolean);
			const lines: string[] = [];
			let idx = 0;
			let maxWidth = Math.max(10, firstWidth);
			while (idx < words.length) {
				let line = words[idx] ?? "";
				idx += 1;
				while (idx < words.length) {
					const test = `${line} ${words[idx]}`;
					if (doc.getTextWidth(test) <= maxWidth) {
						line = test;
						idx += 1;
					} else {
						break;
					}
				}
				lines.push(line);
				maxWidth = Math.max(10, nextWidth);
			}
			return lines.length ? lines : [""];
		};

		const addTitle = (text: string) => {
			doc.setFont("times", "bold");
			doc.setFontSize(titleFontSize);
			const lines = doc.splitTextToSize(text, contentWidth);
			for (const line of lines) {
				ensureLine();
				doc.text(line, pageWidth / 2, y, { align: "center" });
				y += lineHeight;
			}
			y += 1;
		};

		const addCentered = (text: string, opts?: { bold?: boolean }) => {
			doc.setFont("times", opts?.bold ? "bold" : "normal");
			doc.setFontSize(bodyFontSize);
			const lines = doc.splitTextToSize(String(text), contentWidth);
			for (const line of lines) {
				ensureLine();
				doc.text(line, pageWidth / 2, y, { align: "center" });
				y += lineHeight;
			}
			y += paragraphGap;
		};

		const addParagraph = (text: string) => {
			const clauseMatch = String(text).match(/^([A-ZÁÉÍÓÚÑ ]{3,}):\s*(.*)$/);
			if (clauseMatch) {
				const labelText = `${clauseMatch[1]}: `;
				const bodyText = clauseMatch[2] ?? "";

				doc.setFont("times", "bold");
				doc.setFontSize(bodyFontSize);
				const labelWidth = doc.getTextWidth(labelText);
				doc.setFont("times", "normal");
				doc.setFontSize(bodyFontSize);
				const lines = wrapByWords(bodyText, contentWidth - labelWidth, contentWidth);

				ensureLine();
				doc.setFont("times", "bold");
				doc.text(labelText, marginX, y);
				doc.setFont("times", "normal");
				doc.text(lines[0] ?? "", marginX + labelWidth, y);
				y += lineHeight;

				for (let i = 1; i < lines.length; i += 1) {
					ensureLine();
					doc.text(lines[i] ?? "", marginX, y);
					y += lineHeight;
				}
				y += paragraphGap;
				return;
			}

			doc.setFont("times", "normal");
			doc.setFontSize(bodyFontSize);
			const lines = doc.splitTextToSize(String(text), contentWidth);
			for (const line of lines) {
				ensureLine();
				doc.text(line, marginX, y);
				y += lineHeight;
			}
			y += paragraphGap;
		};

		const addFirmasContrato = () => {
			const needed = 40;
			if (y + needed > bottomY) newPage();

			doc.setFont("times", "normal");
			doc.setFontSize(bodyFontSize);

			const lineW = 70;
			const leftX = marginX + 10;
			const rightX = pageWidth - marginX - 10 - lineW;
			const midX = pageWidth / 2;

			doc.line(leftX, y + 2, leftX + lineW, y + 2);
			doc.line(rightX, y + 2, rightX + lineW, y + 2);
			y += lineHeight + 1;

			ensureLine();
			doc.text("EL PRESTATARIO", leftX + 10, y);
			doc.text("FIADOR SOLIDARIO", rightX + 10, y);
			y += lineHeight;

			ensureLine();
			doc.text("ID:", leftX, y);
			doc.text("ID:", rightX, y);
			y += lineHeight;

			y += 10;
			if (y + lineHeight * 2 > bottomY) newPage();
			doc.line(midX - 40, y + 2, midX + 40, y + 2);
			y += lineHeight + 1;
			ensureLine();
			doc.text("GERENTE GENERAL", midX, y, { align: "center" });
			y += lineHeight + paragraphGap;
		};

		const addFirmasPagare = () => {
			const needed = 28;
			if (y + needed > bottomY) newPage();

			doc.setFont("times", "normal");
			doc.setFontSize(bodyFontSize);

			const lineW = 70;
			const leftX = marginX + 10;
			const rightX = pageWidth - marginX - 10 - lineW;

			doc.line(leftX, y + 2, leftX + lineW, y + 2);
			doc.line(rightX, y + 2, rightX + lineW, y + 2);
			y += lineHeight + 1;

			ensureLine();
			doc.text("EL PRESTATARIO", leftX + 10, y);
			doc.text("FIADOR SOLIDARIO", rightX + 10, y);
			y += lineHeight;

			ensureLine();
			doc.text("ID:", leftX, y);
			doc.text("ID:", rightX, y);
			y += lineHeight + paragraphGap;
		};

		return {
			doc,
			addTitle,
			addCentered,
			addParagraph,
			addFirmasContrato,
			addFirmasPagare,
			newPage,
		};
	};

	const buildClausulasContratoConDesplazamiento = (args: {
		tercero: string;
		garantia: string;
		bienes: string[];
	}): string[] => {
		const out: string[] = [];
		for (const clause of CLAUSULAS_CONTRATO_SIN_DESPLAZAMIENTO) {
			const m = String(clause).match(/^([A-ZÁÉÍÓÚÑ ]{3,}):\s*(.*)$/);
			if (!m) {
				out.push(clause);
				continue;
			}
			const label = (m[1] ?? "").trim();
			const rest = m[2] ?? "";

			if (label === "CUARTO") {
				out.push(args.tercero);
				continue;
			}
			if (label === "DECIMO QUINTO") {
				out.push(args.garantia);
				out.push(...args.bienes);
				continue;
			}
			const mapped = LABEL_SHIFT_FOR_CON_DESPLAZAMIENTO[label];
			if (mapped) {
				out.push(`${mapped}: ${rest}`);
				continue;
			}
			out.push(clause);
		}
		return out;
	};

	const handleGenerarPdfSinDesplazamiento = async () => {
		if (!data || generating) return;
		setGeneratingDoc("sin");
		try {
			const { doc, addTitle, addCentered, addParagraph, addFirmasContrato, addFirmasPagare, newPage } = await createPdfContext();
			const nombreCliente = data.cliente?.nombreCompleto || "________________";
			const identidadCliente = data.cliente?.identidadCliente || "________________";
			const monto = data.capitalSolicitado ?? 0;
			const montoStr = monto.toLocaleString("es-HN", { minimumFractionDigits: 2 });

			addTitle("CONTRATO DE PRESTAMO CON GARANTIA MOBILIARIA SIN DESPLAZAMIENTO");
			addCentered(`POR L. ${montoStr}`, { bold: true });
			addParagraph(
				`La Sociedad Mercantil denominada “CREDITO RAPIDO, SOCIEDAD DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE” o su abreviatura “RAPICREDIT, S DE R. L DE C.V”, representada por MARVIN EDGARDO HERNANANDEZ ESPAÑA, con documento nacional de identificación número 1804- 1998-01355, del domicilio de El Progreso, Yoro, con facultades suficientes para suscribir el presente contrato, en adelante se denominara “RAPICREDIT, S DE R. L DE C.V”, y el (la) señor (a) ${nombreCliente}, quien actúa en su condición personal y que en lo sucesivo se denominara EL PRESTATARIO, con documento nacional de identificación número ${identidadCliente}, mayor de edad, soltero, hondureño, y del domicilio ____________________, de la ciudad de __________, Departamento de __________, quien declara que en esta misma fecha recibe de “RAPICREDIT, S DE R. L DE C.V”, la cantidad de ${montoStr} LEMPIRAS (L. ${montoStr}), de acuerdo a las modalidades, plazos y condiciones que contiene este documento:`
			);

			for (const c of CLAUSULAS_CONTRATO_SIN_DESPLAZAMIENTO) addParagraph(c);
			addFirmasContrato();

			newPage();
			addTitle(`PAGARE SIN PROTESTO POR L. ${montoStr}`);
			addParagraph(
				`Yo, ${nombreCliente}, soltero, mayor de edad con nacionalidad hondureña, vecino(a) de ____________________, Municipio de __________, Departamento de __________, en tránsito por esta ciudad, con Documento Nacional de Identificación número ${identidadCliente} denominado EL DEUDOR, por el presente documento manifestó que DEBO y PAGARE incondicionalmente a “RAPICREDIT, S DE R. L DE C.V”; representada por el señor MARVIN EDGARDO HERNANANDEZ ESPAÑA su Gerente General, con documento nacional de identificación número dieciocho cero cuatro espacio un mil novecientos noventa y ocho espacio cero uno trescientos cincuenta y cinco (1804 1998 01355), la cantidad de ${montoStr} Lempiras (L. ${montoStr}.00) conforme al contrato privado de préstamo suscrito y al plan de pago firmado que especifica las fechas de cada cuota.`
			);
			addParagraph(
				"Con un interés anual según lo pactado; una comisión deducida sobre el monto inicial y que serán retenidos del principal al momento del desembolso por concepto de gastos administrativos tales como gastos de papelería y consultas a las centrales de riesgos privadas, visitas de verificación previas al desembolso del crédito y gastos legales. EL DEUDOR suscribirá póliza de seguro de vida y esta será de una compañía aseguradora regulada en Honduras, por el valor de la deuda y vigencia del préstamo bajo las condiciones de la Compañía Aseguradora que EL DEUDOR elija, endosando la póliza como único beneficiario a “RAPICREDIT, S DE R. L DE C.V”; de no contar con una póliza de seguro EL DEUDOR autoriza al ACREEDOR a suscribir Seguro de Vida en el momento del desembolso hasta la cancelación del préstamo."
			);
			addParagraph(
				"Y en caso de caer en mora de una cuota o por el incumplimiento de las otras obligaciones aquí estipuladas se me cargará como deudor una tasa adicional mensual, sin que por este hecho se considere prorrogado el plazo; y dará lugar a que el crédito se declare totalmente vencido, dejando al acreedor en libertad de proceder por la vía que considere oportuna, para la recuperación de su crédito."
			);
			addParagraph(
				`Y junto a las partes contratantes de “RAPICREDIT, S DE R. L DE C.V”, firmamos este PAGARE SIN PROTESTO, en la ciudad de El Progreso a los _____ días de __________ del 20__.`
			);
			addFirmasPagare();

			doc.save(`Contrato_SinDesplazamiento_${data.codigoPrestamo || "prestamo"}.pdf`);
		} catch (err) {
			console.error("Error generando PDF de contrato:", err);
		} finally {
			setGeneratingDoc(null);
		}
	};

	const handleGenerarPdfConDesplazamiento = async () => {
		if (!data || generating) return;
		setGeneratingDoc("con");
		try {
			const { doc, addTitle, addCentered, addParagraph, addFirmasContrato, addFirmasPagare, newPage } = await createPdfContext();
			const nombreCliente = data.cliente?.nombreCompleto || "________________";
			const identidadCliente = data.cliente?.identidadCliente || "________________";
			const monto = data.capitalSolicitado ?? 0;
			const montoStr = monto.toLocaleString("es-HN", { minimumFractionDigits: 2 });
			const montoLetras = numeroALetrasES(Math.trunc(monto));
			const plazo = data.plazoCuotas ?? 0;
			const cuota = data.cuotaFija ?? 0;
			const cuotaStr = cuota.toLocaleString("es-HN", { minimumFractionDigits: 2 });
			const cuotaLetras = numeroALetrasES(Math.trunc(cuota));
			const plazoStr = plazo > 0 ? String(plazo) : "_____";

			addTitle("CONTRATO DE PRESTAMO CON GARANTIA MOBILIARIA CON DESPLAZAMIENTO");
			addCentered(`POR L. ${montoStr}`, { bold: true });
			addParagraph(
				`La Sociedad Mercantil denominada “CREDITO RAPIDO, SOCIEDAD DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE” o su abreviatura “RAPICREDIT, S DE R. L DE C.V”, representada por MARVIN EDGARDO HERNANANDEZ ESPAÑA, con documento nacional de identificación número 1804- 1998-01355, del domicilio de El Progreso, Yoro, con facultades suficientes para suscribir el presente contrato, en adelante se denominara “RAPICREDIT, S DE R. L DE C.V”, y el (la) señor (a) ${nombreCliente}, quien actúa en su condición personal y que en lo sucesivo se denominara EL PRESTATARIO, con documento nacional de identificación número ${identidadCliente}, mayor de edad, soltero, hondureño, y del domicilio ____________________, de la ciudad de __________, Departamento de __________, quien declara que en esta misma fecha recibe de “RAPICREDIT, S DE R. L DE C.V”, la cantidad de ______ ${montoLetras} ______ LEMPIRAS (L. __${montoStr}__), de acuerdo a las modalidades, plazos y condiciones que contiene este documento:`
			);

			const tercero =
				`TERCERO: La suma prestada deberá ser cancelada por EL PRESTATARIO, dentro de un plazo de _____ (${plazoStr}) meses, contado a partir de la presente fecha, en ${plazoStr} cuotas mensuales de capital más intereses corrientes de ______ ${cuotaLetras} ______ LEMPIRAS (L. ${cuotaStr}) ______, durante la vigencia del presente contrato EL PRESTATARIO, se obliga a pagar puntualmente, en la fecha y cantidad establecida en el cronograma o plan de pagos convenido de mutuo acuerdo con “RAPICREDIT, S DE R. L DE C.V”, la tasa de interés que rige el presente contrato será calculada mensual sobre el saldo de capital adeudado.`;

			const garantia =
				`DECIMO CUARTO: GARANTIA MOBILIARIA: Manifiesta EL DEUDOR, que acepta todas y cada una de las condiciones del presente contrato y que recibe a su entera satisfacción la cantidad de ______ ${montoLetras} ______ LEMPIRAS (L. __${montoStr}__), en calidad de préstamo que así mismo para garantizar el cumplimiento de la obligación contraída, constituye garantía mobiliaria con desplazamiento a favor de “RAPICREDIT, S DE R. L DE C.V”, sobre los siguientes bienes:`;
			const bienes = [
				"MARCA: ____________________",
				"MODELO: ____________________",
				"TIPO: ____________________",
				"AÑO: ____________________",
				"MOTOR: ____________________",
				"CHASIS: ____________________",
				"COLOR: ____________________",
				"PLACA: ____________________",
				"VIN: ____________________",
			];

			for (const c of buildClausulasContratoConDesplazamiento({ tercero, garantia, bienes })) addParagraph(c);
			addFirmasContrato();

			newPage();
			addTitle(`PAGARE SIN PROTESTO POR L. ${montoStr}`);
			addParagraph(
				`Yo, ${nombreCliente}, soltero, mayor de edad con nacionalidad hondureña, vecino(a) de ____________________, Municipio de __________, Departamento de __________, en tránsito por esta ciudad, con Documento Nacional de Identificación número ${identidadCliente} denominado EL DEUDOR, por el presente documento manifestó que DEBO y PAGARE incondicionalmente a “RAPICREDIT, S DE R. L DE C.V”; representada por el señor MARVIN EDGARDO HERNANANDEZ ESPAÑA su Gerente General, con documento nacional de identificación número dieciocho cero cuatro espacio un mil novecientos noventa y ocho espacio cero uno trescientos cincuenta y cinco (1804 1998 01355), la cantidad de ${montoStr} Lempiras (L. ${montoStr}.00) conforme al contrato privado de préstamo suscrito y al plan de pago firmado que especifica las fechas de cada cuota.`
			);
			addParagraph(
				"Con un interés anual según lo pactado; una comisión deducida sobre el monto inicial y que serán retenidos del principal al momento del desembolso por concepto de gastos administrativos tales como gastos de papelería y consultas a las centrales de riesgos privadas, visitas de verificación previas al desembolso del crédito y gastos legales. EL DEUDOR suscribirá póliza de seguro de vida y esta será de una compañía aseguradora regulada en Honduras, por el valor de la deuda y vigencia del préstamo bajo las condiciones de la Compañía Aseguradora que EL DEUDOR elija, endosando la póliza como único beneficiario a “RAPICREDIT, S DE R. L DE C.V”; de no contar con una póliza de seguro EL DEUDOR autoriza al ACREEDOR a suscribir Seguro de Vida en el momento del desembolso hasta la cancelación del préstamo."
			);
			addParagraph(
				"Y en caso de caer en mora de una cuota o por el incumplimiento de las otras obligaciones aquí estipuladas se me cargará como deudor una tasa adicional mensual, sin que por este hecho se considere prorrogado el plazo; y dará lugar a que el crédito se declare totalmente vencido, dejando al acreedor en libertad de proceder por la vía que considere oportuna, para la recuperación de su crédito."
			);
			addParagraph(
				`Y junto a las partes contratantes de “RAPICREDIT, S DE R. L DE C.V”, firmamos este PAGARE SIN PROTESTO, en la ciudad de El Progreso a los _____ días de __________ del 20__.`
			);
			addFirmasPagare();

			doc.save(`Contrato_ConDesplazamiento_${data.codigoPrestamo || "prestamo"}.pdf`);
		} catch (err) {
			console.error("Error generando PDF de contrato:", err);
		} finally {
			setGeneratingDoc(null);
		}
	};

	const handleGenerarPdfDacionBienesMuebles = async () => {
		if (!data || generating) return;
		setGeneratingDoc("dacion");
		try {
			const { jsPDF } = await import("jspdf");
			const doc = new jsPDF({ unit: "mm", format: "letter" });
			doc.setFont("times", "normal");
			doc.setLineWidth(0.2);

			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();
			const marginX = 18;
			const marginTop = 16;
			const marginBottom = 16;
			const contentWidth = pageWidth - marginX * 2;
			const bottomY = pageHeight - marginBottom;

			const fontSize = 10;
			const titleFontSize = 11;
			const lineHeight = 4.8;

			let y = marginTop;

			const toDataUrl = async (url: string): Promise<string | null> => {
				try {
					const res = await fetch(url);
					if (!res.ok) return null;
					const blob = await res.blob();
					return await new Promise<string | null>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
						reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
						reader.readAsDataURL(blob);
					});
				} catch {
					return null;
				}
			};

			const logoDataUrl = await toDataUrl("/img/logo.png");
			if (logoDataUrl) {
				try {
					doc.addImage(logoDataUrl, "PNG", marginX, y, 32, 12);
				} catch {
					// si falla el logo, el resto del PDF debe generarse
				}
				y += 14;
			} else {
				y += 8;
			}

			doc.setFont("times", "bold");
			doc.setFontSize(titleFontSize);
			doc.text("DACION DE BIENES MUEBLES.", pageWidth / 2, y, { align: "center" });
			y += 9;

			doc.setFont("times", "normal");
			doc.setFontSize(fontSize);

			const introLine1 = "Yo, (NOSOTROS) ";
			const mayorEdad = ", mayor(es) de edad,";
			const x1 = marginX;
			doc.text(introLine1, x1, y);
			const introStart = x1 + doc.getTextWidth(introLine1) + 1;
			const mayorWidth = doc.getTextWidth(mayorEdad);
			const lineEnd = Math.min(marginX + contentWidth - mayorWidth - 2, pageWidth - marginX);
			doc.line(introStart, y + 1, Math.max(introStart + 10, lineEnd), y + 1);
			doc.text(mayorEdad, lineEnd + 2, y);
			y += lineHeight;

			const introLine2a = "hondureño(s) con domicilio en: ";
			const introLine2b = ", por medio";
			doc.text(introLine2a, marginX, y);
			const domStart = marginX + doc.getTextWidth(introLine2a) + 1;
			const bWidth = doc.getTextWidth(introLine2b);
			const domEnd = Math.min(marginX + contentWidth - bWidth - 2, pageWidth - marginX);
			doc.line(domStart, y + 1, Math.max(domStart + 10, domEnd), y + 1);
			doc.text(introLine2b, domEnd + 2, y);
			y += lineHeight;

			const introParagraph =
				"del presente documento hago FORMAL TRASPASO de todos los derechos que poseo (emos) sobre los bienes muebles de mi (nuestra) propiedad, pasando a las características que a continuación se detalla:";
			const introLines = doc.splitTextToSize(introParagraph, contentWidth);
			doc.text(introLines, marginX, y);
			y += introLines.length * lineHeight + 4;

			const ensureSpace = (needed: number) => {
				if (y + needed > bottomY) {
					doc.addPage();
					y = marginTop;
				}
			};

			// TABLA
			const rows = 4;
			const headerH = 7;
			const rowH = 10;
			const tableH = headerH + rows * rowH;
			ensureSpace(tableH + 6);
			const tableX = marginX;
			const tableY = y;
			const tableW = contentWidth;
			const colW = tableW / 4;

			doc.setFillColor(235, 235, 235);
			doc.rect(tableX, tableY, tableW, headerH, "F");
			doc.rect(tableX, tableY, tableW, tableH);
			for (let i = 1; i <= 3; i += 1) {
				doc.line(tableX + colW * i, tableY, tableX + colW * i, tableY + tableH);
			}
			doc.line(tableX, tableY + headerH, tableX + tableW, tableY + headerH);
			for (let r = 1; r < rows; r += 1) {
				doc.line(tableX, tableY + headerH + rowH * r, tableX + tableW, tableY + headerH + rowH * r);
			}

			doc.setFont("times", "bold");
			doc.setFontSize(9.5);
			const headers = ["DESCRIPCION", "MARCA", "SERIE", "VALOR"] as const;
			for (let i = 0; i < headers.length; i += 1) {
				doc.text(headers[i], tableX + colW * i + colW / 2, tableY + 5, { align: "center" });
			}
			doc.setFont("times", "normal");
			doc.setFontSize(fontSize);
			for (let r = 0; r < rows; r += 1) {
				doc.text("L", tableX + colW * 3 + 2, tableY + headerH + rowH * r + 6);
			}

			y += tableH + 8;

			const body2 =
				"A favor de RAPICREDIT S DE R. L DE C.V quien deberá considerarse como su único dueño y legítimo propietario quedando autorizado RAPICREDIT S DE R L DE C.V., en caso de que la situación del (nuestro) crédito presente más de 3 cuotas en atraso, autorizo a que el personal de RAPICREDIT S DE R. L DE C.V ingrese a mi (nuestra) casa de habitación y negocio de forma expedita sin necesidad de proceso judicial, y domicilio ubicado en: ____________________________. A las personas que la empresa designe a retirar los bienes muebles anteriormente descritos, mismos que no podrán ser enajenados después de 48 horas de retiro, si no he realizado la cancelación de las cuotas en atraso o el acuerdo pactado del crédito que garantiza los bienes muebles antes descritos.";
			const body2Lines = doc.splitTextToSize(body2, contentWidth);
			ensureSpace(body2Lines.length * lineHeight + 20);
			doc.text(body2Lines, marginX, y);
			y += body2Lines.length * lineHeight + 8;

			const firmo =
				"Firmo en la ciudad de ________________________, a los ______ del mes de _____________ del año ___________.";
			const firmoLines = doc.splitTextToSize(firmo, contentWidth);
			doc.text(firmoLines, marginX, y);
			y += firmoLines.length * lineHeight + 10;

			const signatureRow = (label: string) => {
				ensureSpace(26);
				const x = marginX;
				doc.setFont("times", "normal");
				doc.setFontSize(fontSize);
				doc.text("F.", x, y);
				doc.line(x + 6, y + 1, x + 76, y + 1);
				doc.text("ID", x + 78, y);
				doc.line(x + 86, y + 1, x + contentWidth, y + 1);
				y += lineHeight;
				doc.setFontSize(9);
				doc.text(label, x + 6, y);
				y += 10;
			};

			signatureRow("Firma del cliente");
			signatureRow("Firma del conyugue o aval.");

			doc.save(`Dacion_Bienes_Muebles_${data.codigoPrestamo || "prestamo"}.pdf`);
		} catch (err) {
			console.error("Error generando PDF de dación:", err);
		} finally {
			setGeneratingDoc(null);
		}
	};

	const handleGenerarPdfPagare = async () => {
		if (!data || generating) return;
		setGeneratingDoc("pagare");
		try {
			const { doc, addTitle, addParagraph, addFirmasPagare } = await createPdfContext();
			const nombreCliente = data.cliente?.nombreCompleto || "________________";
			const identidadCliente = data.cliente?.identidadCliente || "________________";
			const montoBlancoNum = "________________";
			const montoBlancoLetras = "____________________________";

			addTitle(`PAGARE SIN PROTESTO POR L. ${montoBlancoNum}.00`);
			addParagraph(
				`Yo, ${nombreCliente}, soltero, mayor de edad con nacionalidad hondureña, vecino(a) de ____________________, Municipio de __________, Departamento de __________, en tránsito por esta ciudad, con Documento Nacional de Identificación Número ${identidadCliente}, denominado EL DEUDOR, por el presente documento manifestó que DEBO y PAGARE incondicionalmente a “RAPICREDIT, S DE R. L DE C.V”; representada por el señor(a) MARVIN EDGARDO HERNANANDEZ ESPAÑA su Gerente General, con documento nacional de identificación número (1804 1998 01355), la cantidad de ______ ${montoBlancoLetras} ______ Lempiras (L. __${montoBlancoNum}__.00), comenzando en fecha ____ días del mes de __________ del 20__ (____/____/20__), en la ciudad de El Progreso, conforme al contrato privado de Préstamo suscrito y al plan de pago firmado que especifica las fechas de cada cuota, con un interés del ________ por ciento (____ %) anual; una comisión deducida del ______ % sobre el monto inicial y que serán retenidos del principal al momento del desembolso por concepto de gastos administrativos tales como gastos de papelería y consultas a las centrales de riesgos privadas, visitas de verificación previas al desembolso del crédito y gastos legales por la cantidad de ______________ Lempiras (Lps. ____________).`
			);
			addParagraph(
				"EL DEUDOR suscribirá póliza de seguro de vida y esta será de una compañía Aseguradora regulada en Honduras, por el valor de la deuda y vigencia del préstamo bajo las condiciones de la Compañía Aseguradora que EL DEUDOR elija, endosando la póliza como único beneficiario a “RAPICREDIT, S DE R. L DE C.V”; de no contar con una póliza de seguro EL DEUDOR autoriza al ACREEDOR a suscribir Seguro de Vida en el momento del desembolso hasta la cancelación del préstamo."
			);
			addParagraph(
				"Y en caso de caer en mora de una cuota o por el incumplimiento de las otras obligaciones aquí estipuladas se me cargará como deudor una tasa del CUATRO POR CIENTO (4%) mensual, sin que por este hecho se considere prorrogado el plazo; y dará lugar a que el crédito se declare totalmente vencido, dejando al acreedor en libertad de proceder por la vía que considere oportuna, para la recuperación de su crédito."
			);
			addParagraph(
				"Y junto a las partes contratantes de “RAPICREDIT, S DE R. L DE C.V”; firmamos este PAGARE SIN PROTESTO, en la ciudad de El Progreso a los ____ días de __________ del 20__ (____/____/20__)."
			);
			addFirmasPagare();

			doc.save(`Pagare_${data.codigoPrestamo || "prestamo"}.pdf`);
		} catch (err) {
			console.error("Error generando PDF de pagaré:", err);
		} finally {
			setGeneratingDoc(null);
		}
	};

	const handleImprimirContratoWeb = () => {
		const html = contratosWeb[selectedContratoIndex];
		if (!html) return;

		const printWindow = window.open("", "_blank", "noopener,noreferrer");
		if (!printWindow) return;

		printWindow.document.open();
		printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>Contrato</title></head><body>${html}</body></html>`);
		printWindow.document.close();
		printWindow.focus();
		printWindow.print();
	};

	if (loadingPermisos || (loading && !data)) {
		return (
			<Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
				<CircularProgress size={28} />
			</Box>
		);
	}

	if (!isGerente) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning" sx={{ mb: 2 }}>
					Solo el Gerente puede visualizar el contrato y el pagaré de los préstamos.
				</Alert>
				<Button component={Link} href={codigoPrestamo ? `/prestamos/${encodeURIComponent(codigoPrestamo)}` : "/prestamos"} variant="outlined">
					Volver al préstamo
				</Button>
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography color="error" variant="body2">{error}</Typography>
			</Box>
		);
	}

	if (!data) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography variant="body2">No se pudo cargar la información del préstamo.</Typography>
			</Box>
		);
	}

	const estado = (data.estadoPrestamo || "").toUpperCase();

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
				<Box>
					<Typography variant="h6">Contrato y pagaré del préstamo {data.codigoPrestamo}</Typography>
					<Typography variant="body2" color="text.secondary">
						Cliente: {data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Estado del préstamo: {estado}
					</Typography>
				</Box>

				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
					<Button size="small" variant="outlined" component={Link} href={`/prestamos/${encodeURIComponent(data.codigoPrestamo)}`}>
						Volver al préstamo
					</Button>
				</Box>
			</Box>

			<Paper sx={{ p: 3 }}>
				<Typography variant="subtitle1" sx={{ mb: 2 }}>
					Datos del contrato
				</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Cliente
						</Typography>
						<Typography variant="body2">
							{data.cliente?.nombreCompleto || data.cliente?.codigoCliente || data.cliente?.identidadCliente || "—"}
						</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Capital
						</Typography>
						<Typography variant="body2">{formatMoney(data.capitalSolicitado)}</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Plazo (cuotas)
						</Typography>
						<Typography variant="body2">{data.plazoCuotas}</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Typography variant="caption" color="text.secondary">
							Tasa de interés
						</Typography>
						<Typography variant="body2">
							{tasaInteresLabel}
						</Typography>
					</Grid>
				</Grid>

				<Divider sx={{ my: 3 }} />

				<Alert severity="info" sx={{ mb: 2 }}>
					Selecciona el documento a generar. Los contratos incluyen pagaré.
				</Alert>

				<Divider sx={{ my: 3 }} />

				<Typography variant="subtitle1" sx={{ mb: 1 }}>
					Contratos guardados de la solicitud (vista web)
				</Typography>

				{loadingContratosWeb ? (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
						<CircularProgress size={20} />
						<Typography variant="body2" color="text.secondary">
							Cargando contratos guardados...
						</Typography>
					</Box>
				) : contratosWebError ? (
					<Alert severity="warning" sx={{ mb: 2 }}>
						{contratosWebError}
					</Alert>
				) : contratosWeb.length === 0 ? (
					<Alert severity="info" sx={{ mb: 2 }}>
						No hay contratos guardados para esta solicitud.
					</Alert>
				) : (
					<>
						<Alert severity="success" sx={{ mb: 2 }}>
							Tipo de contrato: {tipoContratoSolicitud || "—"}. Registros disponibles: {contratosWeb.length}.
						</Alert>

						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
							{contratosWeb.map((_contrato, index) => (
								<Button
									key={`contrato-web-${index + 1}`}
									variant={selectedContratoIndex === index ? "contained" : "outlined"}
									onClick={() => setSelectedContratoIndex(index)}
								>
									Contrato {index + 1}
								</Button>
							))}
						</Box>

						<Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: 560, overflow: "auto", bgcolor: "#fff" }}>
							<Box
								sx={{
									"& table": { width: "100%", borderCollapse: "collapse" },
									"& td, & th": { border: "1px solid #ddd", p: 1 },
								}}
								dangerouslySetInnerHTML={{ __html: contratosWeb[selectedContratoIndex] || "" }}
							/>
						</Paper>

						<Button variant="outlined" onClick={handleImprimirContratoWeb}>
							Imprimir contrato visible
						</Button>
					</>
				)}

				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
					<Button
						variant="contained"
						color="primary"
						onClick={handleGenerarPdfSinDesplazamiento}
						disabled={generating}
					>
						{generatingDoc === "sin" ? "Generando..." : "Generar PDF (sin desplazamiento)"}
					</Button>
					<Button
						variant="contained"
						color="secondary"
						onClick={handleGenerarPdfConDesplazamiento}
						disabled={generating}
					>
						{generatingDoc === "con" ? "Generando..." : "Generar PDF (con desplazamiento)"}
					</Button>
					<Button
						variant="contained"
						color="success"
						onClick={handleGenerarPdfPagare}
						disabled={generating}
					>
						{generatingDoc === "pagare" ? "Generando..." : "Generar PDF (solo pagaré)"}
					</Button>
					<Button
						variant="contained"
						color="info"
						onClick={handleGenerarPdfDacionBienesMuebles}
						disabled={generating}
					>
						{generatingDoc === "dacion" ? "Generando..." : "Generar PDF (dación bienes muebles)"}
					</Button>
				</Box>
			</Paper>
		</Box>
	);
};

export default PrestamoDocumentosPage;

