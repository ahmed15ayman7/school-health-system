"use client";

import { Suspense } from "react";
import NewVisitForm from "./NewVisitForm";

export default function NewVisitPage() {
  return (
    <Suspense fallback={<p className="text-sm font-bold text-muted">جاري التحميل...</p>}>
      <NewVisitForm />
    </Suspense>
  );
}
