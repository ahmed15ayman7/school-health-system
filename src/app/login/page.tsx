"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("بيانات الدخول غير صحيحة أو الحساب مقفل مؤقتاً");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#060f24] via-[#0b1b3e] to-[#081430] p-4">
      <motion.div
        className="absolute -start-24 -top-24 h-96 w-96 rounded-full bg-teal-500/30 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-24 -end-16 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-2 to-primary-light text-3xl text-white">
            🏥
          </div>
          <h1 className="text-lg font-black text-primary">منظومة الإدارة الطبية المركزية</h1>
          <p className="text-xs font-bold text-muted">مجمع مدارس الأندلس — بوابة الدخول</p>
        </div>
        <label className="mb-3 block text-start text-xs font-extrabold text-primary">
          اسم المستخدم
          <input
            className="mt-1 w-full rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="mb-3 block text-start text-xs font-extrabold text-primary">
          كلمة المرور
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="mb-2 text-sm font-bold text-danger">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </Button>
        <p className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-3 text-[11px] leading-6 text-muted">
          تجريبي: <code className="font-bold text-accent-dark">admin / admin123</code> — ممرض:{" "}
          <code className="font-bold text-accent-dark">nurse.b / nurse123</code>
        </p>
      </motion.form>
    </div>
  );
}
