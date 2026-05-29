import TraceDetailClient from "./TraceDetailClient";

export function generateStaticParams() {
  return [
    { id: "TORO-01" },
    { id: "TORO-02" },
    { id: "TORO-03" },
    { id: "TORO-04" },
  ];
}

export default function TraceDetailPage() {
  return <TraceDetailClient />;
}
