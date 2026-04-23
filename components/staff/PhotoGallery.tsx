"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface PhotoGalleryProps {
  photos: { id: string; storage_path: string; photo_type: string }[];
  signedUrls?: Record<string, string>;
  supabaseUrl?: string;
  className?: string;
}

export function PhotoGallery({ photos, signedUrls, className }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (photos.length === 0) return null;

  function getUrl(path: string) {
    if (signedUrls && signedUrls[path]) {
      return signedUrls[path];
    }
    return `${supabaseUrl}/storage/v1/object/public/reports/${path}`;
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", className)}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border-neutral bg-gray-50 transition-shadow hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-nile-green"
          >
            <Image
              src={getUrl(photo.storage_path)}
              alt={`Photo ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex items-center justify-center h-[90vh] w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={getUrl(photos[selectedIndex].storage_path)}
                alt={`Photo ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute -top-3 -end-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy shadow-md hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Navigation */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 start-0 end-0 flex justify-center gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(i);
                    }}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all",
                      i === selectedIndex ? "bg-white scale-125" : "bg-white/50"
                    )}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
