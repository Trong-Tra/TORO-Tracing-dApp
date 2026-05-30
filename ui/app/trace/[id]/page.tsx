import TraceDetailClient from "./TraceDetailClient";
import traceIndex from "@/src/data/traceIndex.json";

export function generateStaticParams() {
  return Object.keys(traceIndex.lots).map((id) => ({ id }));
}

export default function TraceDetailPage() {
  return <TraceDetailClient />;
}
