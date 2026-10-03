import { z } from "zod";

export const createStockRequestSchema = z.object({
  notes: z.string().trim().optional(),
  lines: z
    .array(
      z.object({
        medicationId: z.string().uuid(),
        quantityRequested: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "أضف صنفاً واحداً على الأقل"),
});

export const reviewStockRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().trim().optional(),
  lines: z
    .array(
      z.object({
        lineId: z.string().uuid(),
        quantityApproved: z.coerce.number().int().min(0),
      }),
    )
    .optional(),
});

export type CreateStockRequestInput = z.infer<typeof createStockRequestSchema>;
export type ReviewStockRequestInput = z.infer<typeof reviewStockRequestSchema>;
