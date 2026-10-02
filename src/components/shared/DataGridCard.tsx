"use client";

import Link from "next/link";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { resourceShowsAvatar, rowDisplayName } from "@/lib/avatar";
import { rowGridSubtitle, rowGridTags, rowGridTitle } from "@/lib/field-labels";

type Props = {
  row: Record<string, unknown>;
  resourceKey?: string;
  href?: string;
};

export function DataGridCard({ row, resourceKey, href }: Props) {
  const showAvatar = resourceShowsAvatar(resourceKey);
  const title = showAvatar ? rowDisplayName(row) : rowGridTitle(row, resourceKey);
  const subtitle = rowGridSubtitle(row, resourceKey);
  const tags = rowGridTags(row, resourceKey);

  const body = (
    <div className="flex flex-col items-center px-4 py-5 text-center">
      {showAvatar ? (
        <PersonAvatar row={row} resourceKey={resourceKey} size="lg" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
          {title.slice(0, 1)}
        </div>
      )}
      <h3 className="mt-3 line-clamp-2 text-sm font-black text-primary">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs font-bold text-muted">{subtitle}</p>}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const className =
    "block overflow-hidden rounded-2xl border border-border/80 bg-card transition hover:border-accent/30 hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <article className={className}>{body}</article>;
}
