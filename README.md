<div align="center " bg-color="#ffffff">
<img width="1200" height="475" alt="GHBanner" src="https://slc-sflu.edu.ph/wp-content/uploads/2025/02/CIMO-Logo-1.png" />
</div>

# CIMOre Admin Dashboard

This repository contains a Django backend and a React + Vite frontend.

## Prerequisites

- Python 3.11+ (or a compatible Python 3 version)
- Node.js 20+ and npm
- Optional: Git if you need to clone the repository

## Backend setup (Django)

1. Open a terminal in the repository root:
   `cd c:\\Users\\jeric\\Documents\\CIMOre`

2. Create and activate a virtual environment:
   `python -m venv venv`
   `venv\\Scripts\\activate`

3. Install Python dependencies:
   `pip install --upgrade pip`
   `pip install -r requirements.txt`

4. Apply database migrations:
   `python manage.py migrate`

5. Start the backend server:
   `python manage.py runserver`

## Frontend setup (React / Vite)

1. Open a new terminal or keep the backend running separately.
2. Change to the frontend folder:
   `cd CIMOre`
3. Install Node dependencies:
   `npm install`
4. Start the frontend development server:
   `npm run dev`

## Notes

- If the frontend requires environment configuration, add any API keys or settings to a `.env.local` or equivalent file.
- On non-Windows systems, use `source venv/bin/activate` instead of `venv\\Scripts\\activate`.
- Stop servers with `Ctrl+C` in each terminal.

## Default System Credentials
- Important: Change these passwords immediately after first login for security.

## Superuser (Django Admin)
Username: `test.admin@slc-sflu.edu.ph`
Password: `CiMORe@2026`

## System Admin Account
Email: `test.admin@slc-sflu.edu.ph`
Password: `CiMORe@2026`

## Test User Account
Email: `22101222@slc-sflu.edu.ph`
Password: `User12345@`
