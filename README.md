# Missing Frame — Internal Production System

Внутренняя система управления для продакшн-студии.
Стек: **NestJS 11 + Prisma 6 + PostgreSQL** (backend), **Next.js 14 + React 18** (frontend).

> Текущий прогресс: **Фаза 0 (Setup) + Фаза 1 (Авторизация)** завершены.

---

## ⚠️ Этот архив — полная пересборка

Он заменяет весь проект. Структура и версии зафиксированы, всё проверено на компиляцию.
**Не сливай файлы вручную — заменяй папки целиком** (см. ниже).

---

## Структура

```
missing-frame-site/
├── docker-compose.yml      # PostgreSQL + Redis
├── package.json            # корневые скрипты (БЕЗ workspaces)
├── install.sh / .ps1       # установка одной командой
├── .gitignore
├── README.md
├── backend/                # NestJS 11
│   ├── prisma/
│   │   ├── schema.prisma   # ЕДИНСТВЕННАЯ схема
│   │   └── seed.ts
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/         # PrismaService
│   │   └── modules/
│   │       ├── auth/       # JWT, 2FA, сессии
│   │       └── users/      # профиль, смена пароля
│   ├── package.json
│   └── .env.example
└── frontend/               # Next.js 14
    ├── app/
    │   ├── (auth)/         # login, 2fa, reset-password, setup-2fa
    │   └── (dashboard)/    # dashboard (заглушка для Фазы 2)
    ├── contexts/AuthContext.tsx
    ├── lib/api.ts
    ├── middleware.ts
    └── package.json
```

---

## Установка поверх существующего проекта

В твоём `missing-frame-site/` на Рабочем столе:

### Что заменить полностью
1. Удали папки `backend/src/` и `backend/prisma/` → положи новые из архива
2. Удали папку `frontend/app/` → положи новую из архива
3. Скопируй из архива: `frontend/contexts/`, `frontend/lib/`, `frontend/middleware.ts`
4. Замени конфиги: оба `package.json`, `tsconfig.json`, `nest-cli.json`, `next.config.js`

### Что удалить (мусор от Phase 0)
- **`prisma/` в корне проекта** — не используется, рабочая схема в `backend/prisma/`
- **`node_modules/` в корне** и **`package-lock.json` в корне** — мы ушли от workspaces, теперь зависимости ставятся отдельно в каждой папке
- **`packages/`** — пока не используется (можно оставить пустой)
- **`docker/`** — не используется (docker-compose берёт готовые образы)

### Что НЕ трогать
- `.git/`, `docs/`
- `backend/.env` (проверь по `.env.example`), `frontend/.env.local`

---

## Запуск с нуля

### Вариант А — одной командой (PowerShell)
```powershell
cd C:\Users\Alex\Desktop\missing-frame-site
.\install.ps1
```

### Вариант Б — вручную
```bash
# 1. БД
docker-compose up -d        # подождать 15 сек

# 2. Backend
cd backend
npm install --legacy-peer-deps
npx prisma db push
npx prisma generate
npx prisma db seed

# 3. Frontend
cd ../frontend
npm install --legacy-peer-deps
```

### Запуск (два терминала)
```bash
# Терминал 1
cd backend && npm run start:dev      # → http://localhost:3001

# Терминал 2
cd frontend && npm run dev           # → http://localhost:3000
```

---

## Проверка авторизации

| Тест | Действие | Ожидание |
|------|----------|----------|
| Защита роутов | `localhost:3000` | → `/login` |
| Вход | `admin@missingframe.ru` / `Admin123!` | → `/dashboard` |
| Первый вход | `employee@missingframe.ru` / `Temp1234!` | → смена пароля → `/dashboard` |
| Настройка 2FA | dashboard → «Настроить 2FA» → QR → код | «2FA включена» |
| Вход с 2FA | выйти → войти → код | `/dashboard` |

### Тестовые учётки

| Email | Пароль | Роль |
|-------|--------|------|
| admin@missingframe.ru | Admin123! | ADMIN |
| head@missingframe.ru | Head123! | PRODUCTION_HEAD |
| pm@missingframe.ru | Pm123456! | PM |
| hr@missingframe.ru | Hr1234567! | HR |
| employee@missingframe.ru | Temp1234! | EMPLOYEE (первый вход) |

---

## Если ошибки

| Ошибка | Причина | Фикс |
|--------|---------|------|
| `ERESOLVE` | peer-зависимости | `npm install --legacy-peer-deps` |
| `current transaction is aborted` | битая миграция | удалить `backend/prisma/migrations/`, `npm run docker:reset`, `db push` |
| `has no exported member 'Role'` | нет generate | `npx prisma generate` |
| `Duplicate identifier` | старый файл-призрак | удалить папку целиком, положить новую |
| 401 на всё | пустой JWT_SECRET | проверить `backend/.env` |

---

## Команды-помощники (из корня)

```bash
npm run docker:up        # поднять БД
npm run docker:reset     # пересоздать БД с нуля
npm run db:setup         # push + generate + seed
npm run dev:backend      # запустить backend
npm run dev:frontend     # запустить frontend
```
