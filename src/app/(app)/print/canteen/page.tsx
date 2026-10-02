export default function CanteenPrintPage() {
  return (
    <div className="print-area canteen-print-page space-y-4 p-4 text-black">
      <div className="flex items-center justify-between border-b-4 border-double border-[#0F2A5C] pb-3">
        <div className="text-xs">مجمع مدارس الأندلس</div>
        <h2 className="text-center text-lg font-black text-[#0F2A5C]">استمارة متابعة المقصف اليومية</h2>
        <div className="text-xs">{new Date().toLocaleDateString("ar-KW")}</div>
      </div>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-black p-2">المنتج</th>
            <th className="border border-black p-2">الكمية</th>
            <th className="border border-black p-2">تاريخ الانتهاء</th>
            <th className="border border-black p-2">النتيجة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-2">—</td>
            <td className="border border-black p-2">—</td>
            <td className="border border-black p-2">—</td>
            <td className="border border-black p-2">مطابق</td>
          </tr>
        </tbody>
      </table>
      <div className="grid grid-cols-4 gap-3 pt-10 text-center text-xs font-bold">
        {["مفتش المقصف", "الممرض", "إدارة المدرسة", "الإدارة الطبية"].map((l) => (
          <div key={l} className="border-t border-black pt-2">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
