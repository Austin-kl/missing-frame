#!/bin/bash
set -e
echo "=== Missing Frame — установка ==="

echo "[1/5] Поднимаю PostgreSQL + Redis..."
docker-compose up -d
echo "Жду 15 секунд пока БД поднимется..."
sleep 15

echo "[2/5] Backend зависимости..."
cd backend
npm install --legacy-peer-deps

echo "[3/5] Схема БД + seed..."
npx prisma db push
npx prisma generate
npx prisma db seed

echo "[4/5] Frontend зависимости..."
cd ../frontend
npm install --legacy-peer-deps

cd ..
echo ""
echo "=== ✅ Готово! ==="
echo "Запуск (два терминала):"
echo "  npm run dev:backend"
echo "  npm run dev:frontend"
