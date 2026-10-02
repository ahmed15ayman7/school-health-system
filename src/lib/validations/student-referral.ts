import { z } from "zod";

export const createStudentReferralSchema = z.object({
  studentId: z.string().uuid(),
  reasonCategory: z.enum([
    "SYMPTOMS",
    "INJURY",
    "EMERGENCY",
    "CHRONIC_FOLLOWUP",
    "SCHEDULED_MEDICATION",
    "GENERAL_COMPLAINT",
    "OTHER",
  ]),
  reasonDetails: z.string().optional(),
  severity: z.enum(["NORMAL", "URGENT", "EMERGENCY"]).default("NORMAL"),
});

export const completeReferralSchema = z.object({
  outcome: z.enum([
    "TREAT_AND_RETURN",
    "OBSERVE_IN_CLINIC",
    "SENT_HOME",
    "GUARDIAN_PICKUP",
    "DOCTOR_REFERRAL",
    "HOSPITAL_REFERRAL",
    "AMBULANCE",
    "EMERGENCY",
    "FOLLOW_UP",
  ]),
  diagnosis: z.string().optional(),
  procedure: z.string().optional(),
  recommendations: z.string().optional(),
});
