// backend/prisma/seed.ts
// Seed script для создания начальных данных

import { PrismaClient, UserRole, UserStatus, Grade, EmploymentType, ProjectStatus, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Очистка существующих данных (ОСТОРОЖНО!)
  // Раскомментируй если нужно полностью пересоздать БД
  // await prisma.auditLog.deleteMany();
  // await prisma.notification.deleteMany();
  // await prisma.task.deleteMany();
  // await prisma.projectAssignment.deleteMany();
  // await prisma.project.deleteMany();
  // await prisma.competency.deleteMany();
  // await prisma.employeeCard.deleteMany();
  // await prisma.session.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.department.deleteMany();

  // 1. Создать отделы
  console.log('📁 Creating departments...');
  
  const production = await prisma.department.upsert({
    where: { name: 'Production' },
    update: {},
    create: {
      name: 'Production',
      description: 'Производство видеоконтента',
    },
  });

  const creative = await prisma.department.upsert({
    where: { name: 'Creative' },
    update: {},
    create: {
      name: 'Creative',
      description: 'Креативный отдел',
    },
  });

  const tech = await prisma.department.upsert({
    where: { name: 'Tech' },
    update: {},
    create: {
      name: 'Tech',
      description: 'Технический отдел',
    },
  });

  // 2. Создать super-admin
  console.log('👤 Creating super admin...');
  
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@missingframe.ru' },
    update: {},
    create: {
      email: 'admin@missingframe.ru',
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Super',
      lastName: 'Admin',
      mustChangePassword: false,
      twoFactorEnabled: false,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 3. Создать тестовых пользователей
  console.log('👥 Creating test users...');

  const pmPassword = await bcrypt.hash('PM123!', 10);
  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@missingframe.ru' },
    update: {},
    create: {
      email: 'pm@missingframe.ru',
      passwordHash: pmPassword,
      role: UserRole.PM,
      status: UserStatus.ACTIVE,
      firstName: 'Иван',
      lastName: 'Петров',
      mustChangePassword: false,
      twoFactorEnabled: false,
      employeeCard: {
        create: {
          departmentId: production.id,
          position: 'Project Manager',
          grade: Grade.SENIOR,
          employmentType: EmploymentType.FULL_TIME,
          hireDate: new Date('2023-01-15'),
          weeklyCapacity: 40,
          salary: 150000,
          competencies: {
            create: [
              { skill: 'Project Management', level: 5 },
              { skill: 'Team Leadership', level: 4 },
              { skill: 'Risk Management', level: 4 },
            ],
          },
        },
      },
    },
  });

  const producerPassword = await bcrypt.hash('Producer123!', 10);
  const producerUser = await prisma.user.upsert({
    where: { email: 'producer@missingframe.ru' },
    update: {},
    create: {
      email: 'producer@missingframe.ru',
      passwordHash: producerPassword,
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
      firstName: 'Мария',
      lastName: 'Сидорова',
      mustChangePassword: false,
      twoFactorEnabled: false,
      employeeCard: {
        create: {
          departmentId: production.id,
          position: 'Producer',
          grade: Grade.MIDDLE,
          employmentType: EmploymentType.FULL_TIME,
          hireDate: new Date('2023-03-01'),
          weeklyCapacity: 40,
          salary: 120000,
          competencies: {
            create: [
              { skill: 'Production Management', level: 4 },
              { skill: 'Budget Planning', level: 3 },
              { skill: 'Client Communication', level: 5 },
            ],
          },
        },
      },
    },
  });

  const employeePassword = await bcrypt.hash('Employee123!', 10);
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@missingframe.ru' },
    update: {},
    create: {
      email: 'employee@missingframe.ru',
      passwordHash: employeePassword,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      firstName: 'Алексей',
      lastName: 'Иванов',
      mustChangePassword: false,
      twoFactorEnabled: false,
      employeeCard: {
        create: {
          departmentId: creative.id,
          position: 'Video Editor',
          grade: Grade.MIDDLE,
          employmentType: EmploymentType.FULL_TIME,
          hireDate: new Date('2023-06-01'),
          weeklyCapacity: 40,
          salary: 100000,
          competencies: {
            create: [
              { skill: 'Adobe Premiere Pro', level: 5 },
              { skill: 'After Effects', level: 4 },
              { skill: 'Color Grading', level: 3 },
            ],
          },
        },
      },
    },
  });

  console.log(`✅ Created ${3} test users`);

  // 4. Создать тестовый проект
  console.log('📦 Creating test project...');

  const testProject = await prisma.project.create({
    data: {
      name: 'Рекламный ролик для Brand X',
      description: 'Производство 30-секундного рекламного ролика',
      client: 'Brand X Inc.',
      status: ProjectStatus.IN_PROGRESS,
      createdById: superAdmin.id,
      ownerId: pmUser.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-28'),
      budgetPlanned: 500000,
      departments: {
        create: [
          { departmentId: production.id },
          { departmentId: creative.id },
        ],
      },
      assignments: {
        create: [
          {
            userId: pmUser.id,
            role: 'PM',
            allocatedHours: 80,
          },
          {
            userId: producerUser.id,
            role: 'PRODUCER',
            allocatedHours: 120,
          },
          {
            userId: employeeUser.id,
            role: 'TEAM_MEMBER',
            allocatedHours: 160,
          },
        ],
      },
      milestones: {
        create: [
          {
            title: 'Pre-production завершен',
            dueDate: new Date('2024-01-25'),
            status: 'completed',
            completedAt: new Date('2024-01-24'),
          },
          {
            title: 'Съемка завершена',
            dueDate: new Date('2024-02-10'),
            status: 'pending',
          },
          {
            title: 'Финальная версия готова',
            dueDate: new Date('2024-02-25'),
            status: 'pending',
          },
        ],
      },
    },
  });

  console.log(`✅ Created project: ${testProject.name}`);

  // 5. Создать задачи
  console.log('✅ Creating tasks...');

  const task1 = await prisma.task.create({
    data: {
      title: 'Написать сценарий',
      description: 'Подготовить финальную версию сценария',
      status: TaskStatus.DONE,
      priority: 'HIGH',
      projectId: testProject.id,
      assignedToId: producerUser.id,
      dueDate: new Date('2024-01-20'),
      completedAt: new Date('2024-01-19'),
      estimatedHours: 16,
      actualHours: 14,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Провести съемку',
      description: 'Съемочный день в студии',
      status: TaskStatus.IN_PROGRESS,
      priority: 'URGENT',
      projectId: testProject.id,
      assignedToId: producerUser.id,
      dueDate: new Date('2024-02-08'),
      estimatedHours: 24,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Монтаж ролика',
      description: 'Финальный монтаж с цветокоррекцией',
      status: TaskStatus.TODO,
      priority: 'HIGH',
      projectId: testProject.id,
      assignedToId: employeeUser.id,
      dueDate: new Date('2024-02-20'),
      estimatedHours: 40,
    },
  });

  console.log(`✅ Created ${3} tasks`);

  // 6. Создать риски
  console.log('⚠️  Creating risks...');

  await prisma.risk.create({
    data: {
      title: 'Задержка с утверждением сценария',
      description: 'Клиент может не утвердить сценарий с первого раза',
      level: 'MEDIUM',
      status: 'MITIGATED',
      probability: 60,
      impact: 70,
      mitigation: 'Подготовить 2 альтернативных варианта сценария',
      projectId: testProject.id,
      identifiedBy: pmUser.id,
    },
  });

  await prisma.risk.create({
    data: {
      title: 'Погодные условия для съемки',
      description: 'Плохая погода может сорвать outdoor съемку',
      level: 'HIGH',
      status: 'MONITORING',
      probability: 40,
      impact: 90,
      mitigation: 'Забронировать студию как backup',
      projectId: testProject.id,
      identifiedBy: producerUser.id,
    },
  });

  console.log(`✅ Created ${2} risks`);

  // 7. Создать финансовые записи
  console.log('💰 Creating finance records...');

  await prisma.finance.createMany({
    data: [
      {
        projectId: testProject.id,
        category: 'доход',
        amount: 500000,
        description: 'Оплата от клиента',
        date: new Date('2024-01-10'),
      },
      {
        projectId: testProject.id,
        category: 'расход',
        amount: 80000,
        description: 'Аренда студии',
        date: new Date('2024-01-15'),
      },
      {
        projectId: testProject.id,
        category: 'расход',
        amount: 120000,
        description: 'Зарплата команды',
        date: new Date('2024-01-31'),
      },
    ],
  });

  console.log(`✅ Created finance records`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('');
  console.log('Super Admin:');
  console.log('  Email: admin@missingframe.ru');
  console.log('  Password: Admin123!');
  console.log('');
  console.log('Project Manager:');
  console.log('  Email: pm@missingframe.ru');
  console.log('  Password: PM123!');
  console.log('');
  console.log('Producer:');
  console.log('  Email: producer@missingframe.ru');
  console.log('  Password: Producer123!');
  console.log('');
  console.log('Employee:');
  console.log('  Email: employee@missingframe.ru');
  console.log('  Password: Employee123!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
