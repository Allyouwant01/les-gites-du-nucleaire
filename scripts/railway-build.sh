#!/bin/bash
set -e

echo "=== 1/5 Installing dependencies ==="
npm install

echo "=== 2/5 Building shared package ==="
cd packages/shared && npx tsc && cd ../..

echo "=== 3/5 Generating Prisma client & pushing schema ==="
npx prisma generate
npx prisma db push --skip-generate

echo "=== 4/5 Building API ==="
cd apps/api && npx tsc && cd ../..

echo "=== 5/5 Seeding database ==="
npx tsx prisma/seed.ts || echo "Seed skipped (may already exist)"

echo "=== Build complete! ==="
