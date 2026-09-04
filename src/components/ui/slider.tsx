"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  marks?: { value: number; label: string }[];
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, showValue = false, formatValue, marks, value, ...props }, ref) => {
  const sliderId = React.useId();
  const values = Array.isArray(value) ? value : value !== undefined ? [value] : [0];
  const displayValue = formatValue
    ? formatValue(values[0] ?? 0)
    : `${values[0] ?? 0}`;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label htmlFor={sliderId} className="text-sm font-medium text-foreground">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-muted-foreground">{displayValue}</span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        id={sliderId}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={value}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {Array.isArray(value)
          ? value.map((_, i) => (
              <SliderPrimitive.Thumb
                key={i}
                className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              />
            ))
          : (
              <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
            )}
      </SliderPrimitive.Root>
      {marks && marks.length > 0 && (
        <div className="relative mt-1 flex justify-between">
          {marks.map((mark) => (
            <div
              key={mark.value}
              className="flex flex-col items-center"
              style={{ left: `${((mark.value - (props.min ?? 0)) / ((props.max ?? 100) - (props.min ?? 0))) * 100}%` }}
            >
              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              <span className="mt-1 text-xs text-muted-foreground">{mark.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
