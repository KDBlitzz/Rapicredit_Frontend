'use client';

export const EVENT_PAGO_REGISTRADO = 'rapicredit:pago-registrado';

export function emitPagoRegistrado(detail?: { fechaPago?: string }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_PAGO_REGISTRADO, { detail }));
}

export function onPagoRegistrado(handler: (detail?: { fechaPago?: string }) => void) {
  if (typeof window === 'undefined') return () => {};

  const listener = (e: Event) => {
    const ce = e as CustomEvent<{ fechaPago?: string } | undefined>;
    handler(ce.detail);
  };

  window.addEventListener(EVENT_PAGO_REGISTRADO, listener);
  return () => window.removeEventListener(EVENT_PAGO_REGISTRADO, listener);
}
