#!/bin/sh
set -e

echo "Running database migrations..."
bunx drizzle-kit migrate 2>&1 || echo "Migration warning (may already be applied)"

echo "Starting application..."
exec bun server.js
