"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ASWAN_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

interface HeatmapCardProps {
  points: { lat: number; lng: number; weight: number }[];
  className?: string;
}

export function HeatmapCard({ points, className }: HeatmapCardProps) {
  const t = useTranslations("manager");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current) return;

    import("leaflet").then(async (L) => {
      await import("leaflet.heat");

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

      const map = L.map(containerRef.current!, {
        center: ASWAN_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const heatData: [number, number, number][] = points.map((p) => [
        p.lat,
        p.lng,
        p.weight,
      ]);

      L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 5,
        minOpacity: 0.4,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, points]);

  return (
    <div className={cn("rounded-xl border border-border-neutral bg-white shadow-card overflow-hidden", className)}>
      <div className="p-4 border-b border-border-neutral">
        <h3 className="text-sm font-semibold text-navy">{t("dashboard.heatmapTitle")}</h3>
        <p className="text-xs text-navy/50 mt-0.5">{t("dashboard.heatmapLegend")}</p>
      </div>
      <div
        ref={containerRef}
        className="h-[300px] md:h-[400px] w-full"
      />
    </div>
  );
}
