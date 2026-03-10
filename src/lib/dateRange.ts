export type DateRange = {
  desde: string;
  hasta: string;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const pad3 = (n: number) => String(n).padStart(3, '0');

/**
 * Convierte un Date a string ISO con offset local (NO termina en 'Z').
 * Ej: 2026-03-10T00:00:00.000-06:00
 */
export function toOffsetISOString(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const millis = pad3(date.getMilliseconds());

  // getTimezoneOffset: minutos para sumar a local y obtener UTC.
  // Ej: UTC-6 => 360.
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offH = pad2(Math.floor(abs / 60));
  const offM = pad2(abs % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offH}:${offM}`;
}

/**
 * Parsea un value de input type=date (YYYY-MM-DD) como fecha LOCAL.
 * Evita usar `new Date('YYYY-MM-DD')` porque se interpreta como UTC.
 */
export function parseDateInput(value: string): Date {
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(value);
  if (!m) return new Date(value);
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

/**
 * Construye un rango inclusivo por día.
 * - desde: 00:00:00.000 (local)
 * - hasta: 23:59:59.999 (local)
 */
export function toRange(fromDate: Date | string, toDate: Date | string): DateRange {
  const from = typeof fromDate === 'string' ? parseDateInput(fromDate) : new Date(fromDate);
  const to = typeof toDate === 'string' ? parseDateInput(toDate) : new Date(toDate);

  const desdeDate = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    0,
    0,
    0,
    0
  );

  const hastaDate = new Date(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
    23,
    59,
    59,
    999
  );

  return {
    desde: toOffsetISOString(desdeDate),
    hasta: toOffsetISOString(hastaDate),
  };
}
