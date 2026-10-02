import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let clinicName: string | undefined;
  if (session.user.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: { name: true },
    });
    clinicName = clinic?.name;
  }

  return (
    <AppShell userName={session.user.name ?? ""} role={session.user.role} clinicName={clinicName}>
      {children}
    </AppShell>
  );
}
