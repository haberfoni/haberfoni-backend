#!/bin/bash

# Haberfoni FULL SYSTEM Backup Script
# Backs up the Database AND the entire project directory (Source code + Uploads).

# --- SETTINGS ---
BACKUP_DIR="${HOME}/haberfoni_backups"
DB_CONTAINER="haberfoni_db"
DB_USER="root"
DB_PASS="Pr0duct10n_Root!2026"
DB_NAME="haberfoni"
PROJECT_DIR="${HOME}/haberfoni"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=7

# --- PREPARATION ---
mkdir -p "$BACKUP_DIR"
echo "[$DATE] Starting FULL SITE backup..."

# --- 1. DATABASE BACKUP ---
echo "Dumping database..."
docker exec "$DB_CONTAINER" mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "${BACKUP_DIR}/db_${DATE}.sql"
if [ $? -eq 0 ]; then
    gzip "${BACKUP_DIR}/db_${DATE}.sql"
    echo "DB backup SUCCESS: db_${DATE}.sql.gz"
else
    echo "ERROR: DB backup FAILED!"
fi

# --- 2. PROJECT FILES BACKUP (Source Code + Configs + Uploads) ---
# We exclude node_modules and the raw database data (mysql_data) to keep it compact.
echo "Archiving project files (excluding node_modules and raw DB data)..."
if [ -d "$PROJECT_DIR" ]; then
    tar -czf "${BACKUP_DIR}/site_full_${DATE}.tar.gz" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="mysql_data" \
        -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"
    echo "File backup SUCCESS: site_full_${DATE}.tar.gz"
else
    echo "ERROR: $PROJECT_DIR not found!"
fi

# --- 3. CLEANUP (ROTATION) ---
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;

echo "[$DATE] Full backup sequence completed. Backups located in: $BACKUP_DIR"
