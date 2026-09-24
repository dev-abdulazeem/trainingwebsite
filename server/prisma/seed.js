import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@youtubeautomation.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@youtubeautomation.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create demo student
  const studentPassword = await hashPassword('student123');
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'Demo Student',
      email: 'student@example.com',
      password: studentPassword,
      role: 'STUDENT',
    },
  });
  console.log('✅ Student created:', student.email);

  // Create YouTube Automation Course
  const course = await prisma.course.upsert({
    where: { slug: 'youtube-automation-masterclass' },
    update: {},
    create: {
      title: 'YouTube Automation Masterclass',
      slug: 'youtube-automation-masterclass',
      description: 'Learn YouTube Automation from start to finish. Master niche research, content creation, AI tools, voiceovers, video editing, thumbnails, SEO, monetization, analytics, and scaling.',
      price: 15000.00,
      status: 'PUBLISHED',
    },
  });
  console.log('✅ Course created:', course.title);

  // Create Modules
  const modules = [
    { title: 'Foundation', sortOrder: 0 },
    { title: 'Finding Your Niche', sortOrder: 1 },
    { title: 'Content Research', sortOrder: 2 },
    { title: 'Scripting with AI', sortOrder: 3 },
    { title: 'Voiceovers', sortOrder: 4 },
    { title: 'Video Editing', sortOrder: 5 },
    { title: 'Thumbnails', sortOrder: 6 },
    { title: 'SEO & Optimization', sortOrder: 7 },
    { title: 'Monetization', sortOrder: 8 },
    { title: 'Analytics & Scaling', sortOrder: 9 },
  ];

  for (const mod of modules) {
    const createdModule = await prisma.module.upsert({
      where: {
        id: `${course.id}-${mod.sortOrder}`, // temporary unique key
      },
      update: {},
      create: {
        courseId: course.id,
        title: mod.title,
        sortOrder: mod.sortOrder,
      },
    });
    console.log(`✅ Module created: ${createdModule.title}`);

    // Create sample lessons for each module
    const lessons = [
      {
        title: `${mod.title} - Introduction`,
        description: `Welcome to the ${mod.title} module.`,
        duration: 600,
        sortOrder: 0,
      },
      {
        title: `${mod.title} - Core Concepts`,
        description: `Learn the core concepts of ${mod.title.toLowerCase()}.`,
        duration: 1200,
        sortOrder: 1,
      },
      {
        title: `${mod.title} - Practical Application`,
        description: `Apply what you've learned in ${mod.title.toLowerCase()}.`,
        duration: 1800,
        sortOrder: 2,
      },
    ];

    for (const lesson of lessons) {
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          sortOrder: lesson.sortOrder,
          isPublished: mod.sortOrder === 0, // Only publish first module initially
        },
      });
    }
    console.log(`  ✅ ${lessons.length} lessons created for ${mod.title}`);
  }

  // Create sample coupon
  const coupon = await prisma.coupon.upsert({
    where: { code: 'FIRST20' },
    update: {},
    create: {
      code: 'FIRST20',
      discountType: 'FIXED',
      discountValue: 11000.00,
      maxUses: 20,
      isActive: true,
    },
  });
  console.log('✅ Coupon created:', coupon.code);

  // Create enrollment for demo student
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Enrollment created for demo student');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });