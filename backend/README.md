# School ERP Backend

A robust, multi-tenant backend system for school management (ERP). It provides comprehensive functionalities to manage students, staff, academics, attendance, fees, exams, and timetables securely within isolated school environments.

---

## 1. Project Overview

**What it does:**
This project serves as the centralized backend for a School ERP. It securely isolates data by school (Tenant) and allows authorized personnel (Admin, Management, Principal, Teachers, Accountants) to manage day-to-day operations.

**Main School ERP Features:**
- **Multi-tenancy:** Strict data isolation by `tenantId` per school.
- **Role-Based Access Control (RBAC):** Supports identities like Admin, Staff, Student, and Parent.
- **Core Operations:** Admissions, Staff HR, Attendance tracking, Fee collection, CBSE-compliant Exam grading, and dynamic Timetables.
- **Dynamic Extensibility:** Custom Fields and Master Data dictionaries.

**Tech Stack:**
- **Runtime:** Node.js (v18/v20)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Security:** JWT Authentication, Helmet, Express Rate Limit
- **Testing:** Jest + Supertest

**Architecture Reality (Modular Monolith):**
While documented below in a microservice-oriented style to clarify domain boundaries, the current codebase is actually a **Modular Monolith**. 
All logical services reside in a single repository, run within a single Express.js process, and share a single PostgreSQL database instance. However, the codebase strictly adheres to Domain-Driven Design (DDD). Each domain (e.g., Auth, Attendance, Fees) is encapsulated within its own module in the `src/modules/` directory, exposing its own routes, controllers, and services. This makes it highly cohesive and paves an easy path for future extraction into physical microservices if needed.

---

## 2. Architecture & Logical Services

The system is broken down into the following logical services/domain modules:

```mermaid
graph TD
    Client["Client (Web/Mobile)"]
    API_Gateway["Express Router (API Gateway)"]
    
    Client -->|HTTP / API| API_Gateway
    
    subgraph Logical Services
        AuthService["Auth Service"]
        AdminService["Admin/Master Service"]
        StudentService["Student Service"]
        StaffService["Staff Service"]
        AttendanceService["Attendance Service"]
        FeeService["Fee Service"]
        ExamService["Exam Service"]
        TimetableService["Timetable Service"]
    end
    
    API_Gateway --> AuthService
    API_Gateway --> AdminService
    API_Gateway --> StudentService
    API_Gateway --> StaffService
    API_Gateway --> AttendanceService
    API_Gateway --> FeeService
    API_Gateway --> ExamService
    API_Gateway --> TimetableService
    
    subgraph Shared Database
        DB[("PostgreSQL\n(Prisma ORM)")]
    end
    
    AuthService --> DB
    AdminService --> DB
    StudentService --> DB
    StaffService --> DB
    AttendanceService --> DB
    FeeService --> DB
    ExamService --> DB
    TimetableService --> DB
```

### 🔐 Auth Service
- **Responsibility:** Handles user registration, authentication, JWT issuance, and RBAC token validation.
- **Database Models:** `User`, `Tenant`
- **Auth/Roles:** Open for login. Registration requires a secret `REGISTRATION_KEY`.

### ⚙️ Admin / Master Data Service
- **Responsibility:** Manages the structural backbone of the school (Academic Years, Classes, Sections, Departments, Subjects, Holidays, Custom Fields).
- **Database Models:** `AcademicYear`, `Class`, `Section`, `Department`, `Subject`, `Holiday`, `MasterData`, `CustomField`
- **Dependencies:** Relied upon by all other services.
- **Auth/Roles:** Strictly Admin / Management / Principal.

### 🧑‍🎓 Student Service
- **Responsibility:** Manages student onboarding, demographics, parent/guardian linkages, and dynamic custom profile fields.
- **Database Models:** `Student`, `StudentParent`, `CustomFieldValue`
- **Dependencies:** Requires Admin Service (Class, Section).
- **Auth/Roles:** Admin / Management / Principal / Staff.

### 👨‍🏫 Staff Service
- **Responsibility:** Manages employee HR profiles, addresses, dependents, and subject assignments.
- **Database Models:** `Staff`, `StaffSubject`, `StaffAddress`, `StaffSpouse`, `StaffChild`, `StaffOtherDetails`
- **Dependencies:** Requires Admin Service (Department, Subject).
- **Auth/Roles:** Admin / Management / Principal.

### 📅 Attendance Service
- **Responsibility:** Tracks daily attendance for students and staff. Calculates monthly percentages, intelligently excluding holidays and weekends.
- **Database Models:** `StudentAttendance`, `StaffAttendance`
- **Dependencies:** Requires Student, Staff, and Admin (Holidays) services.
- **Auth/Roles:** Staff (Teachers) can mark student attendance. Admins mark staff attendance.

### 💰 Fee Service
- **Responsibility:** Manages fee heads (Categories), class-wise Fee Structures, and processes transactional Fee Collections (Receipts).
- **Database Models:** `FeeCategory`, `FeeStructure`, `FeeCollection`
- **Dependencies:** Requires Student and Admin services.
- **Auth/Roles:** Admins / Accountants.

### 📝 Exam Service
- **Responsibility:** Configures exam schedules, accepts bulk mark entries, computes grades based on CBSE scales, and generates report cards.
- **Database Models:** `Exam`, `ExamMark`
- **Dependencies:** Requires Student and Admin (Subject) services.
- **Auth/Roles:** Admins / Staff.

### ⏰ Timetable Service
- **Responsibility:** Manages daily period slots and assigns teachers/subjects to classes on specific days to prevent clashes.
- **Database Models:** `PeriodSlot`, `Timetable`
- **Dependencies:** Requires Admin (Class), Staff, and Admin (Subject) services.
- **Auth/Roles:** Admins create it; Authenticated users view it.

---

## 3. System Flows

### Login / Auth Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthRoute
    participant AuthService
    participant DB
    
    Client->>AuthRoute: POST /auth/login (email, password, tenantId)
    AuthRoute->>AuthService: Validate Credentials
    AuthService->>DB: Find User by email + tenantId
    DB-->>AuthService: User Record & Hashed Password
    AuthService->>AuthService: Compare bcrypt hash
    AuthService-->>Client: Return JWT (Contains tenantId, identity)
```

### Attendance Flow
```mermaid
sequenceDiagram
    participant Teacher
    participant AttendanceRoute
    participant AttendanceService
    participant DB
    
    Teacher->>AttendanceRoute: POST /attendance/students/mark-class (JWT)
    AttendanceRoute->>AttendanceService: Validate Date & Payload
    AttendanceService->>DB: Check if Date is a Holiday
    AttendanceService->>DB: Verify all studentIds belong to Tenant & Class
    DB-->>AttendanceService: Validation Success
    AttendanceService->>DB: Upsert/Create Attendance Records (Transaction)
    AttendanceService-->>Teacher: 200 OK (Attendance Marked)
```

### Fees Collection Flow
```mermaid
sequenceDiagram
    participant Accountant
    participant FeeService
    participant DB
    
    Accountant->>FeeService: POST /fees/collect (studentId, amount)
    FeeService->>DB: Aggregate MAX(receiptNo) for current year
    DB-->>FeeService: Latest Receipt (e.g., RC/1/000045)
    FeeService->>FeeService: Increment receipt -> RC/1/000046
    FeeService->>DB: Insert FeeCollection record
    FeeService-->>Accountant: 201 Created (Receipt Data)
```

---

## 4. Setup Instructions

### Prerequisites
- Node.js (v18 or v20)
- PostgreSQL
- Docker & Docker Compose (optional)

### Environment Variables (`.env`)
```env
PORT=8010
DATABASE_URL="postgresql://user:password@localhost:5432/school_erp?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
CORS_ORIGIN="http://localhost:3000"
REGISTRATION_KEY="secret_key_to_create_first_admin"
```

### Installation & Local Dev
1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Sync Database Schema (Migration):
   ```bash
   npx prisma db push
   ```
4. Start Development Server:
   ```bash
   npm run dev
   ```

### Production / Docker Deployment
```bash
docker-compose up -d --build
```
The included `Dockerfile` uses `npm ci --omit=dev` for lean production builds.

---

## 5. API Documentation

Most endpoints require a `Bearer Token`. 

### Auth Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `POST` | `/api/v1/auth/register` | Register new user | Requires `REGISTRATION_KEY` |
| `POST` | `/api/v1/auth/login` | Login user | Public |

### Admin / Master Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `GET/POST/PUT/DEL` | `/api/v1/academic-years` | Manage academic years | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/classes` | Manage classes | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/sections` | Manage sections | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/departments` | Manage departments | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/subjects` | Manage subjects | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/master-data` | Master dictionary (Caste, Religion, etc.) | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/custom-fields` | Manage dynamic form fields | Admin/Mgmt/Principal |
| `GET/POST/PUT/DEL` | `/api/v1/holidays` | Manage holiday calendar | Admin |

### Student Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `GET/POST/PUT/DEL` | `/api/v1/students` | CRUD on Student profiles | Admin/Staff |
| `POST` | `/api/v1/custom-fields/values` | Save custom field answers | Admin/Staff |

### Staff Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `GET/POST/PUT/DEL` | `/api/v1/staff` | CRUD on Staff HR profiles | Admin/Mgmt/Principal |
| `POST/DEL` | `/api/v1/staff/:id/subjects` | Assign/remove teaching subjects | Admin/Mgmt/Principal |

### Attendance Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `POST` | `/api/v1/attendance/students/mark-class` | Bulk mark class attendance | Auth (Teacher) |
| `GET` | `/api/v1/attendance/students/class` | View daily class attendance | Auth |
| `GET` | `/api/v1/attendance/students/monthly-summary` | View class monthly percentages | Auth |
| `POST` | `/api/v1/attendance/staff/mark` | Mark staff attendance | Admin |
| `GET` | `/api/v1/attendance/staff/by-date` | View staff attendance by date | Auth |

### Fee Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `GET/POST/PUT/DEL` | `/api/v1/fees/categories` | Manage fee heads | Admin |
| `GET/POST/PUT` | `/api/v1/fees/structures` | Assign fee amounts to classes | Admin |
| `POST` | `/api/v1/fees/collect` | Collect payment (generates receipt) | Admin/Accountant |
| `GET` | `/api/v1/fees/students/:id/status` | View outstanding balances | Auth |
| `GET` | `/api/v1/fees/collections` | View daily collection reports | Auth |

### Exam Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `GET/POST/PUT/DEL` | `/api/v1/exams` | Manage exam timelines | Admin |
| `POST` | `/api/v1/exams/:examId/marks` | Bulk upload marks (triggers transaction) | Admin/Staff |
| `GET` | `/api/v1/exams/students/:id/report` | Generate report card | Admin/Staff |

### Timetable Service
| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| `POST` | `/api/v1/timetable/period-slots/seed` | Seed default bell timings | Admin |
| `GET/POST/PUT/DEL` | `/api/v1/timetable/period-slots` | Manage daily period slots | Admin |
| `POST/PUT/DEL` | `/api/v1/timetable` | Assign teachers to class slots | Admin |
| `GET` | `/api/v1/timetable/class` | View schedule for a class | Auth |
| `GET` | `/api/v1/timetable/teacher` | View schedule for a teacher | Auth |

---

## 6. Authentication and Authorization

- **Middleware:** 
  - `authMiddleware.js`: Verifies JWT and injects `req.user`. Ensures request belongs to a valid tenant.
  - `authorize.js`: Checks `req.user.identity` against required roles (e.g., `authorize('admin', 'staff')`).
- **Data Isolation:** The `tenantId` extracted from the JWT is strictly applied to every database query inside the services to prevent cross-tenant data leaks.

---

## 7. Database / Models

All models are defined in `prisma/schema.prisma`. 

**Relationships & Constraints:**
- Every major entity has a `@relation` to `Tenant`.
- `Unique` constraints heavily utilize compound keys (e.g., `[tenantId, studentId, date]` for attendance) to guarantee isolation.
- Enums are used for `AttendanceStatus` (present, absent, holiday), `ExamType`, `Identity`, etc.

---

## 8. Project Structure

```
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Local/Production docker orchestration
├── package.json           # Dependencies and NPM scripts
├── prisma/
│   └── schema.prisma      # Unified Database Schema
├── src/
│   ├── app.js             # API Gateway: Express setup, CORS, Helmet, Rate Limits
│   ├── server.js          # HTTP Listener
│   ├── middleware/        # Global Auth & Security Middleware
│   ├── modules/           # 📦 DOMAIN MODULES (Logical Services)
│   │   ├── auth/          # -> Auth Service
│   │   ├── student/       # -> Student Service
│   │   ├── staff/         # -> Staff Service
│   │   ├── attendance/    # -> Attendance Service
│   │   ├── fee/           # -> Fee Service
│   │   ├── exam/          # -> Exam Service
│   │   ├── timetable/     # -> Timetable Service
│   │   ├── master/        # -> Admin Service (Subjects)
│   │   ├── master-data/   # -> Admin Service (Dictionaries)
│   │   ├── class/         # -> Admin Service (Classes)
│   │   └── holiday/       # -> Admin Service (Holidays)
│   ├── routes/
│   │   └── index.js       # Central router stitching modules together
│   └── utils/             # Shared utilities (HttpError)
└── tests/                 # Integration tests (Jest)
```

---

## 9. Scripts and Commands

- `npm run dev`: Hot-reloading development server (nodemon).
- `npm start`: Standard production start (node).
- `npm test`: Runs Jest integration tests (`--runInBand` ensures DB transactions do not collide).
- `npx prisma db push`: Pushes Prisma schema to the DB without creating migration files (used for rapid dev).
- `npx prisma generate`: Regenerates the Prisma Client after schema changes.

---

## 10. Deployment Notes

- **Docker:** All logical services deploy together in a single Node.js container (monolith deployment).
- **Environment:** `DATABASE_URL` must point to your PostgreSQL instance. `JWT_SECRET` must be set.
- **Security:** Helmet is used for secure HTTP headers. Express Rate Limiter prevents brute force on `/api/v1` and `/api/v1/auth`.

---

## 11. Known Limitations or TODOs

- **File Uploads:** While `photoUrl` and `signatureUrl` exist in the DB schema, there is no active local disk/S3 file upload middleware implemented in the routes. URLs must be handled externally.
- **Fee Receipt Concurrency:** Fee receipt generation relies on `MAX(receiptNo)`. While safer than `COUNT(*)`, it lacks a strict database-level locking sequence table, which could theoretically cause collisions under extremely high concurrent load.
- **CORS Configuration:** If `CORS_ORIGIN` is not set in production, the app defaults to allowing all origins.
