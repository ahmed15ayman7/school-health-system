import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

export type ActorContext = {
  userId: string;
  role: UserRole;
  clinicId: string | null;
  username: string;
  fullName: string;
};

export async function getActor(): Promise<ActorContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    clinicId: session.user.clinicId ?? null,
    username: session.user.username ?? "",
    fullName: session.user.name ?? "",
  };
}

export async function requireActor(): Promise<ActorContext> {
  const actor = await getActor();
  if (!actor) throw new Error("UNAUTHORIZED");
  return actor;
}
