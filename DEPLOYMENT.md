# Deployment Guide: Django to Render + React to Vercel

## Backend Deployment (Django on Render)

### Step 1: Push Changes to GitHub
```bash
git add .
git commit -m "Setup Render deployment for Django"
git push origin main
```

### Step 2: Create Render Account & Web Service
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select this repository

### Step 3: Configure Render Web Service
- **Name**: `cimore-backend` (or similar)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r server/requirements.txt && python server/manage.py collectstatic --noinput`
- **Start Command**: `cd server && gunicorn cimore_backend.wsgi`
- **Plan**: Free (or Pro for production)

### Step 4: Add Environment Variables in Render Dashboard
Add these in the "Environment" section:
```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.rwytyuivhhsxvuhdoobz.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR_PASSWORD]@db.rwytyuivhhsxvuhdoobz.supabase.co:5432/postgres
SECRET_KEY=[generate-a-strong-secret-key]
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-render-app.onrender.com,cimore.vercel.app
```

### Step 5: Deploy
- Click "Create Web Service"
- Render will automatically deploy when you push to main
- Your backend will be at: `https://your-render-app.onrender.com`

---

## Frontend Configuration (React on Vercel)

### Step 1: Create `.env.local` for Development
```bash
VITE_API_URL=http://localhost:8000
```

### Step 2: Create `.env.production` for Production
```bash
VITE_API_URL=https://your-render-app.onrender.com
```

### Step 3: Update All Components
Replace hardcoded API URLs with the centralized config:
```javascript
// OLD (in every component):
const API = 'https://ci-mo-re-deploy-isra.vercel.app';

// NEW (in every component):
import { API } from '../config/api.js';
```

### Step 4: Update Vercel Environment Variables
1. Go to [vercel.com](https://vercel.com) dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   - **VITE_API_URL**: `https://your-render-app.onrender.com`

### Step 5: Deploy
```bash
git push origin main
```
Vercel will automatically redeploy with the new API URL.

---

## Local Development

```bash
# Backend
cd server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000

# Frontend (new terminal)
npm run dev
```

Visit `http://localhost:3000` and it will connect to `http://localhost:8000`.

---

## Troubleshooting

### CORS Errors?
- Make sure `ALLOWED_HOSTS` includes your Render domain
- Make sure `CORS_ALLOWED_ORIGINS` includes your Vercel domain

### Database Connection Failed?
- Verify `DATABASE_URL` is correct in Render environment variables
- Check Supabase connection is working: `psql postgresql://...`

### Frontend Still calling old domain?
- Check `.env.local` and `.env.production` are set correctly
- Verify `import { API }` is used in all components
- Clear browser cache and rebuild

---

## Generated Services
- **Backend**: `https://your-render-app.onrender.com`
- **Frontend**: `https://your-vercel-app.vercel.app`
- **Database**: Supabase (existing)
- **Node Service**: `http://localhost:3001` (optional)
