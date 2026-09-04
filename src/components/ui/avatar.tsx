"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { User } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  name?: string;
  fallback?: React.ReactNode;
  status?: "online" | "offline" | "away" | "busy";
  showStatus?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size,
      src,
      alt,
      name,
      fallback,
      status,
      showStatus = false,
      ...props
    },
    ref
  ) => {
    const initials = name ? getInitials(name) : null;

    const statusColors = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500",
      busy: "bg-red-500",
    };

    return (
      <div ref={ref} className={cn("relative inline-flex", className)} {...props}>
        <AvatarPrimitive.Root className={cn(avatarVariants({ size }))}>
          <AvatarPrimitive.Image
            src={src || undefined}
            alt={alt || name || "Avatar"}
            className="aspect-square h-full w-full"
          />
          <AvatarPrimitive.Fallback
            delayMs={src ? 600 : 0}
            className="flex h-full w-full items-center justify-center bg-muted font-medium text-muted-foreground"
          >
            {fallback || (initials ? <span>{initials}</span> : <User className="h-1/2 w-1/2" />)}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
        {showStatus && status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    alt?: string;
    name?: string;
  }>;
  max?: number;
  size?: VariantProps<typeof avatarVariants>["size"];
  className?: string;
}

function AvatarGroup({
  avatars,
  max = 5,
  size = "default",
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          name={avatar.name}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <Avatar
          size={size}
          className="ring-2 ring-background"
          fallback={`+${remaining}`}
        />
      )}
    </div>
  );
}

export { Avatar, AvatarGroup, avatarVariants };
