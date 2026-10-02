import { Suspense } from "react";
import { auth } from "@/lib/auth";
import NewVisitForm from "./NewVisitForm";

export default async function NewVisitPage() {
  const session = await auth();
  return (
    <Suspense fallback={<p className="text-sm font-bold text-muted">جاري التحميل...</p>}>
      <NewVisitForm defaultClinicId={session?.user.clinicId} />
    </Suspense>
  );
}
