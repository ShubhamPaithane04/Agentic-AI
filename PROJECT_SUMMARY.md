# Aizen - AI-Powered Development Assistant

## Project Overview
**Aizen** is a full-stack AI coding assistant that generates complete projects through natural conversation. It's a production-ready web application with a modern React frontend and Flask backend, featuring real-time code execution, project templates, and instant project export.

---

## 🎯 Core Functionality

### What It Does
- **Conversational Project Generation**: Chat naturally to build complete applications
- **Template Library**: Instant deployment of React, Flask, and Express.js projects
- **Code Execution**: Run Python and JavaScript code directly in the browser
- **Project Export**: Download generated projects as ZIP files
- **File Management**: Browse, view, and edit generated code in real-time
- **Multi-Agent Architecture**: Specialized agents for coding, debugging, planning, and testing

---

## 🏗️ Technical Architecture

### Backend (Flask + Python)
**Key Backend Features:**
- RESTful API with Server-Sent Events (SSE) for streaming
- Subprocess-based code execution with 10s timeout protection
- ZIP compression for project export
- SQLite database for user authentication
- UTF-8 encoding throughout for Unicode support
- CORS-enabled for cross-origin requests

### Frontend (React + Vite)
**Key Frontend Features:**
- React 18 with hooks and functional components
- Vite for blazing-fast HMR (Hot Module Replacement)
- Zustand for lightweight state management
- Tailwind CSS + custom theme system
- Lucide React icons
- Server-Sent Events client for real-time streaming
- Responsive design (mobile-friendly)

---

## 🚀 Major Features

### 1. **Template System**
- **React Todo App**: Modern hooks-based app with state management
- **Flask REST API**: Complete CRUD API with SQLite database
- **Express.js API**: Node.js server with CORS and routing
- One-click deployment to workspace

### 2. **Code Execution Service**
- Execute Python and JavaScript safely
- Subprocess isolation for security
- Real-time stdout/stderr streaming
- Timeout protection (10 seconds)

### 3. **Project Export**
- Download entire workspace as ZIP
- Preserves folder structure
- One-click from UI

### 4. **Real-Time Chat Interface**
- Streaming responses via SSE
- Message history with persistence
- Markdown rendering with syntax highlighting
- Tool call visualization

### 5. **File Explorer & Code Viewer**
- Tree-based file navigation
- Syntax-highlighted code display
- Search functionality
- Terminal emulation

---

## 🔐 Security Features

- **Sandboxed Execution**: Code runs in isolated subprocess
- **Timeout Protection**: 10-second hard limit on code execution
- **Path Traversal Prevention**: Workspace-only file access
- **JWT Authentication**: Secure user sessions
- **Password Hashing**: Werkzeug bcrypt for credentials

---

## 📡 Key API Endpoints

- `POST /api/signup` - Create user account
- `POST /api/login` - Login and get JWT
- `GET /api/templates` - List all templates
- `POST /api/templates/{id}` - Create from template
- `POST /api/execute` - Run Python/JS code
- `GET /api/export` - Download project ZIP
- `GET /api/files` - List workspace files
- `GET /api/stats` - Project statistics

---

## 🛠️ Tech Stack

**Backend:** Flask, Python 3.8+, SQLite, Werkzeug
**Frontend:** React 18, Vite 8, Zustand, Tailwind CSS, Lucide Icons
**Development:** Node.js 18+, Python venv, Git

---

## 🚦 How to Run

```bash
# Quick start
start.bat

# Or manually:
# Terminal 1: venv\Scripts\activate && python backend/app.py
# Terminal 2: cd aizen/frontend && npm run dev
```

**Access:** http://localhost:5173

---

## 🎓 Why This Is a Major Project

1. ✅ **Full-Stack Architecture** - Complete backend + frontend
2. ✅ **Real Code Execution** - Not just templates, actual running code
3. ✅ **Production-Grade** - Error handling, security, optimization
4. ✅ **Modern Stack** - Latest React, Vite, Flask patterns
5. ✅ **Security Focused** - Sandboxing, auth, validation
6. ✅ **Polished UI** - Professional design with animations
7. ✅ **Scalable Design** - Service layer, modular components
8. ✅ **Comprehensive Docs** - Well-documented code

---

## 📊 Stats

- **Total Files**: 50+ source files
- **Lines of Code**: ~8,000+
- **Components**: 15+ React components
- **API Endpoints**: 15+
- **Templates**: 3 ready-to-deploy projects
- **Languages**: Python, JavaScript, JSX, CSS, HTML

---

**Built for [Your College/University] Major Project**
