import {
  PrismaClient,
  UserRole,
  type StudentReferralStatus,
  type ReferralReasonCategory,
  type ReferralSeverity,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const DEMO_STUDENTS: {
  academicNumber: string;
  name: string;
  grade: string;
  class: string;
  gender: "MALE" | "FEMALE";
  clinicIdx: number;
  seed: string;
}[] = [
  { academicNumber: "2026001", name: "أحمد محمد علي", grade: "الخامس", class: "5/أ", gender: "MALE", clinicIdx: 1, seed: "ahmed-2026001" },
  { academicNumber: "2026002", name: "فاطمة خالد السالم", grade: "الرابع", class: "4/ب", gender: "FEMALE", clinicIdx: 2, seed: "fatima-2026002" },
  { academicNumber: "2026003", name: "عمر يوسف الحربي", grade: "السادس", class: "6/أ", gender: "MALE", clinicIdx: 1, seed: "omar-2026003" },
  { academicNumber: "2026004", name: "مريم سعد العتيبي", grade: "الثالث", class: "3/أ", gender: "FEMALE", clinicIdx: 0, seed: "mariam-2026004" },
  { academicNumber: "2026005", name: "خالد عبدالله", grade: "الأول", class: "1/ج", gender: "MALE", clinicIdx: 0, seed: "khaled-2026005" },
  { academicNumber: "2026006", name: "نورة فيصل", grade: "الثاني", class: "2/أ", gender: "FEMALE", clinicIdx: 2, seed: "noura-2026006" },
  { academicNumber: "2026007", name: "سالم أحمد", grade: "الإعدادي", class: "7/ب", gender: "MALE", clinicIdx: 3, seed: "salem-2026007" },
  { academicNumber: "2026008", name: "لينا محمود", grade: "الإعدادي", class: "8/أ", gender: "FEMALE", clinicIdx: 4, seed: "lina-2026008" },
  { academicNumber: "2026009", name: "يوسف إبراهيم", grade: "الثانوي", class: "10/أ", gender: "MALE", clinicIdx: 5, seed: "youssef-2026009" },
  { academicNumber: "2026010", name: "ريم عبدالرحمن", grade: "الثانوي", class: "11/ب", gender: "FEMALE", clinicIdx: 5, seed: "reem-2026010" },
  { academicNumber: "2026011", name: "حسن علي", grade: "الخامس", class: "5/ب", gender: "MALE", clinicIdx: 1, seed: "hassan-2026011" },
  { academicNumber: "2026012", name: "دانة محمد", grade: "الرابع", class: "4/أ", gender: "FEMALE", clinicIdx: 2, seed: "dana-2026012" },
];

const DEMO_EMPLOYEES = [
  { employeeNumber: "EMP-1001", name: "سعيد المطيري", department: "تعليم", jobTitle: "معلم", phone: "+96550001001" },
  { employeeNumber: "EMP-1002", name: "هند الشمري", department: "إدارة", jobTitle: "سكرتيرة", phone: "+96550001002" },
  { employeeNumber: "EMP-1003", name: "فهد العنزي", department: "صيانة", jobTitle: "فني", phone: "+96550001003" },
];

function photo(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}&size=128`;
}

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60 * 1000);
}

async function main() {
  const school = await prisma.school.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "مجمع مدارس الأندalus الخاصة",
      address: "الكويت، السالمية",
      phone: "+965 25701234",
      email: "info@andalus.edu.kw",
    },
  });

  const clinicNames = [
    "عيادة الروضة",
    "عيادة الابتدائي بنين",
    "عيادة الابتدائي بنات",
    "عيادة الإعدادي بنين",
    "عيادة الإعدادي بنات",
    "عيادة الثانوي",
  ];

  const clinics = [];
  for (let i = 0; i < clinicNames.length; i++) {
    const id = `00000000-0000-4000-8000-${String(i + 2).padStart(12, "0")}`;
    clinics.push(
      await prisma.clinic.upsert({
        where: { id },
        update: { name: clinicNames[i]! },
        create: { id, schoolId: school.id, name: clinicNames[i]!, location: `مبنى ${i + 1}` },
      }),
    );
  }

  await prisma.canteen.upsert({
    where: { id: "00000000-0000-4000-8000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000010",
      schoolId: school.id,
      name: "مقصف المبنى الرئيسي",
      location: "الطابق الأرضي",
    },
  });

  const passwordHash = await hashPassword("admin123");
  const nurseHash = await hashPassword("nurse123");

  const users: { username: string; fullName: string; role: UserRole; clinicIdx: number; hash: string }[] = [
    { username: "admin", fullName: "مدير النظام", role: "SUPER_ADMIN", clinicIdx: 0, hash: passwordHash },
    { username: "med.manager", fullName: "مدير طبي", role: "MEDICAL_MANAGER", clinicIdx: 0, hash: passwordHash },
    { username: "head.nurse", fullName: "رئيس تمريض", role: "HEAD_NURSE", clinicIdx: 1, hash: nurseHash },
    { username: "nurse.b", fullName: "ممرض ابتدائي بنين", role: "NURSE", clinicIdx: 1, hash: nurseHash },
    { username: "pharmacy", fullName: "صيدلي", role: "PHARMACY", clinicIdx: 0, hash: passwordHash },
    { username: "canteen", fullName: "مفتش مقصف", role: "CANTEEN_INSPECTOR", clinicIdx: 0, hash: passwordHash },
    { username: "hr", fullName: "موارد بشرية", role: "HR", clinicIdx: 0, hash: passwordHash },
    { username: "school.admin", fullName: "إدارة مدرسة", role: "SCHOOL_ADMIN", clinicIdx: 0, hash: passwordHash },
    { username: "psych", fullName: "أخصائي نفسي", role: "PSYCHOLOGIST", clinicIdx: 0, hash: passwordHash },
    { username: "social", fullName: "أخصائي اجتماعي", role: "SOCIAL_WORKER", clinicIdx: 0, hash: passwordHash },
    { username: "teacher1", fullName: "معلم مشرف", role: "TEACHER", clinicIdx: 1, hash: passwordHash },
    { username: "viewer", fullName: "مشاهد", role: "VIEWER", clinicIdx: 0, hash: passwordHash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash: u.hash, role: u.role, clinicId: clinics[u.clinicIdx]!.id },
      create: {
        username: u.username,
        email: `${u.username}@andalus.edu.kw`,
        passwordHash: u.hash,
        role: u.role,
        clinicId: clinics[u.clinicIdx]!.id,
        fullName: u.fullName,
      },
    });
  }

  const nurse = await prisma.user.findUniqueOrThrow({ where: { username: "nurse.b" } });
  const teacher = await prisma.user.findUniqueOrThrow({ where: { username: "teacher1" } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { username: "admin" } });

  const students = [];
  for (const s of DEMO_STUDENTS) {
    const st = await prisma.student.upsert({
      where: { academicNumber: s.academicNumber },
      update: {
        name: s.name,
        photoUrl: photo(s.seed),
        grade: s.grade,
        class: s.class,
      },
      create: {
        academicNumber: s.academicNumber,
        qrCode: `STU-${s.academicNumber}`,
        name: s.name,
        grade: s.grade,
        class: s.class,
        clinicId: clinics[s.clinicIdx]!.id,
        guardianName: `ولي ${s.name.split(" ")[0]}`,
        guardianPhone: "+9659911" + s.academicNumber.slice(-4),
        gender: s.gender,
        photoUrl: photo(s.seed),
      },
    });
    students.push(st);

    await prisma.medicalProfile.upsert({
      where: { ownerType_ownerId: { ownerType: "STUDENT", ownerId: st.id } },
      update: {},
      create: { ownerType: "STUDENT", ownerId: st.id, bloodType: s.gender === "MALE" ? "O+" : "A+" },
    });
  }

  const firstProfile = await prisma.medicalProfile.findUniqueOrThrow({
    where: { ownerType_ownerId: { ownerType: "STUDENT", ownerId: students[0]!.id } },
  });
  await prisma.allergy.createMany({
    data: [{ profileId: firstProfile.id, type: "Penicillin", severity: "SEVERE", notes: "حساسية دوائية" }],
    skipDuplicates: true,
  });

  for (const e of DEMO_EMPLOYEES) {
    await prisma.employee.upsert({
      where: { employeeNumber: e.employeeNumber },
      update: { name: e.name },
      create: {
        ...e,
        clinicId: clinics[1]!.id,
        email: `${e.employeeNumber.toLowerCase()}@andalus.edu.kw`,
      },
    });
  }

  const year = new Date().getFullYear();
  await prisma.counter.upsert({
    where: { scope_year: { scope: "VIS", year } },
    update: { value: 20 },
    create: { scope: "VIS", year, value: 20 },
  });
  await prisma.counter.upsert({
    where: { scope_year: { scope: "REF", year } },
    update: { value: 10 },
    create: { scope: "REF", year, value: 10 },
  });
  await prisma.counter.upsert({
    where: { scope_year: { scope: "EMG", year } },
    update: { value: 3 },
    create: { scope: "EMG", year, value: 3 },
  });

  const visitDefs = [
    { num: `VIS-${year}-000101`, studentIdx: 0, status: "OPEN" as const, triage: "MEDIUM" as const, mins: 45 },
    { num: `VIS-${year}-000102`, studentIdx: 2, status: "CLOSED" as const, triage: "LOW" as const, mins: 120 },
    { num: `VIS-${year}-000103`, studentIdx: 5, status: "CLOSED" as const, triage: "HIGH" as const, mins: 90 },
    { num: `VIS-${year}-000104`, studentIdx: 1, status: "OPEN" as const, triage: "LOW" as const, mins: 15 },
  ];

  for (const v of visitDefs) {
    const st = students[v.studentIdx]!;
    const entry = minutesAgo(v.mins);
    await prisma.visit.upsert({
      where: { visitNumber: v.num },
      update: {},
      create: {
        visitNumber: v.num,
        dateTime: entry,
        clinicId: st.clinicId,
        nurseId: nurse.id,
        visitorType: "STUDENT",
        visitorId: st.id,
        reasonsJson: { selected: ["FEVER", "HEADACHE"] },
        triageLevel: v.triage,
        triageReason: "تقييم أولي",
        status: v.status,
        entryTime: entry,
        exitTime: v.status === "CLOSED" ? new Date() : null,
        durationMinutes: v.status === "CLOSED" ? 25 : null,
        outcome: v.status === "CLOSED" ? "TREAT_AND_RETURN" : null,
      },
    });
  }

  type RefDef = {
    num: string;
    studentIdx: number;
    status: StudentReferralStatus;
    severity: ReferralSeverity;
    category: ReferralReasonCategory;
    referralMins: number;
    receivedMins?: number;
  };

  const refDefs: RefDef[] = [
    { num: `REF-${year}-000201`, studentIdx: 3, status: "PENDING", severity: "NORMAL", category: "SYMPTOMS", referralMins: 20 },
    { num: `REF-${year}-000202`, studentIdx: 4, status: "PENDING", severity: "URGENT", category: "INJURY", referralMins: 18 },
    { num: `REF-${year}-000203`, studentIdx: 6, status: "RECEIVED", severity: "NORMAL", category: "GENERAL_COMPLAINT", referralMins: 40, receivedMins: 5 },
    { num: `REF-${year}-000204`, studentIdx: 0, status: "IN_TREATMENT", severity: "NORMAL", category: "SYMPTOMS", referralMins: 60, receivedMins: 50 },
    { num: `REF-${year}-000205`, studentIdx: 8, status: "COMPLETED", severity: "NORMAL", category: "CHRONIC_FOLLOWUP", referralMins: 180, receivedMins: 170 },
  ];

  for (const r of refDefs) {
    const st = students[r.studentIdx]!;
    const referralTime = minutesAgo(r.referralMins);
    const receivedTime = r.receivedMins != null ? minutesAgo(r.receivedMins) : null;
    await prisma.studentReferral.upsert({
      where: { referralNumber: r.num },
      update: { status: r.status },
      create: {
        referralNumber: r.num,
        studentId: st.id,
        referredById: teacher.id,
        referredByName: teacher.fullName,
        referredByRole: teacher.role,
        reasonCategory: r.category,
        reasonDetails: "بيانات تجريبية للعرض",
        severity: r.severity,
        status: r.status,
        referralTime,
        receivedTime,
        waitingMinutes: receivedTime ? Math.round((receivedTime.getTime() - referralTime.getTime()) / 60000) : null,
        treatmentStartTime: r.status === "IN_TREATMENT" || r.status === "COMPLETED" ? minutesAgo(45) : null,
        treatmentEndTime: r.status === "COMPLETED" ? minutesAgo(30) : null,
        departureTime: r.status === "COMPLETED" ? minutesAgo(28) : null,
        treatmentMinutes: r.status === "COMPLETED" ? 15 : null,
        totalMinutes: r.status === "COMPLETED" ? 32 : null,
        clinicId: st.clinicId,
        outcome: r.status === "COMPLETED" ? "TREAT_AND_RETURN" : null,
        guardianNotified: r.status === "COMPLETED",
      },
    });
  }

  await prisma.emergencyCase.upsert({
    where: { caseNumber: `EMG-${year}-000301` },
    update: {},
    create: {
      caseNumber: `EMG-${year}-000301`,
      eventTime: minutesAgo(200),
      location: "الملعب — مبنى 2",
      visitorType: "STUDENT",
      visitorId: students[2]!.id,
      responseLevel: "CONSCIOUS",
      referralDecision: false,
      outcome: "stable",
    },
  });

  const med = await prisma.medication.upsert({
    where: { qrCode: "MED-PARACET-DEMO" },
    update: {},
    create: {
      name: "باراسيتامول 500mg",
      activeIngredient: "Paracetamol",
      clinicId: clinics[1]!.id,
      qrCode: "MED-PARACET-DEMO",
      minQuantity: 10,
      unit: "tablet",
    },
  });

  await prisma.medicationBatch.upsert({
    where: { id: "00000000-0000-4000-8010-000000000001" },
    update: { quantity: 48 },
    create: {
      id: "00000000-0000-4000-8010-000000000001",
      medicationId: med.id,
      batchNumber: "BATCH-2026-A",
      quantity: 48,
      expiryDate: new Date(Date.now() + 180 * 86400000),
    },
  });

  await prisma.medicationBatch.upsert({
    where: { id: "00000000-0000-4000-8010-000000000002" },
    update: { quantity: 3 },
    create: {
      id: "00000000-0000-4000-8010-000000000002",
      medicationId: med.id,
      batchNumber: "BATCH-LOW-STOCK",
      quantity: 3,
      expiryDate: new Date(Date.now() + 60 * 86400000),
    },
  });

  await prisma.circular.upsert({
    where: { id: "00000000-0000-4000-8020-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8020-000000000001",
      title: "تعميم: بروتوكول الحمى الموسمية",
      content: "يرجى اتباع إجراءات الفرز عند ارتفاع الحرارة.",
      priority: "URGENT",
      issuedById: admin.id,
      targetAudience: ["NURSE", "TEACHER"],
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: "IN_APP",
        title: "مرحباً بك في المنظومة",
        message: "تم تحميل البيانات التجريبية بنجاح.",
        link: "/",
      },
      {
        userId: nurse.id,
        type: "REFERRAL",
        title: "تحويل جديد",
        message: "يوجد تحويلات معلّقة في لوحة التتبع.",
        link: "/referrals/dashboard",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.frequentVisitorAlert.createMany({
    data: [
      {
        studentId: students[10]!.id,
        visitCount: 4,
        periodStart: minutesAgo(60 * 24 * 20),
        periodEnd: new Date(),
        periodType: "month",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed:");
  console.log(`  ${students.length} students, ${DEMO_EMPLOYEES.length} employees`);
  console.log(`  ${visitDefs.length} visits, ${refDefs.length} referrals`);
  console.log("  Login: admin / admin123  |  nurse.b / nurse123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
