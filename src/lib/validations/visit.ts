import { z } from "zod";
import { vitalSignsSchema } from "@/lib/validations/vitals";

export const visitReasonSchema = z.enum([
  "PAIN",
  "INJURY",
  "FEVER",
  "HEADACHE",
  "ABDOMINAL_PAIN",
  "VOMITING",
  "DIARRHEA",
  "ALLERGY",
  "DIZZINESS",
  "DYSPNEA",
  "RESPIRATORY",
  "PSYCHOLOGICAL",
  "CHRONIC_FOLLOWUP",
  "MEDICATION_ADMIN",
  "ROUTINE_CHECK",
  "OTHER",
]);

export const createVisitSchema = z.object({
  clinicId: z.string().uuid(),
  visitorType: z.enum(["STUDENT", "EMPLOYEE"]),
  visitorId: z.string().uuid(),
  reasons: z.record(z.string(), z.unknown()).optional(),
  reasonList: z.array(visitReasonSchema).optional(),
  otherReason: z.string().optional(),
  triageLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]).default("LOW"),
  triageReason: z.string().optional(),
  triageAction: z.string().optional(),
  vitals: vitalSignsSchema.optional(),
});

export const closeVisitSchema = z.object({
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
  procedure: z.string().optional(),
  recommendations: z.string().optional(),
  notes: z.string().optional(),
});
