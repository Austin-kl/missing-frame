# Missing Frame - Development Roadmap v3.0
# С бесплатным хостингом и оптимальными точками смены чатов

---

## ⛔ ТЕХНИЧЕСКИЕ ПРАВИЛА (читать первым делом в каждом новом чате)

Эти правила предотвращают конфликты файлов и зависимостей при смене чатов.
Нарушение любого = часы отладки. Они важнее всего остального в этом файле.

### Версии стека (НЕ менять без причины)
- **NestJS:** v11 (`@nestjs/*` все `^11`, кроме `@nestjs/schedule` `^6`, `@nestjs/config` `^4`)
- **Prisma:** v6
- **Next.js:** 14.2.x
- **React:** 18.3.x
- **Node:** 20+

> При генерации `package.json` всегда указывай эти версии. Не смешивай NestJS 10 и 11 — это даёт `ERESOLVE`.

### Установка пакетов
- **Всегда** `npm install <pkg> --legacy-peer-deps` — иначе npm падает на peer-зависимостях.

### База данных (локально)
- **Только** `npx prisma db push` + `npx prisma generate`. **НИКОГДА** `migrate dev` локально.
  Причина: упавшая миграция вешает транзакцию PostgreSQL (`current transaction is aborted`).
- Если БД сломалась: `docker-compose down -v && docker-compose up -d`, подождать 15 сек, `db push`.
- Папки `backend/prisma/migrations/` локально быть НЕ должно. Если появилась — удалить.

### Замена кода между фазами (ГЛАВНОЕ)
- Новая фаза = **полная замена папок целиком**, НЕ ручной merge файлов.
- Перед копированием новых модулей: **удалить старую папку `src/modules/<module>/` целиком**, потом класть новую.
- Никаких «дописать пару файлов в существующую папку» — остаются файлы-призраки (`index.ts`, старые декораторы) и дают `Duplicate identifier`.
- Один источник правды на сущность: декораторы — отдельные файлы + один `index.ts` только с `export *`. Не дублировать определения.

### Структура проекта (фиксированная, monorepo)
```
missing-frame-site/
├── docker-compose.yml        # postgres + redis
├── package.json              # workspace root
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # ЕДИНСТВЕННАЯ схема (НЕ в корне проекта)
│   │   └── seed.ts
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/           # PrismaService + PrismaModule
│   │   └── modules/<name>/   # каждый модуль: module/service/controller/dto/...
│   ├── .env
│   └── package.json          # NestJS 11
└── frontend/
    ├── app/(auth)/ (dashboard)/ ...
    ├── contexts/  lib/  middleware.ts
    ├── .env.local
    └── package.json          # Next 14
```

> Если в корне проекта есть дубль `prisma/` — это мусор от Phase 0, бэкенд его не использует. Рабочая схема только в `backend/prisma/`.

### Чек перед коммитом фазы
```bash
cd backend && npx tsc --noEmit     # 0 ошибок
cd ../frontend && npx tsc --noEmit  # 0 ошибок
```

---

## 🗺️ Общая стратегия хостинга

| Период | Хостинг | Завершенные фазы | Цена |
|--------|---------|------------------|------|
| **Недели 1-4** | Локально (Docker) | Фазы 0-2 | $0 |
| **Недели 5-6** | Render Free + Neon | Фазы 3-4 | $0 |
| **Недели 7+** | Railway | Фазы 5-8 | $15-20/мес |

---

## 💬 Когда менять чаты (ВАЖНО!)

### Правила смены чата:
1. **После каждой завершенной фазы** - начинаешь новый чат для следующей фазы
2. **При смене хостинга** - новый чат для деплоя
3. **Если контекст >100 сообщений** - начинай новый чат раньше
4. **При переходе к новому модулю** (Projects → Tasks → HR)

### Как передавать контекст:
1. Сохрани важные файлы из предыдущего чата
2. В новом чате отправь:
   - "Продолжаем разработку Missing Frame"
   - "Завершена Фаза X"
   - "Следующая задача: Фаза Y"
   - Прикрепи текущий roadmap (этот файл)
3. Я пойму контекст и продолжу

### Метки в roadmap:
- 🔄 **СМЕНА ЧАТА** - обязательная точка для нового чата
- 📦 **ЧЕКПОИНТ** - можно сменить чат (опционально)

---

## ЭТАП 1: ЛОКАЛЬНАЯ РАЗРАБОТКА (Недели 1-4, $0)

---

## ФАЗА 0: Setup и инфраструктура (2-3 дня)

### Цель
Настроить локальное окружение для разработки

### Задачи

**Setup проекта:**
- [ ] Создать GitHub репозиторий `missing-frame`
- [ ] Склонировать локально
- [ ] Запустить `setup.sh` (скачанный из Claude)
- [ ] Скопировать все файлы:
  - `schema.prisma` → `backend/prisma/schema.prisma`
  - `seed.ts` → `backend/prisma/seed.ts`
  - Все остальные конфиг файлы

**Локальная БД:**
- [ ] Установить Docker Desktop
- [ ] Запустить `docker-compose up -d` (PostgreSQL)
- [ ] Создать `backend/.env`:
  ```
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/missingframe"
  JWT_SECRET="local-dev-secret"
  PORT=3001
  FRONTEND_URL="http://localhost:3000"
  NODE_ENV="development"
  ```
- [ ] Создать `frontend/.env.local`:
  ```
  NEXT_PUBLIC_API_URL="http://localhost:3001"
  ```

**Применить миграции:**
- [ ] `cd backend && npx prisma migrate dev --name init`
- [ ] `npm run seed`
- [ ] Проверить через `npx prisma studio`

**Первый запуск:**
- [ ] Terminal 1: `cd backend && npm run start:dev`
- [ ] Terminal 2: `cd frontend && npm run dev`
- [ ] Открыть http://localhost:3000
- [ ] Увидеть дефолтную Next.js страницу

**Git setup:**
- [ ] `git add .`
- [ ] `git commit -m "Initial setup"`
- [ ] `git push origin main`

### Результат
✅ Локальное окружение работает
✅ БД создана с тестовыми данными
✅ Backend и Frontend запускаются
✅ Код в GitHub

### 📦 **ЧЕКПОИНТ** 
Можно сменить чат, если setup затянулся

---

## ФАЗА 1: Авторизация и безопасность (4-5 дней)

### Цель
Полностью рабочая авторизация с JWT, 2FA и сессиями

### Backend задачи

**Auth модуль:**
- [ ] Создать `src/modules/auth/` структуру
- [ ] AuthService с методами:
  - `login(email, password)` → JWT token
  - `validate2FA(userId, code)` → verified token
  - `refreshToken(refreshToken)` → new tokens
  - `logout(userId)` → invalidate session
- [ ] AuthController с endpoints:
  - `POST /auth/login`
  - `POST /auth/2fa/verify`
  - `POST /auth/2fa/enable`
  - `POST /auth/refresh`
  - `POST /auth/logout`

**JWT Strategy:**
- [ ] Установить `@nestjs/passport passport-jwt`
- [ ] Создать `JwtAuthGuard`
- [ ] Создать `RolesGuard` (для проверки ролей)
- [ ] Middleware для извлечения userId из токена

**2FA логика:**
- [ ] Установить `speakeasy` для TOTP
- [ ] Генерация QR-кода (опционально - можно позже)
- [ ] Сохранение `twoFactorSecret` в User
- [ ] Верификация кода

**Sessions:**
- [ ] Создать сессии при логине
- [ ] Хранить IP, User-Agent
- [ ] Auto-cleanup старых сессий (cronjob)

**Users модуль (базовый):**
- [ ] `GET /users/me` - текущий юзер
- [ ] `PATCH /users/me` - обновить профиль
- [ ] `PATCH /users/change-password` - смена пароля

### Frontend задачи

**Auth context:**
- [ ] Создать `contexts/AuthContext.tsx`
- [ ] Методы: login, logout, refreshToken
- [ ] Хранение JWT в localStorage (или httpOnly cookies)
- [ ] Auto-refresh токена

**Login страница:**
- [ ] Переписать `MF_Screen_01_Login_Final.jsx` в Next.js
- [ ] `app/(auth)/login/page.tsx`
- [ ] Форма с email/password
- [ ] Валидация через Zod
- [ ] API вызов `POST /auth/login`
- [ ] Redirect на 2FA или Dashboard

**2FA страница:**
- [ ] Переписать `MF_Screen_02_2FA.jsx`
- [ ] `app/(auth)/2fa/page.tsx`
- [ ] Ввод 6-значного кода
- [ ] API вызов `POST /auth/2fa/verify`
- [ ] Redirect на Dashboard после успеха

**Password Reset:**
- [ ] Переписать `MF_Screen_03_ChangePassword.jsx`
- [ ] `app/(auth)/reset-password/page.tsx`
- [ ] Форма смены пароля
- [ ] API вызов `PATCH /users/change-password`

**Protected routes:**
- [ ] Создать middleware для Next.js
- [ ] Проверка JWT перед рендером
- [ ] Redirect на /login если не авторизован

**API Client:**
- [ ] `lib/api.ts` с axios instance
- [ ] Автоматическая подстановка JWT
- [ ] Interceptor для refresh token
- [ ] Обработка 401 ошибок

### Тестирование

- [ ] Логин как admin@missingframe.ru
- [ ] Проверить JWT токен в localStorage/cookies
- [ ] Включить 2FA
- [ ] Разлогиниться и залогиниться с 2FA
- [ ] Сменить пароль
- [ ] Проверить защиту роутов (попытаться открыть /dashboard без логина)

### Git
- [ ] Commit после backend: `git commit -m "feat: auth backend module"`
- [ ] Commit после frontend: `git commit -m "feat: auth frontend pages"`
- [ ] Push в main

### Результат — ✅ ЗАВЕРШЕНО
✅ Авторизация JWT + refresh (access 15 мин, refresh 7 дней, ротация сессий)
✅ 2FA через TOTP (speakeasy): setup с QR-кодом, enable, verify
✅ Первый вход с принудительной сменой пароля (`mustReset`)
✅ Защищённые роуты (middleware по cookie `mf_access`)
✅ Cron-очистка истёкших сессий
✅ Users: `GET /users/me`, `PATCH /users/me`, `PATCH /users/change-password`

### 📦 Что реализовано — точное состояние (для нового чата)

**Backend модули:** `auth/`, `users/`, `prisma/`
**Эндпоинты auth:** `POST /auth/login`, `/auth/first-password`, `/auth/2fa/verify`,
`/auth/2fa/setup`, `/auth/2fa/enable`, `DELETE /auth/2fa`, `POST /auth/refresh`,
`/auth/logout`, `/auth/logout-all`, `GET /auth/sessions`

**Prisma модели:** `User` (role, status, mustReset, twoFactorEnabled/Secret, departmentId),
`Session`, `Department`. Энумы: `Role` (ADMIN/PRODUCTION_HEAD/DEPARTMENT_DIRECTOR/HR/PM/EMPLOYEE/INTERN), `UserStatus` (ACTIVE/DEACTIVATED).

**Frontend страницы:** `(auth)/login`, `(auth)/2fa`, `(auth)/reset-password` (2 режима:
обычная смена + `?mode=required` для первого входа), `(auth)/setup-2fa`, `(dashboard)/dashboard` (заглушка).
**Инфраструктура:** `contexts/AuthContext.tsx` (login/firstPassword/verify2FA/logout/auto-refresh),
`lib/api.ts` (axios + interceptors + tokenStorage), `middleware.ts`.

**Seed-юзеры:** admin@/Admin123!, head@/Head123!, pm@/Pm123456!, hr@/Hr1234567!,
employee@/Temp1234! (mustReset=true). Все @missingframe.ru.

**⚠️ ВАЖНО для Фазы 2:** dashboard сейчас заглушка. Реальный экран —
`MF_Screen_04_Dashboard_Responsive.jsx`. Использовать существующий `AuthContext`
(`useAuth()` даёт `user` с полями id/email/firstName/lastName/role/twoFactorEnabled/department).
Защищённые API-запросы делать через `import api from '@/lib/api'` — токен подставляется автоматически.

### 🔄 **СМЕНА ЧАТА #1**
**После завершения Фазы 1 - ОБЯЗАТЕЛЬНО новый чат**

Сообщение для нового чата:
```
Продолжаем Missing Frame. Завершена Фаза 1 (Авторизация) — полностью рабочая.
Следующая задача: Фаза 2 (Dashboard и навигация).

Стек: NestJS 11, Prisma 6, Next 14, React 18. Monorepo (backend/ + frontend/).
Уже есть: AuthContext (useAuth), lib/api.ts (axios с авто-токеном), middleware защиты роутов,
модули auth/ и users/ на бэке, Prisma модели User/Session/Department.

Прикрепляю roadmap v3 (читай блок «ТЕХНИЧЕСКИЕ ПРАВИЛА» в начале).
```

---

## ФАЗА 2: Dashboard и навигация (3-4 дня)

### Цель
Красивый dashboard с реальными данными и навигацией

### Backend задачи

**Dashboard endpoints:**
- [ ] `GET /dashboard/employee` - для обычных сотрудников:
  - Мои проекты (активные)
  - Мои задачи (по статусам)
  - Ближайшие дедлайны
  - Мои KPI (базовые)
- [ ] `GET /dashboard/manager` - для руководителей:
  - Проекты в риске
  - Перегруженные сотрудники
  - Просроченные задачи
  - Production Health Score (простая метрика)

**Statistics модуль:**
- [ ] Подсчет активных проектов
- [ ] Подсчет задач по статусам
- [ ] Расчет загруженности (capacity)
- [ ] Upcoming deadlines (ближайшие 7 дней)

### Frontend задачи

**Layout компоненты:**
- [ ] `components/layout/Sidebar.tsx` - боковое меню
- [ ] `components/layout/Header.tsx` - верхняя панель
- [ ] `components/layout/DashboardLayout.tsx` - обертка
- [ ] Навигация по разделам (Dashboard, Projects, Tasks, Calendar, etc.)

**Dashboard страница:**
- [ ] Переписать `MF_Screen_04_Dashboard_Responsive.jsx`
- [ ] `app/(dashboard)/dashboard/page.tsx`
- [ ] Карточки со статистикой (ProjectsCard, TasksCard, DeadlinesCard)
- [ ] Графики через Recharts:
  - Projects по статусам (pie chart)
  - Tasks timeline (bar chart)
  - Capacity utilization (line chart)
- [ ] Role-based рендеринг (разные виды для Employee/Manager)

**UI компоненты (shadcn):**
- [ ] Установить компоненты: `npx shadcn-ui add card badge avatar`
- [ ] Создать `components/ui/StatCard.tsx`
- [ ] Создать `components/charts/ProjectsPieChart.tsx`
- [ ] Создать `components/charts/TasksBarChart.tsx`

**Mobile responsiveness:**
- [ ] Сворачиваемое меню на мобилке
- [ ] Адаптивная сетка для карточек
- [ ] Скрытие sidebar на <768px

### Тестирование
- [ ] Открыть dashboard как Employee
- [ ] Открыть dashboard как Manager (сменить роль в БД)
- [ ] Проверить на мобилке (DevTools responsive mode)
- [ ] Убедиться что данные реальные (из БД)

### Git
- [ ] `git commit -m "feat: dashboard with stats"`
- [ ] `git push origin main`

### Результат
✅ Красивый dashboard
✅ Навигация работает
✅ Графики с реальными данными
✅ Responsive design

### 🔄 **СМЕНА ЧАТА #2**
**После Фазы 2 - новый чат**

Сообщение:
```
Missing Frame. Завершены Фазы 1-2 (Auth + Dashboard).
Следующая: Фаза 3 (Проекты).
Локальная разработка работает.
```

---

## ЭТАП 2: БЕСПЛАТНЫЙ ХОСТИНГ (Недели 5-6, $0)

### 🚀 Деплой на Render + Neon (перед Фазой 3)

**Зачем деплоить сейчас:**
- Фазы 0-2 готовы, можно показать команде
- Хочешь тестировать с телефона
- Проверить работу в production

**Setup (1-2 часа):**
- [ ] Зарегистрироваться на https://neon.tech
- [ ] Создать PostgreSQL проект
- [ ] Скопировать DATABASE_URL
- [ ] Зарегистрироваться на https://render.com
- [ ] Создать Web Service для backend
- [ ] Настроить env variables
- [ ] Зарегистрироваться на https://vercel.com
- [ ] Import GitHub repo для frontend
- [ ] Применить миграции на Neon: `DATABASE_URL="neon_url" npx prisma migrate deploy`
- [ ] Загрузить seed: `DATABASE_URL="neon_url" npm run seed`

**Проверка:**
- [ ] Открыть Vercel URL
- [ ] Логин (первый запрос = медленный, это нормально)
- [ ] Проверить dashboard

### 🔄 **СМЕНА ЧАТА #3**
**После деплоя на Render - новый чат**

Сообщение:
```
Missing Frame задеплоен на Render Free + Neon.
URL: [вставить].
Начинаем Фазу 3 (Проекты).
```

---

## ФАЗА 3: Проекты и Project Room (6-8 дней)

### Цель
Полноценное управление проектами с командой и рисками

### Backend задачи

**Projects модуль:**
- [ ] `POST /projects` - создать проект
- [ ] `GET /projects` - список с фильтрами (status, owner, department)
- [ ] `GET /projects/:id` - детали проекта
- [ ] `PATCH /projects/:id` - обновить
- [ ] `DELETE /projects/:id` - удалить (soft delete)

**Project Assignments:**
- [ ] `POST /projects/:id/assignments` - назначить человека
- [ ] `DELETE /projects/:id/assignments/:userId` - убрать
- [ ] `PATCH /projects/:id/assignments/:userId` - изменить роль/часы

**Departments связь:**
- [ ] `POST /projects/:id/departments` - связать с отделом
- [ ] Many-to-many через ProjectDepartment

**Fibonacci Risk Scoring (базовая версия):**
- [ ] Endpoint `POST /projects/:id/calculate-risk`
- [ ] Логика расчета risk score (1-21 по Fibonacci)
- [ ] Определение risk class: низкий/средний/высокий
- [ ] Рекомендация PM на основе компетенций

**Milestones:**
- [ ] CRUD для milestones
- [ ] `GET /projects/:id/milestones`
- [ ] `PATCH /milestones/:id/complete` - отметить выполненным

### Frontend задачи

**Projects List:**
- [ ] Переписать `MF_Screen_11_ProjectsList.jsx`
- [ ] `app/(dashboard)/projects/page.tsx`
- [ ] Таблица проектов (shadcn Table)
- [ ] Фильтры: статус, owner, department
- [ ] Поиск по названию
- [ ] Сортировка по дате/приоритету
- [ ] Кнопка "Create Project"

**Project Room:**
- [ ] Переписать `MF_Screen_06_ProjectRoom.jsx`
- [ ] `app/(dashboard)/projects/[id]/page.tsx`
- [ ] Tabs: Overview, Team, Tasks, Finance, Risks
- [ ] **Overview tab:**
  - Паспорт проекта (название, клиент, даты, бюджет)
  - Timeline с milestones
  - Risk score indicator
- [ ] **Team tab:**
  - Список участников с ролями
  - Кнопка "Add Team Member"
  - Allocated hours per person
- [ ] **Tasks tab:**
  - Список задач проекта (пока пустой, заполним в Фазе 4)
- [ ] **Finance tab:**
  - Budget vs Actual
  - Простая таблица доходов/расходов
- [ ] **Risks tab:**
  - Список рисков (заполним в Фазе 6)

**Project Create/Edit формы:**
- [ ] Multi-step wizard:
  - Step 1: Basic info (название, клиент, описание)
  - Step 2: Dates & Budget
  - Step 3: Team assignment
  - Step 4: Departments
- [ ] Validation через Zod
- [ ] API интеграция

**Team assignment UI:**
- [ ] Select для выбора пользователя
- [ ] Select для роли (PM, Producer, Team Member)
- [ ] Input для allocated hours
- [ ] Список назначенных (с кнопкой Remove)

### Тестирование
- [ ] Создать новый проект
- [ ] Назначить команду (себя как PM)
- [ ] Добавить milestones
- [ ] Открыть Project Room
- [ ] Проверить все табы
- [ ] Отредактировать проект
- [ ] Проверить фильтры в списке проектов

### Git
- [ ] `git commit -m "feat: projects module with assignments"`
- [ ] `git push origin main`
- [ ] Деплой на Render (автоматически)

### Результат
✅ CRUD проектов
✅ Project Room с табами
✅ Team assignments
✅ Risk scoring (базовый)

### 📦 **ЧЕКПОИНТ**
Фаза 3 большая, можно сменить чат в середине

### 🔄 **СМЕНА ЧАТА #4**
**После Фазы 3 - новый чат**

---

## ФАЗА 4: Задачи и Calendar (5-6 дней)

### Цель
Task management + календарь

### Backend задачи

**Tasks модуль:**
- [ ] CRUD для задач
- [ ] `POST /tasks` - создать
- [ ] `GET /tasks` - список с фильтрами (project, assignee, status)
- [ ] `PATCH /tasks/:id` - обновить (включая смену статуса)
- [ ] `DELETE /tasks/:id`
- [ ] Subtasks (parent-child relation)
- [ ] Time tracking (estimatedHours, actualHours)

**Calendar модуль:**
- [ ] CRUD для CalendarEvent
- [ ] `GET /calendar/events?start=&end=` - события за период
- [ ] Типы событий: Meeting, Deadline, Shoot, Milestone

**Google Calendar sync (опционально, можно пропустить):**
- [ ] Установить Google OAuth
- [ ] Read-only sync
- [ ] Webhook для обновлений
- **ИЛИ** пропустить пока, добавить позже

### Frontend задачи

**Tasks страница:**
- [ ] Переписать `MF_Screen_07_Tasks.jsx`
- [ ] `app/(dashboard)/tasks/page.tsx`
- [ ] **Kanban board:**
  - Колонки: TODO, In Progress, Review, Done
  - Drag-and-drop (dnd-kit)
  - Карточки задач
- [ ] **List view** (альтернатива)
- [ ] Фильтры: по проекту, assignee, status
- [ ] Create Task форма

**Task detail modal:**
- [ ] Title, description
- [ ] Status, priority
- [ ] Assignee select
- [ ] Due date picker
- [ ] Estimated/Actual hours
- [ ] Subtasks (опционально)

**Calendar страница:**
- [ ] Переписать `MF_Screen_09_Calendar.jsx`
- [ ] `app/(dashboard)/calendar/page.tsx`
- [ ] Использовать библиотеку (react-big-calendar или fullcalendar)
- [ ] Month/Week/Day views
- [ ] Показывать события, дедлайны, встречи
- [ ] Кнопка "Create Event"

**Интеграция Tasks в Project Room:**
- [ ] В Project Room → Tasks tab показать задачи проекта
- [ ] Кнопка "Create Task for this Project"

### Тестирование
- [ ] Создать задачи для проекта
- [ ] Перетащить задачу между колонками
- [ ] Назначить задачу на себя
- [ ] Открыть календарь
- [ ] Создать событие
- [ ] Проверить дедлайны задач на календаре

### Git
- [ ] `git commit -m "feat: tasks and calendar modules"`
- [ ] `git push`

### Результат
✅ Kanban board
✅ Task management
✅ Calendar с событиями

### 🔄 **СМЕНА ЧАТА #5**
**После Фазы 4 - новый чат**

Сообщение:
```
Missing Frame на Render.
Завершены Фазы 1-4 (Auth, Dashboard, Projects, Tasks, Calendar).
Готов к переходу на Railway и Фазе 5 (Team & HR).
```

---

## ЭТАП 3: ПЕРЕХОД НА RAILWAY (Неделя 7, $15-20/мес)

### 🚀 Миграция на Railway (1 день)

**Зачем переходить:**
- Render засыпает (50 сек холодный старт)
- Нужна стабильность для Фаз 5+
- WebSocket понадобится в Фазе 8

**Миграция:**
- [ ] Зарегистрироваться на https://railway.app
- [ ] Создать проект
- [ ] Add PostgreSQL (Hobby)
- [ ] Add Service → GitHub → `/backend`
- [ ] Настроить env variables
- [ ] Экспорт данных из Neon: `pg_dump "neon_url" > backup.sql`
- [ ] Импорт в Railway: `psql "railway_url" < backup.sql`
- [ ] Обновить Vercel env: `NEXT_PUBLIC_API_URL`
- [ ] Тест

### Результат
✅ Быстрый backend на Railway
✅ Данные мигрированы

### 🔄 **СМЕНА ЧАТА #6**
**После миграции - новый чат**

---

## ФАЗА 5: Team, HR и Competency Matrix (5-6 дней)

### Цель
Управление сотрудниками, компетенциями, грейдами

### Backend задачи

**EmployeeCard модуль:**
- [ ] CRUD для employee cards
- [ ] `GET /employees` - список с фильтрами (department, grade)
- [ ] `GET /employees/:id` - профиль
- [ ] `PATCH /employees/:id` - обновить

**Competencies:**
- [ ] CRUD для competencies
- [ ] `POST /employees/:id/competencies` - добавить компетенцию
- [ ] `PATCH /competencies/:id` - обновить level (1-5)
- [ ] Верификация компетенций (verifiedBy)

**Reviews модуль:**
- [ ] CRUD для reviews
- [ ] Ratings: technicalSkills, communication, teamwork, productivity
- [ ] Aggregation (средний рейтинг)

**KPI модуль:**
- [ ] CRUD для KPIRecord
- [ ] Metrics: выручка, проектов завершено, качество
- [ ] Period-based queries (по месяцам/кварталам)

### Frontend задачи

**Team страница:**
- [ ] Переписать `MF_Screen_08_Team.jsx`
- [ ] `app/(dashboard)/team/page.tsx`
- [ ] Таблица сотрудников
- [ ] Фильтры: department, grade, role
- [ ] Поиск по имени

**Employee Profile:**
- [ ] Переписать `MF_Screen_12_EmployeeProfile.jsx`
- [ ] `app/(dashboard)/team/[id]/page.tsx`
- [ ] Tabs: Info, Competencies, Projects, Reviews, KPI
- [ ] Редактирование профиля (только для админов/HR)

**Competency Matrix:**
- [ ] Переписать `MF_Screen_13_CompetencyMatrix.jsx`
- [ ] `app/(dashboard)/competencies/page.tsx`
- [ ] Heatmap всех компетенций (recharts)
- [ ] Фильтры по skills, departments
- [ ] Export в CSV (опционально)

**HR Center:**
- [ ] Переписать `MF_Screen_14_HRCenter.jsx`
- [ ] `app/(dashboard)/hr/page.tsx`
- [ ] Onboarding pipeline (новые сотрудники)
- [ ] Reviews management
- [ ] Grading overview

### Тестирование
- [ ] Создать employee card
- [ ] Добавить компетенции
- [ ] Оставить review
- [ ] Проверить competency matrix
- [ ] Открыть HR center

### Git
- [ ] `git commit -m "feat: HR and competencies modules"`
- [ ] `git push`

### Результат
✅ Team management
✅ Competency matrix
✅ HR workflows

### 🔄 **СМЕНА ЧАТА #7**

---

## ФАЗА 6: Meetings, Decisions, Risks (4-5 дней)

### Backend
- [ ] Meetings CRUD
- [ ] Decisions CRUD
- [ ] Risks CRUD + risk matrix

### Frontend
- [ ] `MF_Screen_15_Meetings.jsx` → `/meetings`
- [ ] `MF_Screen_17_DecisionLog.jsx` → `/decisions`
- [ ] `MF_Screen_18_RiskRegister.jsx` → `/risks`

### 🔄 **СМЕНА ЧАТА #8**

---

## ФАЗА 7: Finance и Analytics (4-5 дней)

### Backend
- [ ] Finance модуль
- [ ] Analytics endpoints

### Frontend
- [ ] `MF_Screen_16_MoneyKPI.jsx` → `/finance`

### 🔄 **СМЕНА ЧАТА #9**

---

## ФАЗА 8: Real-time, Admin, Polish (5-6 дней)

### Backend
- [ ] Socket.io
- [ ] Audit logs
- [ ] Telegram bot

### Frontend
- [ ] `MF_Screen_10_AdminPanel.jsx` → `/admin`
- [ ] Real-time notifications
- [ ] Polish

### 🔄 **СМЕНА ЧАТА #10** - Финальный

---

## 📋 Чек-лист смены чатов

### Перед сменой чата:
- [ ] Завершить все задачи фазы
- [ ] Сделать commit & push
- [ ] Протестировать функционал
- [ ] Записать что сделано, что осталось

### В новом чате отправь:
```
Missing Frame - Продолжение разработки

Завершено:
- Фаза X: [название]
- Функционал: [список]

Текущий стек:
- Backend: http://localhost:3001 (или Railway URL)
- Frontend: http://localhost:3000 (или Vercel URL)
- БД: PostgreSQL (локально/Neon/Railway)

Следующая задача:
- Фаза Y: [название]

Прикрепляю roadmap.
```

### Файлы для сохранения между чатами:
- `roadmap.md` (этот файл)
- `schema.prisma` (если менялась)
- Текущие env variables
- Список завершенных задач

---

## 🎯 Критичные моменты

1. **Не пропускай смену чата** после завершенной фазы - контекст раздуется
2. **Всегда коммить код** перед сменой чата
3. **Сохраняй важные файлы** из предыдущего чата
4. **В новом чате четко пиши** что завершено и что дальше
5. **Прикрепляй roadmap** в каждый новый чат

---

## Итоговый timeline

| Неделя | Фазы | Хостинг | Смена чата |
|--------|------|---------|------------|
| 1-2 | 0-1 | Локально | #1, #2 |
| 3-4 | 2-3 | Локально → Render | #3 |
| 5-6 | 3-4 | Render | #4, #5 |
| 7 | Миграция + 5 | Railway | #6 |
| 8 | 6-7 | Railway | #7, #8 |
| 9 | 8 | Railway | #9, #10 |

**Итого: ~9 недель, 10 смен чатов**

Готов начинать?
