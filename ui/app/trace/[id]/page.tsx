import TraceDetailClient from "./TraceDetailClient";

export function generateStaticParams() {
  return [
    { id: "TORO-LOT-001" },
    { id: "TORO-LOT-002" },
    { id: "TORO-LOT-003" },
    { id: "TORO-LOT-004" },
  ];
}

export default function TraceDetailPage() {
  return <TraceDetailClient />;
}
