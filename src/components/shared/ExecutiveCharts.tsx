"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ExecutiveCharts({
  visitsByDay,
}: {
  visitsByDay: { day: string; count: number }[];
}) {
  if (!visitsByDay.length) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-black text-primary">زيارات آخر 7 أيام</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={visitsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-black text-primary">نفس البيانات (أعمدة)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={visitsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
