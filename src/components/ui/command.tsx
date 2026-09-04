"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Search, Command as CommandIcon, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const commandInputVariants = cva(
  "flex h-11 w-full rounded-md bg-transparent py-3 pl-4 pr-12 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-11",
        sm: "h-9",
        lg: "h-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  group?: string;
  disabled?: boolean;
  onSelect?: (item: CommandItem) => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onSelect?: (item: CommandItem) => void;
  className?: string;
}

function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  onSelect,
  className,
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredItems = React.useMemo(() => {
    if (!search) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      const group = item.group || "Suggestions";
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filteredItems]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSearch("");
    }
  }, [open]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].onSelect?.(filteredItems[selectedIndex]);
            onSelect?.(filteredItems[selectedIndex]);
            onOpenChange(false);
          }
          break;
        case "Escape":
          onOpenChange(false);
          break;
      }
    },
    [filteredItems, selectedIndex, onSelect, onOpenChange]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-lg border bg-popover shadow-lg",
          className
        )}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            Object.entries(groupedItems).map(([group, groupItems]) => (
              <div key={group}>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {group}
                </div>
                {groupItems.map((item) => {
                  const index = filteredItems.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onSelect?.(item);
                        onSelect?.(item);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm outline-none",
                        index === selectedIndex && "bg-accent text-accent-foreground",
                        item.disabled && "pointer-events-none opacity-50"
                      )}
                    >
                      {item.icon && (
                        <span className="flex h-5 w-5 items-center justify-center">
                          {item.icon}
                        </span>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} results
          </span>
        </div>
      </div>
    </div>
  );
}

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="flex items-center border-b px-3">
      {icon || <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />}
      <input
        ref={ref}
        className={cn(commandInputVariants(), className)}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = "CommandInput";

interface CommandListProps {
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

function CommandList({
  children,
  className,
  emptyMessage = "No results found.",
  isEmpty = false,
}: CommandListProps) {
  return (
    <div className={cn("max-h-[300px] overflow-y-auto p-2", className)}>
      {isEmpty ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface CommandGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function CommandGroup({ label, children, className }: CommandGroupProps) {
  return (
    <div className={cn("mb-2", className)}>
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  shortcut?: string;
}

function CommandItem({
  icon,
  shortcut,
  children,
  className,
  ...props
}: CommandItemProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      )}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function CommandSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

export {
  CommandPalette,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  commandInputVariants,
};
