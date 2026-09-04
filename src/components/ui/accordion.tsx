"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

interface AccordionItemProps {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

function AccordionItem({
  value,
  trigger,
  children,
  disabled = false,
  className,
  contentClassName,
}: AccordionItemProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} disabled={disabled}>
      <div className={cn("border-b", className)}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-sm font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
          <div className="flex flex-1 items-center text-left">{trigger}</div>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent className={cn("overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down", contentClassName)}>
          <div className="pb-4 pt-0">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface AccordionProps {
  items: {
    value: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
  }[];
  type?: "single" | "multiple";
  defaultValue?: string[];
  className?: string;
  itemClassName?: string;
}

function Accordion({
  items,
  type = "single",
  defaultValue,
  className,
  itemClassName,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(
    defaultValue || (items[0] ? [items[0].value] : [])
  );

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      if (type === "single") {
        return prev.includes(value) ? [] : [value];
      }
      return prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
    });
  };

  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item) => (
        <AccordionItemWithControl
          key={item.value}
          value={item.value}
          trigger={item.trigger}
          disabled={item.disabled}
          open={openItems.includes(item.value)}
          onToggle={() => toggleItem(item.value)}
          className={itemClassName}
        >
          {item.content}
        </AccordionItemWithControl>
      ))}
    </div>
  );
}

function AccordionItemWithControl({
  value,
  trigger,
  children,
  disabled = false,
  open,
  onToggle,
  className,
}: {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  open: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Collapsible open={open} onOpenChange={onToggle} disabled={disabled}>
      <div className={cn("border-b", className)}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-sm font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
          <div className="flex flex-1 items-center text-left">{trigger}</div>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="pb-4 pt-0">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, Accordion, AccordionItem };
