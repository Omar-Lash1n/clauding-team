"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ASWAN_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

interface PinMapProps {
  defaultLat?: number;
  defaultLng?: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export function PinMap({ defaultLat, defaultLng, onChange, className }: PinMapProps) {
  const t = useTranslations("common");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const initialCenter: [number, number] =
    defaultLat && defaultLng ? [defaultLat, defaultLng] : ASWAN_CENTER;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: initialCenter,
        zoom: DEFAULT_MAP_ZOOM,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(initialCenter, { draggable: true }).addTo(map);
      markerRef.current = marker;
      mapRef.current = map;

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onChange(lat, lng);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
      });

      if (defaultLat && defaultLng) {
        onChange(defaultLat, defaultLng);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        markerRef.current?.setLatLng([lat, lng]);
        mapRef.current?.setView([lat, lng], 16);
        onChange(lat, lng);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="h-full w-full rounded-xl overflow-hidden" />
      <div className="absolute bottom-3 start-3 z-[1000]">
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={useMyLocation}
          disabled={geoLoading}
          className="gap-1.5 shadow-md"
        >
          <MapPin className="h-3.5 w-3.5" />
          {geoLoading ? t("loading") : "موقعي"}
        </Button>
      </div>
    </div>
  );
}
