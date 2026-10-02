import type { TimelineEvent } from "@/server/health/history.service";
import Link from "next/link";

export function MedicalTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return <p className="text-sm font-bold text-muted">لا توجد أحداث في السجل.</p>;
  }
  return (
    <ol className="relative space-y-4 border-s-2 border-accent/30 ps-4">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span className="absolute -start-[1.35rem] top-1 h-3 w-3 rounded-full bg-accent" />
          <time className="text-xs font-bold text-muted">{new Date(e.at).toLocaleString("ar-QA")}</time>
          <div className="font-black text-primary">
            {e.link ? (
              <Link href={e.link} className="hover:underline">
                {e.title}
              </Link>
            ) : (
              e.title
            )}
          </div>
          {e.detail && <p className="text-sm font-semibold text-muted">{e.detail}</p>}
        </li>
      ))}
    </ol>
  );
}
