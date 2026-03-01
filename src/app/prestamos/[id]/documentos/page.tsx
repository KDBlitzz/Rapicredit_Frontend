"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Box, Paper, Typography, CircularProgress, Button, Divider } from "@mui/material";
import Link from "next/link";
import { usePrestamoDetalle } from "../../../../hooks/usePrestamoDetalle";
import { usePermisos } from "../../../../hooks/usePermisos";

const formatMoney = (v?: number) =>
  v != null ? `L. ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}` : "L. 0.00";

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-HN") : "-");

const PrestamoDocumentosPage: React.FC = () => {
  const params = useParams();
  const codigoPrestamo = params?.id as string;

  const { data, loading, error } = usePrestamoDetalle(codigoPrestamo, 0);
  const { empleado, loading: loadingPermisos } = usePermisos();

  const rolActual = (empleado?.rol || "").toLowerCase();
  const isGerente = rolActual === "gerente";

  if (loading || loadingPermisos) {
    return (
      <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!isGerente) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Acceso restringido
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No tiene permisos para acceder a la previsualización de contrato y pagaré.
        </Typography>
        <Button variant="outlined" component={Link} href="/prestamos">
          Volver a préstamos
        </Button>
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

  const clienteNombre = data.cliente?.nombreCompleto || "________________";
  const clienteIdentidad = data.cliente?.identidadCliente || "________________";
  const codigoCliente = data.cliente?.codigoCliente || "________________";

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}>
        <Box>
          <Typography variant="h6">Contrato y pagaré del préstamo {data.codigoPrestamo}</Typography>
          <Typography variant="caption" color="text.secondary">
            Cliente: {clienteNombre} ({codigoCliente} / {clienteIdentidad})
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" onClick={handlePrint}>
            Imprimir
          </Button>
          <Button size="small" variant="outlined" component={Link} href={`/prestamos/${encodeURIComponent(data.codigoPrestamo || "")}`}>
            Volver al préstamo
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, textAlign: "center", fontWeight: 600 }}>
          CONTRATO DE PRESTAMO CON GARANTIA MOBILIARIA SIN DESPLAZAMINETO
        </Typography>

        <Typography variant="body2" paragraph>
          POR {formatMoney(data.capitalSolicitado)}
        </Typography>

        <Typography variant="body2" paragraph>
          La Sociedad Mercantil denominada “CREDITO RAPIDO, SOCIEDAD DE RESPONSABILIDAD LIMITADA DE CAPITAL VARIABLE” o su abreviatura
          “RAPICREDIT, S DE R. L DE C.V”, representada por MARVIN EDGARDO HERNANANDEZ ESPAÑA, con documento nacional de identificación número 1804
          1998-01355, del domicilio de El Progreso, Yoro, con facultades suficientes para suscribir el presente contrato, en adelante se denominara
          “RAPICREDIT, S DE R. L DE C.V”,  y el (la) señor (a) {clienteNombre}, quien actúa en su condición personal y que en lo sucesivo se denominara
          EL PRESTATARIO, con documento nacional de identificación número {clienteIdentidad}, mayor de edad, soltero, hondureño, y del domicilio
          ________________________________________________, de la ciudad de ___________________, Departamento de __________________, quien declara que en esta misma fecha recibe de
          “RAPICREDIT, S DE R. L DE C.V”, la cantidad de {formatMoney(data.capitalSolicitado)}, de acuerdo a las modalidades, plazos y condiciones que contiene este documento:
        </Typography>

        <Typography variant="body2" paragraph>
          PRIMERO: Información: Declara el Deudor, que previo a la suscripción del presente contrato ha recibido a su satisfacción por parte del acreedor, la información relacionada con
          el presente contrato de préstamo, intereses, comisiones pactadas, así como las consecuencias por el incumplimiento de la obligación.
        </Typography>

        <Typography variant="body2" paragraph>
          SEGUNDO: La suma de dinero entregada en calidad de préstamo a EL PRESTATARIO, deberá ser usado exclusivamente para CAPITAL DE TRABAJO, mediante el producto o
          servicio financiero denominado ____________________________, siendo entendido que el cambio de destino de los fondos sin previa autorización de “RAPICREDIT, S DE R. L DE
          C.V”, dará derecho a esta para dar por vencida anticipadamente la obligación y para exigir su inmediato cumplimiento.
        </Typography>

        <Typography variant="body2" paragraph>
          CUARTO: La suma prestada deberá ser cancelada por EL PRESTATARIO, dentro de un plazo de __________________ (___) meses, contado a partir de la presente fecha, los días
          __________________ (_____) cuotas mensuales de capital más intereses corrientes de _________________________________ LEMPIRAS (L.___________), durante la vigencia del
          presente contrato EL PRESTATARIO, se obliga a pagar puntualmente, en la fecha y cantidad establecida en el cronograma o plan de pagos convenido de mutuo acuerdo con
          “RAPICREDIT, S DE R. L DE C.V”, la tasa de interés que rige el presente contrato será calculada mensual sobre el saldo de capital adeudado.
        </Typography>

        <Typography variant="body2" paragraph>
          QUINTO: EL préstamo devengara intereses a partir de la fecha de suscripción del Contrato a una tasa mensual de ______________________________________(___.____%), y una
          tasa de interés efectiva anual de _____________________________________ POR CIENTO (___.___%), en caso de incumplimiento en las fechas de pago establecidas en el
          cronograma, la tasa de interés moratorio será del Cinco por ciento (5%) mensual sobre el saldo de capital vencido.
        </Typography>

        <Typography variant="body2" paragraph>
          SEXTO: EL PRESTATARIO, autoriza a “RAPICREDIT, S DE R. L DE C.V”, a cobrar el tres por ciento (3%) en concepto de Comisión por otorgamiento, y gestos administrativos,
          el cual será calculado sobre el monto desembolsado y será cobrado una sola vez al momento del desembolso.
        </Typography>

        <Typography variant="body2" paragraph>
          SEPTIMO: modificación de intereses: Es entendido por EL DEUDOR, que la tasa de interés antes estipulada se podrá modificar según las condiciones del Mercado Financiero
          Nacional y la política crediticia de “RAPICREDIT, S DE R. L DE C.V”, con una notificación previa a su efectividad, de quince (15) días por el medio que “RAPICREDIT,
          S DE R. L DE C.V”, estime conveniente igualmente que cualquier ajuste resultante de la modificación de la tasa de interés, deberá ser cubierto por EL DEUDOR, quedando
          “RAPICREDIT, S DE R. L DE C.V”, autorizado para cobrar y efectuar tales ajustes.
        </Typography>

        <Typography variant="body2" paragraph>
          OCTAVO: Moneda: Es entendido que la cantidad de dinero prestado y sus intereses, deberá ser pagada por el deudor en moneda nacional.
        </Typography>

        <Typography variant="body2" paragraph>
          NOVENO: Fecha y Lugar de Pago: Es pactado que los pagos de capital, así como los intereses, deberán ser depositados en la fecha exacta de su vencimiento en las oficinas de
          “RAPICREDIT, S DE R. L DE C.V”, o a los promotores.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO: Los mecanismos de cobro extrajudiciales y judicial a implementar, en caso de mora serán los siguientes: a) Al presentar mora de uno (1) a ocho (8) visitas por el personal
          “RAPICREDIT, S DE R. L DE C.V”, requerimiento de pago extrajudicial con intervalo de tres (3) días entres sí; firmada la primera por el Asesor de Negocios, la Segunda por el Gerente
          de la Agencia con copia a los fiadores y la tercera firmada por el Gerente de Negocios o los supervisores de zona copia a los fiadores; b) Al presentar mora mayor de treinta (30) días
          requerimiento extrajudicial firmado por Apoderado Legal; c) La falta de pago de dos (2) cuotas consecutivas o alternas de capital o intereses hará exigible el total el total de la
          obligación, aunque la misma no se encuentre vencida en su totalidad, y se trasladara  al Apoderado Legal; d) En los casos de los créditos otorgados, por la naturaleza de los plazos
          Bimensual, Trimestral, Semestral, Anual o al Vencimiento, el incumplimiento en el pago de la primera cuota hará vencimiento, el cumplimiento en el pago de la primera cuanto hará
          exigible el total de la obligación y se trasladara al Apoderado Legal, aunque la misma no se encuentre vencida en su totalidad.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO PRIMERO: “RAPICREDIT, S DE R. L DE C.V”, comunicara a EL PRESTATARIO, en forma previa a su pactadas en este Contrato, aplicación cualquier modificación en las
          condiciones con treinta (30) días calendario de anticipación, previo a que la modificación entre en vigencia, a través de avisos escritos domicilio de los clientes, comunicados vía
          televisión, radio, periódico, medios electrónicos, avisos en su página web, La tasa de interés, las comisiones y precios que rigen este contrato podrá modificarse según las condiciones
          del mercado financiero nacional, previa notificación a los prestatarios con quince días de anticipación, Cualquier ajuste resultante de la modificación de la tasa de interés será cubierto
          por EL PRESTATARIO, quedando “RAPICREDIT, S DE R. L DE C.V”,  autorizado para efectuar y cobrar tales ajustes; en este caso particular el usuario concluida la relación financiero
          puede decidir dar por contractual con la consiguiente aplicación de los intereses que corresponda, sin penalidad o comisión.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO SEGUNDO: Intereses si el crédito o su saldo se cobraren por la vía judicial los normales y moratorios se continuarán ajustando en la misma forma, modo, procedimiento y
          fechas establecidas para el cobro normal.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO TERCERO: Cuando el pago de capital e intereses se efectué con cheque de cualquier Banco del sistema financiero nacional estos serán recibidos SALVO BUEN COBRO y el
          cheque que sea devuelto por cualquier causa dará derecho a “RAPICREDIT, S DE R. L DE C.V”, a cargar a EL PRESTATARIO el valor del cheque devuelto más la comisión por
          devolución y los intereses dejados.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO CUARTO: USO DE LA INFORMACIÓN: EL DEUDOR, y LOS AVALES SOLIDARIOS, autorizan a “RAPICREDIT, S DE R. L DE C.V”, a solicitar y dar información de sus
          obligaciones en el sistema financiero nacional, así como incorporar dicha información a la Central de Información Crediticia (CIC) u otra central de riesgos pública o privada, así como a
          financiadores del “RAPICREDIT, S DE R. L DE C.V”.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO QUINTO: GARANTIA MOBILIARIA: Manifiesta EL DEUDOR, que acepta todas y cada una de las condiciones del presente contrato y que recibe a su entera satisfacción la
          cantidad de {formatMoney(data.capitalSolicitado)}, en calidad de préstamo que así mismo para garantizar el cumplimiento de la obligación contraída, constituye garantía mobiliaria con
          desplazamiento a favor de “RAPICREDIT, S DE R. L DE C.V”, sobre los siguientes bienes:
        </Typography>

        <Typography variant="body2" paragraph>
          _________________________________________________________________________
          <br />
          _________________________________________________________________________
          <br />
          _________________________________________________________________________
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO SEXTO: AUTORIZACION EXTRAORDINARIA: a) Es pactado y entendido por EL DEUDOR, que conforme al articulo 55 numeral 2 y 60 de la Ley de Garantías Mobiliarias,
          “RAPICREDIT, S DE R. L DE C.V”, queda autorizado para apropiarse directamente de la totalidad o parte de los bienes garantizadores, en caso de que la garantía se pueda volver
          inservible al permanecer en poder del deudor, o cuando por la mora en el cumplimiento de la obligación sea evidente que no tiene EL DEUDOR capacidad para enfrentar la obligación
          contraída. b) autorización de Debito a Cuentas EL DEUDOR, autoriza irrevocablemente a “RAPICREDIT, S DE R. L DE C.V”, para que debite de sus cuentas, depósitos a plazo o cualquier
          otro deposito que posea con EL DEUDOR, por el importe de los saldos deudores, intereses pactados, abonos a capital, comisiones, tarifas, seguros, cargos por administración y gestiones de
          cobro por mora derivados del presente préstamo.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO SEPTIMO: DE LA EJECUCION DE LA GARANTIA: Es pactado y entendido que en caso de ejecución de los bienes garantizadores, la misma se efectuara en forma
          extrajudicial, con intervención de Notario, conforme al artículo 55 numeral 1 y 2 de la Ley de Garantías Mobiliarias, el cual será designado por “RAPICREDIT, S DE R. L DE C.V”,  y se
          deberá seguir el procedimiento establecido en la relacionada Ley de Garantías Mobiliarias; conservando “RAPICREDIT, S DE R. L DE C.V”, la facultad de utilizar la vía judicial ordinaria
          según lo requieran las circunstancias para la ejecución de los bienes garantizadores.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO OCTAVO: INSCRIPCION DE GARANTIA MOBILIARIA: Es pactado que EL DEUDOR, autoriza “RAPICREDIT, S DE R. L DE C.V”, para que presente el formulario de inscripción
          Inicial y las enmiendas posteriores, incluido el Formulario de Ejecución que establece la ley, asumiendo los costos que los mismos generan y que serán deducidos del primer desembolso.
        </Typography>

        <Typography variant="body2" paragraph>
          DECIMO NOVENO: PROHIBICION DE GRAVAMEN: ES entendido por EL DEUDOR, que no podrá realizar ninguna transacción, venta o gravamen con terceros, sobre los bienes
          garantizadores, sin autorización de “RAPICREDIT, S DE R. L DE C.V”.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO: EL PRESTATARIO o sus FIADORES SOLIDARIOS podrán pagar anticipadamente el principal adeudado en cuyo caso se aplicarán los pagos en el siguiente orden: 1) intereses
          moratorios si los hubiere, 2) Intereses normales, 3) Seguro de deuda y otros valores pendientes de pago hasta la fecha en que se haga la cancelación correspondiente 4) Capital.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO PRIMERO: Adicionalmente al presente contrato y como un instrumento adicional de garantía de la obligación contraída, EL PRESTATARIO sus FIADORES SOLIDARIOS, se
          comprometen a suscribir un PAGARE a favor de “RAPICREDIT, S DE R. L DE C.V”.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO SEGUNDO: EL PRESTATARIO sin notificación previa, autoriza expresamente a “RAPICREDIT, S DE R. L DE C.V”, para ceder o descontar el préstamo formalizado en este
          contrato, así como también autoriza a “RAPICREDIT, S DE R. L DE C.V”, a endosar el Titulo Valor (PAGARE) a cualquier institución pública o privada nacional e internacional. Así mismo
          EL PRESTATARIO se compromete a hacer todos los pagos a que está obligado a favor de “RAPICREDIT, S DE R. L DE C.V”, o a quien eventualmente se le haya cedido el crédito libre de
          cualquier deducción, impuesto, tasa, carga, gravamen, retención o contribución.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO TERCERO: EL PRESTATARIO y los FIADORES SOLIDARIO autorizan a “RAPICREDIT, S DE R. L DE C.V”, a solicitar y dar información de sus obligaciones en el sistema
          financiero nacional, así como incorporar dicha información a la central de riesgos de la COMISION NACIONAL DE BANCA Y SEGUROS (CNBS), Buros de crédito u otra central de riesgos
          pública o privada.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGECIMO CUARTO: CARÁCTER DEL CONTRATO. - De conformidad con el Artículo 166 de la ley del Sistema Financiero Nacional, el estado de cuenta certificado por el Contador o la
          Contadora de “RAPICREDIT, S DE R. L DE C.V”, hará fe en juicio para establecer el saldo a cargo de EL PRESTATARIO y constituirá junto con el presente Contrato Titulo Ejecutivo, sin
          necesidad de reconocimiento de firma ni de otro requisito previo alguno.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO QUINTO: DEL SEGURO: EL PRESTATARIO y LOS FIADORES SOLIDARIOS deben suscribir y mantener un seguro de deuda por la cuantía y condiciones que le señale
          “RAPICREDIT, S DE R. L DE C.V”, con cualquier compañía aseguradora aceptada por “RAPICREDIT, S DE R. L DE C.V”, mientras existan deudas, nombrando beneficiario único e
          irrevocable a “RAPICREDIT, S DE R. L DE C.V”, dentro de los límites de su interés, como acreedor del PRESTATARIO Y LOS FIADORES SOLIDARIOS asegurados.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO SEXTO: DE LOS GASTOS. - Serán por cuenta de EL PRESTATARIO Y LOS FIADORES SOLIDARIOS las costas personales, procesales, y honorarios legales de todas las acciones
          que intente “RAPICREDIT, S DE R. L DE C.V”, en contra de EL PRESTATARIO y LOS FIADORES SOLIDARIO, para la recuperación del crédito, serán también por su cuenta el pago de
          impuestos, tasas, y demás cargos derivados, de este contrato.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO SEPTIMO: Queda expresamente convenido que “RAPICREDIT, S DE R. L DE C.V”, podrá resolver este contrato de pleno derecho y acelerar el vencimiento de las obligaciones en
          que ha incurrido EL PRESTATARIO y los FIADORES SOLIDARIOS para con “RAPICREDIT, S DE R. L DE C.V”, y se consideraran de plazo vencido por incumplimiento por parte de
          EL PRESTATARIO y LOS FIADORES SOLIDARIOS en los siguientes casos: 1) Por incumplimiento o negativa de EL PRESTATARIO y LOS FIADORES SOLIDARIOS de satisfacer cualesquiera de
          las obligaciones, estipulaciones y condiciones de este contrato, o de las operaciones que se originen, contraten, o convengan en virtud del mismo; 2) Por utilizar o destinar los fondos del
          préstamo en una actividad diferente de la especificada en la primera parte del presente contrato. 3) Por el incumplimiento de pago de dos cuotas consecutivas (o de forma alterna) de capital,
          intereses o gastos que se causen u originen por este Contrato; En los casos de los créditos otorgados, por la naturaleza de los plazos Bimensual, Trimestral, Semestral, Anual o al
          vencimiento, el incumplimiento de pago de la primera cuota hará exigible el total de la obligación, aunque la misma no se encuentre vencida en su totalidad.  4) Por el incumplimiento en el pago
          de capital, intereses, gastos u otras obligaciones contratadas con otros acreedores y que a criterio de “RAPICREDIT, S DE R. L DE C.V”, pongan en peligro de perjuicio los intereses de
          “RAPICREDIT, S DE R. L DE C.V”.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO OCTAVO: LEYES Y JURISDICCION LEGAL. - En todo lo no previsto en el presente contrato se estará a lo previsto en el Código Civil, Comercio y Código Procesal Civil y la
          resolución de cualquier controversia o conflicto entre las partes relacionado directa o indirectamente, con este contrato ya sea de la naturaleza, interpretación, cumplimiento, ejecución o
          terminación del mismo se resolverá en el Juzgado de Letras o de Paz Competente del lugar donde se suscriba el presente contrato.
        </Typography>

        <Typography variant="body2" paragraph>
          VIGESIMO NOVENO: ACEPTACION. - “RAPICREDIT, S DE R. L DE C.V”, Y EL PRESTATARIO y FIADORES SOLIDARIOS manifiestan estar de acuerdo con todas y cada una de las cláusulas
          de este contrato y aceptan la totalidad de su contenido, comprometiéndose a su fiel cumplimiento, firmado para constancia con copias como sean en número las partes, en El Progreso
          departamento de Yoro a los _______________ (___) días del mes de ________________ del año _________________ (202__). El cliente acepta y es consciente de haber recibido de parte de
          “RAPICREDIT, S DE R. L DE C.V”, la información completa y correspondiente a las deducciones consignadas en este contrato de préstamo en moneda nacional, así como la información
          sobre el debido proceso para interponer reclamos.
        </Typography>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" align="center">EL PRESTATARIO</Typography>
            <Typography variant="caption" align="center" display="block">{clienteNombre}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" align="center">GERENTE GENERAL</Typography>
            <Typography variant="caption" align="center" display="block">RAPICREDIT, S DE R. L DE C.V</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, textAlign: "center", fontWeight: 600 }}>
          PAGARE SIN PROTESTO
        </Typography>

        <Typography variant="body2" paragraph>
          PAGARE SIN PROTESTO POR {formatMoney(data.capitalSolicitado)}
        </Typography>

        <Typography variant="body2" paragraph>
          Yo, {clienteNombre}, soltero, mayor de edad con nacionalidad hondureña, vecino(a) de ________________________________, Municipio de _____________________ Departamento de
          _____________________ tránsito por esta ciudad, con Documento Nacional de Identificación número {clienteIdentidad} denominado EL DEUDOR, por el presente documento manifestó que
          DEBO y PAGARE incondicionalmente a “RAPICREDIT, S DE R. L DE C.V”; representada por el señor(a) MARVIN EDGARDO HERNANDEZ ESPAÑA su Gerente General, con documento
          nacional de identificación número dieciocho cero cuatro espacio un mil novecientos noventa y ocho espacio cero uno trescientos cincuenta y cinco (1804 1998 01355), la cantidad de
          {formatMoney(data.capitalSolicitado)} comenzando en fecha _____ días del mes de _____________ del 202__ (___/____/ 20___) en la ciudad de El Progreso, conforme al contrato privado de
          Préstamo suscrito y al plan de pago firmado que especifica las fechas de cada cuota, con un interés del ______________________ Por Ciento (___.___%) anual; una comisión deducida del
          _____% sobre el monto inicial y que serán retenidos del principal al momento del desembolso por concepto de gastos administrativos tales como gastos de papelería y consultas a las
          centrales de riesgos privadas, visitas de verificación previas al desembolso del crédito y gastos legales por la cantidad de _______________________________ Lempiras (L______________).
        </Typography>

        <Typography variant="body2" paragraph>
          EL DEUDOR suscribirá póliza de seguro de vida y esta será de una compañía Aseguradora regulada en Honduras, por el valor de la deuda y vigencia del préstamo bajo las condiciones de la
          Compañía Aseguradora que EL DEUDOR elija, endosando la póliza como único beneficiario a “RAPICREDIT, S DE R. L DE C.V”; de no contar con una póliza de seguro EL DEUDOR autoriza al
          ACREEDOR a suscribir Seguro de Vida en el momento del desembolso hasta la cancelación del préstamo.
        </Typography>

        <Typography variant="body2" paragraph>
          Y en caso de caer en mora de una cuota o por el incumplimiento de las otras obligaciones aquí estipuladas se me cargará como deudor una tasa del CUATRO POR CIENTO (4%) mensual, sin que
          por este hecho se considere prorrogado el plazo; y dará lugar a que el crédito se declare totalmente vencido, dejando al acreedor en libertad de proceder por la vía que considere oportuna, para
          la recuperación su Crédito.
        </Typography>

        <Typography variant="body2" paragraph>
          Y junto a las partes contratantes de “RAPICREDIT, S DE R. L DE C.V”; firmamos este PAGARE SIN PROTESTO, en la ciudad de El Progreso a los __________________ días de
          _________________ del 20____ (____/___/ 202___).
        </Typography>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-start", gap: 6, flexWrap: "wrap" }}>
          <Box sx={{ minWidth: 260 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" align="center">EL PRESTATARIO</Typography>
            <Typography variant="caption" align="center" display="block">{clienteNombre}</Typography>
          </Box>
          <Box sx={{ minWidth: 260 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" align="center">FIADOR SOLIDARIO</Typography>
            <Typography variant="caption" align="center" display="block">____________________________</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PrestamoDocumentosPage;
