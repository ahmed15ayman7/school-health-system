import { z } from "zod";

export const createMedicationSchema = z.object({
  name: z.string().trim().min(2, "اسم الدواء مطلوب"),
  activeIngredient: z.string().trim().optional(),
  category: z.enum(["MEDICINE", "SUPPLY"]).optional(),
  dosageForm: z.string().trim().optional(),
  concentration: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  minQuantity: z.coerce.number().int().min(0).default(5),
  supplier: z.string().trim().optional(),
  storageLocation: z.string().trim().optional(),
  clinicId: z.string().uuid().optional(),
});

export const stockInSchema = z.object({
  medicationId: z.string().uuid(),
  batchNumber: z.string().trim().min(1, "رقم الدفعة مطلوب"),
  quantity: z.coerce.number().int().positive("الكمية يجب أن تكون أكبر من صفر"),
  expiryDate: z.string().min(1, "تاريخ الصلاحية مطلوب"),
  notes: z.string().trim().optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
