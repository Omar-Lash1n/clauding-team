"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const ICON_NAMES = [
  "Construction", "Lightbulb", "Droplet", "Waves", "Trash2", "TrafficCone",
  "TreeDeciduous", "Armchair", "AlertCircle", "Wrench", "Bolt", "PlugZap",
  "PawPrint", "ShieldAlert", "Car", "Bike", "Bus", "SignpostBig",
  "Umbrella", "CloudRain", "MapPin", "Flame", "Pipette", "SprayCan",
  "Recycle", "HardHat", "Cone", "Footprints", "Building", "Antenna",
] as const;

interface CategoryIconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false);

  function renderIcon(name: string, size = 20) {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[name];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-neutral bg-sky-white text-navy">
        {renderIcon(value, 32)}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            {value || "Select icon"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="grid grid-cols-6 gap-1">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md hover:bg-sky-white transition-colors",
                  value === name && "bg-navy/10 ring-1 ring-navy/30"
                )}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                title={name}
              >
                {renderIcon(name)}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
