import { Suspense } from "react";
import TracePageClient from "./TracePageClient";

export default function TracePage() {
  return (
    <Suspense fallback={<TraceFallback />}>
      <TracePageClient />
    </Suspense>
  );
}

function TraceFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/50">
      <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin mb-4" />
      <p>Loading trace explorer...</p>
    </div>
  );
}
