"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface PhotoUploaderProps {
  maxCount?: number;
  value: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

export function PhotoUploader({
  maxCount = 4,
  value,
  onChange,
  className,
}: PhotoUploaderProps) {
  const t = useTranslations("citizen.wizard");
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrors([]);
    const incoming = Array.from(e.target.files ?? []);
    const newErrors: string[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      if (value.length + valid.length >= maxCount) {
        newErrors.push(t("photosMaxReached"));
        break;
      }
      if (file.size > MAX_SIZE_BYTES) {
        newErrors.push(t("photoTooLarge"));
        continue;
      }
      const lowerType = file.type.toLowerCase();
      const lowerName = file.name.toLowerCase();
      const isAllowed =
        ALLOWED_TYPES.includes(lowerType) ||
        lowerName.endsWith(".heic") ||
        lowerName.endsWith(".heif");
      if (!isAllowed) {
        newErrors.push(t("photoWrongType"));
        continue;
      }
      valid.push(file);
    }

    if (newErrors.length > 0) setErrors(newErrors);
    if (valid.length > 0) onChange([...value, ...valid]);
    // Reset input so the same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const canAdd = value.length < maxCount;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {value.map((file, idx) => {
          const url = URL.createObjectURL(file);
          return (
            <div
              key={idx}
              className="relative h-20 w-20 rounded-xl overflow-hidden border border-[#DCE3EA]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                onLoad={() => URL.revokeObjectURL(url)}
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 end-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#3E7D60]/40 bg-[#F0F7FF] text-[#3E7D60] hover:border-[#3E7D60] hover:bg-[#C7E1D4]/30 transition-colors"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs font-medium">+</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        multiple={maxCount > 1}
        onChange={handleFileChange}
        className="hidden"
      />

      {errors.map((err, i) => (
        <p key={i} className="text-xs text-red-600">
          {err}
        </p>
      ))}
    </div>
  );
}
