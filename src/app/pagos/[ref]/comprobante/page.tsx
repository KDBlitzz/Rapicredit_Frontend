import ComprobanteAbonoView from "../../comprobante/ComprobanteAbonoView";

export default function ComprobanteByRefPage({ params }: { params: { ref: string } }) {
  return <ComprobanteAbonoView refId={params.ref} />;
}
