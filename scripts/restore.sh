#!/usr/bin/env bash
set -euo pipefail
FILE=${1:?usage: restore.sh backup.sql}
psql "$DATABASE_URL" < "$FILE"
echo "Restored from $FILE"
