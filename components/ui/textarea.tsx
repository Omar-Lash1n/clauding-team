import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#DCE3EA] bg-white px-3 py-2 text-sm text-[#1C2D5B] placeholder:text-gray-400 transition-colors resize-none",
          "focus:outline-none focus:ring-2 focus:ring-[#3E7D60]/30 focus:border-[#3E7D60]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
