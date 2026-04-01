# ARIFAC LMS Platform - Walkthrough

Welcome to the **ARIFAC Learner Management System (LMS)**. This platform implements a robust, secure, and state-machine-driven lifecycle for professional certification.

## 🚀 Getting Started

1. **Install Dependencies**: ensure all packages are ready.
   ```bash
   npm install
   ```
2. **Database Setup**: We have configured the system to use a local **SQLite** database for immediate, zero-configuration development.
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. **Start Development**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the landing page.

---

## 🏗️ Core Architecture

### 1. The Learner Lifecycle (State Machine)
The system is anchored by `lib/state-machine.ts`, which enforces strict transitions. A learner cannot skip steps or bypass approvals.
- **REGISTERED** → **APPROVED** (Secretariat) → **ELIGIBLE** (Eligibility Check) → **CREDENTIAL_ISSUED** → **COURSE_SELECTED** → **PAYMENT_PENDING** / **CERTIFICATE_PENDING** (Admin Review) → **ACTIVE** (Learning).

### 2. Branding (ARIFAC Institutional Theme)
The design system in `app/globals.css` uses a premium blue/emerald/emerald-green palette inspired by regulatory institutions.
- **Glassmorphism**: Cards and dashboards use subtle backdrops and gradients.
- **Transitions**: Smooth slide-in animations for all page loads.

### 3. Key Modules
- **Course Selection**: Branching logic for L1/L5 (Direct) vs L2/L4 (Admin Review needed).
- **Payment Gateway**: Simulated gateway with transaction success/fail logic.
- **Learning Viewer**: Markdown-ready study material viewer with progress tracking.
- **Assessment Engine**: Timed exams with scoring and automatic certificate generation.

### 4. Admin Dashboard
Access the administrative portal at `/admin` (Default Admin login: `admin@arifac.com` / `admin123`).
- **Secretariat Approvals**: One-click approvals for new registrations.
- **Certificate Review**: Dashboard for reviewing uploaded prior-qualifications for advanced courses.

---

## 📂 File System Overview

- `/app/api`: Complete RESTful API architecture following Next.js best practices.
- `/lib/auth.ts`: JWT-based session management with HttpOnly cookies.
- `/prisma/schema.prisma`: The source of truth for the database state and models.
- `/middleware.ts`: Global route protection and role-based redirect logic.

## 🏆 Earning Certification
Once a learner completes the **Main Exam** (Course L1–L5), the system automatically generates a cryptographically unique certificate viewable at `/certificate`.
