#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE project' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'project')\gexec
EOSQL

echo "Importing platform_db dump..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/dumps/bdd_platform.sql

echo "Importing project dump..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname project -f /docker-entrypoint-initdb.d/dumps/bdd_school.sql
