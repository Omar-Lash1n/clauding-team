"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { ASWAN_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  onMapReady?: (map: L.Map) => void;
}

// This component renders inside a dynamic import with ssr:false
// so it's safe to reference Leaflet globals
export default function LeafletMap({
  center = ASWAN_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  className,
  children,
  onMapReady,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import leaflet at runtime (client-only)
    import("leaflet").then((L) => {
      // Fix default icon 404 bug
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center,
        zoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      onMapReady?.(map);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={cn("z-0", className)}>
      {/* children rendered by parent after map is ready */}
      {children}
    </div>
  );
}
