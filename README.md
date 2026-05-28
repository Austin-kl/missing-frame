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
