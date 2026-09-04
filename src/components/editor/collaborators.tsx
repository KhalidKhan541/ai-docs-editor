"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Collaborator {
  id: string;
  name: string;
  image?: string;
  color: string;
  isActive: boolean;
  role: "owner" | "editor" | "viewer";
}

interface CollaboratorsProps {
  collaborators: Collaborator[];
}

export default function Collaborators({ collaborators }: CollaboratorsProps) {
  const [visibleCount, setVisibleCount] = useState(3);

  const activeCount = collaborators.filter((c) => c.isActive).length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {collaborators.slice(0, visibleCount).map((collaborator) => (
          <Tooltip key={collaborator.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar
                  className="h-8 w-8 border-2 border-white transition-transform hover:z-10 hover:scale-110"
                  style={{ borderColor: collaborator.color }}
                >
                  <AvatarFallback
                    className="text-xs font-medium text-white"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    {collaborator.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {collaborator.isActive && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-center">
                <div className="text-sm font-medium">{collaborator.name}</div>
                <div className="text-xs text-gray-500 capitalize">{collaborator.role}</div>
                <div className="text-xs text-gray-400">
                  {collaborator.isActive ? "Editing now" : "Offline"}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {collaborators.length > visibleCount && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-gray-200 text-xs font-medium text-gray-600">
                  +{collaborators.length - visibleCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-sm">
                {collaborators.slice(visibleCount).map((c) => c.name).join(", ")}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {activeCount > 0 && (
        <span className="ml-2 text-xs text-gray-500">
          {activeCount} editing
        </span>
      )}
    </div>
  );
}
