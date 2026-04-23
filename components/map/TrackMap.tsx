"use client";

import { useEffect, useRef } from "react";
import { ASWAN_CENTER, DEFAULT_MAP_ZOOM, STATUS_MARKER_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { ReportStatus } from "@/types/domain";

interface ReportMarker {
  id: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  title?: string;
}

interface TrackMapProps {
  reports: ReportMarker[];
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export function TrackMap({ reports, onMarkerClick, className }: TrackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

      const map = L.map(containerRef.current!, {
        center: ASWAN_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      reports.forEach((r) => {
        const color = STATUS_MARKER_COLORS[r.status] ?? "#64748B";
        const iconHtml = `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`;

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);

        if (r.title) {
          marker.bindTooltip(r.title, { direction: "top" });
        }

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(r.id));
        }
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("z-0 rounded-xl overflow-hidden", className)}
    />
  );
}
