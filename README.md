<div align="center">
  <img width="1200" height="475" alt="CiMORe Banner" src="https://slc-sflu.edu.ph/wp-content/uploads/2025/02/CIMO-Logo-1.png" />
</div>

# CiMORe — AI-Assisted Institutional Intelligence Hub

AI-Assisted Web-Based Institutional Intelligence Hub for the **College Information and Marketing Office of Saint Louis College**.

| Layer | Technology | Hosted On |
|---|---|---|
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 | Vercel |
| Backend | Django 5 + Django REST Framework | Render |
| Database | PostgreSQL via Supabase | Supabase |
| Storage | Supabase Storage | Supabase |
| AI | Google Gemini API | — |
| Email | Gmail SMTP | — |

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Backend setup (Django)](#2-backend-setup-django)
  - [3. Frontend setup (React + Vite)](#3-frontend-setup-react--vite)
  - [4. Environment variables](#4-environment-variables)
  - [5. Run the project](#5-run-the-project)
- [Deployment](#deployment)
  - [Backend → Render](#backend--render)
  - [Frontend → Vercel](#frontend--vercel)
- [Default Credentials](#default-credentials)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| npm | 10+ |
| Git | any |

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/your-org/CiMORe.git
cd CiMORe/CiMOReDeploy
```

---

### 2. Backend setup (Django)

```bash
cd server

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Apply migrations
python manage.py migrate
```

---

### 3. Frontend setup (React + Vite)

From the `CiMOReDeploy/` root (not inside `server/`):

```bash
npm install
```

---

### 4. Environment variables

#### Backend — `server/.env`

Copy `server/.env.example` to `server/.env` and fill in the values:

```env
# Django core
DEBUG=True
SECRET_KEY=your-local-secret-key

# For local dev, these can stay as-is
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Database — leave blank to use local SQLite, or provide Supabase URL
DATABASE_URL=

# Email — leave blank to use console backend (emails print to terminal)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=CiMORe <noreply@example.com>
```

> When `DEBUG=True` and `DATABASE_URL` is blank, Django falls back to the local `db.sqlite3` file. When `EMAIL_HOST_USER` is blank, emails are printed to the terminal.

#### Frontend — `.env` (in `CiMOReDeploy/`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000
```

---

### 5. Run the project

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd server
venv\Scripts\activate
python manage.py runserver 8000
```

**Terminal 2 — Frontend**
```bash
# from CiMOReDeploy/
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |

The Vite dev server proxies `/api` and `/media` requests to `http://localhost:8000` automatically — no extra CORS config needed locally.

---

## Deployment

### Backend → Render

#### Step 1 — Create a Web Service on Render

1. Go to [render.com](https://render.com) → **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:

| Field | Value |
|---|---|
| **Name** | `cimore-backend` |
| **Environment** | Python 3 |
| **Build Command** | `pip install -r server/requirements.txt && python server/manage.py collectstatic --noinput` |
| **Start Command** | `cd server && gunicorn cimore_backend.wsgi` |
| **Python Version** | 3.11.9 |

#### Step 2 — Add Environment Variables in Render Dashboard

Go to **Environment** → add each variable:

```env
DEBUG=False
SECRET_KEY=<generate a strong random key>
ALLOWED_HOSTS=cimoredeploy.onrender.com,cimore.vercel.app
CORS_ALLOWED_ORIGINS=https://cimore.vercel.app
CSRF_TRUSTED_ORIGINS=https://cimore.vercel.app
FRONTEND_URL=https://cimore.vercel.app
DATABASE_URL=postgresql://user:password@host:5432/dbname
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=CiMORe <your-gmail@gmail.com>
```

> `EMAIL_HOST_PASSWORD` must be a Gmail **App Password** (16 characters), not your Gmail login password. Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

#### Step 3 — Deploy

Click **Create Web Service**. Render deploys automatically on every push to `main`.

Your backend will be live at:
```
https://cimoredeploy.onrender.com
```

---

### Frontend → Vercel

#### Step 1 — Add Environment Variables in Vercel Dashboard

Go to your project → **Settings** → **Environment Variables**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://cimoredeploy.onrender.com
```

#### Step 2 — Deploy

```bash
git push origin main
```

Vercel redeploys automatically. Your frontend will be live at:
```
https://cimore.vercel.app
```

The `vercel.json` already handles SPA routing (all paths rewrite to `/index.html`).

---

## Default Credentials

> **Change these passwords immediately after first login.**

| Role | Email | Password |
|---|---|---|
| Superuser / System Admin | `test.admin@slc-sflu.edu.ph` | `CiMORe@2026` |
| Test User | `22101222@slc-sflu.edu.ph` | `User12345@` |

Django Admin panel: `http://localhost:8000/admin` (local) or `https://cimoredeploy.onrender.com/admin` (production).

---

## Troubleshooting

**CORS errors in the browser**
- Confirm `CORS_ALLOWED_ORIGINS` in your backend `.env` includes the exact frontend origin (e.g. `https://cimore.vercel.app` — no trailing slash).
- Confirm `ALLOWED_HOSTS` includes the Render domain.

**`Database connection failed` on Render**
- Verify `DATABASE_URL` is set correctly in the Render dashboard.
- Test the connection string locally: `psql "postgresql://user:password@host:5432/dbname"`

**Frontend still calling an old domain**
- Check that `VITE_API_URL` is set in the Vercel environment variables (not just a local `.env` file).
- Trigger a fresh Vercel deployment after updating env vars.

**Emails not sending**
- Make sure `EMAIL_HOST_PASSWORD` is a Gmail App Password, not your account password.
- If `DEBUG=True`, emails are printed to the terminal — check there first.

**Render free tier cold start (slow first request)**
- Free-tier Render services spin down after 15 minutes of inactivity. The first request after a cold start can take 30–60 seconds.
