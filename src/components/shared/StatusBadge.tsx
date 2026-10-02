import { Badge } from "@/components/ui/badge";
import { referralIsLate } from "@/lib/referral-utils";

type RefLike = {
  status: string;
  referralTime: string | Date;
};

const labels: Record<string, { text: string; tone: "yellow" | "blue" | "orange" | "green" | "red" }> = {
  PENDING: { text: "قيد الانتظار", tone: "yellow" },
  RECEIVED: { text: "تم الاستقبال", tone: "blue" },
  IN_TREATMENT: { text: "قيد العلاج", tone: "orange" },
  COMPLETED: { text: "انتهى", tone: "green" },
};

export function ReferralStatusBadge({ referral }: { referral: RefLike }) {
  const rt = typeof referral.referralTime === "string" ? new Date(referral.referralTime) : referral.referralTime;
  if (referralIsLate({ status: referral.status as "PENDING", referralTime: rt })) {
    return <Badge tone="red">متأخر</Badge>;
  }
  const m = labels[referral.status] ?? { text: referral.status, tone: "gray" as const };
  return <Badge tone={m.tone}>{m.text}</Badge>;
}

export function VisitStatusBadge({ status }: { status: string }) {
  const map: Record<string, { text: string; tone: "green" | "blue" | "orange" }> = {
    OPEN: { text: "مفتوحة", tone: "blue" },
    CLOSED: { text: "مغلقة", tone: "green" },
    REFERRED: { text: "محالة", tone: "orange" },
  };
  const m = map[status] ?? { text: status, tone: "blue" };
  return <Badge tone={m.tone}>{m.text}</Badge>;
}
