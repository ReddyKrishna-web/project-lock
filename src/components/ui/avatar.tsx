import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-[#0b57d0] to-[#083aa0]",
  "from-[#2f6fd6] to-[#0b57d0]",
  "from-[#083aa0] to-[#2f4fa0]",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-[13px]",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
  };
  const hash = [...name].reduce((a, c) => a + (c.codePointAt(0) ?? 0), 0);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        GRADIENTS[hash % GRADIENTS.length],
        sizes[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
