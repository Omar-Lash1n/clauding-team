"use client";

import { useEffect, useRef } from "react";

interface HeatmapLayerProps {
  map: L.Map | null;
  points: [number, number, number][];
  options?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
  };
}

export function HeatmapLayer({ map, points, options = {} }: HeatmapLayerProps) {
  const layerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    async function addLayer() {
      const L = await import("leaflet");
      await import("leaflet.heat");

      if (cancelled || !map) return;

      if (layerRef.current) {
        (layerRef.current as L.Layer).remove();
      }

      const heat = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 5,
        minOpacity: 0.4,
        ...options,
      }).addTo(map);

      layerRef.current = heat;
    }

    addLayer();

    return () => {
      cancelled = true;
      if (layerRef.current && map) {
        (layerRef.current as L.Layer).remove();
        layerRef.current = null;
      }
    };
  }, [map, points, options]);

  return null;
}
