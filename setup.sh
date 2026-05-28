#!/bin/bash
# Missing Frame - Automated Setup Script
# Запустить: chmod +x setup.sh && ./setup.sh

set -e

echo "🚀 Missing Frame - Automated Setup"
echo "===================================="
echo ""

# Проверка node и npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ сначала."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен."
    exit 1
fi

echo "✅ Node.js $(node -v) найден"
echo "✅ npm $(npm -v) найден"
echo ""

# Создать структуру проекта
echo "📁 Создание структуры проекта..."
mkdir -p packages/types
mkdir -p packages/constants
mkdir -p docker

# Backend setup
echo ""
echo "🔧 Настройка Backend (NestJS)..."
if [ ! -d "backend" ]; then
    npx -y @nestjs/cli new backend --skip-git --package-manager npm
    cd backend
    
    # Установка зависимостей
    echo "📦 Установка backend зависимостей..."
    npm install @prisma/client prisma
    npm install @nestjs/passport passport passport-jwt @nestjs/jwt bcrypt
    npm install @nestjs/config class-validator class-transformer
    npm install socket.io @nestjs/websockets @nestjs/platform-socket.io
    npm install -D @types/passport-jwt @types/bcrypt @types/node
    
    # Инициализация Prisma
    npx prisma init
    
    cd ..
else
    echo "⚠️  Backend уже существует, пропускаю"
fi

# Frontend setup
echo ""
echo "🎨 Настройка Frontend (Next.js)..."
if [ ! -d "frontend" ]; then
    npx -y create-next-app@latest frontend \
        --typescript \
        --tailwind \
        --app \
        --no-src-dir \
        --import-alias "@/*" \
        --use-npm
    
    cd frontend
    
    # Установка зависимостей
    echo "📦 Установка frontend зависимостей..."
    npm install axios
    npm install react-hook-form zod @hookform/resolvers
    npm install @tanstack/react-query
    npm install recharts lucide-react
    npm install socket.io-client
    
    cd ..
else
    echo "⚠️  Frontend уже существует, пропускаю"
fi

# Docker Compose
echo ""
echo "🐳 Создание docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: mf-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: missingframe
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - mf-network

  redis:
    image: redis:7-alpine
    container_name: mf-redis
    ports:
      - "6379:6379"
    networks:
      - mf-network

volumes:
  postgres_data:

networks:
  mf-network:
    driver: bridge
EOF

# Root package.json (monorepo)
echo ""
echo "📦 Создание root package.json..."
cat > package.json << 'EOF'
{
  "name": "missing-frame",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "packages/*"
  ],
  "scripts": {
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "db:up": "docker-compose up -d postgres",
    "db:down": "docker-compose down",
    "db:migrate": "cd backend && npx prisma migrate dev",
    "db:seed": "cd backend && npm run seed",
    "db:studio": "cd backend && npx prisma studio"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

npm install

# .gitignore
echo ""
echo "📝 Создание .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.next/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Prisma
backend/prisma/migrations/

# Temp
tmp/
temp/
EOF

# README.md
echo ""
echo "📄 Создание README.md..."
cat > README.md << 'EOF'
# Missing Frame - Internal ERP System

Production Management System для Missing Frame.

## Tech Stack

**Frontend:** Next.js 14 + React + TailwindCSS + shadcn/ui  
**Backend:** NestJS + Prisma + PostgreSQL  
**Deploy:** Railway (Backend) + Vercel (Frontend)

## Quick Start

### 1. Установка зависимостей

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Запуск БД (Docker)

```bash
npm run db:up
```

### 3. Настройка Backend

```bash
cd backend

# Скопировать .env.example в .env
cp .env.example .env

# Применить миграции
npx prisma migrate dev

# Создать super-admin
npm run seed
```

### 4. Запуск приложения

```bash
# В корне проекта
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Развертывание

См. документацию в `/docs/deployment.md`

## Документация

- [Quick Start Guide](docs/quick-start.md)
- [Development Roadmap](docs/roadmap.md)
- [Database Schema](docs/schema.md)
- [API Documentation](docs/api.md)

## License

Private - Missing Frame Internal Use Only
EOF

# Создать папку docs и скопировать туда документы
echo ""
echo "📚 Создание документации..."
mkdir -p docs
cp /home/claude/schema.prisma backend/prisma/schema.prisma 2>/dev/null || true
cp /home/claude/roadmap.md docs/roadmap.md 2>/dev/null || true
cp /home/claude/quick-start.md docs/quick-start.md 2>/dev/null || true
cp /home/claude/project-structure.md docs/architecture.md 2>/dev/null || true

# Создать .env.example для backend
echo ""
echo "🔐 Создание .env.example..."
cat > backend/.env.example << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/missingframe"

# JWT
JWT_SECRET="change-me-in-production"
JWT_EXPIRATION="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Telegram Bot (получить через @BotFather)
TELEGRAM_BOT_TOKEN=""

# Email (Resend API - https://resend.com)
RESEND_API_KEY=""
EMAIL_FROM="noreply@missingframe.ru"

# Google Calendar (опционально)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"
EOF

# Создать .env.local.example для frontend
cat > frontend/.env.local.example << 'EOF'
NEXT_PUBLIC_API_URL="http://localhost:3001"
EOF

echo ""
echo "✅ Setup завершен!"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Скопируйте Prisma схему:"
echo "   cp docs/schema.prisma backend/prisma/schema.prisma"
echo ""
echo "2. Настройте .env файлы:"
echo "   cd backend && cp .env.example .env"
echo "   cd ../frontend && cp .env.local.example .env.local"
echo ""
echo "3. Запустите БД и примените миграции:"
echo "   npm run db:up"
echo "   npm run db:migrate"
echo "   npm run db:seed"
echo ""
echo "4. Запустите приложение:"
echo "   npm run dev"
echo ""
echo "5. Откройте http://localhost:3000"
echo ""
echo "📖 Полная документация: docs/quick-start.md"
echo "🗺️  Roadmap: docs/roadmap.md"
echo ""
