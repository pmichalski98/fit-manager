#!/bin/bash
set -euo pipefail

BACKUP_DIR=/opt/backups/fit-manager
TIMESTAMP=$(date +%Y%m%d_%H%M)

mkdir -p "$BACKUP_DIR"
docker compose -f /opt/fit-manager/docker-compose.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$TIMESTAMP.sql.gz"
