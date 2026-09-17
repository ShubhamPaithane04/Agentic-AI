from __future__ import annotations

import collections
import datetime
import json
import os
import queue
import re
import sqlite3
import threading
import shutil
import time
import zipfile
import io
from functools import wraps

import jwt
from dotenv import load_dotenv
from flask import Flask, Response, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from services.agent_runtime import AgentRuntime
from services.code_executor import executor
from services.nl2sql import generate_sql
from services.project_templates import get_template, list_templates
from utils.tools import list_files


load_dotenv(override=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
WORKSPACE_DIR = os.path.join(ROOT_DIR, "workspace")
DATABASE = os.path.join(BASE_DIR, "database.db")
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv(
    "JWT_SECRET",
    "change-me-in-production-with-at-least-32-bytes",
)
CORS(app, origins=ALLOWED_ORIGINS)

runtime = AgentRuntime(WORKSPACE_DIR)

# ---------------------------------------------------------------------------
# Rate limiter: sliding-window, per IP, max 10 req/min for smart-workflow
# ---------------------------------------------------------------------------
_rate_store: dict[str, collections.deque] = {}
_rate_lock = threading.Lock()
RATE_LIMIT = 10          # max requests
RATE_WINDOW = 60         # seconds


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    with _rate_lock:
        window = _rate_store.setdefault(ip, collections.deque())
        # drop timestamps outside window
        while window and window[0] < now - RATE_WINDOW:
            window.popleft()
        if len(window) >= RATE_LIMIT:
            return True
        window.append(now)
        return False


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def init_db() -> None:
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                prompt TEXT NOT NULL,
                blueprint TEXT,
                project_name TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS event_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                event_type TEXT NOT NULL,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def log_event(event_type: str, user_id: int | None = None, metadata: dict | None = None) -> None:
    """Fire-and-forget event logging — failures are silently ignored."""
    try:
        with sqlite3.connect(DATABASE) as conn:
            conn.execute(
                "INSERT INTO event_log (user_id, event_type, metadata) VALUES (?, ?, ?)",
                (user_id, event_type, json.dumps(metadata or {})),
            )
            conn.commit()
    except Exception:
        pass


def create_token(user_id: int, username: str) -> str:
    return jwt.encode(
        {
            "id": user_id,
            "username": username,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )


def auth_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header.split(" ", 1)[1].strip() if header.startswith("Bearer ") else None
        if not token:
            return jsonify({"success": False, "error": "Authentication required"}), 401

        try:
            payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Session expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401

        g.current_user = payload
        return view_func(*args, **kwargs)

    return wrapped


def stream_event(message: dict) -> str:
    return f"data: {json.dumps(message)}\n\n"


def save_history(user_id: int, prompt: str, blueprint: str, project_name: str) -> None:
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO search_history (user_id, prompt, blueprint, project_name)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, prompt, blueprint, project_name),
        )
        conn.commit()


# ---------------------------------------------------------------------------
# Routes — health / validation
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    provider_ready = bool(os.getenv("GROQ_API_KEY"))
    return jsonify(
        {
            "status": "ok",
            "app": "Aizen",
            "mode": "agentic-workspace",
            "provider_ready": provider_ready,
        }
    )


@app.get("/api/validate-key")
def validate_key():
    provider_ready = bool(os.getenv("GROQ_API_KEY"))
    github_configured = bool(os.getenv("GITHUB_TOKEN"))
    return jsonify(
        {
            "success": True,
            "backend": "connected",
            "provider_ready": provider_ready,
            "github_configured": github_configured,
            "message": "Backend connected"
            if provider_ready
            else "Backend connected. Add GROQ_API_KEY for model-backed upgrades.",
        }
    )


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.post("/api/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if len(username) < 3 or len(password) < 6:
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Username must be at least 3 characters and password at least 6 characters.",
                }
            ),
            400,
        )

    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, generate_password_hash(password)),
            )
            conn.commit()
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "error": "Username already exists"}), 409

    log_event("user_signup", user_id=user_id, metadata={"username": username})
    return jsonify(
        {
            "success": True,
            "user": {"id": user_id, "username": username},
            "token": create_token(user_id, username),
        }
    )


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "error": "Invalid username or password"}), 401

    log_event("user_login", user_id=user["id"])
    return jsonify(
        {
            "success": True,
            "user": {"id": user["id"], "username": user["username"]},
            "token": create_token(user["id"], user["username"]),
        }
    )


@app.get("/api/me")
@auth_required
def me():
    user_id = g.current_user["id"]
    # Fetch created_at for this user
    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT created_at FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        created_at = row["created_at"] if row else None

    return jsonify(
        {
            "success": True,
            "user": {
                "id": user_id,
                "username": g.current_user["username"],
                "created_at": created_at,
            },
        }
    )


@app.get("/api/history")
@auth_required
def history():
    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT prompt, blueprint, project_name, timestamp
            FROM search_history
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 20
            """,
            (g.current_user["id"],),
        )
        rows = [dict(row) for row in cursor.fetchall()]

    return jsonify({"success": True, "history": rows})


# ---------------------------------------------------------------------------
# File operations
# ---------------------------------------------------------------------------

@app.get("/api/files")
def files():
    payload = json.loads(list_files())
    if not payload.get("success"):
        return jsonify(payload), 400
    return jsonify(payload)


@app.get("/api/file_content")
def file_content_read():
    filename = request.args.get("filename", "").strip().lstrip("/\\")
    if not filename:
        return jsonify({"success": False, "error": "Filename is required"}), 400

    file_path = os.path.abspath(os.path.join(WORKSPACE_DIR, filename))
    if not file_path.startswith(WORKSPACE_DIR):
        return jsonify({"success": False, "error": "Forbidden path"}), 403

    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": "File not found"}), 404

    try:
        with open(file_path, "r", encoding="utf-8") as file_handle:
            return jsonify({"success": True, "content": file_handle.read()})
    except UnicodeDecodeError:
        return jsonify({"success": False, "error": "Binary file cannot be previewed"}), 400


@app.post("/api/file_content")
def file_content_write():
    """Write updated content back to a workspace file (Monaco editor save)."""
    data = request.get_json(silent=True) or {}
    filename = (data.get("filename") or "").strip().lstrip("/\\")
    content = data.get("content")

    if not filename:
        return jsonify({"success": False, "error": "Filename is required"}), 400
    if content is None:
        return jsonify({"success": False, "error": "Content is required"}), 400

    file_path = os.path.abspath(os.path.join(WORKSPACE_DIR, filename))
    if not file_path.startswith(WORKSPACE_DIR):
        return jsonify({"success": False, "error": "Forbidden path"}), 403

    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as fh:
            fh.write(content)
        log_event("file_edited", metadata={"filename": filename})
        return jsonify({"success": True, "message": f"Saved {filename}"})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


# ---------------------------------------------------------------------------
# Main AI workflow (with rate limiting)
# ---------------------------------------------------------------------------

@app.post("/api/smart-workflow")
def smart_workflow():
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")
    if _is_rate_limited(client_ip):
        return (
            jsonify({"success": False, "error": "Rate limit exceeded. Max 10 requests per minute."}),
            429,
        )

    payload = request.get_json(silent=True) or {}
    prompt = (payload.get("prompt") or "").strip()
    conversation = payload.get("conversation") or []
    if not prompt:
        return jsonify({"success": False, "error": "Prompt is required"}), 400

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1].strip() if auth_header.startswith("Bearer ") else None
    current_user = None
    if token:
        try:
            current_user = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.InvalidTokenError:
            current_user = None

    event_queue: queue.Queue = queue.Queue()

    def emit(message_type: str, **kwargs):
        event_queue.put({"type": message_type, **kwargs})

    def worker():
        try:
            result = runtime.run(prompt, emit, conversation=conversation)

            if current_user:
                save_history(
                    current_user["id"],
                    prompt,
                    result.blueprint,
                    result.project_name,
                )
                log_event(
                    "project_generated",
                    user_id=current_user["id"],
                    metadata={"project_name": result.project_name, "blueprint": result.blueprint},
                )

            emit(
                "done",
                content="Workflow Complete",
                message=result.summary,
                files=result.files,
                manifest=result.manifest,
            )
        except Exception as exc:  # pragma: no cover - defensive path
            emit("error", content=str(exc))
        finally:
            event_queue.put(None)

    threading.Thread(target=worker, daemon=True).start()

    def generate():
        while True:
            message = event_queue.get()
            if message is None:
                break
            yield stream_event(message)

    return Response(generate(), mimetype="text/event-stream")


# ---------------------------------------------------------------------------
# Code Execution
# ---------------------------------------------------------------------------

@app.route('/api/execute', methods=['POST'])
def execute_code():
    """Execute code in a sandbox and return output."""
    data = request.json or {}
    language = data.get('language', 'python')
    code = data.get('code', '')

    if not code:
        return jsonify({'success': False, 'error': 'No code provided'}), 400

    if language in ['python', 'py']:
        result = executor.execute_python(code)
    elif language in ['javascript', 'js']:
        result = executor.execute_javascript(code)
    else:
        return jsonify({'success': False, 'error': f'Unsupported language: {language}'}), 400

    log_event("code_executed", metadata={"language": language})
    return jsonify(result)


# ---------------------------------------------------------------------------
# English -> SQL (SQL Assistant)
# ---------------------------------------------------------------------------

@app.route('/api/nl2sql', methods=['POST'])
def nl2sql():
    """Translate an English question into a SQL query via prompt-based generation."""
    data = request.get_json(silent=True) or {}
    question = (data.get('question') or '').strip()
    schema = data.get('schema') or ''
    dialect = data.get('dialect') or 'SQLite'

    if not question:
        return jsonify({'success': False, 'error': 'A question is required'}), 400

    try:
        result = generate_sql(question, schema=schema, dialect=dialect)
    except ValueError as exc:
        return jsonify({'success': False, 'error': str(exc)}), 400
    except Exception as exc:
        return jsonify({'success': False, 'error': f'SQL generation failed: {exc}'}), 502

    if not result.get('sql'):
        return jsonify({'success': False, 'error': 'The model did not return a SQL query. Try rephrasing the question.'}), 502

    log_event(
        "nl2sql_generated",
        metadata={"dialect": dialect, "has_schema": bool(schema.strip())},
    )
    return jsonify({'success': True, **result})


# ---------------------------------------------------------------------------
# Project Templates
# ---------------------------------------------------------------------------

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """List all available project templates."""
    templates = list_templates()
    return jsonify({'success': True, 'templates': templates})


@app.route('/api/templates/<template_id>', methods=['POST'])
def create_from_template(template_id):
    """Create a new project from template."""
    template = get_template(template_id)
    if not template:
        return jsonify({'success': False, 'error': 'Template not found'}), 404

    try:
        if os.path.exists(WORKSPACE_DIR):
            shutil.rmtree(WORKSPACE_DIR)
        os.makedirs(WORKSPACE_DIR, exist_ok=True)

        for filename, content in template['files'].items():
            filepath = os.path.join(WORKSPACE_DIR, filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

        log_event("template_used", metadata={"template_id": template_id, "name": template.get("name")})
        return jsonify({
            'success': True,
            'message': f"Created {template['name']}",
            'files': list(template['files'].keys())
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

@app.route('/api/export', methods=['GET'])
def export_project():
    """Export workspace as downloadable ZIP file."""
    try:
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files_list in os.walk(WORKSPACE_DIR):
                for file in files_list:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, WORKSPACE_DIR)
                    zf.write(file_path, arcname)

        memory_file.seek(0)
        log_event("export_downloaded")
        return Response(
            memory_file.getvalue(),
            mimetype='application/zip',
            headers={'Content-Disposition': 'attachment;filename=project.zip'}
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Project Statistics
# ---------------------------------------------------------------------------

@app.route('/api/stats', methods=['GET'])
def get_project_stats():
    """Get statistics about the current project."""
    try:
        stats = {
            'files': 0,
            'lines': 0,
            'languages': set(),
            'size_bytes': 0
        }

        if os.path.exists(WORKSPACE_DIR):
            for root, dirs, files_list in os.walk(WORKSPACE_DIR):
                for file in files_list:
                    filepath = os.path.join(root, file)
                    stats['files'] += 1
                    stats['size_bytes'] += os.path.getsize(filepath)

                    ext = os.path.splitext(file)[1]
                    if ext in ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.java', '.cpp']:
                        stats['languages'].add(ext[1:])
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                stats['lines'] += len(f.readlines())
                        except Exception:
                            pass

        stats['languages'] = list(stats['languages'])
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@app.route('/api/analytics', methods=['GET'])
@auth_required
def get_analytics():
    """Return 7-day usage data and workspace language breakdown for the current user."""
    user_id = g.current_user["id"]

    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Prompts per day (last 7 days)
        cur.execute(
            """
            SELECT DATE(timestamp) as day, COUNT(*) as count
            FROM search_history
            WHERE user_id = ?
              AND timestamp >= DATETIME('now', '-7 days')
            GROUP BY DATE(timestamp)
            ORDER BY day ASC
            """,
            (user_id,),
        )
        daily_rows = [dict(r) for r in cur.fetchall()]

        # Total prompts and projects
        cur.execute(
            "SELECT COUNT(*) as total FROM search_history WHERE user_id = ?",
            (user_id,),
        )
        total_prompts = cur.fetchone()["total"]

        # Event breakdown
        cur.execute(
            """
            SELECT event_type, COUNT(*) as count
            FROM event_log
            WHERE user_id = ?
            GROUP BY event_type
            """,
            (user_id,),
        )
        events = {r["event_type"]: r["count"] for r in cur.fetchall()}

    # Build a full 7-day series (fill missing days with 0)
    today = datetime.date.today()
    day_map = {r["day"]: r["count"] for r in daily_rows}
    series = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        label = day.strftime("%a")
        series.append({"day": label, "date": day.isoformat(), "prompts": day_map.get(day.isoformat(), 0)})

    # Language breakdown from workspace
    lang_counts: dict[str, int] = {}
    if os.path.exists(WORKSPACE_DIR):
        for root, dirs, files_list in os.walk(WORKSPACE_DIR):
            for file in files_list:
                ext = os.path.splitext(file)[1].lstrip(".")
                if ext in ("py", "js", "jsx", "ts", "tsx", "html", "css", "json", "md"):
                    lang_counts[ext] = lang_counts.get(ext, 0) + 1

    lang_data = [{"name": k.upper(), "value": v} for k, v in sorted(lang_counts.items(), key=lambda x: -x[1])]

    return jsonify({
        "success": True,
        "daily_prompts": series,
        "total_prompts": total_prompts,
        "events": events,
        "languages": lang_data,
    })


# ---------------------------------------------------------------------------
# GitHub push (existing feature — keep intact)
# ---------------------------------------------------------------------------

@app.route('/api/github-push', methods=['POST'])
def github_push():
    """Push workspace to a new GitHub repository."""
    import base64
    data = request.get_json(silent=True) or {}
    github_token = data.get("githubToken", "")
    if not github_token:
        github_token = os.getenv("GITHUB_TOKEN", "")
    repo_name = data.get("repoName", "aizen-project")
    is_private = bool(data.get("private", False))
    description = (data.get("description") or "").strip()

    if not github_token:
        return jsonify({"success": False, "error": "GitHub token is required"}), 400
    if not os.path.exists(WORKSPACE_DIR):
        return jsonify({"success": False, "error": "No project workspace found to publish."}), 400

    repo_name = slugify_repo_name(repo_name)
    if not repo_name:
        repo_name = "aizen-project"

    import urllib.request
    import urllib.error

    headers_gh = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Aizen-App",
    }

    # 1. Create repo
    try:
        repo_data = create_github_repo(headers_gh, repo_name, is_private, description)
        repo_full_name = repo_data["full_name"]
        final_repo_name = repo_data["name"]
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        return jsonify({"success": False, "error": f"Repo creation failed: {err_body}"}), 400

    # 2. Push files
    pushed_files = []
    if os.path.exists(WORKSPACE_DIR):
        for root, dirs, files_list in os.walk(WORKSPACE_DIR):
            for fname in files_list:
                fpath = os.path.join(root, fname)
                rel = os.path.relpath(fpath, WORKSPACE_DIR).replace("\\", "/")
                try:
                    with open(fpath, "rb") as fh:
                        encoded = base64.b64encode(fh.read()).decode()
                    body = json.dumps({"message": f"Add {rel}", "content": encoded}).encode()
                    url = f"https://api.github.com/repos/{repo_full_name}/contents/{rel}"
                    req2 = urllib.request.Request(url, data=body, headers=headers_gh)
                    urllib.request.urlopen(req2)
                    pushed_files.append(rel)
                except Exception:
                    pass  # skip unreadable files

    log_event("github_push", metadata={"repo": final_repo_name, "files": len(pushed_files)})
    return jsonify({
        "success": True,
        "url": f"https://github.com/{repo_full_name}",
        "repo": final_repo_name,
        "files_pushed": len(pushed_files),
        "message": f"Pushed {len(pushed_files)} files to {repo_full_name}",
    })


def slugify_repo_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", (value or "").strip().lower()).strip("-._")
    return cleaned[:100]


def create_github_repo(headers_gh: dict, base_name: str, is_private: bool, description: str) -> dict:
    import urllib.request
    import urllib.error

    candidates = [
        base_name,
        f"{base_name}-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
    ]

    for candidate in candidates:
        create_body = json.dumps({
            "name": candidate,
            "private": is_private,
            "auto_init": False,
            "description": description,
        }).encode()
        req = urllib.request.Request("https://api.github.com/user/repos", data=create_body, headers=headers_gh)
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as exc:
            if exc.code == 422:
                continue
            raise

    raise urllib.error.HTTPError(
        url="https://api.github.com/user/repos",
        code=422,
        msg="Repository name already exists and fallback naming also failed",
        hdrs=None,
        fp=None,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
else:
    init_db()
