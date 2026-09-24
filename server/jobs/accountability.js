import cron from 'node-cron';
import prisma from '../config/database.js';

// Run every day at 9:00 AM
const accountabilityJob = cron.schedule('0 9 * * *', async () => {
  console.log('🏃 Running accountability check...');
  const now = new Date();

  try {
    // Day 3 warning - inactive students
    const day3Inactive = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        lastActiveAt: {
          gte: new Date(now - 5 * 24 * 60 * 60 * 1000),
          lt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const student of day3Inactive) {
      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'INACTIVITY_WARNING',
          title: 'We Miss You! ⚠️',
          body: 'You haven\'t been active for 3 days. Complete your next lesson to stay on track with your YouTube Automation journey.',
        },
      });
      console.log(`📧 Sent day-3 warning to ${student.email}`);
    }

    // Day 5 warning - final warning
    const day5Inactive = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        lastActiveAt: {
          gte: new Date(now - 7 * 24 * 60 * 60 * 1000),
          lt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const student of day5Inactive) {
      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'FINAL_WARNING',
          title: 'Final Warning 🚨',
          body: 'Your account will be paused if you remain inactive. Complete a lesson or assignment within 2 days to keep your access.',
        },
      });
      console.log(`🚨 Sent day-5 final warning to ${student.email}`);
    }

    // Day 7 - auto-pause accounts
    const day7Inactive = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        lastActiveAt: {
          lt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const student of day7Inactive) {
      await prisma.user.update({
        where: { id: student.id },
        data: { isActive: false },
      });

      await prisma.enrollment.updateMany({
        where: { userId: student.id },
        data: { status: 'PAUSED' },
      });

      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'ACCESS_PAUSED',
          title: 'Account Access Paused',
          body: 'Your account has been paused due to inactivity. Contact support to reactivate your access.',
        },
      });
      console.log(`⏸️ Paused account for ${student.email}`);
    }

    // Assignment due reminders (due in 24 hours)
    const dueSoon = await prisma.submission.findMany({
      where: {
        status: 'PENDING',
        submittedAt: {
          lt: new Date(now - 6 * 24 * 60 * 60 * 1000), // submitted 6 days ago (due in 1 day if 7-day due)
        },
      },
      include: {
        assignment: true,
        user: true,
      },
    });

    for (const submission of dueSoon) {
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          type: 'ASSIGNMENT_DUE',
          title: 'Assignment Due Soon ⏰',
          body: `Your submission for "${submission.assignment.title}" is due within 24 hours.`,
        },
      });
    }

    console.log('✅ Accountability check complete');
  } catch (error) {
    console.error('❌ Accountability job error:', error);
  }
});

// Start the job (only in production, disable in development if needed)
const startAccountabilityJob = () => {
  if (process.env.NODE_ENV !== 'test') {
    accountabilityJob.start();
    console.log('⏰ Accountability cron job scheduled (daily at 9:00 AM)');
  }
};

export { startAccountabilityJob, accountabilityJob };