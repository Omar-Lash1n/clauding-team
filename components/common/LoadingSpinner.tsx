import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({ className, size = "md", label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2
        className={cn("animate-spin text-[#3E7D60]", sizeClasses[size])}
      />
      {label && (
        <span className="text-sm text-[#1C2D5B]/60">{label}</span>
      )}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F7FF]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
