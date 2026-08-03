"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({ children, speed = 30, pauseOnHover = false, className }: MarqueeProps) {
  return (
    <div className={cn("z-10 w-full overflow-hidden", className)}>
      <div className="relative flex max-w-full overflow-hidden py-5">
        <div
          className={cn("flex w-max animate-marquee", pauseOnHover && "hover:[animation-play-state:paused]")}
          style={{ "--duration": `${speed}s` } as React.CSSProperties}
        >
          {children}
          {children}
        </div>
      </div>
    </div>
  );
}
