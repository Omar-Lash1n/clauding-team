"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F0F7FF]">
      <LoadingSpinner />
    </div>
  ),
});

export { LeafletMap };
export default LeafletMap;
