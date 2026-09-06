"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success"
  | "warning"
  | "link";
type Size = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/25 font-medium",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/70 font-medium",
  ghost: "text-foreground hover:bg-muted font-medium",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted font-medium",
  danger: "bg-danger text-white hover:opacity-90 font-medium",
  success: "bg-success text-white hover:opacity-90 font-medium",
  warning: "bg-warning text-white hover:opacity-90 font-medium",
  link: "text-primary underline-offset-4 hover:underline font-medium p-0 h-auto",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
  sm: "h-8.5 px-3.5 text-sm rounded-xl gap-2",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-11.5 px-5 text-[15px] rounded-2xl gap-2",
  icon: "h-10 w-10 rounded-xl",
  "icon-sm": "h-8 w-8 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, iconRight, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
        {iconRight}
      </button>
    );
  },
);
Button.displayName = "Button";

export { variantClasses, sizeClasses };
export type { Variant, Size };
