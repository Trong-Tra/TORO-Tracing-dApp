import TraceDetailClient from "./TraceDetailClient";

export function generateStaticParams() {
  return [{ id: "MOTN3042" }];
}

export default function TraceDetailPage() {
  return <TraceDetailClient />;
}
