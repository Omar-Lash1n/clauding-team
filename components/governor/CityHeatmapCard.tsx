"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { LeafletMap } from "@/components/map/LeafletMapWrapper";
import { HeatmapLayer } from "@/components/map/HeatmapLayer";
import { ASWAN_CENTER } from "@/lib/constants";
import { ALL_PRIORITY_LEVELS, ALL_REPORT_STATUSES } from "@/types/domain";
import type { HeatmapPoint } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

interface District {
  id: string;
  name_en: string;
  name_ar: string;
  center_lat: number;
  center_lng: number;
  bounding_radius_km: number;
}

interface CityHeatmapCardProps {
  points: HeatmapPoint[];
  districts: District[];
  categories?: { id: string; name_en: string; name_ar: string }[];
}

const ACTIVE_STATUSES = ["submitted", "approved", "assigned", "in_progress"];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#C94C4C",
  high: "#D9822F",
  medium: "#D9A441",
  low: "#2D5C46",
  scheduled: "#94A3B8",
};

export function CityHeatmapCard({ points, districts, categories = [] }: CityHeatmapCardProps) {
  const t = useTranslations("governor.heatmap");
  const tPriority = useTranslations("priorities");
  const tStatus = useTranslations("statuses");
  const locale = useLocale();

  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ACTIVE_STATUSES);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [map, setMap] = useState<L.Map | null>(null);

  const togglePriority = useCallback((p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  const toggleStatus = useCallback((s: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }, []);

  const filtered = useMemo(() => {
    return points.filter((p) => {
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(p.priority ?? ""))
        return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status ?? ""))
        return false;
      if (selectedCategory && p.district_id !== selectedCategory) return false;
      return true;
    });
  }, [points, selectedPriorities, selectedStatuses, selectedCategory]);

  const heatPoints: [number, number, number][] = useMemo(
    () =>
      filtered
        .filter((p) => p.location_lat != null && p.location_lng != null)
        .map((p) => [p.location_lat!, p.location_lng!, p.weight ?? 1]),
    [filtered]
  );

  const uniqueDistricts = useMemo(
    () => new Set(filtered.map((p) => p.district_id).filter(Boolean)),
    [filtered]
  );

  // Draw district boundary circles
  const handleMapReady = useCallback(
    (m: L.Map) => {
      setMap(m);
      import("leaflet").then((L) => {
        districts.forEach((d) => {
          L.circle([d.center_lat, d.center_lng], {
            radius: d.bounding_radius_km * 1000,
            stroke: true,
            color: "#1C2D5B",
            opacity: 0.3,
            weight: 2,
            fill: false,
          }).addTo(m);
        });
      });
    },
    [districts]
  );

  return (
    <div className="rounded-xl border border-border-neutral bg-white p-6 shadow-card">
      <h3 className="text-lg font-bold text-navy mb-4">{t("filterPriority")}</h3>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {ALL_PRIORITY_LEVELS.map((p) => (
          <Badge
            key={p}
            variant={selectedPriorities.includes(p) ? "default" : "outline"}
            className={cn(
              "cursor-pointer text-xs",
              selectedPriorities.includes(p) && "text-white"
            )}
            style={
              selectedPriorities.includes(p)
                ? { backgroundColor: PRIORITY_COLORS[p] }
                : {}
            }
            onClick={() => togglePriority(p)}
          >
            {tPriority(p)}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {ACTIVE_STATUSES.map((s) => (
          <Badge
            key={s}
            variant={selectedStatuses.includes(s) ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => toggleStatus(s)}
          >
            {tStatus(s as "submitted" | "approved" | "assigned" | "in_progress")}
          </Badge>
        ))}
      </div>

      {/* Count line */}
      <p className="text-xs text-navy/50 mb-3">
        {t("resultCount", {
          count: formatNumber(filtered.length, locale),
          districts: formatNumber(uniqueDistricts.size, locale),
        })}
      </p>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border-neutral">
        <LeafletMap
          center={ASWAN_CENTER}
          zoom={12}
          className="h-[400px] md:h-[500px] w-full"
          onMapReady={handleMapReady}
        />
        <HeatmapLayer map={map} points={heatPoints} />
      </div>
    </div>
  );
}
