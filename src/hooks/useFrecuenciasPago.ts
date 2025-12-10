"use client";

// Frecuencias de pago en duro: Días, Semanas, Quincenas, Meses
export interface FrecuenciaPago {
  _id: string;
  nombre: "Días" | "Semanas" | "Quincenas" | "Meses";
  dias?: number;
}

export function useFrecuenciasPago() {
  const data: FrecuenciaPago[] = [
    { _id: "dias", nombre: "Días", dias: 1 },
    { _id: "semanas", nombre: "Semanas", dias: 7 },
    { _id: "quincenas", nombre: "Quincenas", dias: 14 },
    { _id: "meses", nombre: "Meses", dias: 30 },
  ];
  return { data, loading: false, error: null };
}
