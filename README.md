<div align="center">

<img src="docs/screenshots/logo.png" width="88" alt="Aizen logo">

# Aizen

### Type a prompt. Get a working project.

Aizen is a browser-based AI coding assistant. Describe what you want to build, and it classifies your intent, scaffolds a real project across ~10 tech stacks, and then keeps iterating — reading files, editing them, validating the result — until it's actually done, not just generated once and abandoned.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](backend/requirements.txt)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)](backend/app.py)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](aizen/frontend/package.json)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](aizen/frontend/package.json)
[![Groq](https://img.shields.io/badge/LLM-Groq-F55036)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-informational)](LICENSE)
[![Stars](https://img.shields.io/github/stars/ShubhamPaithane04/Agentic-AI?style=flat&color=purple)](../../stargazers)

<img src="docs/screenshots/landing.png" width="850" alt="Aizen landing page">

**[Features](#features) · [Architecture](#architecture) · [Quickstart](#getting-started) · [API](#api-reference) · [Roadmap](#roadmap)**

</div>

---

> **If Aizen is useful to you, a ⭐ on the repo goes a long way — it's the easiest way to support it.**

## What makes it different

Most "AI project generator" demos do one thing: call an LLM once, dump some files, done. Aizen is built around ideas that go further:

|  | Typical one-shot generator | Aizen |
|---|---|---|
| **Understanding your ask** | Treats every message as "generate" | Classifies intent first — chat, new build, or edit |
| **Follow-ups** | Regenerates the whole project from scratch | Edits the existing workspace in place |
| **Generation** | Single LLM call, hope for the best | Agent loop: list → read → edit → **validate**, on a budget of steps |
| **API failure** | Empty response, dead end | Deterministic local fallback — you always get *something* working |
| **Visibility** | Black box until the zip drops | Every generated file is browsable mid-session |

- 🧠 **Intent-first, not generation-first** — a follow-up like "add a dark mode toggle" edits your existing project instead of regenerating it from scratch
- 🔁 **An agent loop, not a single shot** — bounded read/edit/validate cycles instead of trusting the first draft
- 🛟 **It never returns nothing** — if the Groq call fails, a deterministic local fallback still produces a working template

## Features

| | |
|---|---|
| 🧠 **Intent classification** | Routes each prompt to chat, new-project, or modify-project handling automatically |
| 🏗️ **Multi-stack project generation** | Scaffolds full projects — plain HTML up to React + Flask — across ~10 supported stacks |
| 🔁 **Agentic build loop** | Iterative read → edit → validate cycle instead of one-shot generation |
| 💻 **Live editor & preview** | Monaco-powered in-browser editing with a live preview pane |
| ▶️ **Sandboxed code execution** | Run Python/JS snippets server-side with timeout protection |
| 🗄️ **SQL assistant** | Natural-language-to-SQL tool panel for querying data |
| 📊 **Analytics dashboard** | Recharts-based view of workspace stats — files, size, languages |
| 📦 **One-click export** | Download the generated workspace as a ZIP, or push straight to GitHub |
| 🔐 **Auth** | JWT-based signup/login with hashed credentials |

## Screenshots

<p align="center">
  <img src="docs/screenshots/login.png" width="420" alt="Login screen">
  <img src="docs/screenshots/landing-cta.png" width="420" alt="Landing page CTA and feature grid">
</p>

## Architecture

```
Browser (React + Vite)
   │  prompt
   ▼
Flask API  ──►  Intent Classifier
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
    plain chat   new project   modify project
                     │             │
                     ▼             ▼
              Groq LLM (structured output)
                     │
             (on failure) ──► deterministic template fallback
                     │
                     ▼
              Agent loop: list → read → edit → validate  (bounded steps)
                     │
                     ▼
              workspace/  (files streamed back to the UI)
```

- **Backend** — Flask, SQLite, JWT auth, subprocess-sandboxed code execution, SSE streaming
- **Frontend** — React 19, Vite 8, Zustand, Tailwind CSS 4, Monaco Editor, Recharts

## Tech stack

**Backend:** Flask · Groq SDK · SQLite · PyJWT · python-dotenv
**Frontend:** React 19 · Vite 8 · Zustand · Tailwind CSS 4 · Monaco Editor · Recharts · React Router · react-markdown

## Getting started

### Prerequisites

- Python 3.10+
- Node.js + npm
- (Optional) A [Groq API key](https://console.groq.com) — without one, Aizen falls back to local template generation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt   # Windows
# source venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
```

Create `backend/.env`:

```env
PORT=5000
JWT_SECRET=change-me-in-production-with-at-least-32-bytes
GROQ_API_KEY=your_key_here
```

```bash
python app.py
```

### Frontend

```bash
cd aizen/frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open **http://127.0.0.1:5173** (backend health check: **http://127.0.0.1:5000/health**).

### Or use the one-shot scripts

```bash
start.bat     # Windows
sh start.sh   # macOS/Linux
```

## Try it

1. Open the app and confirm the backend status shows online
2. Prompt: `Build a full-stack SaaS dashboard with auth`
3. Watch the workspace populate — then try a follow-up like `add a settings page` and watch it modify the same project instead of starting over

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/validate-key` | Validate configured Groq key |
| `POST` | `/api/signup` / `/api/login` | JWT auth |
| `GET` | `/api/me` | Current user |
| `GET` | `/api/history` | Prompt/build history |
| `POST` | `/api/smart-workflow` | Main entry point — intent classification → build/modify/chat |
| `GET` | `/api/files` | List workspace files |
| `GET`/`POST` | `/api/file_content` | Read / write a file |
| `POST` | `/api/execute` | Run Python/JS in a sandboxed subprocess |
| `POST` | `/api/nl2sql` | Natural language → SQL |
| `GET` | `/api/templates` / `POST /api/templates/<id>` | List and deploy starter templates |
| `GET` | `/api/export` | Download workspace as ZIP |
| `GET` | `/api/stats` / `/api/analytics` | Workspace metrics |
| `POST` | `/api/github-push` | Push the generated workspace to GitHub |

## Roadmap

- [ ] Django, Vue, and Next.js project templates
- [ ] Live iframe preview for generated web projects
- [ ] One-click deploy (Vercel / Render) alongside GitHub push
- [ ] Real-time multi-user collaboration on a workspace
- [ ] Dockerized code execution sandbox

## Contributing

Issues and PRs are welcome. If you're proposing a larger change (a new stack template, a change to the agent loop), open an issue first so we can talk shape before code.

```bash
git checkout -b feature/your-idea
# make your changes
git commit -m "Add your idea"
git push origin feature/your-idea
```

## Security notes

- Code execution runs in an isolated subprocess with a 10-second timeout
- File operations are constrained to the workspace directory (no path traversal)
- Passwords are hashed with Werkzeug; sessions use JWT
- Secrets live in `backend/.env`, which is git-ignored — never commit it

## Troubleshooting

<details>
<summary>Frontend says backend is offline</summary>

Confirm the backend is running on port `5000` and `http://127.0.0.1:5000/health` responds. Refresh the frontend once the backend is up.
</details>

<details>
<summary>Vite won't start in PowerShell</summary>

```bash
npm.cmd run dev -- --host 127.0.0.1
```
</details>

<details>
<summary>Backend import errors</summary>

Make sure you're running with the project virtual environment's interpreter, not a global Python install.
</details>

## License

MIT — see [LICENSE](LICENSE).

<div align="center">

Built by [Shubham Paithane](https://github.com/ShubhamPaithane04)

If this saved you time, [★ star the repo](../../stargazers) — it helps others find it.

</div>
