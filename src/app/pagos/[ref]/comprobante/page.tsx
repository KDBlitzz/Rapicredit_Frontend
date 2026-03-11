import ComprobanteAbonoView from "../../comprobante/ComprobanteAbonoView";

export default async function ComprobanteByRefPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return <ComprobanteAbonoView refId={ref} />;
}
