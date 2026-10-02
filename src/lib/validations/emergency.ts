import { z } from "zod";

export const createEmergencySchema = z.object({
  location: z.string().min(2),
  visitorType: z.enum(["STUDENT", "EMPLOYEE"]),
  visitorId: z.string().uuid(),
  vitalSigns: z.record(z.string(), z.unknown()).optional(),
  interventions: z.record(z.string(), z.unknown()).optional(),
  medicationsUsed: z.record(z.string(), z.unknown()).optional(),
  responseLevel: z.enum(["CONSCIOUS", "RESPONDS_TO_PAIN", "UNRESPONSIVE"]).optional(),
  referralDecision: z.boolean().optional(),
  guardianContactTime: z.string().datetime().optional(),
  ambulanceArrivalTime: z.string().datetime().optional(),
  hospitalName: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
});
