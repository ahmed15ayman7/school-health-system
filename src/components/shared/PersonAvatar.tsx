"use client";

import { cn } from "@/lib/utils";
import { rowAvatarSrc, rowDisplayName, rowInitials } from "@/lib/avatar";
import { useState } from "react";

type Props = {
  row: Record<string, unknown>;
  resourceKey?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
};

export function PersonAvatar({ row, resourceKey, size = "md", className }: Props) {
  const name = rowDisplayName(row);
  const [failed, setFailed] = useState(false);
  const src = rowAvatarSrc(row, resourceKey);

  if (failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-accent font-black text-white shadow-inner",
          sizes[size],
          className,
        )}
        aria-hidden
      >
        {rowInitials(name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm ring-1 ring-border/60",
        sizes[size],
        className,
      )}
    />
  );
}
