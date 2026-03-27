#!/bin/sh
set -e

echo "Running database migrations..."
bunx drizzle-kit migrate
echo "Migrations complete."

echo "Starting application..."
exec bun server.js
