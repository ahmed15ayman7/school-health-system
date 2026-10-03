const LABELS: Record<string, string> = {
  id: "المعرّف",
  academicNumber: "الرقم الأكاديمي",
  employeeNumber: "رقم الموظف",
  qrCode: "QR",
  name: "الاسم",
  grade: "الصف",
  class: "الفصل",
  guardianName: "ولي الأمر",
  guardianPhone: "هاتف ولي الأمر",
  gender: "الجنس",
  phone: "الهاتف",
  department: "القسم",
  jobTitle: "المسمى",
  visitNumber: "رقم الزيارة",
  visitorName: "الزائر",
  reasonsSummary: "سبب الزيارة",
  dateTime: "التاريخ",
  referralTime: "وقت التحويل",
  visitorType: "نوع الزائر",
  triageLevel: "الفرز",
  status: "الحالة",
  severity: "الخطورة",
  reasonCategory: "سبب التحويل",
  reasonDetails: "التفاصيل",
  medicationName: "الدواء",
  genericName: "الاسم العلمي",
  stockQty: "الرصيد",
  clinicName: "العيادة",
  form: "الشكل",
  strength: "التركيز",
  minQuantity: "حد إعادة الطلب",
  quantity: "الكمية",
  expiryDate: "انتهاء الصلاحية",
  title: "العنوان",
  subject: "الموضوع",
  message: "الرسالة",
  channel: "القناة",
  isActive: "نشط",
  bloodType: "فصيلة الدم",
  eventTime: "وقت الحدث",
  createdAt: "تاريخ الإنشاء",
  student: "الطالب",
  username: "اسم المستخدم",
  fullName: "الاسم الكامل",
  role: "الدور",
  recordType: "النوع",
};

const HIDDEN = new Set([
  "isDeleted",
  "clinicId",
  "nurseId",
  "visitorId",
  "createdById",
  "updatedAt",
  "passwordHash",
  "photoUrl",
  "avatarUrl",
  "batches",
  "clinic",
  "medication",
  "activeIngredient",
  "dosageForm",
  "concentration",
  "category",
  "supplier",
  "storageLocation",
  "qrCode",
  "receivedAt",
  "medicationId",
  "unit",
]);

export function fieldLabel(key: string): string {
  return LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
}

export function isHiddenField(key: string): boolean {
  return HIDDEN.has(key);
}

export function formatCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (key === "gender") {
    if (value === "MALE") return "ذكر";
    if (value === "FEMALE") return "أنثى";
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      return new Intl.DateTimeFormat("ar-QA", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Qatar",
      }).format(new Date(value));
    } catch {
      return value;
    }
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.name === "string") return o.name;
    if (typeof o.title === "string") return o.title;
    return JSON.stringify(value);
  }
  return String(value);
}

export const LIST_COLUMNS: Record<string, string[]> = {
  students: ["academicNumber", "name", "grade", "class", "guardianName", "isActive"],
  employees: ["employeeNumber", "name", "department", "jobTitle", "phone", "isActive"],
  visits: ["visitNumber", "dateTime", "visitorName", "reasonsSummary", "triageLevel", "status"],
  referrals: ["referralTime", "severity", "status", "reasonCategory", "student"],
  emergency: ["eventTime", "severity", "status", "location"],
  medications: ["name", "genericName", "form", "stockQty", "minQuantity", "clinicName"],
  inventory: ["medicationName", "batchNumber", "quantity", "expiryDate", "clinicName"],
  clinics: ["name", "code", "building", "floor", "isActive"],
  circulars: ["title", "priority", "publishedAt", "status"],
  notifications: ["title", "channel", "status", "createdAt"],
  "psychology/sessions": ["sessionDate", "status", "studentId"],
  "social/cases": ["openedAt", "status", "priority", "studentId"],
  "internal-referrals": ["referralDate", "status", "fromClinicId", "toClinicId"],
  "alerts/frequent": ["visitorName", "visitCount", "periodDays", "clinicName"],
  "canteen/inspections": ["inspectionDate", "score", "status"],
  "canteen/incidents": ["reportedAt", "severity", "status"],
  "nurses/shifts": ["shiftDate", "shiftType", "nurseId", "status"],
  "nurses/attendance": ["date", "checkIn", "checkOut", "status"],
  "safety/first-aid": ["location", "lastChecked", "status"],
  "safety/aed": ["location", "lastMaintenance", "status"],
  "safety/inspections": ["inspectionDate", "area", "result"],
  reports: ["name", "type", "generatedAt"],
  settings: ["username", "fullName", "role", "clinicId"],
  search: ["recordType", "name", "academicNumber", "employeeNumber", "grade", "department"],
};

/** عنوان البطاقة في عرض الشبكة */
export const GRID_TITLE_FIELD: Record<string, string> = {
  students: "name",
  employees: "name",
  visits: "visitNumber",
  referrals: "student",
  settings: "fullName",
  search: "name",
};

const TITLE_FALLBACKS = ["name", "fullName", "title", "visitNumber", "username", "medicationName"];

export function rowGridTitle(row: Record<string, unknown>, resourceKey?: string): string {
  const key = resourceKey ? GRID_TITLE_FIELD[resourceKey] : undefined;
  if (key && row[key] != null) return formatCellValue(key, row[key]);
  for (const f of TITLE_FALLBACKS) {
    if (row[f] != null) return formatCellValue(f, row[f]);
  }
  return "—";
}

const GRID_SUBTITLE: Record<string, string> = {
  students: "academicNumber",
  employees: "employeeNumber",
  settings: "username",
  search: "recordType",
  visits: "visitorName",
};

const GRID_TAGS: Record<string, string[]> = {
  students: ["grade", "class", "gender"],
  employees: ["department", "jobTitle"],
  settings: ["role"],
  search: ["grade", "department"],
  visits: ["triageLevel", "status"],
  referrals: ["severity", "status"],
};

export function rowGridSubtitle(row: Record<string, unknown>, resourceKey?: string): string {
  const key = resourceKey ? GRID_SUBTITLE[resourceKey] : undefined;
  if (key && row[key] != null) {
    const v = formatCellValue(key, row[key]);
    if (v !== "—") return v;
  }
  return "";
}

export function rowGridTags(row: Record<string, unknown>, resourceKey?: string): string[] {
  const keys = (resourceKey && GRID_TAGS[resourceKey]) || ["status"];
  return keys
    .map((k) => formatCellValue(k, row[k]))
    .filter((v) => v !== "—" && v.length < 40)
    .slice(0, 3);
}
