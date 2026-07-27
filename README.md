# StudyMind AI

StudyMind AI is a full-stack learning workspace for students. Upload course materials, chat with an AI tutor grounded in your notes, generate quizzes and flashcards, track progress, collaborate in study groups, and visualize topics with mind maps.

The application uses a **Next.js** frontend, an **Express** REST API with **Socket.io** for real-time notifications, **MongoDB** for persistence, and **OpenRouter** / **Groq** for AI features.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Charts | Recharts |
| HTTP Client | Fetch API |
| Real-time | Socket.io |
| AI | OpenRouter, Groq Whisper |
| Storage | Cloudinary |

---

## Repository layout

| Path | Stack | Role |
|------|--------|------|
| `frontend/` | Next.js 16, React 19, Tailwind CSS 4 | Web UI, auth, dashboard modules |
| `backend/` | Express 5, Mongoose, JWT | API, file handling, AI proxy, WebSockets |

---

## Features

### Authentication and account

- Email and password registration and login with JWT sessions
- Google Sign-In (OAuth client ID on frontend and backend)
- Profile and preferences on the Settings page (theme, AI response length)
- Post-login redirect support via `?next=` (for example invite links to join a group)

### Study materials

- Upload notes (PDF, DOCX, PPT, images) with text extraction for AI use
- Filter and browse uploaded materials from the My Notes page
- Optional Cloudinary storage; local `backend/uploads` fallback when Cloudinary is not configured

### AI study tools

- **AI Assistant** — conversational help with optional focus on a selected note; source excerpts in a side panel
- **Summariser** — structured or plain summaries from pasted text or uploaded notes
- **Quizzes** — generate quizzes from notes via OpenRouter; take quizzes with review mode and local scoring for short answers
- **Flashcards** — generate and study flip-card sets from notes
- **Mind maps** — AI-generated hierarchical maps with an interactive viewer and topic outline
- **Voice Tutor** — browser speech input with spoken/text replies (where supported)

### Planning and analytics

- **Study Planner** — daily tasks with status cycling (Pending, In Progress, Done)
- **Progress** — study stats, charts, weak-topic breakdown from quiz performance
- **Dashboard** — overview cards, activity charts, and quick links to core tools

### Study groups

- Create groups, invite members via shareable link or invite code, join with code
- Group dashboard: chat, shared files, tasks, announcements, activity feed, planner items
- Quiz leaderboard and group progress overview
- Links from the group hub to quizzes, assistant, flashcards, and mind maps with group context
- Real-time **Socket.io** notifications for messages, announcements, and file uploads (bell icon in the top bar)

### UI and navigation

- Fixed sidebar and top action bar (notifications, theme toggle, profile menu with Settings and Log out)
- Scrollable page content areas inside the dashboard shell
- Auth pages: split layout, no landing page (site root redirects to `/login`)

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Node.js | LTS recommended (18+) |
| MongoDB | Local instance or MongoDB Atlas |
| OpenRouter API key | Required for AI generation and chat |
| Google OAuth client | Optional; required for Google Sign-In |
| Cloudinary account | Optional; for cloud file storage |

---

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Default API base: `http://localhost:5000/api`  
Health check: `GET http://localhost:5000/api/health`  
Socket.io connects to the same host as the API (without the `/api` prefix).

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to **Sign in** (`/login`).

### 3. First use

- Register at `/signup` or sign in at `/login`
- Upload a note under **My Notes**
- Open **AI Assistant**, **Summariser**, or generate **Quizzes** / **Flashcards** / **Mind Maps** from that note
- Create a **Study Group** and share the invite link from the group page

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP server port (default `5000`) |
| `CLIENT_URL` | Frontend origin for CORS and invite URLs (e.g. `http://localhost:3000`) |
| `API_PUBLIC_URL` | Public base URL for uploaded files when not using Cloudinary |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Chat/completion model id |
| `OPENROUTER_MAX_TOKENS` | Max tokens for AI responses |
| `OPENROUTER_VISION_MODEL` | Model for vision/OCR-related calls when used |
| `GROQ_API_KEY` | Groq API key for Voice Tutor transcription |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (server-side verification) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (optional) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | REST API base (e.g. `http://localhost:5000/api`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same Google OAuth client ID as the backend |

Do not commit `.env` or `.env.local`. Use placeholder values in `.env.example` only; never commit production secrets.

---

## Frontend routes

| Route | Module |
|-------|--------|
| `/` | Redirects to `/login` |
| `/login`, `/signup` | Authentication |
| `/dashboard` | Overview and quick actions |
| `/notes` | Upload and manage materials |
| `/assistant` | AI chat |
| `/summariser` | AI summaries |
| `/quizzes`, `/quizzes/[id]` | Quiz list and attempt/review |
| `/flashcards` | Flashcard study |
| `/planner` | Study planner |
| `/progress` | Analytics |
| `/activity` | Recent activity log |
| `/mind-maps`, `/mind-maps/[id]` | Mind map gallery and viewer |
| `/groups`, `/groups/[id]`, `/groups/join` | Study groups and invite join |
| `/voice-tutor` | Voice session UI |
| `/settings` | Account and preferences |

Protected routes require a valid JWT (stored client-side after login).

---

## API overview

All JSON routes below are prefixed with `/api`. Protected routes expect `Authorization: Bearer <token>`.

| Area | Methods | Path (examples) |
|------|---------|-----------------|
| Auth | POST | `/auth/register`, `/auth/login`, `/auth/google` |
| Auth | GET, PATCH | `/auth/me` |
| Notes | GET, POST | `/notes`, `/notes/upload` |
| AI | POST | `/ai/chat`, `/ai/summarise`, `/ai/generate-quiz`, `/ai/generate-flashcards`, `/ai/generate-mind-map` |
| Quizzes | GET, POST | `/quizzes`, `/quizzes/:id`, `/quizzes/:id/submit` |
| Flashcards | GET | `/flashcards`, `/flashcards/:id` |
| Planner | GET, POST, PATCH | `/planner`, `/planner/week`, `/planner/:id` |
| Progress | GET | `/progress` |
| Mind maps | GET, POST | `/mind-maps`, `/mind-maps/:id` |
| Groups | GET, POST, PATCH | `/groups`, `/groups/join`, `/groups/:id`, `/groups/:id/messages`, … |
| Health | GET | `/health` |

---

## Real-time notifications

- The backend attaches **Socket.io** to the HTTP server.
- Clients authenticate with the same JWT used for REST (`auth.token` on connect).
- Users join a private room `user:<userId>`.
- Group events (chat, announcements, file uploads) emit a `notification` event to other members.
- The frontend **NotificationProvider** subscribes and updates the bell badge and dropdown; progress activity is merged when the panel opens.

Restart the backend after changing socket or group controller code.

---

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `frontend/` | `npm run dev` | Dev server with Turbopack (port 3000); use `npm run dev:webpack` if needed |
| `frontend/` | `npm run build` | Production build |
| `frontend/` | `npm run start` | Serve production build |
| `backend/` | `npm run dev` | API with file watch |
| `backend/` | `npm start` | Production API |

---

## Design notes

- Dashboard: dark glass-style panels, gold/charcoal accents, fixed sidebar with inset border, fixed top actions bar
- Auth: light/dark-aware form tokens via `[data-auth-page]` and system `prefers-color-scheme`
- Charts: Recharts on Dashboard and Progress pages

---

## License

Private project — use and distribution according to your organization’s policy.
