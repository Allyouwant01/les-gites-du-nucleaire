#!/bin/bash
set -e

echo "=== 1/3 Installing dependencies ==="
npm install

echo "=== 2/3 Building shared package ==="
cd packages/shared && npx tsc && cd ../..

echo "=== 3/3 Generating Prisma client & Building API ==="
npx prisma generate
cd apps/api && npx tsc && cd ../..

echo "=== Build complete! ==="
