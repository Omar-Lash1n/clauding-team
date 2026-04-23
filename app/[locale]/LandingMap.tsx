"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#C7E1D4]/30 animate-pulse rounded-2xl" />
  ),
});

export function LandingMap() {
  return <LeafletMap className="h-full w-full" zoom={11} />;
}
