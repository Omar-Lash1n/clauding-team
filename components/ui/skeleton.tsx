import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#DCE3EA]/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
