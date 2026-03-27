// ---------------------------------------------------------------------------
// documentFill.ts
// Funciones de relleno para Pagaré y Contratos de RapiCredit.
// ---------------------------------------------------------------------------

export interface ClienteCompleto {
  nombreCompleto: string;
  identidad: string;
  direccion: string;
  municipio: string;
  departamento: string;
}

export interface PrestamoData {
  capital?: number;
  capitalSolicitado?: number;
  interes?: number;
  tasaInteresAnual?: number;
  cuotas?: number;
  plazoCuotas?: number;
  cuotaFija?: number;
  comision?: number;
  gastosLegales?: number;
  [key: string]: unknown;
}

function fechaHoy() {
  const d = new Date();
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = meses[d.getMonth()];
  const anio4 = String(d.getFullYear());
  const anio2 = anio4.slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return { dia, mes, anio4, anio2, ddmmaa: `${dia}/${mm}/${anio2}` };
}

function lps(valor: number): string {
  return valor.toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function numeroALetras(n: number): string {
  const unidades = [
    "",
    "UNO",
    "DOS",
    "TRES",
    "CUATRO",
    "CINCO",
    "SEIS",
    "SIETE",
    "OCHO",
    "NUEVE",
    "DIEZ",
    "ONCE",
    "DOCE",
    "TRECE",
    "CATORCE",
    "QUINCE",
    "DIECISEIS",
    "DIECISIETE",
    "DIECIOCHO",
    "DIECINUEVE",
  ];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const centenas = [
    "",
    "CIEN",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ];

  if (n === 0) return "CERO";
  const entero = Math.floor(Math.abs(n));

  function grupo(num: number): string {
    if (num === 0) return "";
    if (num < 20) return unidades[num];
    if (num < 100) {
      const d = Math.floor(num / 10);
      const u = num % 10;
      if (num >= 20 && num < 30 && u > 0) return "VEINTI" + unidades[u];
      return u === 0 ? decenas[d] : decenas[d] + " Y " + unidades[u];
    }
    if (num === 100) return "CIEN";
    const c = Math.floor(num / 100);
    const r = num % 100;
    return r === 0 ? centenas[c] : centenas[c] + " " + grupo(r);
  }

  if (entero < 1000) return grupo(entero);
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  const prefMil = miles === 1 ? "MIL" : grupo(miles) + " MIL";
  return resto === 0 ? prefMil : prefMil + " " + grupo(resto);
}

function tasaALetras(tasa: number): string {
  const entero = Math.floor(tasa);
  const decimal = Math.round((tasa - entero) * 100);
  return decimal === 0
    ? numeroALetras(entero)
    : numeroALetras(entero) + " PUNTO " + numeroALetras(decimal);
}

export function fillPagare(
  html: string,
  prestamo: PrestamoData,
  cliente: ClienteCompleto
): string {
  const capital = Number(prestamo.capital ?? prestamo.capitalSolicitado ?? 0);
  const tasaA = Number(prestamo.interes ?? prestamo.tasaInteresAnual ?? 0);
  const comision = Number(prestamo.comision ?? 3);
  const gastosLeg = Number(prestamo.gastosLegales ?? 0);
  const f = fechaHoy();
  let h = html;

  h = h.replace(/POR L\._+\.00/, `POR L. ${lps(capital)}`);

  h = h.replace(/Yo,_{10,}/, `Yo, <strong>${cliente.nombreCompleto}</strong> `);

  h = h.replace(/vecino\(a\) de_{5,},/, `vecino(a) de <strong>${cliente.direccion}</strong>,`);

  h = h.replace(/Municipio de_{5,}Departamento/, `Municipio de <strong>${cliente.municipio}</strong> Departamento`);

  h = h.replace(/Departamento de_{5,}en tránsito/, `Departamento de <strong>${cliente.departamento}</strong> en tránsito`);

  h = h.replace(/Identificación Numero_{5,}/, `Identificación Numero <strong>${cliente.identidad}</strong>`);

  h = h.replace(
    /la cantidad de _{5,}\(L\._{4,}\.00\)/,
    `la cantidad de <strong>${numeroALetras(capital)} LEMPIRAS</strong> (L. <strong>${lps(capital)}</strong>)`
  );

  h = h.replace(
    /comenzando en fecha _{2,}días del mes de _{5,}del 202_{1,}\(_{2,}\/_{3,}\/ 20_{2,}\)/,
    `comenzando en fecha <strong>${f.dia}</strong> días del mes de <strong>${f.mes}</strong> del ${f.anio4} (<strong>${f.ddmmaa}</strong>)`
  );

  h = h.replace(
    /un interés del _{5,}Por Ciento\(_{2,}\._{2,}%\) anual/,
    `un interés del <strong>${tasaALetras(tasaA)}</strong> Por Ciento (<strong>${tasaA.toFixed(3)}</strong>%) anual`
  );

  h = h.replace(/del_{3,}%/, `del <strong>${comision}%</strong>`);

  h = h.replace(
    /la cantidad de _{5,}Lempiras \(Lps\._{5,}\)/,
    gastosLeg > 0
      ? `la cantidad de <strong>${lps(gastosLeg)} Lempiras</strong> (Lps. <strong>${lps(gastosLeg)}</strong>)`
      : `la cantidad de <strong>0.00 Lempiras</strong> (Lps. <strong>0.00</strong>)`
  );

  h = h.replace(
    /a los _{3,}días de_{5,} del 20_{3,} \(_{3,}\/_{3,}\/ 202_{2,}\)/,
    `a los <strong>${f.dia}</strong> días de <strong>${f.mes}</strong> del <strong>${f.anio4}</strong> (<strong>${f.ddmmaa}</strong>)`
  );

  h = h.replace(
    /<p>EL PRESTATARIO<br\/>ID:<\/p>/,
    `<p><strong>${cliente.nombreCompleto}</strong><br/>EL PRESTATARIO<br/>ID: <strong>${cliente.identidad}</strong></p>`
  );

  return h;
}

export function fillContrato(
  html: string,
  prestamo: PrestamoData,
  cliente: ClienteCompleto,
  nombreProducto = ""
): string {
  const capital = Number(prestamo.capital ?? prestamo.capitalSolicitado ?? 0);
  const tasaA = Number(prestamo.interes ?? prestamo.tasaInteresAnual ?? 0);
  const tasaM = tasaA / 12;
  const cuotas = Number(prestamo.cuotas ?? prestamo.plazoCuotas ?? 0);
  const cuotaFija = Number(prestamo.cuotaFija ?? 0);
  const f = fechaHoy();
  let h = html;

  const vehiculoData =
    prestamo.datosVehiculo && typeof prestamo.datosVehiculo === "object"
      ? (prestamo.datosVehiculo as Record<string, unknown>)
      : prestamo.vehiculo && typeof prestamo.vehiculo === "object"
      ? (prestamo.vehiculo as Record<string, unknown>)
      : {};

  const resolveVehiculo = (directKey: string, nestedKey: string): string => {
    const directValue = prestamo[directKey];
    if (typeof directValue === "string" && directValue.trim()) return directValue.trim();
    const nestedValue = vehiculoData[nestedKey];
    if (typeof nestedValue === "string" && nestedValue.trim()) return nestedValue.trim();
    return "";
  };

  const vehiculo = {
    marca: resolveVehiculo("marca", "marca"),
    modelo: resolveVehiculo("modelo", "modelo"),
    tipo: resolveVehiculo("tipo", "tipo"),
    anio: resolveVehiculo("anio", "anio"),
    motor: resolveVehiculo("motor", "motor"),
    chasis: resolveVehiculo("chasis", "chasis"),
    color: resolveVehiculo("color", "color"),
    placa: resolveVehiculo("placa", "placa"),
    vin: resolveVehiculo("vin", "vin"),
  };

  h = h.replace(/<h3>POR L\. _+<\/h3>/, `<h3>POR L. ${lps(capital)}.00</h3>`);

  h = h.replace(/el \(la\) señor \(a\)_{5,},/, `el (la) señor (a) <strong>${cliente.nombreCompleto}</strong>,`);

  h = h.replace(/identificación número_{5,},/, `identificación número <strong>${cliente.identidad}</strong>,`);

  h = h.replace(/del domicilio_{5,},/, `del domicilio <strong>${cliente.direccion}</strong>,`);

  h = h.replace(/de la ciudad de_{5,},/, `de la ciudad de <strong>${cliente.municipio}</strong>,`);

  h = h.replace(/Departamento de_{5,},/, `Departamento de <strong>${cliente.departamento}</strong>,`);

  h = h.replace(
    /_{10,}LEMPIRAS \(L\._{5,}\.00\)/,
    `<strong>${lps(capital)} LEMPIRAS</strong> (L. <strong>${lps(capital)}</strong>.00)`
  );

  if (nombreProducto) {
    h = h.replace(/denominado _{5,},/, `denominado <strong>${nombreProducto}</strong>,`);
  }

  if (vehiculo.marca) {
    h = h.replace(/MARCA:\s*_{3,}/i, `MARCA: <strong>${vehiculo.marca}</strong>`);
  }
  if (vehiculo.modelo) {
    h = h.replace(/MODELO:\s*_{3,}/i, `MODELO: <strong>${vehiculo.modelo}</strong>`);
  }
  if (vehiculo.tipo) {
    h = h.replace(/TIPO:\s*_{3,}/i, `TIPO: <strong>${vehiculo.tipo}</strong>`);
  }
  if (vehiculo.anio) {
    h = h.replace(/AÑO:\s*_{3,}/i, `AÑO: <strong>${vehiculo.anio}</strong>`);
    h = h.replace(/ANIO:\s*_{3,}/i, `ANIO: <strong>${vehiculo.anio}</strong>`);
  }
  if (vehiculo.motor) {
    h = h.replace(/MOTOR:\s*_{3,}/i, `MOTOR: <strong>${vehiculo.motor}</strong>`);
  }
  if (vehiculo.chasis) {
    h = h.replace(/CHASIS:\s*_{3,}/i, `CHASIS: <strong>${vehiculo.chasis}</strong>`);
  }
  if (vehiculo.color) {
    h = h.replace(/COLOR:\s*_{3,}/i, `COLOR: <strong>${vehiculo.color}</strong>`);
  }
  if (vehiculo.placa) {
    h = h.replace(/PLACA:\s*_{3,}/i, `PLACA: <strong>${vehiculo.placa}</strong>`);
  }
  if (vehiculo.vin) {
    h = h.replace(/VIN:\s*_{3,}/i, `VIN: <strong>${vehiculo.vin}</strong>`);
  }

  h = h.replace(
    /plazo de_{5,}\(_{2,}\) meses/,
    `plazo de <strong>${cuotas}</strong> (<strong>${cuotas}</strong>) meses`
  );

  h = h.replace(
    /los días _{5,}\(_{3,}\) cuotas mensuales de capital más intereses corrientes de _{5,}LEMPIRAS \(L\._{5,}\)/,
    `los días <strong>${f.dia}</strong> (<strong>${cuotas}</strong>) cuotas mensuales de capital más intereses corrientes de <strong>${lps(cuotaFija)} LEMPIRAS</strong> (L. <strong>${lps(cuotaFija)}</strong>)`
  );

  h = h.replace(
    /tasa mensual de _{5,}\(_{2,}\._{3,}%\)/,
    `tasa mensual de <strong>${tasaM.toFixed(4)}%</strong> (<strong>${tasaM.toFixed(4)}</strong>%)`
  );

  h = h.replace(
    /tasa de interés efectiva anual de _{5,} POR CIENTO \(_{2,}\._{2,}%\)/,
    `tasa de interés efectiva anual de <strong>${tasaA}%</strong> POR CIENTO (<strong>${tasaA.toFixed(3)}</strong>%)`
  );

  h = h.replace(
    /la cantidad de _{5,}\(L\._{5,}\.00\)/,
    `la cantidad de <strong>${lps(capital)} LEMPIRAS</strong> (L. <strong>${lps(capital)}</strong>.00)`
  );

  h = h.replace(
    /a los_{5,}\(_{2,}\) días del mes de _{5,}del año_{5,} \(202_{2,}\)/,
    `a los <strong>${f.dia}</strong> (${f.dia}) días del mes de <strong>${f.mes}</strong> del año <strong>${f.anio4}</strong> (${f.anio4})`
  );

  h = h.replace(
    /<p>EL PRESTATARIO<br\/>ID:<\/p>/,
    `<p><strong>${cliente.nombreCompleto}</strong><br/>EL PRESTATARIO<br/>ID: <strong>${cliente.identidad}</strong></p>`
  );

  if (!h.includes("EL PRESTATARIO")) {
    const bloqueFirma = `
  <p>En fe de lo anterior, firmamos el presente contrato en la ciudad de El Progreso, Yoro,
  a los <strong>${f.dia}</strong> días del mes de <strong>${f.mes}</strong> del año <strong>${f.anio4}</strong>.</p>

  <div style="display:flex; justify-content:space-between; margin-top:40px;">
    <div style="text-align:center; width:45%;">
      <div style="border-top:1px solid #000; margin-bottom:4px;"></div>
      <p><strong>${cliente.nombreCompleto}</strong><br/>EL PRESTATARIO<br/>ID: <strong>${cliente.identidad}</strong></p>
    </div>
    <div style="text-align:center; width:45%;">
      <div style="border-top:1px solid #000; margin-bottom:4px;"></div>
      <p>FIADOR SOLIDARIO<br/>ID:</p>
    </div>
  </div>
  <div style="text-align:center; margin-top:32px;">
    <div style="display:inline-block; width:45%; border-top:1px solid #000;"></div>
    <p>GERENTE GENERAL</p>
  </div>`;
    h = h.replace("</body>", `${bloqueFirma}\n</body>`);
  }

  return h;
}

export function debugFill(html: string, docName: string): void {
  const htmlSinBienes = html.replace(/<p>_{5,}<\/p>/g, "");
  const matches = htmlSinBienes.match(/_{4,}/g) ?? [];

  if (matches.length === 0) {
    console.log(`OK [${docName}] Todos los campos reemplazados correctamente.`);
  } else {
    console.warn(`[${docName}] ${matches.length} campo(s) sin reemplazar:`);
    let searchFrom = 0;
    matches.forEach((_, i) => {
      const pos = htmlSinBienes.indexOf("____", searchFrom);
      if (pos === -1) return;
      const ctx = htmlSinBienes
        .slice(Math.max(0, pos - 40), pos + 80)
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      console.warn(`  ${i + 1}. ...${ctx}...`);
      searchFrom = pos + 1;
    });
  }
}
