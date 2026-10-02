"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      academicNumber: String(fd.get("academicNumber")),
      name: String(fd.get("name")),
      grade: String(fd.get("grade")),
      class: String(fd.get("class")),
      guardianName: String(fd.get("guardianName")),
      guardianPhone: String(fd.get("guardianPhone")),
      gender: String(fd.get("gender")),
      clinicId: String(fd.get("clinicId")),
    };
    const res = await fetch("/api/v1/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "فشل الحفظ");
      return;
    }
    router.push(`/students/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-primary">إضافة طالب</h2>
        <Link href="/students">
          <Button type="button" size="sm" variant="outline">
            رجوع
          </Button>
        </Link>
      </div>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
      <Field name="academicNumber" label="الرقم الأكاديمي" required />
      <Field name="name" label="اسم الطالب" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="grade" label="الصف" required />
        <Field name="class" label="الفصل" required />
      </div>
      <Field name="guardianName" label="ولي الأمر" required />
      <Field name="guardianPhone" label="هاتف ولي الأمر" required />
      <label className="block text-xs font-extrabold text-primary">
        الجنس
        <select name="gender" required className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold">
          <option value="MALE">ذكر</option>
          <option value="FEMALE">أنثى</option>
        </select>
      </label>
      <Field
        name="clinicId"
        label="معرّف العيادة (UUID)"
        required
        defaultValue="00000000-0000-4000-8000-000000000003"
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "جاري الحفظ..." : "حفظ الطالب"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-xs font-extrabold text-primary">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold"
      />
    </label>
  );
}
