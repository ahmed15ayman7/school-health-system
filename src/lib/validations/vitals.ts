import { z } from "zod";

export const vitalSignsSchema = z.object({
  temperature: z.number().min(35).max(42).optional().nullable(),
  bloodPressureSystolic: z.number().int().min(70).max(250).optional().nullable(),
  bloodPressureDiastolic: z.number().int().min(40).max(150).optional().nullable(),
  pulse: z.number().int().min(30).max(250).optional().nullable(),
  respirationRate: z.number().int().min(8).max(60).optional().nullable(),
  spo2: z.number().int().min(0).max(100).optional().nullable(),
  bloodSugar: z.number().int().min(20).max(600).optional().nullable(),
  weight: z.number().min(1).max(300).optional().nullable(),
  height: z.number().min(30).max(250).optional().nullable(),
});

export type VitalSignsInput = z.infer<typeof vitalSignsSchema>;
