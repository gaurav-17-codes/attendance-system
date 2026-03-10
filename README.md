#  KALNET Attendance Management System

A production-grade **Student Attendance Management System** built as part of the KALNET internship assignment. This is a full-stack web application with role-based access control, real-time attendance tracking, and detailed reporting.

---

## Live Demo Credentials

| Role    | Email              | Password     |
|---------|--------------------|--------------|
| Admin   | admin@kalnet.com   | password123  |
| Teacher | priya@kalnet.com   | password123  |
| Student | arjun@kalnet.com   | password123  |

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router)           |
| Language   | TypeScript                        |
| Styling    | Tailwind CSS                      |
| Backend    | Next.js API Routes                |
| Database   | PostgreSQL / SQLite               |
| ORM        | Prisma                            |
| Auth       | Custom JWT + HTTP-only Cookies    |
| Validation | Zod                               |

---

## Features

### Admin
- Create and manage classes with teacher assignment
- Add student and teacher accounts
- Enroll students into classes
- Generate attendance reports with date range filters
- Export reports as CSV

### Teacher
- View assigned classes dashboard
- Mark attendance — Present / Absent / Late
- Bulk mark all students at once
- Edit attendance (same day only)
- View per-student attendance statistics with visual rings

### Student
- View overall attendance percentage across all classes
- Class-wise breakdown with animated progress rings
- Color-coded status: 🟢 Good (≥85%) 🟡 Warning (75–85%) 🔴 Critical (<75%)
- Warning alert when attendance drops below 75%

---

## Project Structure

```
kalnet-attendance/
├── app/
│   ├── api/
│   │   ├── auth/          # login, logout, me
│   │   ├── classes/       # CRUD + student enrollment
│   │   ├── attendance/    # mark + fetch attendance
│   │   ├── students/      # student management
│   │   ├── teachers/      # teacher management
│   │   └── reports/       # reports + CSV export
│   ├── dashboard/
│   │   ├── admin/         # admin pages
│   │   ├── teacher/       # teacher pages
│   │   └── student/       # student pages
│   └── login/             # login page
├── components/
│   ├── providers/         # AuthProvider (React Context)
│   └── ui/                # Sidebar, StatsCard, AttendanceRing
├── lib/
│   ├── auth.ts            # JWT + bcrypt utilities
│   ├── prisma.ts          # Prisma client singleton
│   ├── validations.ts     # Zod schemas
│   └── services/          # Business logic layer
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Demo data seeder
├── types/                 # TypeScript types
└── utils/                 # API response helpers
```

---

## Database Schema

```
User         — id, name, email, password (bcrypt), role
Class        — id, name, subject, teacherId, createdBy
StudentClass — studentId + classId (junction table)
Attendance   — studentId, classId, date, status (PRESENT/ABSENT/LATE)
```

### Key Constraints
- `@@unique([studentId, classId])` — student can't enroll in same class twice
- `@@unique([studentId, classId, date])` — one attendance record per student per class per day
- `@db.Date` on date field — stores date only, prevents timezone bugs

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/gaurav-17-codes/attendance-system.git
cd attendance-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kalnet_attendance"
JWT_SECRET="your-secret-key-here"
```

> **For SQLite (no PostgreSQL needed):**
> Set `DATABASE_URL="file:./dev.db"` and change `provider = "sqlite"` in `prisma/schema.prisma`

### 4. Set up the database
```bash
npx prisma db push
```

### 5. Seed demo data
```bash
npx ts-node prisma/seed.ts
```

### 6. Start the development server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## API Documentation

| Method | Endpoint                        | Role          | Description                  |
|--------|---------------------------------|---------------|------------------------------|
| POST   | /api/auth/login                 | All           | Login, returns JWT cookie    |
| POST   | /api/auth/logout                | All           | Clears auth cookie           |
| GET    | /api/auth/me                    | All           | Get current user             |
| GET    | /api/classes                    | All           | List classes (role-filtered) |
| POST   | /api/classes                    | Admin         | Create a class               |
| POST   | /api/classes/:id/students       | Admin         | Enroll students              |
| GET    | /api/students                   | Admin/Teacher | List all students            |
| POST   | /api/students                   | Admin         | Create student account       |
| GET    | /api/teachers                   | Admin         | List all teachers            |
| POST   | /api/teachers                   | Admin         | Create teacher account       |
| GET    | /api/attendance?classId=&date=  | Teacher/Admin | Get class attendance         |
| POST   | /api/attendance                 | Teacher/Admin | Mark/update attendance       |
| GET    | /api/reports?classId=&format=   | All           | Generate reports / CSV       |

---

## Architecture Decisions

### JWT in HTTP-only Cookies
Tokens stored in `httpOnly` cookies — JavaScript cannot read them, preventing XSS attacks.

### Service Layer Pattern
Business logic is separated from API routes into `lib/services/`. API routes are thin: validate → call service → respond.

### Prisma Upsert for Attendance
Uses `upsert` instead of separate create/update — atomic operation that prevents race conditions and duplicate records.

### Database-level Constraints
Unique constraints enforced at DB level as a second layer of defense beyond application logic.

### Soft Deletes
Classes are deactivated (`isActive: false`) instead of deleted — preserves historical attendance data.

---

## Future Improvements

- Email notifications when attendance drops below threshold
- Mobile app with QR code attendance marking
- Parent portal to view child's attendance
- Timetable integration for auto-creating attendance slots
- Biometric / face recognition attendance
- Analytics dashboard with weekly trends and heatmaps
- Bulk CSV import for students and enrollments
- Refresh token implementation
- Rate limiting on API routes

---

## Author

**Gaurav Das**
Trainee — Full Stack Developer @ KALNET

---

## License

This project was built as part of the KALNET internship program.