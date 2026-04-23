import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}
    >
      <div className="rounded-2xl bg-[#F7F7D5] p-5">
        <Icon className="h-8 w-8 text-[#3E7D60]" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-[#1C2D5B] text-base">{title}</h3>
        {description && (
          <p className="text-sm text-[#1C2D5B]/60 max-w-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
