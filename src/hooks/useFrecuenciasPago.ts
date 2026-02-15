"use client";

// Frecuencias de pago en duro: Días, Semanas, Quincenas, Meses
export interface FrecuenciaPago {
  _id: string;
  nombre: "Días" | "Semanas" | "Quincenas" | "Meses";
  dias?: number;
}

const FRECUENCIAS_PAGO: FrecuenciaPago[] = [
  { _id: "dias", nombre: "Días", dias: 1 },
  { _id: "semanas", nombre: "Semanas", dias: 7 },
  { _id: "quincenas", nombre: "Quincenas", dias: 14 },
  { _id: "meses", nombre: "Meses", dias: 30 },
];

export function useFrecuenciasPago() {
  return { data: FRECUENCIAS_PAGO, loading: false, error: null };
}
