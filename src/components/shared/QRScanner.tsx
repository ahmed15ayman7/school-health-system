"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onScan: (text: string) => void;
  onClose?: () => void;
};

export function QRScanner({ onScan, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: { clear: () => void } | null = null;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const id = "qr-reader";
        if (ref.current) ref.current.id = id;
        const html5 = new Html5Qrcode(id);
        await html5.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 200 },
          (decoded) => {
            onScan(decoded);
            html5.stop().catch(() => undefined);
          },
          () => undefined,
        );
        scanner = html5;
      } catch {
        setError("تعذّر تشغيل الكamera");
      }
    })();
    return () => {
      scanner?.clear?.();
    };
  }, [onScan]);

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
      <div ref={ref} className="overflow-hidden rounded-xl" />
      {onClose && (
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          إغلاق
        </Button>
      )}
    </div>
  );
}
