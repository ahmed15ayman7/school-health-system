#!/bin/sh
set -e

mkdir -p "${UPLOAD_DIR:-./uploads}"

if [ "${RUN_DB_PUSH:-false}" = "true" ]; then
  echo "Applying Prisma schema (db push)..."
  node /app/node_modules/prisma/build/index.js db push --skip-generate
fi

exec "$@"
