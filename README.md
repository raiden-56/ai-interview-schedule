# 🎯 InterviewAI - AI-Powered Interview Platform

A production-grade SaaS platform for conducting live coding interviews, video assessments, and AI-driven candidate evaluation. Built with modern technologies and enterprise-level architecture.

## 🚀 Tech Stack

### Frontend

- **React.js** + TypeScript + Vite
- **MUI (Material UI)** - Enterprise UI components
- **Redux Toolkit** - State management
- **React Query** - Server state & caching
- **React Router v7** - Client-side routing
- **Monaco Editor** - VS Code-like coding editor
- **Socket.IO Client** - Real-time communication
- **Framer Motion** - Animations
- **Recharts** - Analytics charts
- **React Hook Form + Zod** - Form handling & validation

### Backend

- **Node.js** + Express.js + TypeScript
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Production database
- **Redis** - Caching & pub/sub
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Secure authentication with refresh tokens
- **BullMQ** - Background job processing
- **Winston** - Structured logging

### AI Stack

- **OpenAI API** - Code analysis & interview reports
- **Whisper** - Speech-to-text transcription
- **TensorFlow.js** - Emotion detection
- **face-api.js** - Face tracking & proctoring

### DevOps

- **Docker** + Docker Compose - Containerization
- **Nginx** - Reverse proxy & load balancing
- **GitHub Actions** - CI/CD pipeline
- **AWS** (EC2, S3, CloudFront) - Cloud infrastructure

## ✨ Features

### Core

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control (Admin/Recruiter/Candidate)
- ✅ Recruiter, Candidate & Admin dashboards
- ✅ Interview scheduling with email invitations
- ✅ Resume upload & AI parsing

### Coding Interview

- ✅ Monaco editor with multi-language support
- ✅ Real-time code collaboration via Socket.IO
- ✅ Code execution via Judge0 API
- ✅ Auto-save & test cases
- ✅ AI code review & analysis

### Video Interview

- ✅ WebRTC peer-to-peer video calling
- ✅ Screen sharing & recording
- ✅ Real-time chat
- ✅ Camera/mic toggle & background blur

### AI Features

- ✅ AI coding feedback & code quality scoring
- ✅ AI communication & confidence scoring
- ✅ AI sentiment analysis
- ✅ AI-generated interview reports
- ✅ AI hiring recommendations
- ✅ AI resume-job matching (ATS score)

### Anti-Cheating (Proctoring)

Candidates see a consent screen listing what is monitored and must start in
fullscreen with a working camera. Detection runs in the browser
(`frontend/src/hooks/useAntiCheating.ts`); every event is sent to
`POST /api/v1/interviews/:id/proctoring/events`, where the **server** assigns
severity (repeat offences escalate), stores it in `cheating_logs`, and pushes
it live to the interviewer only (candidates never receive alerts).

| Signal | How it is detected |
| --- | --- |
| Tab switch | `visibilitychange` |
| Other app / second monitor focused | window `blur` while the tab stays visible |
| External paste | paste/drop whose text wasn't copied inside the interview (preview stored) |
| Auto-typer / injected code | large single edit in the editor without a paste event |
| Copy out of the page | `copy`/`cut` events |
| Fullscreen exit | `fullscreenchange` (blocking overlay until re-entered) |
| DevTools attempt | F12 / Ctrl+Shift+I/J/C / Ctrl+U (blocked) |
| Multiple displays | `screen.isExtended` (Chromium) |
| No face / multiple faces / looking away | MediaPipe face detector on the webcam (lazy-loaded) |
| Camera off or covered | track disabled/ended, or near-black frames |
| Inactivity | no keyboard/mouse input for 3 minutes |

Recruiters get an **integrity score** (100 minus weighted penalties) and risk
level in the interview room's *Proctoring* tab and from the shield icon on the
Interviews page. The proctoring summary is also fed into the AI report.

> MediaPipe's WASM and model are loaded from `cdn.jsdelivr.net` and
> `storage.googleapis.com`. If those are blocked, face checks fall back to
> camera-off/covered detection only.

### Analytics

- ✅ Candidate ranking & scoring
- ✅ Recruiter analytics dashboard
- ✅ Interview performance reports
- ✅ Hiring pipeline analytics
- ✅ AI scoring charts (Radar, Bar, Area)

## 🏗️ Project Structure

```
interview-module/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── app/             # App entry & providers
│   │   ├── components/      # Shared components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── redux/           # Redux store & slices
│   │   ├── sockets/         # Socket.IO service
│   │   ├── routes/          # Router config
│   │   ├── theme/           # MUI theme
│   │   └── utils/           # Utilities
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── sockets/         # Socket.IO handlers
│   │   ├── ai/             # AI services
│   │   ├── jobs/           # Background jobs
│   │   └── utils/          # Utilities
│   ├── prisma/              # Database schema
│   ├── Dockerfile
│   └── package.json
├── nginx/                    # Nginx configuration
├── .github/workflows/        # CI/CD pipeline
├── docker-compose.yml        # Container orchestration
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (optional)

### Quick Start with Docker

```bash
docker-compose up -d
```

The app will be available at `http://localhost`

### Manual Setup

#### Backend

```bash
cd backend
cp .env.example .env
# Update .env with your database credentials
npm install
npx prisma migrate dev
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Security Features

- Helmet.js security headers
- Rate limiting
- XSS protection
- JWT refresh token rotation
- Secure HTTP-only cookies
- RBAC authorization
- Input validation with Zod
- Encrypted WebRTC connections

## 📊 Database Schema

- Users, Companies, CompanyMembers
- JobPostings, Interviews
- CodingSessions, AIReports
- CheatingLogs, Resumes
- ChatMessages, Notifications

## 🎨 Theme

- Dark/Light mode toggle
- Primary: `#7C4DFF` (Purple)
- Secondary: `#00E5FF` (Cyan)
- Background: `#0B1020` (Deep Navy)
- Surface: `#121A2B`

## 📝 License

MIT
