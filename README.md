# YouTube Automation Course Platform

Fullstack course platform for selling and delivering a YouTube Automation course. Built with React 19, Tailwind CSS v4, Node.js, Express, PostgreSQL, Prisma, Paystack, and Cloudinary.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS v4, Vite, React Router v7, TanStack Query, Zustand |
| Backend | Node.js, Express, Prisma ORM, PostgreSQL |
| Payments | Paystack |
| File/Video Storage | Cloudinary |
| Email | Resend |
| Auth | JWT (access + refresh tokens) |

---

## Features

### Student Side
- Landing page with curriculum preview, pricing, FAQ
- Account creation with optional coupon code
- Secure login with JWT
- Paystack payment integration
- Course dashboard with progress tracking
- Sequential lesson unlocking (complete previous to unlock next)
- Video player with progress tracking (auto-save every 10s)
- Lesson resources (downloadable files)
- Assignments with submission and grading
- Community forum with categories
- Notifications (new lessons, assignment reminders, replies)
- Inactivity warnings (Day 3, Day 5) and auto-pause (Day 7)
- Settings (profile, password, notification prefs)

### Admin Side
- Dashboard with stats (students, revenue, completion rate)
- Student management (view, search, pause/reactivate)
- Course builder (create modules, lessons, upload videos)
- Coupon manager (create, edit, delete, toggle, usage tracking)
- Assignment grading with feedback
- Community moderation
- Broadcast notifications to all students
- Lesson release scheduling

---

## Project Structure

youtube-automation-course/
├── backend/
│   ├── config/
│   │   ├── database.js      # Prisma client
│   │   └── cloudinary.js    # Cloudinary upload/delete
│   ├── middleware/
│   │   ├── auth.js          # JWT auth, role checks
│   │   └── upload.js        # Multer file handlers
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── courses.js
│   │   ├── lessons.js
│   │   ├── progress.js
│   │   ├── assignments.js
│   │   ├── submissions.js
│   │   ├── coupons.js
│   │   ├── payments.js
│   │   ├── community.js
│   │   ├── notifications.js
│   │   ├── admin.js
│   │   └── upload.js
│   ├── utils/
│   │   └── auth.js          # bcrypt, JWT helpers
│   ├── jobs/
│   │   └── accountability.js # Cron job for inactivity
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js    # All API calls
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── AdminRoute.jsx
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   └── TopBar.jsx
│   │   │   └── layouts/
│   │   │       ├── MainLayout.jsx
│   │   │       ├── DashboardLayout.jsx
│   │   │       └── AdminLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CoursePage.jsx
│   │   │   │   ├── LessonPage.jsx
│   │   │   │   ├── AssignmentsPage.jsx
│   │   │   │   ├── CommunityPage.jsx
│   │   │   │   ├── CommunityPost.jsx
│   │   │   │   └── SettingsPage.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Students.jsx
│   │   │   │   ├── Courses.jsx
│   │   │   │   ├── Coupons.jsx
│   │   │   │   ├── Submissions.jsx
│   │   │   │   └── Community.jsx
│   │   │   └── payment/
│   │   │       ├── PaymentPage.jsx
│   │   │       └── PaymentSuccess.jsx
│   │   ├── store/
│   │   │   └── authStore.js   # Zustand auth state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json


---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Paystack account (test keys for dev)
- Cloudinary account
- Bravo account (for emails)

