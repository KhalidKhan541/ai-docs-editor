"use client";

import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
  items: Array<{
    label: string;
    href?: string;
    icon?: React.ReactNode;
    current?: boolean;
  }>;
  maxItems?: number;
}

function Breadcrumb({
  separator = <ChevronRight className="h-4 w-4" />,
  items,
  maxItems = 4,
  className,
  ...props
}: BreadcrumbProps) {
  const [expanded, setExpanded] = React.useState(false);

  const visibleItems = React.useMemo(() => {
    if (expanded || items.length <= maxItems) return items;
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    return [firstItem, { label: "...", current: false }, ...lastItems];
  }, [items, maxItems, expanded]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center", className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {visibleItems.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-muted-foreground" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.label === "..." ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            ) : item.current || !item.href ? (
              <span
                className={cn(
                  "text-sm font-medium",
                  item.current ? "text-foreground" : "text-muted-foreground"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
  children: React.ReactNode;
  className?: string;
}

function BreadcrumbItem({
  href,
  icon,
  current = false,
  children,
  className,
}: BreadcrumbItemProps) {
  return (
    <li className={cn("flex items-center gap-1.5", className)}>
      {current || !href ? (
        <span
          className={cn(
            "text-sm font-medium",
            current ? "text-foreground" : "text-muted-foreground"
          )}
          aria-current={current ? "page" : undefined}
        >
          {icon && <span className="mr-1.5">{icon}</span>}
          {children}
        </span>
      ) : (
        <a
          href={href}
          className="flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {icon && <span className="mr-1.5">{icon}</span>}
          {children}
        </a>
      )}
    </li>
  );
}

function BreadcrumbSeparator({
  separator,
  className,
}: {
  separator?: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn("text-muted-foreground", className)}
      aria-hidden="true"
    >
      {separator || <ChevronRight className="h-4 w-4" />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("flex h-6 w-6 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
