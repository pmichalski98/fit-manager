#!/bin/sh
set -e

echo "Running database migrations..."
bun ./node_modules/drizzle-kit/bin.cjs migrate
echo "Migrations complete."

echo "Starting application..."
exec bun server.js
