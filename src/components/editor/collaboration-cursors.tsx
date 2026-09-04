"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Cursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  selection?: { start: number; end: number };
}

interface CollaborationCursorsProps {
  cursors: Cursor[];
}

export default function CollaborationCursors({ cursors }: CollaborationCursorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {cursors.map((cursor) => (
        <div
          key={cursor.id}
          className="collaboration-cursor absolute transition-all duration-100"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <div
            className="collaboration-cursor-label"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L6 18L8.5 10.5L15 8L1 1Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
