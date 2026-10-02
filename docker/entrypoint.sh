#!/bin/sh
set -e

mkdir -p "${UPLOAD_DIR:-./uploads}"

if [ "${RUN_DB_PUSH:-false}" = "true" ]; then
  echo "WARN: RUN_DB_PUSH داخل الحاوية غير مدعوم (Prisma CLI يحتاج node_modules كاملة)."
  echo "      شغّل مرة واحدة من جهازك: npm run db:push  (بنفس DATABASE_URL)"
  echo "      ثم احذف RUN_DB_PUSH من Coolify وأعد النشر."
fi

exec "$@"
