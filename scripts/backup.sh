#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d_%H%M%S)
FILE="backups/school_health_${TS}.sql"
mkdir -pg backups
pg_dump "$DATABASE_URL" > "$FILE"
echo "Backup written to $FILE"
