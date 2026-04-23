"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinMap } from "@/components/map/PinMap";
import { districtFromPoint } from "@/lib/utils/geo";
import type { District } from "@/types/domain";
import type { DistrictBounds } from "@/lib/utils/geo";

interface StepLocationProps {
  lat: number | null;
  lng: number | null;
  addressDescription: string;
  districts: District[];
  detectedDistrictName: string | null;
  onLocationChange: (lat: number, lng: number, districtId: string | null) => void;
  onAddressChange: (value: string) => void;
}

export function StepLocation({
  lat,
  lng,
  addressDescription,
  districts,
  detectedDistrictName,
  onLocationChange,
  onAddressChange,
}: StepLocationProps) {
  const t = useTranslations("citizen.wizard");
  const locale = useLocale();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);

  const districtBounds: DistrictBounds[] = districts.map((d) => ({
    id: d.id,
    centerLat: d.center_lat,
    centerLng: d.center_lng,
    boundingRadiusKm: d.bounding_radius_km,
  }));

  const resolveDistrict = useCallback(
    (latitude: number, longitude: number) => {
      const id = districtFromPoint(latitude, longitude, districtBounds);
      onLocationChange(latitude, longitude, id);
    },
    [districtBounds, onLocationChange]
  );

  function handleUseMyLocation() {
    setGeoLoading(true);
    setGeoDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        resolveDistrict(latitude, longitude);
        setGeoLoading(false);
      },
      () => {
        setGeoDenied(true);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleMapChange(latitude: number, longitude: number) {
    resolveDistrict(latitude, longitude);
  }

  return (
    <div className="space-y-4">
      {/* Location buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="flex-1 gap-2"
        >
          <Navigation className="h-4 w-4" />
          {geoLoading ? "…" : t("useMyLocation")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => {
            /* Map is already showing; this just focuses it visually */
          }}
        >
          <MapPin className="h-4 w-4" />
          {t("pickOnMap")}
        </Button>
      </div>

      {/* Geo denied alert */}
      {geoDenied && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{t("locationDenied")}</p>
        </div>
      )}

      {/* Map */}
      <PinMap
        defaultLat={lat ?? undefined}
        defaultLng={lng ?? undefined}
        onChange={handleMapChange}
        className="h-64 rounded-xl"
      />

      {/* Detected district */}
      {detectedDistrictName && (
        <div className="rounded-lg bg-[#3E7D60]/5 border border-[#3E7D60]/20 px-3 py-2">
          <p className="text-xs font-medium text-[#3E7D60]">
            {t("detectedDistrict", { district: detectedDistrictName })}
          </p>
        </div>
      )}

      {/* Landmark / address description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1C2D5B]">
          {t("landmarkLabel")}
        </label>
        <Input
          value={addressDescription}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t("landmarkHint")}
          maxLength={500}
        />
      </div>
    </div>
  );
}
