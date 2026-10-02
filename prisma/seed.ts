import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "مجمع مدارس الأندلس الخاصة",
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

  const student = await prisma.student.upsert({
    where: { academicNumber: "2026001" },
    update: {
      photoUrl: "https://api.dicebear.com/9.x/avataaars/png?seed=ahmed-student-2026001&size=128",
    },
    create: {
      academicNumber: "2026001",
      qrCode: "STU-2026001",
      name: "أحمد محمد علي",
      grade: "الخامس",
      class: "5/أ",
      clinicId: clinics[1]!.id,
      guardianName: "محمد علي",
      guardianPhone: "+96599112233",
      gender: "MALE",
      photoUrl: "https://api.dicebear.com/9.x/avataaars/png?seed=ahmed-student-2026001&size=128",
    },
  });

  const profile = await prisma.medicalProfile.upsert({
    where: { ownerType_ownerId: { ownerType: "STUDENT", ownerId: student.id } },
    update: {},
    create: { ownerType: "STUDENT", ownerId: student.id, bloodType: "O+" },
  });

  await prisma.allergy.createMany({
    data: [{ profileId: profile.id, type: "Penicillin", severity: "SEVERE", notes: "حساسية دوائية" }],
    skipDuplicates: true,
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
