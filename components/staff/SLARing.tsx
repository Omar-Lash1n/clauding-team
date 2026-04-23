"use client";

import { cn } from "@/lib/utils/cn";
import { getSlaRingColor } from "@/lib/staff/report-views";
import { timeRemaining } from "@/lib/workflow/sla";

interface SLARingProps {
  deadline: string | null | undefined;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function SLARing({
  deadline,
  size = 48,
  strokeWidth = 4,
  className,
  showLabel = true,
}: SLARingProps) {
  if (!deadline) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-full bg-gray-100", className)}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">—</span>
      </div>
    );
  }

  const remaining = timeRemaining(deadline);
  const color = getSlaRingColor(deadline);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0 = just started, 100 = deadline reached/breached)
  // We approximate based on minutes: if breached, show full ring
  let progress: number;
  if (remaining.breached) {
    progress = 100;
  } else {
    // Use a simple heuristic: more than 24h = early, less = progressing
    const totalEstimate = 1440; // 24h as baseline
    const elapsed = totalEstimate - remaining.minutes;
    progress = Math.min(100, Math.max(5, (elapsed / totalEstimate) * 100));
  }

  const dashOffset = circumference - (progress / 100) * circumference;

  const absMins = Math.abs(remaining.minutes);
  const hours = Math.floor(absMins / 60);
  const mins = absMins % 60;

  let label: string;
  if (remaining.breached) {
    label = hours > 0 ? `-${hours}h` : `-${mins}m`;
  } else {
    label = hours > 0 ? `${hours}h` : `${mins}m`;
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-xs font-semibold"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
