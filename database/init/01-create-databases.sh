#!/bin/bash
set -e

databases=(
  "auth_db"
  "catalog_db"
  "cart_db"
  "order_db"
  "payment_db"
  "inventory_db"
)

for database in "${databases[@]}"; do
  echo "Creando o verificando: $database"

  psql \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --set database="$database" <<-'EOSQL'
      SELECT format('CREATE DATABASE %I', :'database')
      WHERE NOT EXISTS (
        SELECT 1
        FROM pg_database
        WHERE datname = :'database'
      )\gexec
EOSQL
done
