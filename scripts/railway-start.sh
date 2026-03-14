#!/bin/bash
set -e

echo "=== Pushing database schema ==="
npx prisma db push --skip-generate

echo "=== Seeding database ==="
npx tsx prisma/seed.ts || echo "Seed skipped or already done"

echo "=== Starting API server ==="
cd apps/api && node dist/server.js
