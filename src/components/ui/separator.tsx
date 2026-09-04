"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "dotted";
}

function Divider({
  className,
  label,
  orientation = "horizontal",
  variant = "solid",
  ...props
}: DividerProps) {
  const variantClasses = {
    solid: "",
    dashed: "border-dashed border-t border-border",
    dotted: "border-dotted border-t border-border",
  };

  if (orientation === "vertical") {
    return (
      <Separator
        orientation="vertical"
        className={cn("h-auto", className)}
        {...props}
      />
    );
  }

  if (!label) {
    return (
      <Separator
        orientation="horizontal"
        className={cn(
          variant === "solid" ? "" : variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn("flex items-center gap-4", className)}
      {...props}
    >
      <div className={cn("h-px flex-1 bg-border", variantClasses[variant])} />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      <div className={cn("h-px flex-1 bg-border", variantClasses[variant])} />
    </div>
  );
}

export { Separator, Divider };
