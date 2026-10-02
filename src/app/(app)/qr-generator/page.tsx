"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

export default function QrGeneratorPage() {
  const [code, setCode] = useState("STU-2026001");
  const [img, setImg] = useState<string | null>(null);

  async function generate() {
    setImg(await QRCode.toDataURL(code, { width: 256, margin: 1 }));
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-primary">توليد QR</h2>
      <input
        className="w-full max-w-md rounded-xl border border-border px-3 py-2 text-sm font-bold"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button onClick={generate}>توليد</Button>
      {img && <img src={img} alt="QR" className="rounded-xl border border-border bg-white p-3" />}
    </div>
  );
}
