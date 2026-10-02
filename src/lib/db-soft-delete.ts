import { Prisma } from "@prisma/client";

const SOFT_MODELS = new Set([
  "Student",
  "Employee",
  "Visit",
  "Medication",
]);

export function softDeleteExtension() {
  return Prisma.defineExtension({
    name: "softDelete",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SOFT_MODELS.has(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_MODELS.has(model)) {
            args.where = { ...args.where, isDeleted: false };
          }
          return query(args);
        },
      },
    },
  });
}
