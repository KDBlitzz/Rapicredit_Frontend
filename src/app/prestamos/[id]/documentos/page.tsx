"use client";

import React, { useState } from "react";
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

const PrestamoDocumentosPage: React.FC = () => {
	const params = useParams();
	const codigoPrestamo = params?.id as string;

	const { empleado, loading: loadingPermisos } = usePermisos();
	const rolActual = (empleado?.rol || "").toLowerCase();
	const isGerente = rolActual === "gerente";

	const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, 0);
	const [generating, setGenerating] = useState(false);

	const formatMoney = (v?: number) =>
		v != null
			? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
			: "L. 0.00";

	const formatDate = (iso?: string) =>
		iso ? new Date(iso).toLocaleDateString("es-HN") : "-";

	const handleGenerarPdf = async () => {
		if (!data || generating) return;
		setGenerating(true);
		try {
			const jsPDFModule = await import("jspdf");
			const JsPdfCtor = (jsPDFModule as any).jsPDF || (jsPDFModule as any).default || (jsPDFModule as any);
			const doc = new JsPdfCtor({ unit: "mm", format: "letter" });

			const lineHeight = 6;
			let y = 20;

			const addTitle = (text: string) => {
				doc.setFontSize(14);
				const lines = (doc as any).splitTextToSize(text, 170);
				if (y + lines.length * lineHeight > 270) {
					doc.addPage();
					y = 20;
				}
				doc.text(lines, 20, y);
				y += lines.length * lineHeight + 4;
			};

			const addParagraph = (text: string) => {
				doc.setFontSize(11);
				const lines = (doc as any).splitTextToSize(text, 170);
				if (y + lines.length * lineHeight > 270) {
					doc.addPage();
					y = 20;
				}
				doc.text(lines, 20, y);
				y += lines.length * lineHeight + 2;
			};

			const nombreCliente = data.cliente?.nombreCompleto || "________________";
			const identidadCliente = data.cliente?.identidadCliente || "________________";
			const monto = data.capitalSolicitado ?? 0;
			const montoStr = monto.toLocaleString("es-HN", { minimumFractionDigits: 2 });

			// Portada
			addTitle(`CONTRATO DE PRESTAMO CON GARANTIA MOBILIARIA SIN DESPLAZAMINETO`);
			addParagraph(`POR L. ${montoStr}`);
			addParagraph(`Cliente: ${nombreCliente}`);
			addParagraph(`Número de préstamo: ${data.codigoPrestamo || ""}`);
			addParagraph(`Plazo (cuotas): ${data.plazoCuotas}`);
			addParagraph(`Tasa de interés: ${data.tasaInteresNombre || data.tasaInteresId || ""}`);
			addParagraph(`Fecha desembolso: ${formatDate(data.fechaDesembolso)}`);
			addParagraph(`Fecha vencimiento: ${formatDate(data.fechaVencimiento)}`);

			// Página de contrato completo
			doc.addPage();
			y = 20;
			addTitle("CONTRATO DE PRESTAMO CON GARANTIA MOBILIARIA SIN DESPLAZAMINETO");

			addParagraph(
				`La Sociedad Mercantil denominada “CREDITO RAPIDO, SOCIEDAD DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE” o su abreviatura “RAPICREDIT, S DE R. L DE C.V”, representada por MARVIN EDGARDO HERNANANDEZ ESPAÑA, con documento nacional de identificación número 1804- 1998-01355, del domicilio de El Progreso, Yoro, con facultades suficientes para suscribir el presente contrato, en adelante se denominara “RAPICREDIT, S DE R. L DE C.V”, y el (la) señor (a) ${nombreCliente}, quien actúa en su condición personal y que en lo sucesivo se denominara EL PRESTATARIO, con documento nacional de identificación número ${identidadCliente}, mayor de edad, soltero, hondureño, y del domicilio ____________________, de la ciudad de __________, Departamento de __________, quien declara que en esta misma fecha recibe de “RAPICREDIT, S DE R. L DE C.V”, la cantidad de ${montoStr} LEMPIRAS (L. ${montoStr}), de acuerdo a las modalidades, plazos y condiciones que contiene este documento:`
			);

			addParagraph(
				"PRIMERO: Información: Declara el Deudor, que previo a la suscripción del presente contrato ha recibido a su satisfacción por parte del acreedor, la información relacionada con el presente contrato de préstamo, intereses, comisiones pactadas, así como las consecuencias por el incumplimiento de la obligación."
			);

			addParagraph(
				"SEGUNDO: La suma de dinero entregada en calidad de préstamo a EL PRESTATARIO, deberá ser usada exclusivamente para CAPITAL DE TRABAJO, mediante el producto o servicio financiero denominado __________, siendo entendido que el cambio de destino de los fondos sin previa autorización de “RAPICREDIT, S DE R. L DE C.V”, dará derecho a esta para dar por vencida anticipadamente la obligación y para exigir su inmediato cumplimiento."
			);

			addParagraph(
				"CUARTO: La suma prestada deberá ser cancelada por EL PRESTATARIO, dentro de un plazo de _____ (   ) meses, contado a partir de la presente fecha, en cuotas mensuales de capital más intereses corrientes, durante la vigencia del presente contrato EL PRESTATARIO, se obliga a pagar puntualmente, en la fecha y cantidad establecida en el cronograma o plan de pagos convenido de mutuo acuerdo con “RAPICREDIT, S DE R. L DE C.V”, la tasa de interés que rige el presente contrato será calculada mensual sobre el saldo de capital adeudado."
			);

			addParagraph(
				"QUINTO: EL préstamo devengará intereses a partir de la fecha de suscripción del Contrato a una tasa mensual de _____ (  .  %), y una tasa de interés efectiva anual de _____ POR CIENTO ( . %), en caso de incumplimiento en las fechas de pago establecidas en el cronograma, la tasa de interés moratorio será del cinco por ciento (5%) mensual sobre el saldo de capital vencido."
			);

			addParagraph(
				"SEXTO: EL PRESTATARIO, autoriza a “RAPICREDIT, S DE R. L DE C.V”, a cobrar el tres por ciento (3%) en concepto de Comisión por otorgamiento y gestos administrativos, el cual será calculado sobre el monto desembolsado y será cobrado una sola vez al momento del desembolso."
			);

			addParagraph(
				"SEPTIMO: Modificación de intereses: Es entendido por EL DEUDOR, que la tasa de interés antes estipulada se podrá modificar según las condiciones del Mercado Financiero Nacional y la política crediticia de “RAPICREDIT, S DE R. L DE C.V”, con una notificación previa a su efectividad, de quince (15) días por el medio que “RAPICREDIT, S DE R. L DE C.V”, estime conveniente igualmente que cualquier ajuste resultante de la modificación de la tasa de interés, deberá ser cubierto por EL DEUDOR, quedando “RAPICREDIT, S DE R. L DE C.V”, autorizado para cobrar y efectuar tales ajustes."
			);

			addParagraph(
				"OCTAVO: Moneda: Es entendido que la cantidad de dinero prestado y sus intereses, deberá ser pagada por el deudor en moneda nacional."
			);

			addParagraph(
				"NOVENO: Fecha y Lugar de Pago: Es pactado que los pagos de capital, así como los intereses, deberán ser depositados en la fecha exacta de su vencimiento en las oficinas de “RAPICREDIT, S DE R. L DE C.V”, o a los promotores."
			);

			addParagraph(
				"DECIMO: Los mecanismos de cobro extrajudiciales y judicial a implementar, en caso de mora serán los siguientes: a) Al presentar mora de uno (1) a ocho (8) visitas por el personal “RAPICREDIT, S DE R. L DE C.V”, requerimiento de pago extrajudicial con intervalo de tres (3) días entres sí; firmada la primera por el Asesor de Negocios, la Segunda por el Gerente de la Agencia con copia a los fiadores y la tercera firmada por el Gerente de Negocios o los supervisores de zona copia a los fiadores; b) Al presentar mora mayor de treinta (30) días requerimiento extrajudicial firmado por Apoderado Legal; c) La falta de pago de dos (2) cuotas consecutivas o alternas de capital o intereses hará exigible el total el total de la obligación, aunque la misma no se encuentre vencida en su totalidad, y se trasladara al Apoderado Legal; d) En los casos de los créditos otorgados, por la naturaleza de los plazos Bimensual, Trimestral, Semestral, Anual o al Vencimiento, el incumplimiento en el pago de la primera cuota hará vencimiento, el cumplimiento en el pago de la primera cuanto hará exigible el total de la obligación y se trasladara al Apoderado Legal, aunque la misma no se encuentre vencida en su totalidad."
			);

			addParagraph(
				"DECIMO PRIMERO: “RAPICREDIT, S DE R. L DE C.V”, comunicara a EL PRESTATARIO, en forma previa a su aplicación cualquier modificación en las condiciones con treinta (30) días calendario de anticipación, previo a que la modificación entre en vigencia, a través de avisos escritos domicilio de los clientes, comunicados vía televisión, radio, periódico, medios electrónicos, avisos en su página web. La tasa de interés, las comisiones y precios que rigen este contrato podrá modificarse según las condiciones del mercado financiero nacional, previa notificación a los prestatarios con quince días de anticipación, Cualquier ajuste resultante de la modificación de la tasa de interés será cubierto por EL PRESTATARIO, quedando “RAPICREDIT, S DE R. L DE C.V”, autorizado para efectuar y cobrar tales ajustes; en este caso particular el usuario concluida la relación financiera puede decidir dar por terminado el contrato sin penalidad o comisión."
			);

			addParagraph(
				"DECIMO SEGUNDO: Intereses: si el crédito o su saldo se cobraren por la vía judicial los normales y moratorios se continuarán ajustando en la misma forma, modo, procedimiento y fechas establecidas para el cobro normal."
			);

			addParagraph(
				"DECIMO TERCERO: Cuando el pago de capital e intereses se efectúe con cheque de cualquier Banco del sistema financiero nacional estos serán recibidos SALVO BUEN COBRO y el cheque que sea devuelto por cualquier causa dará derecho a “RAPICREDIT, S DE R. L DE C.V”, a cargar a EL PRESTATARIO el valor del cheque devuelto más la comisión por devolución y los intereses dejados."
			);

			addParagraph(
				"DECIMO CUARTO: USO DE LA INFORMACIÓN: EL DEUDOR, y LOS AVALES SOLIDARIOS, autorizan a “RAPICREDIT, S DE R. L DE C.V”, a solicitar y dar información de sus obligaciones en el sistema financiero nacional, así como incorporar dicha información a la Central de Información Crediticia (CIC) u otra central de riesgos pública o privada, así como a financiadores del “RAPICREDIT, S DE R. L DE C.V”."
			);

			addParagraph(
				"DECIMO QUINTO: GARANTIA MOBILIARIA: Manifiesta EL DEUDOR, que acepta todas y cada una de las condiciones del presente contrato y que recibe a su entera satisfacción la cantidad de _____ (L. _____.00), en calidad de préstamo que así mismo para garantizar el cumplimiento de la obligación contraída, constituye garantía mobiliaria con desplazamiento a favor de “RAPICREDIT, S DE R. L DE C.V”, sobre los siguientes bienes: ____________."
			);

			addParagraph(
				"DECIMO SEXTO: AUTORIZACION EXTRAORDINARIA: a) Es pactado y entendido por EL DEUDOR, que conforme al artículo 55 numeral 2 y 60 de la Ley de Garantías Mobiliarias, “RAPICREDIT, S DE R. L DE C.V”, queda autorizado para apropiarse directamente de la totalidad o parte de los bienes garantizadores, en caso de que la garantía se pueda volver inservible al permanecer en poder del deudor, o cuando por la mora en el cumplimiento de la obligación sea evidente que no tiene EL DEUDOR capacidad para enfrentar la obligación contraída. b) Autorización de débito a cuentas: EL DEUDOR, autoriza irrevocablemente a “RAPICREDIT, S DE R. L DE C.V”, para que debite de sus cuentas, depósitos a plazo o cualquier otro depósito que posea con EL DEUDOR, por el importe de los saldos deudores, intereses pactados, abonos a capital, comisiones, tarifas, seguros, cargos por administración y gestiones de cobro por mora derivados del presente préstamo."
			);

			addParagraph(
				"DECIMO SEPTIMO: DE LA EJECUCION DE LA GARANTIA: Es pactado y entendido que en caso de ejecución de los bienes garantizadores, la misma se efectuará en forma extrajudicial, con intervención de Notario, conforme al artículo 55 numeral 1 y 2 de la Ley de Garantías Mobiliarias, el cual será designado por “RAPICREDIT, S DE R. L DE C.V”, y se deberá seguir el procedimiento establecido en la relacionada Ley de Garantías Mobiliarias; conservando “RAPICREDIT, S DE R. L DE C.V”, la facultad de utilizar la vía judicial ordinaria según lo requieran las circunstancias para la ejecución de los bienes garantizadores."
			);

			addParagraph(
				"DECIMO OCTAVO: INSCRIPCION DE GARANTIA MOBILIARIA: Es pactado que EL DEUDOR, autoriza “RAPICREDIT, S DE R. L DE C.V”, para que presente el formulario de inscripción inicial y las enmiendas posteriores, incluido el Formulario de Ejecución que establece la ley, asumiendo los costos que los mismos generan y que serán deducidos del primer desembolso."
			);

			addParagraph(
				"DECIMO NOVENO: PROHIBICION DE GRAVAMEN: Es entendido por EL DEUDOR, que no podrá realizar ninguna transacción, venta o gravamen con terceros, sobre los bienes garantizadores, sin autorización de “RAPICREDIT, S DE R. L DE C.V”."
			);

			addParagraph(
				"VIGESIMO: EL PRESTATARIO o sus FIADORES SOLIDARIOS podrán pagar anticipadamente el principal adeudado en cuyo caso se aplicarán los pagos en el siguiente orden: 1) intereses moratorios si los hubiere, 2) intereses normales, 3) seguro de deuda y otros valores pendientes de pago hasta la fecha en que se haga la cancelación correspondiente, 4) capital."
			);

			addParagraph(
				"VIGESIMO PRIMERO: Adicionalmente al presente contrato y como un instrumento adicional de garantía de la obligación contraída, EL PRESTATARIO y sus FIADORES SOLIDARIOS, se comprometen a suscribir un PAGARE a favor de “RAPICREDIT, S DE R. L DE C.V”."
			);

			addParagraph(
				"VIGESIMO SEGUNDO: EL PRESTATARIO sin notificación previa, autoriza expresamente a “RAPICREDIT, S DE R. L DE C.V”, para ceder o descontar el préstamo formalizado en este contrato, así como también autoriza a “RAPICREDIT, S DE R. L DE C.V”, a endosar el título valor (PAGARE) a cualquier institución pública o privada nacional e internacional. Así mismo EL PRESTATARIO se compromete a hacer todos los pagos a que está obligado a favor de “RAPICREDIT, S DE R. L DE C.V”, o a quien eventualmente se le haya cedido el crédito libre de cualquier deducción, impuesto, tasa, carga, gravamen, retención o contribución."
			);

			addParagraph(
				"VIGESIMO TERCERO: EL PRESTATARIO y los FIADORES SOLIDARIOS autorizan a “RAPICREDIT, S DE R. L DE C.V”, a solicitar y dar información de sus obligaciones en el sistema financiero nacional, así como incorporar dicha información a la central de riesgos de la COMISION NACIONAL DE BANCA Y SEGUROS (CNBS), buros de crédito u otra central de riesgos pública o privada."
			);

			addParagraph(
				"VIGECIMO CUARTO: CARÁCTER DEL CONTRATO. De conformidad con el Artículo 166 de la Ley del Sistema Financiero Nacional, el estado de cuenta certificado por el Contador o la Contadora de “RAPICREDIT, S DE R. L DE C.V”, hará fe en juicio para establecer el saldo a cargo de EL PRESTATARIO y constituirá junto con el presente contrato título ejecutivo, sin necesidad de reconocimiento de firma ni de otro requisito previo alguno."
			);

			addParagraph(
				"VIGESIMO QUINTO: DEL SEGURO: EL PRESTATARIO y LOS FIADORES SOLIDARIOS deben suscribir y mantener un seguro de deuda por la cuantía y condiciones que le señale “RAPICREDIT, S DE R. L DE C.V”, con cualquier compañía aseguradora aceptada por “RAPICREDIT, S DE R. L DE C.V”, mientras existan deudas, nombrando beneficiario único e irrevocable a “RAPICREDIT, S DE R. L DE C.V”, dentro de los límites de su interés, como acreedor del PRESTATARIO y LOS FIADORES SOLIDARIOS asegurados."
			);

			addParagraph(
				"VIGESIMO SEXTO: DE LOS GASTOS. Serán por cuenta de EL PRESTATARIO y LOS FIADORES SOLIDARIOS las costas personales, procesales, y honorarios legales de todas las acciones que intente “RAPICREDIT, S DE R. L DE C.V”, en contra de EL PRESTATARIO y LOS FIADORES SOLIDARIOS, para la recuperación del crédito, serán también por su cuenta el pago de impuestos, tasas, y demás cargos derivados de este contrato."
			);

			addParagraph(
				"VIGESIMO SEPTIMO: Queda expresamente convenido que “RAPICREDIT, S DE R. L DE C.V”, podrá resolver este contrato de pleno derecho y acelerar el vencimiento de las obligaciones en que ha incurrido EL PRESTATARIO y los FIADORES SOLIDARIOS para con “RAPICREDIT, S DE R. L DE C.V”, y se considerarán de plazo vencido por incumplimiento por parte de EL PRESTATARIO y LOS FIADORES SOLIDARIOS en los siguientes casos: 1) Por incumplimiento o negativa de EL PRESTATARIO y LOS FIADORES SOLIDARIOS de satisfacer cualesquiera de las obligaciones, estipulaciones y condiciones de este contrato, o de las operaciones que se originen, contraten, o convengan en virtud del mismo; 2) Por utilizar o destinar los fondos del préstamo en una actividad diferente de la especificada en la primera parte del presente contrato; 3) Por el incumplimiento de pago de dos cuotas consecutivas (o de forma alterna) de capital, intereses o gastos que se causen u originen por este contrato; 4) En los casos de los créditos otorgados, por la naturaleza de los plazos bimensual, trimestral, semestral, anual o al vencimiento, el incumplimiento de pago de la primera cuota hará exigible el total de la obligación, aunque la misma no se encuentre vencida en su totalidad; 5) Por el incumplimiento en el pago de capital, intereses, gastos u otras obligaciones contratadas con otros acreedores y que a criterio de “RAPICREDIT, S DE R. L DE C.V”, pongan en peligro de perjuicio los intereses de “RAPICREDIT, S DE R. L DE C.V”."
			);

			addParagraph(
				"VIGESIMO OCTAVO: LEYES Y JURISDICCION LEGAL. En todo lo no previsto en el presente contrato se estará a lo previsto en el Código Civil, Código de Comercio y Código Procesal Civil y la resolución de cualquier controversia o conflicto entre las partes relacionado directa o indirectamente con este contrato ya sea de la naturaleza, interpretación, cumplimiento, ejecución o terminación del mismo en el Juzgado de Letras o de Paz competente del lugar donde se suscriba el presente contrato."
			);

			addParagraph(
				"VIGESIMO NOVENO: ACEPTACION. “RAPICREDIT, S DE R. L DE C.V”, y EL PRESTATARIO y FIADORES SOLIDARIOS manifiestan estar de acuerdo con todas y cada una de las cláusulas de este contrato y aceptan la totalidad de su contenido, comprometiéndose a su fiel cumplimiento, firmado para constancia con copias como sean en número las partes, en El Progreso departamento de Yoro a los _____ (  ) días del mes de __________ del año (202_). El cliente acepta y es consciente de haber recibido de parte de “RAPICREDIT, S DE R. L DE C.V”, la información completa y correspondiente a las deducciones consignadas en este contrato de préstamo en moneda nacional, así como la información sobre el debido proceso para interponer reclamos."
			);

			addParagraph("EL PRESTATARIO		FIADOR SOLIDARIO");
			addParagraph("ID:		ID:");
			addParagraph("GERENTE GENERAL");

			// Página de PAGARE
			doc.addPage();
			y = 20;
			addTitle("PAGARE SIN PROTESTO");

			addParagraph(
				`Yo, ${nombreCliente}, soltero, mayor de edad con nacionalidad hondureña, vecino(a) de ____________________, Municipio de __________, Departamento de __________, en tránsito por esta ciudad, con Documento Nacional de Identificación número ${identidadCliente} denominado EL DEUDOR, por el presente documento manifestó que DEBO y PAGARE incondicionalmente a “RAPICREDIT, S DE R. L DE C.V”; representada por el señor MARVIN EDGARDO HERNANDEZ ESPAÑA su Gerente General, con documento nacional de identificación número dieciocho cero cuatro espacio un mil novecientos noventa y ocho espacio cero uno trescientos cincuenta y cinco (1804 1998 01355), la cantidad de ${montoStr} Lempiras (L. ${montoStr}.00) conforme al contrato privado de préstamo suscrito y al plan de pago firmado que especifica las fechas de cada cuota.`
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

			addParagraph("EL PRESTATARIO		FIADOR SOLIDARIO");
			addParagraph("ID:		ID:");

			doc.save(`Contrato_${data.codigoPrestamo || "prestamo"}.pdf`);
		} catch (err) {
			console.error("Error generando PDF de contrato:", err);
		} finally {
			setGenerating(false);
		}
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
							{data.tasaInteresNombre || data.tasaInteresId || "—"}
						</Typography>
					</Grid>
				</Grid>

				<Divider sx={{ my: 3 }} />

				<Alert severity="info" sx={{ mb: 2 }}>
					Al presionar el botón se generará el PDF del contrato y el pagaré utilizando estos datos.
				</Alert>

				<Button
					variant="contained"
					color="primary"
					onClick={handleGenerarPdf}
					disabled={generating}
				>
					{generating ? "Generando..." : "Generar PDF"}
				</Button>
			</Paper>
		</Box>
	);
};

export default PrestamoDocumentosPage;

