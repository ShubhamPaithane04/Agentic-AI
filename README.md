# Aizen

Aizen is an AI coding workspace that takes one prompt, chooses a project shape, scaffolds files, and shows the result inside a React app.

## Active Architecture

- [backend](D:\Projects\sdr-agent\backend): Flask API
- [aizen/frontend](D:\Projects\sdr-agent\aizen\frontend): React frontend
- [workspace](D:\Projects\sdr-agent\workspace): latest generated output

## Prerequisites

- Python 3.10+
- Node.js + npm
- Windows PowerShell or Command Prompt
- Optional: `GROQ_API_KEY` if you want model-backed generation instead of template-only fallback

## Project Setup

### Backend setup

```bash
cd backend
..\venv\Scripts\python.exe -m pip install -r requirements.txt
```

If you do not want to use the existing virtual environment:

```bash
python -m venv venv
venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### Frontend setup

```bash
cd aizen/frontend
npm install
```

## Environment Variables

Create `backend/.env` if needed:

```env
PORT=5000
JWT_SECRET=change-me-in-production-with-at-least-32-bytes
GROQ_API_KEY=your_key_here
```

Notes:

- The app still runs without `GROQ_API_KEY`
- With no model key, Aizen falls back to local template-based project generation

## How To Run

### Option 1: Run backend and frontend manually

Backend:

```bash
cd backend
..\venv\Scripts\python.exe app.py
```

Frontend:

```bash
cd aizen/frontend
npm run dev -- --host 127.0.0.1
```

Open:

- frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- backend health: [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health)

### Option 2: Use the startup scripts

Windows:

```bash
start.bat
```

Shell:

```bash
sh start.sh
```

## Quick Check

After starting the app:

1. Open [http://127.0.0.1:5173](http://127.0.0.1:5173)
2. Confirm the backend status is online in the UI
3. Try a prompt like:

```text
Build a full-stack SaaS dashboard with auth
```

4. Check generated files in [workspace](D:\Projects\sdr-agent\workspace)

## Main API Endpoints

- `GET /health`
- `GET /api/validate-key`
- `POST /api/signup`
- `POST /api/login`
- `GET /api/me`
- `GET /api/history`
- `POST /api/smart-workflow`
- `GET /api/files`
- `GET /api/file_content`

## What The App Does

1. Accepts a natural-language build request
2. Interprets the request as a project blueprint
3. Generates a small project scaffold
4. Writes the files into `workspace/`
5. Streams the result back into the frontend

## Troubleshooting

### Frontend says backend offline

- Make sure backend is running on port `5000`
- Open [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health)
- Refresh the frontend once after backend starts

### Vite does not start in PowerShell

Use:

```bash
npm.cmd run dev -- --host 127.0.0.1
```

### Backend import errors

Make sure you are using the project virtual environment:

```bash
..\venv\Scripts\python.exe app.py
```
