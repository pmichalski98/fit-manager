#!/bin/sh
set -e

echo "Running database migrations..."
bun ./scripts/migrate.ts
echo "Migrations complete."

echo "Starting application..."
exec bun server.js
