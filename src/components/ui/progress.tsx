"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva("relative h-4 w-full overflow-hidden rounded-full bg-secondary", {
  variants: {
    size: {
      sm: "h-2",
      default: "h-4",
      lg: "h-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const indicatorVariants = cva(
  "h-full w-full flex-1 bg-primary transition-all",
  {
    variants: {
      color: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        destructive: "bg-destructive",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
);

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  color?: VariantProps<typeof indicatorVariants>["color"];
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  indeterminate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size,
      color,
      showLabel = false,
      label,
      animated = false,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full">
        {(showLabel || label) && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {label || "Progress"}
            </span>
            {showLabel && (
              <span className="text-sm text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressVariants({ size, className }))}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemax={max}
          aria-valuemin={0}
          {...props}
        >
          <div
            className={cn(
              indicatorVariants({ color }),
              indeterminate && "animate-indeterminate",
              animated && "transition-all duration-500"
            )}
            style={indeterminate ? undefined : { width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: "default" | "success" | "warning" | "destructive" | "info";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

function CircularProgress({
  value = 0,
  max = 100,
  size = 64,
  strokeWidth = 4,
  color = "default",
  showLabel = true,
  label,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    destructive: "text-destructive",
    info: "text-blue-500",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", colorClasses[color])}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">
            {label || `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

export { Progress, CircularProgress, progressVariants };
