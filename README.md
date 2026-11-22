# District Educational Office (Secondary) Marthandam
## EBS DATA ENTRY SYSTEM &bull; Teacher Information & Service Registry

A unified, multi-tenant web application combining the **Institutional Authentication Portal (`ebs2026-27.html`)** and the **Teacher Data Registry (`Staff Data.html`)** with persistent database storage, role-based access control, and native deployment readiness for **Vercel**.

---

## 🌟 Key Highlights & Roles

### 1. 🛡️ Administrator Role (`admin`)
* **Controls all schools' data** across the entire district (all 138 registered schools).
* **Master Management Console**:
  * Real-time KPI summary cards:
    * Total registered institutions (138 schools).
    * Submissions count (schools with active submissions vs pending).
    * Total teachers registered across the district.
    * Breakdown by School Type (Government, Fully Aided, Partially Aided, Self-Finance).
  * Comprehensive filters: filter by School (select from all 138 schools), School Type, Designation, and free-text search.
  * Add teacher records on behalf of any school.
  * Edit or delete any teacher record with confirmation safeguards.
  * **Master CSV Export**: Download all teacher data across the district or for filtered institutions into an Excel-ready spreadsheet.
  * **138 Schools Audit Directory**: Real-time checklist tracking which schools have submitted data and which are pending, with instant drill-down.

### 2. 🏫 School User Role (`school`)
* **Strict tenant scoping**: Controls only the data inside their own school.
* **Streamlined Data Entry**:
  * Logs in using their official 11-digit UDISE Code and institutional password (`<UDISE_Code>@123`).
  * Institutional UDISE Code and School Name are automatically locked and pre-filled.
  * Sl No auto-increments based on existing entries for their school.
  * Full 20-field official data entry form across 4 sections:
    1. **School Details**: Sl No, UDISE Code (locked), School Name (locked), School Type (Government / Fully Aided / Partially Aided / Self-Finance).
    2. **Teacher Personal & Service Details**: Name, Sex, Designation, Educational Qualification, DOB, Appointment Date, Retirement Date, Appointment Nature (with automatic highlight for Aided schools).
    3. **Subject & Teaching Details**: Main Subject (all 35 official subjects), Other Subject (all 35 subjects, defaulting to NIL), Medium of Teaching (Tamil, English, Malayalam).
    4. **Contact Details & Remarks**: Area, Email ID, 10-digit Mobile Number, Address with Pincode, Remarks.
* **School Registry Table**:
  * Live search, Edit mode with auto-scroll, Delete with confirmation.
  * **School CSV Export**: Exports only their institution's verified records with UTF-8 BOM encoding for Excel.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **District Admin** | `admin` | `Admin@DEO2026` | Full district control (all 139 schools) |
| **School User** | `<10 or 11-digit UDISE>` *(e.g. `33300700117`)* | `<UDISE>@123` *(e.g. `33300700117@123`)* | Scoped to their school only |
| **Demo School** | `3330097696` | `3330097696@123` | DEMO MATRIC HR SEC SCHOOL |

*Note: All 138 schools from the official DEO Marthandam registry plus demo school are pre-configured out of the box.*

---

## 📊 Official DEO EBS 2026–2027 Export Engine

The system contains an integrated export engine (`lib/exporter.js`) using the official DEO `EBS 2026 - 2027.xlsx` template:
* **Multi-Sheet Workbook (.xlsx)**: Generates the full 9-sheet official book including Form 1 (`HSS HM`), Form 2 (`HS HM`), Form 3 (`PG`), Form 4 (`BT`), Form 5 (`SEC GRADE`), Form 6 (`SPL TEACHER`), Form 7 (`OFFICE`), `CHECK` matrix (with dynamic formulas and post totals), and `Subjects` directory.
* **Single Sheet Extraction**: Export only a specific form (e.g., only `PG` teachers or only the `CHECK` summary matrix) as `.xlsx` or `.csv`.
* **Single School Scoping**: Export records filtered to any individual school (or district-wide).
* **Multi-Criteria Filtering**: Filter by School Type, Designation, Main Subject, or search keywords.
* **One-Click School User Export**: Institutional school users can download their school's filled official workbook with 1 click directly from their dashboard.

---

## 🚀 Local Development Setup

The application features an automatic dual-database engine:
* When running locally without a cloud database configured, it uses a zero-setup local SQLite database (`data.db`).
* When `DATABASE_URL` is configured, it connects to PostgreSQL (Neon, Supabase, Vercel Postgres, etc.).

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm start
```
The application will start at:
👉 **`http://localhost:3000`**

### Step 3: Run Automated Verification Tests
```bash
npm test
```

---

## ☁️ Deploying to Vercel

Vercel is a serverless environment where file writes are ephemeral. Therefore, a cloud PostgreSQL database (such as **Neon**, **Supabase**, or **Vercel Postgres**) is used for persistent storage.

### Step 1: Create a Free Cloud PostgreSQL Database
You can use any cloud PostgreSQL provider with a generous free tier:
1. **Neon Serverless Postgres** (Recommended - 1-minute setup):
   - Visit [neon.tech](https://neon.tech) and create a free project.
   - Copy your connection string (format: `postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require`).
   *Alternatively, use Supabase, Vercel Postgres, or Railway.*

### Step 2: Deploy to Vercel

#### Option A: Using the Vercel Web Dashboard (GitHub)
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit of unified EBS Data Entry System"
   git push origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository.
4. Under **Environment Variables**, add:
   * `DATABASE_URL`: `your_neon_or_supabase_postgres_connection_string`
   * `JWT_SECRET`: `any_random_secure_secret_string`
   * `ADMIN_USERNAME`: `admin` *(optional, defaults to admin)*
   * `ADMIN_PASSWORD`: `Admin@DEO2026` *(or your preferred password)*
5. Click **Deploy**. Vercel will build and deploy the app in seconds!

#### Option B: Using the Vercel CLI
```bash
npm i -g vercel
vercel
```
When prompted, link your project and add the environment variables in the project settings or via:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```
Then trigger production deployment:
```bash
vercel --prod
```

### Database Auto-Initialization:
On first run in production, the application will automatically:
1. Create the `schools`, `users`, and `teachers` tables.
2. Seed the 138 official schools into the database.
3. Initialize the administrator account.

---

## 📁 Project Architecture

```
school_entry/
├── api/
│   └── index.js             # Express API / Vercel Serverless Function entry point
├── lib/
│   ├── auth.js              # Authentication, bcrypt, JWT, and role-based guards
│   ├── db.js                # Dual database adapter (PostgreSQL + SQLite fallback)
│   └── schools.js           # Official 138 schools directory & validator
├── public/
│   ├── app.js               # Frontend client controller & reactive state management
│   ├── index.html           # Unified responsive UI (Login, School Portal, Admin Console)
│   └── style.css            # Custom scrollbars, animations, and styles
├── scripts/
│   └── seed.js              # Standalone DB seeding script
├── test_api.js              # Database & authentication integration tests
├── test_http.js             # End-to-end HTTP API endpoint test suite
├── .env.example             # Template for environment configuration
├── package.json             # Scripts & dependencies
├── server.js                # Local development server runner
└── vercel.json              # Vercel serverless routing configuration
```

---

## 🔒 Security & Data Integrity

1. **Role-Based Tenant Enforcement**: The backend server verifies the user's role on every API call. School users are strictly restricted to querying, inserting, modifying, or deleting records where `udise_code` matches their authenticated session.
2. **Encrypted Credentials**: Admin passwords and custom school credentials are encrypted using `bcryptjs` before storage.
3. **HTTP-Only Cookies & Bearer Tokens**: Sessions are protected using JWT tokens transmitted via secure HTTP headers and SameSite cookies.
4. **Input Sanitization**: Client-side escaping and SQL parameterization prevent XSS and SQL injection.

