<div align="center">

# YouTube Automation Course Platform

**A fullstack platform for selling and delivering a YouTube Automation course.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)]()
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)]()
[![Paystack](https://img.shields.io/badge/Paystack-Payments-00C3F7)]()

</div>

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, Vite, React Router v7, TanStack Query, Zustand |
| **Backend** | Node.js, Express, Prisma ORM, PostgreSQL |
| **Payments** | Paystack |
| **Storage** | Cloudinary |
| **Email** | Resend |
| **Auth** | JWT (access + refresh tokens) |

---

## Features

### Student Experience

| Feature | Description |
| :--- | :--- |
| **Landing Page** | Curriculum preview, pricing tiers, and FAQ. |
| **Authentication** | Account creation with optional coupon code and secure JWT login. |
| **Payments** | Seamless Paystack checkout with success callback. |
| **Dashboard** | Course progress tracking at a glance. |
| **Lesson Unlocking** | Sequential progression (complete a lesson to unlock the next). |
| **Video Player** | Custom player that auto-saves progress every 10 seconds. |
| **Resources** | Downloadable files attached to each lesson. |
| **Assignments** | Submit work and receive graded feedback from instructors. |
| **Community Forum** | Categorized discussions with fellow students. |
| **Notifications** | Alerts for new lessons, assignment reminders, and replies. |
| **Inactivity System** | Warnings on Day 3 & 5, with auto-pause on Day 7. |
| **Settings** | Profile, password, and notification preferences. |

### Admin Panel

| Feature | Description |
| :--- | :--- |
| **Dashboard** | Overview of students, revenue, and completion rates. |
| **Student Management** | Search, view, pause, and reactivate student accounts. |
| **Course Builder** | Create modules and lessons, and upload videos. |
| **Coupon Manager** | Create, edit, toggle, and track coupon usage. |
| **Grading** | Review and grade assignment submissions with feedback. |
| **Moderation** | Manage community posts and replies. |
| **Broadcasts** | Send system-wide notifications to all students. |
| **Scheduling** | Schedule future lesson release dates. |

---

## Project Structure

```text
youtube-automation-course/
├── backend/
│   ├── config/
│   │   ├── database.js          # Prisma client
│   │   └── cloudinary.js        # Cloudinary upload/delete
│   ├── middleware/
│   │   ├── auth.js              # JWT auth & role checks
│   │   └── upload.js            # Multer file handlers
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
│   │   └── auth.js              # bcrypt & JWT helpers
│   ├── jobs/
│   │   └── accountability.js    # Cron job for inactivity
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js        # All API calls
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   └── layouts/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── admin/
│   │   │   └── payment/
│   │   ├── store/
│   │   │   └── authStore.js     # Zustand auth state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** database
- **Paystack** account ([get test keys](https://dashboard.paystack.com/#/settings/developer))
- **Cloudinary** account ([sign up free](https://cloudinary.com))
- **Resend** account ([sign up free](https://resend.com))

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/youtube-automation-course.git
cd youtube-automation-course
```

**2. Set up the backend**

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env variables
npx prisma migrate dev
npx prisma db seed
npm run dev
```

**3. Set up the frontend**

```bash
cd ../frontend
npm install
cp .env.example .env
# Fill in your .env variables
npm run dev
```

---

## License

This project is proprietary. All rights reserved.