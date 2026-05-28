# Missing Frame - START HERE 🚀

## Ты здесь впервые? Читай это.

---

## 📦 Что у тебя должно быть

Скачай эти файлы из предыдущего чата:

1. ✅ **roadmap-v2-with-chat-switches.md** - главный план (ЭТО ВАЖНО!)
2. ✅ **schema.prisma** - схема БД
3. ✅ **seed.ts** - тестовые данные
4. ✅ **setup.sh** - автоустановка
5. ✅ **free-tier-checklist.md** - чеклист бесплатного хостинга
6. ✅ **chat-switching-guide.md** - как менять чаты

---

## 🎯 Твой план на сегодня (Фаза 0)

### Цель: Настроить локальное окружение

**Время: 2-3 часа**

### Шаг 1: Создай репозиторий (5 минут)

```bash
# На GitHub
Создай новый репо: missing-frame

# Локально
mkdir missing-frame
cd missing-frame
git init
git remote add origin https://github.com/YOUR_USERNAME/missing-frame.git
```

### Шаг 2: Запусти setup.sh (30 минут)

```bash
# Скопируй setup.sh в папку missing-frame
chmod +x setup.sh
./setup.sh

# Скрипт создаст:
# - /backend (NestJS)
# - /frontend (Next.js)
# - docker-compose.yml
# - Установит все зависимости
```

### Шаг 3: Скопируй файлы (5 минут)

```bash
# Скопируй из скачанных файлов:
cp schema.prisma backend/prisma/schema.prisma
cp seed.ts backend/prisma/seed.ts

# Создай .env файлы
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Шаг 4: Запусти БД (10 минут)

```bash
# Установи Docker Desktop (если нет)
# https://www.docker.com/products/docker-desktop

# Запусти PostgreSQL
docker-compose up -d

# Проверь что работает
docker ps
# Должен показать postgres контейнер
```

### Шаг 5: Примени миграции (15 минут)

```bash
cd backend

# Применить схему БД
npx prisma migrate dev --name init

# Загрузить тестовые данные
npm run seed

# Проверить через Prisma Studio
npx prisma studio
# Откроется http://localhost:5555
# Должны быть таблицы и 4 юзера
```

### Шаг 6: Первый запуск (10 минут)

```bash
# Terminal 1: Backend
cd backend
npm run start:dev
# Должен запуститься на http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# Должен запуститься на http://localhost:3000

# Открой браузер
http://localhost:3000
# Должна показаться дефолтная Next.js страница
```

### Шаг 7: Первый commit (5 минут)

```bash
git add .
git commit -m "Initial setup - Фаза 0 завершена"
git push origin main
```

---

## ✅ Проверка что всё работает

- [ ] Docker PostgreSQL запущен (`docker ps`)
- [ ] Backend отвечает: http://localhost:3001
- [ ] Frontend отвечает: http://localhost:3000
- [ ] Prisma Studio открывается: http://localhost:5555
- [ ] В БД есть таблицы users, projects, tasks и т.д.
- [ ] Есть 4 тестовых юзера (admin, pm, producer, employee)
- [ ] Код в GitHub

---

## 🔄 После завершения Фазы 0

**Когда всё работает - СМЕНИ ЧАТ!**

### Начни новый чат с этим сообщением:

```
Missing Frame - Фаза 1: Авторизация

=== СТАТУС ===
Завершено:
- Фаза 0: Setup ✅
  - Репо создан
  - Backend + Frontend запущены
  - БД настроена
  - Seed данные загружены

=== ОКРУЖЕНИЕ ===
Backend: http://localhost:3001
Frontend: http://localhost:3000
БД: Docker PostgreSQL

=== СЛЕДУЮЩАЯ ЗАДАЧА ===
Фаза 1: Авторизация
- Нужно создать Auth модуль в NestJS
- JWT + 2FA
- Login/2FA/Reset страницы

Прикрепляю roadmap.
```

**Прикрепи файл:** `roadmap-v2-with-chat-switches.md`

---

## 🚨 Частые проблемы

### "Docker не запускается"
- Установи Docker Desktop
- macOS: `brew install --cask docker`
- Windows: скачай с docker.com

### "npm install падает с ошибкой"
- Обнови Node.js до 18+: `node -v`
- Очисти кэш: `npm cache clean --force`

### "Prisma migrate выдает ошибку"
- Проверь что PostgreSQL запущен: `docker ps`
- Проверь DATABASE_URL в .env
- Убедись что порт 5432 свободен

### "Backend не стартует"
- Проверь что PostgreSQL доступен
- Проверь .env файл
- Посмотри ошибки в консоли

---

## 📚 Полезные команды

```bash
# Остановить БД
docker-compose down

# Запустить БД
docker-compose up -d

# Посмотреть БД через Prisma Studio
cd backend && npx prisma studio

# Пересоздать БД (ОСТОРОЖНО - удалит данные)
cd backend
npx prisma migrate reset
npm run seed

# Проверить статус Git
git status

# Посмотреть логи Docker
docker-compose logs postgres
```

---

## 🎯 Твоя цель на первый день

**К концу дня должно быть:**

1. ✅ Репозиторий на GitHub
2. ✅ Локальное окружение работает
3. ✅ БД настроена с тестовыми данными
4. ✅ Backend + Frontend запускаются
5. ✅ Первый commit сделан
6. ✅ Roadmap скачан и изучен
7. ✅ Готов к Фазе 1

**Когда всё готово - начинай новый чат для Фазы 1.**

---

## 💡 Советы

1. **Не спеши** - setup важен, потрать на него время
2. **Проверяй каждый шаг** - не переходи дальше пока не работает
3. **Сохраняй все файлы** - roadmap, схема, seed
4. **Делай коммиты** - после каждого шага
5. **Читай roadmap** - там всё расписано

---

## 📞 Нужна помощь?

Если застрял - начни чат с:

```
Missing Frame - Помощь с Setup (Фаза 0)

Проблема: [опиши что не работает]

Что сделал:
- [список шагов]

Ошибка:
[скопируй текст ошибки]
```

Я помогу разобраться.

---

**Готов начинать? Скачай файлы и запусти setup.sh!**
