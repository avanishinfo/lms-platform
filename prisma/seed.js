const { PrismaClient, CourseLevel, LearnerStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@arifac.com' },
    update: {},
    create: {
      name: 'ARIFAC Admin',
      email: 'admin@arifac.com',
      phone: '+91-9000000000',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  const learnerPassword = await bcrypt.hash('learner123', 10);
  const learnerUser = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91-9876543210',
      password: learnerPassword,
      role: 'LEARNER',
      learner: {
        create: {
          status: 'REGISTERED',
        },
      },
    },
  });
  console.log('✅ Sample learner created:', learnerUser.email);

  const courses = [
    { name: 'Foundation in Regulatory Affairs', description: 'Entry-level ra course.', level: 'L1', price: 4999, duration: 20 },
    { name: 'Regulatory Affairs Professional', description: 'Intermediate ra course.', level: 'L2', price: 9999, duration: 40 },
    { name: 'Advanced Regulatory Specialist', description: 'Advanced ra course.', level: 'L3', price: 14999, duration: 60 },
    { name: 'Regulatory Affairs Manager', description: 'Leadership ra course.', level: 'L4', price: 19999, duration: 80 },
    { name: 'Regulatory Affairs Expert', description: 'Expert ra course.', level: 'L5', price: 24999, duration: 100 },
  ];

  for (const c of courses) {
    await prisma.course.upsert({
      where: { id: c.level },
      update: c,
      create: { id: c.level, ...c },
    });
    console.log(`✅ Course created: ${c.name}`);
  }

  console.log('✅ Database seeded!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
