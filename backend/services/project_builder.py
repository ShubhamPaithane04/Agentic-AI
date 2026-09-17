"""Project generation helpers for Aizen's assistant-style builder."""

from __future__ import annotations

import json
import os
import re
import traceback
from dataclasses import dataclass, field

from utils.config import get_groq_client


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return normalized or "aizen-project"


def detect_blueprint(prompt: str) -> str:
    text = prompt.lower()

    if any(word in text for word in ["saas", "full stack", "fullstack", "auth", "dashboard"]):
        return "fullstack"
    if any(word in text for word in ["express", "node api", "node.js", "nodejs", "rest api"]):
        return "node-api"
    if any(word in text for word in ["flask", "fastapi", "python api", "backend api", "server api"]):
        return "python-api"
    if any(word in text for word in ["landing page", "portfolio", "website", "hero section"]):
        return "landing-page"
    if any(word in text for word in ["scraper", "crawler", "automation script", "cli", "command line", "terminal tool"]):
        if "java" in text:
            return "java-cli"
        if "c++" in text or "cpp" in text:
            return "cpp-cli"
        return "python-cli"
    if any(word in text for word in ["spring boot", "java app", "java project", "java cli"]):
        return "java-cli"
    if any(word in text for word in ["c++", "cpp", "competitive programming", "cpp cli"]):
        return "cpp-cli"
    if any(word in text for word in ["php", "laravel", "php site"]):
        return "php-site"
    if any(word in text for word in ["react", "vite", "frontend", "todo", "ui", "typescript ui"]):
        return "react-app"

    return "starter"


@dataclass
class BuildResult:
    project_name: str
    blueprint: str
    summary: str
    files: dict[str, str]
    suggested_commands: list[str]
    source: str = "template"
    runtime: dict = field(default_factory=dict)
    validation: list[str] = field(default_factory=list)
    plan: list[str] = field(default_factory=list)

    @property
    def manifest(self) -> dict:
        return {
            "project_name": self.project_name,
            "blueprint": self.blueprint,
            "files": list(self.files.keys()),
            "suggested_commands": self.suggested_commands,
            "source": self.source,
            "runtime": self.runtime,
            "validation": self.validation,
            "plan": self.plan,
        }


class ProjectBuilder:
    def __init__(self) -> None:
        self.model = "openai/gpt-oss-120b"
        self._last_build_error: str | None = None

    def _history_to_model_messages(self, conversation: list[dict]) -> list[dict]:
        messages = []
        for item in conversation[-16:]:
            role = item.get("role")
            content = item.get("content", [])
            if role not in {"user", "assistant"}:
                continue
            text_parts = [block.get("text", "") for block in content if block.get("type") == "text"]
            joined = "\n\n".join(part for part in text_parts if part.strip())
            if joined:
                messages.append({"role": role, "content": joined})
        return messages

    def _conversation_memory_summary(self, conversation: list[dict]) -> str:
        older_messages = conversation[:-16]
        if not older_messages:
            return ""
        memory_lines = []
        for item in older_messages[-24:]:
            role = item.get("role")
            if role not in {"user", "assistant"}:
                continue
            text_parts = [block.get("text", "") for block in item.get("content", []) if block.get("type") == "text"]
            joined = " ".join(part.strip() for part in text_parts if part.strip())
            if joined:
                memory_lines.append(f"{role.upper()}: {joined[:120]}")
        return "\n".join(memory_lines)

    def build(self, prompt: str, conversation: list[dict] | None = None) -> BuildResult:
        self._last_build_error = None
        model_result = self._build_with_model(prompt, conversation=conversation)
        if model_result:
            return self._finalize_build(model_result, prompt)

        fallback = self._build_with_templates(prompt)
        if self._last_build_error:
            fallback.summary += (
                f"\n\n_(debug: AI-backed generation failed, so this is a generic fallback template — {self._last_build_error})_"
            )
        return fallback

    def build_template_fallback(self, prompt: str) -> BuildResult:
        return self._build_with_templates(prompt)

    def _build_with_model(self, prompt: str, conversation: list[dict] | None = None) -> BuildResult | None:
        try:
            client = get_groq_client()
        except Exception as exc:
            print(f"[Aizen] Could not create Groq client for build ({type(exc).__name__}): {exc}")
            traceback.print_exc()
            self._last_build_error = f"could not create Groq client — {type(exc).__name__}: {exc}"
            return None

        blueprint = detect_blueprint(prompt)
        system_prompt = """
You are Aizen, an expert coding assistant that behaves more like ChatGPT/Claude than a toy generator.
Given a user's build request, return ONLY valid JSON with this shape:
{
  "project_name": "short-kebab-name",
  "blueprint": "react-app | python-api | landing-page | python-cli | fullstack | node-api | java-cli | cpp-cli | php-site | starter",
  "assistant_reply": "Concise but helpful explanation in markdown. Include what you built, assumptions, and next steps.",
  "suggested_commands": ["command one", "command two"],
  "files": [
    {"path": "README.md", "content": "file contents here"}
  ]
}

Rules:
- Generate a small but coherent project, usually 3-10 files.
- Keep files production-shaped and runnable, but concise.
- Use plain ASCII.
- The assistant_reply should sound calm, practical, and teammate-like.
- Prefer including a previewable HTML entry for UI-heavy projects when practical.
- Do not wrap the JSON in markdown fences.
"""
        user_prompt = f"User request: {prompt}\nPreferred blueprint hint: {blueprint}"

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if conversation:
            memory_summary = self._conversation_memory_summary(conversation)
            if memory_summary:
                messages.append({
                    "role": "system",
                    "content": (
                        "Conversation memory from earlier in this thread:\n"
                        f"{memory_summary}\n"
                        "Use this to stay consistent with the ongoing conversation."
                    )
                })
            messages.extend(self._history_to_model_messages(conversation))

        messages.append({"role": "user", "content": user_prompt})

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.35,
            )
            response_text = response.choices[0].message.content.strip()
            payload = self._parse_json(response_text)
            files = {
                item["path"]: item["content"]
                for item in payload.get("files", [])
                if item.get("path") and item.get("content") is not None
            }
            if not files:
                self._last_build_error = "model response parsed but contained no files"
                return None

            return BuildResult(
                project_name=slugify(payload.get("project_name", "aizen-project")),
                blueprint=payload.get("blueprint", blueprint),
                summary=payload.get("assistant_reply", "Generated a project from your request."),
                files=files,
                suggested_commands=payload.get("suggested_commands", []),
                source="model",
            )
        except Exception as exc:
            print(f"[Aizen] Model-backed build failed ({type(exc).__name__}): {exc}")
            traceback.print_exc()
            self._last_build_error = f"{type(exc).__name__}: {exc}"
            return None

    def _parse_json(self, text: str) -> dict:
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())

    def _build_with_templates(self, prompt: str) -> BuildResult:
        blueprint = detect_blueprint(prompt)
        project_name = self._extract_project_name(prompt, blueprint)

        if blueprint == "react-app":
            files = self._react_app(project_name, prompt)
            commands = ["npm install", "npm run dev", "npm run build"]
        elif blueprint == "python-api":
            files = self._python_api(project_name, prompt)
            commands = ["pip install -r requirements.txt", "python app.py"]
        elif blueprint == "landing-page":
            files = self._landing_page(project_name, prompt)
            commands = ["Open preview.html in a browser"]
        elif blueprint == "python-cli":
            files = self._python_cli(project_name, prompt)
            commands = ["python main.py --help", "python main.py demo"]
        elif blueprint == "fullstack":
            files = self._fullstack(project_name, prompt)
            commands = [
                "cd frontend && npm install && npm run dev",
                "cd backend && pip install -r requirements.txt && python app.py",
            ]
        elif blueprint == "node-api":
            files = self._node_api(project_name, prompt)
            commands = ["npm install", "npm run dev"]
        elif blueprint == "java-cli":
            files = self._java_cli(project_name, prompt)
            commands = ["javac src/Main.java", "java -cp src Main"]
        elif blueprint == "cpp-cli":
            files = self._cpp_cli(project_name, prompt)
            commands = ["g++ -std=c++17 src/main.cpp -o app", ".\\app"]
        elif blueprint == "php-site":
            files = self._php_site(project_name, prompt)
            commands = ["php -S localhost:8000"]
        else:
            files = self._starter(project_name, prompt)
            commands = []

        summary = self._build_summary(project_name, blueprint, prompt, files, commands)
        result = BuildResult(
            project_name=project_name,
            blueprint=blueprint,
            summary=summary,
            files=files,
            suggested_commands=commands,
            source="template",
        )
        return self._finalize_build(result, prompt)

    def _finalize_build(self, build: BuildResult, prompt: str) -> BuildResult:
        runtime = self._runtime_for_blueprint(build.blueprint, build.files, build.suggested_commands)
        validation = self._validate_files(build.blueprint, build.files, runtime)
        plan = self._build_plan(build.blueprint, prompt)

        build.runtime = runtime
        build.validation = validation
        build.plan = plan
        build.files["manifest.json"] = json.dumps(
            {
                "name": build.project_name,
                "blueprint": build.blueprint,
                "prompt": prompt,
                "files": list(build.files.keys()),
                "source": build.source,
                "runtime": runtime,
                "validation": validation,
                "plan": plan,
            },
            indent=2,
        )
        return build

    def _extract_project_name(self, prompt: str, blueprint: str) -> str:
        match = re.search(r"(?:called|named)\s+([a-zA-Z0-9 _-]+)", prompt, flags=re.IGNORECASE)
        if match:
            return slugify(match.group(1))

        defaults = {
            "react-app": "aizen-react-studio",
            "python-api": "aizen-python-api",
            "landing-page": "aizen-launch-page",
            "python-cli": "aizen-cli-tool",
            "fullstack": "aizen-fullstack-app",
            "node-api": "aizen-node-api",
            "java-cli": "aizen-java-tool",
            "cpp-cli": "aizen-cpp-tool",
            "php-site": "aizen-php-site",
            "starter": "aizen-starter-project",
        }
        return defaults[blueprint]

    def _build_plan(self, blueprint: str, prompt: str) -> list[str]:
        return [
            f"Interpret the request as a `{blueprint}` project and choose the smallest coherent starter.",
            "Generate the core files needed to run, inspect, or preview the first version quickly.",
            f"Keep the output easy to extend in follow-up prompts for: {prompt}",
        ]

    def _runtime_for_blueprint(self, blueprint: str, files: dict[str, str], commands: list[str]) -> dict:
        file_names = list(files.keys())
        preview_entry = ""

        for candidate in [
            "preview.html",
            "index.preview.html",
            "index.html",
            "frontend/preview.html",
            "frontend/index.preview.html",
            "frontend/index.html",
        ]:
            if candidate in files:
                preview_entry = candidate
                break

        if not preview_entry:
            preview_entry = next((name for name in file_names if name.lower().endswith(".html")), "")

        return {
            "preview_supported": bool(preview_entry),
            "preview_entry": preview_entry,
            "run_commands": commands,
            "primary_language": self._language_for_blueprint(blueprint),
            "stack_label": self._stack_label(blueprint),
        }

    def _validate_files(self, blueprint: str, files: dict[str, str], runtime: dict) -> list[str]:
        checks = []
        required = {
            "react-app": ["package.json", "src/App.jsx", "src/main.jsx"],
            "python-api": ["app.py", "requirements.txt"],
            "landing-page": ["index.html", "style.css", "script.js"],
            "python-cli": ["main.py"],
            "fullstack": ["backend/app.py", "frontend/package.json", "frontend/src/App.jsx"],
            "node-api": ["package.json", "server.js"],
            "java-cli": ["src/Main.java"],
            "cpp-cli": ["src/main.cpp"],
            "php-site": ["index.php"],
            "starter": ["README.md"],
        }
        missing = [name for name in required.get(blueprint, []) if name not in files]

        if missing:
            checks.append(f"Missing expected starter files: {', '.join(missing)}.")
        else:
            checks.append("Core starter files are present.")

        if runtime.get("preview_supported"):
            checks.append(f"Live preview should work from `{runtime['preview_entry']}`.")
        else:
            checks.append("This stack is code-first, so preview is not expected by default.")

        if runtime.get("run_commands"):
            checks.append(f"Run guidance is available for the generated stack: `{runtime['run_commands'][0]}`.")

        return checks

    def _language_for_blueprint(self, blueprint: str) -> str:
        return {
            "react-app": "JavaScript",
            "python-api": "Python",
            "landing-page": "HTML/CSS/JavaScript",
            "python-cli": "Python",
            "fullstack": "Python + JavaScript",
            "node-api": "JavaScript",
            "java-cli": "Java",
            "cpp-cli": "C++",
            "php-site": "PHP",
            "starter": "Mixed",
        }.get(blueprint, "Mixed")

    def _stack_label(self, blueprint: str) -> str:
        return {
            "react-app": "React + Vite",
            "python-api": "Flask API",
            "landing-page": "Static website",
            "python-cli": "Python CLI",
            "fullstack": "Flask + React",
            "node-api": "Express API",
            "java-cli": "Java CLI",
            "cpp-cli": "C++ CLI",
            "php-site": "PHP website",
            "starter": "Starter scaffold",
        }.get(blueprint, "Starter scaffold")

    def _build_summary(
        self,
        project_name: str,
        blueprint: str,
        prompt: str,
        files: dict[str, str],
        commands: list[str],
    ) -> str:
        file_list = "\n".join(f"- `{name}`" for name in files.keys() if name != "manifest.json")
        command_list = "\n".join(f"- `{command}`" for command in commands) or "- Review the generated files and iterate."
        return (
            f"I put together a `{blueprint}` starter called `{project_name}` based on your request.\n\n"
            f"What I included:\n{file_list}\n\n"
            f"Assumptions I made:\n"
            f"- I kept the first pass compact and extendable instead of generating a huge code dump.\n"
            f"- I optimized for a starter you can inspect quickly and refine in follow-up prompts.\n"
            f"- Original request: {prompt}\n\n"
            f"Suggested next steps:\n{command_list}\n"
        )

    def _react_app(self, project_name: str, prompt: str) -> dict[str, str]:
        project_title = project_name.replace("-", " ").title()
        prompt_js = json.dumps(prompt)
        package_json = {
            "name": project_name,
            "private": True,
            "version": "0.1.0",
            "type": "module",
            "scripts": {"dev": "vite", "build": "vite build", "preview": "vite preview"},
            "dependencies": {"react": "^19.0.0", "react-dom": "^19.0.0"},
            "devDependencies": {"@vitejs/plugin-react": "^5.0.0", "vite": "^6.0.0"},
        }
        return {
            "package.json": json.dumps(package_json, indent=2),
            "index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aizen React App</title>
    <script type="module" src="/src/main.jsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
""",
            "preview.html": f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{project_title} Preview</title>
    <link rel="stylesheet" href="preview.css" />
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Aizen React Starter</p>
        <h1>{project_title}</h1>
        <p class="lede">Created from the request: {prompt}</p>
      </section>
      <section class="grid">
        <article class="card"><h2>Prompt aware</h2><p>The UI reflects the original request instead of generic boilerplate.</p></article>
        <article class="card"><h2>Ready to code</h2><p>The actual React files are included alongside this quick preview.</p></article>
        <article class="card"><h2>Easy to extend</h2><p>You can now ask for routing, auth, forms, or API integration.</p></article>
      </section>
    </main>
  </body>
</html>
""",
            "preview.css": """:root {
  color-scheme: dark;
  font-family: 'Segoe UI', sans-serif;
}
body {
  margin: 0;
  min-height: 100vh;
  color: #f4f7fb;
  background:
    radial-gradient(circle at top left, rgba(65, 172, 255, 0.18), transparent 28rem),
    linear-gradient(160deg, #07111f, #0f1d33 50%, #08111c);
}
.shell { width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 4rem 0 5rem; }
.hero { padding: 2rem 0 3rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.18em; color: #7dc2ff; font-size: 0.75rem; margin: 0 0 1rem; }
h1 { margin: 0; font-size: clamp(2.6rem, 8vw, 5rem); line-height: 0.95; }
.lede { max-width: 42rem; font-size: 1.05rem; color: #bfd3e9; margin-top: 1rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.card { padding: 1.25rem; border-radius: 1rem; background: rgba(7, 17, 31, 0.78); border: 1px solid rgba(125, 194, 255, 0.18); }
.card h2 { margin-top: 0; }
.card p { margin-bottom: 0; color: #bfd3e9; }
""",
            "src/main.jsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
""",
            "src/App.jsx": f"""const featureCards = [
  {{
    title: 'Prompt aware',
    body: 'The scaffold reflects the original request instead of a generic boilerplate.',
  }},
  {{
    title: 'Easy to extend',
    body: 'The structure stays intentionally small so the next edit feels obvious.',
  }},
  {{
    title: 'Visible output',
    body: 'This starter is meant to be reviewed and refined right away.',
  }},
];

export default function App() {{
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Built by Aizen</p>
        <h1>{project_title}</h1>
        <p className="lede">Created from the request: {prompt_js}</p>
      </section>

      <section className="grid">
        {{featureCards.map((card) => (
          <article key={{card.title}} className="card">
            <h2>{{card.title}}</h2>
            <p>{{card.body}}</p>
          </article>
        ))}}
      </section>
    </main>
  );
}}
""",
            "src/styles.css": """:root {
  color-scheme: dark;
  font-family: 'Segoe UI', sans-serif;
  background: #07111f;
  color: #f4f7fb;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(65, 172, 255, 0.18), transparent 28rem),
    linear-gradient(160deg, #07111f, #0f1d33 50%, #08111c);
}
.shell { width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 4rem 0 5rem; }
.hero { padding: 2rem 0 3rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.18em; color: #7dc2ff; font-size: 0.75rem; margin: 0 0 1rem; }
h1 { margin: 0; font-size: clamp(2.6rem, 8vw, 5rem); line-height: 0.95; }
.lede { max-width: 42rem; font-size: 1.05rem; color: #bfd3e9; margin-top: 1rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.card { padding: 1.25rem; border-radius: 1rem; background: rgba(7, 17, 31, 0.78); border: 1px solid rgba(125, 194, 255, 0.18); }
.card h2 { margin-top: 0; }
.card p { margin-bottom: 0; color: #bfd3e9; }
""",
            "README.md": f"# {project_name}\n\nScaffolded by Aizen from a one-command prompt.\n",
        }

    def _python_api(self, project_name: str, prompt: str) -> dict[str, str]:
        prompt_python = json.dumps(prompt)
        return {
            "app.py": f"""from flask import Flask, jsonify, request

app = Flask(__name__)

PROJECT = {{
    "name": "{project_name}",
    "purpose": {prompt_python},
}}


@app.get("/health")
def health():
    return jsonify({{"status": "ok", "project": PROJECT["name"]}})


@app.get("/api/meta")
def meta():
    return jsonify(PROJECT)


@app.post("/api/generate")
def generate():
    payload = request.get_json(silent=True) or {{}}
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        return jsonify({{"success": False, "error": "prompt is required"}}), 400

    return jsonify({{
        "success": True,
        "result": {{
            "message": "Wire your domain-specific generation flow here.",
            "prompt": prompt,
        }},
    }})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
""",
            "requirements.txt": "flask==3.1.0\n",
            ".env.example": "PORT=5000\n",
            "README.md": f"# {project_name}\n\nMinimal Python API starter generated by Aizen.\n",
        }

    def _landing_page(self, project_name: str, prompt: str) -> dict[str, str]:
        project_title = project_name.replace("-", " ").title()
        return {
            "index.html": f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{project_name}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Aizen Launch Kit</p>
        <h1>{project_title}</h1>
        <p class="lede">{prompt}</p>
        <button id="cta">Request early access</button>
      </section>
    </main>
    <script src="script.js"></script>
  </body>
</html>
""",
            "preview.html": f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{project_name} Preview</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Preview Ready</p>
        <h1>{project_title}</h1>
        <p class="lede">{prompt}</p>
        <button id="cta">Request early access</button>
      </section>
    </main>
    <script src="script.js"></script>
  </body>
</html>
""",
            "style.css": """body {
  margin: 0;
  min-height: 100vh;
  font-family: Georgia, serif;
  color: #1d160f;
  background:
    radial-gradient(circle at top, rgba(255, 197, 109, 0.55), transparent 32rem),
    linear-gradient(180deg, #fff7e7, #f5ead7 55%, #ead8bd);
}
.page { width: min(960px, calc(100% - 2rem)); margin: 0 auto; padding: 5rem 0; }
.hero { padding: 3rem; border-radius: 2rem; background: rgba(255, 248, 236, 0.8); border: 1px solid rgba(115, 80, 34, 0.14); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.22em; font-size: 0.75rem; }
h1 { font-size: clamp(3rem, 8vw, 5.5rem); line-height: 0.94; margin: 0.6rem 0 1rem; }
.lede { max-width: 44rem; font-size: 1.1rem; }
button { margin-top: 1.5rem; border: 0; border-radius: 999px; padding: 0.95rem 1.4rem; background: #1d160f; color: #fff7e7; cursor: pointer; }
""",
            "script.js": """document.getElementById('cta').addEventListener('click', () => {
  alert('Hook this call to your waitlist provider.');
});
""",
            "README.md": f"# {project_name}\n\nStatic landing page scaffold generated by Aizen.\n",
        }

    def _python_cli(self, project_name: str, prompt: str) -> dict[str, str]:
        return {
            "main.py": f"""import argparse


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="{project_name}",
        description="CLI scaffold generated from: {prompt}",
    )
    parser.add_argument("name", nargs="?", default="world", help="Name to greet")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    print(f"Hello, {{args.name}}. Extend this command for your real workflow.")


if __name__ == "__main__":
    main()
""",
            "README.md": f"# {project_name}\n\nCLI scaffold generated by Aizen.\n",
        }

    def _fullstack(self, project_name: str, prompt: str) -> dict[str, str]:
        project_title = project_name.replace("-", " ").title()
        prompt_js = json.dumps(prompt)
        return {
            "backend/app.py": """from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/dashboard")
def dashboard():
    return jsonify(
        {
            "headline": "Your full-stack starter is running",
            "metrics": [
                {"label": "Users", "value": 128},
                {"label": "Deploys", "value": 12},
                {"label": "Conversion", "value": "5.6%"},
            ],
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
""",
            "backend/requirements.txt": "flask==3.1.0\nflask-cors==5.0.0\n",
            "frontend/package.json": json.dumps(
                {
                    "name": f"{project_name}-frontend",
                    "private": True,
                    "version": "0.1.0",
                    "type": "module",
                    "scripts": {"dev": "vite", "build": "vite build"},
                    "dependencies": {"react": "^19.0.0", "react-dom": "^19.0.0"},
                    "devDependencies": {"@vitejs/plugin-react": "^5.0.0", "vite": "^6.0.0"},
                },
                indent=2,
            ),
            "frontend/index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aizen Fullstack Starter</title>
    <script type="module" src="/src/main.jsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
""",
            "frontend/preview.html": f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{project_title} Preview</title>
    <link rel="stylesheet" href="preview.css" />
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Aizen Fullstack Starter</p>
        <h1>{project_title}</h1>
        <p>{prompt}</p>
      </section>
      <section class="metrics">
        <article class="card"><strong>128</strong><span>Users</span></article>
        <article class="card"><strong>12</strong><span>Deploys</span></article>
        <article class="card"><strong>5.6%</strong><span>Conversion</span></article>
      </section>
    </main>
  </body>
</html>
""",
            "frontend/preview.css": """body {
  margin: 0;
  font-family: 'Trebuchet MS', sans-serif;
  background: linear-gradient(160deg, #101723, #0a0f18);
  color: #ecf3ff;
}
.shell { width: min(1080px, calc(100% - 2rem)); margin: 0 auto; padding: 4rem 0; }
.hero { margin-bottom: 2rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; color: #8ec5ff; }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.card { border-radius: 1rem; padding: 1.2rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(142, 197, 255, 0.18); }
.card strong { display: block; font-size: 2rem; }
""",
            "frontend/src/main.jsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
""",
            "frontend/src/App.jsx": f"""import {{ useEffect, useState }} from 'react';

export default function App() {{
  const [data, setData] = useState(null);

  useEffect(() => {{
    fetch('http://localhost:5000/api/dashboard')
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({{ headline: 'Backend offline', metrics: [] }}));
  }}, []);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Aizen Fullstack Starter</p>
        <h1>{project_title}</h1>
        <p>{prompt_js}</p>
      </section>
      <section className="metrics">
        {{(data?.metrics || []).map((item) => (
          <article className="card" key={{item.label}}>
            <strong>{{item.value}}</strong>
            <span>{{item.label}}</span>
          </article>
        ))}}
      </section>
    </main>
  );
}}
""",
            "frontend/src/styles.css": """body {
  margin: 0;
  font-family: 'Trebuchet MS', sans-serif;
  background: linear-gradient(160deg, #101723, #0a0f18);
  color: #ecf3ff;
}
.shell { width: min(1080px, calc(100% - 2rem)); margin: 0 auto; padding: 4rem 0; }
.hero { margin-bottom: 2rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; color: #8ec5ff; }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.card { border-radius: 1rem; padding: 1.2rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(142, 197, 255, 0.18); }
.card strong { display: block; font-size: 2rem; }
""",
            "README.md": f"# {project_name}\n\nGenerated by Aizen as a full-stack starter.\n",
        }

    def _node_api(self, project_name: str, prompt: str) -> dict[str, str]:
        package_json = {
            "name": project_name,
            "version": "0.1.0",
            "private": True,
            "type": "module",
            "scripts": {"dev": "node --watch server.js", "start": "node server.js"},
            "dependencies": {"express": "^4.21.2", "cors": "^2.8.5"},
        }
        return {
            "package.json": json.dumps(package_json, indent=2),
            "server.js": f"""import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json());

const project = {{
  name: '{project_name}',
  purpose: {json.dumps(prompt)},
}};

app.get('/health', (_req, res) => {{
  res.json({{ status: 'ok', project: project.name }});
}});

app.get('/api/meta', (_req, res) => {{
  res.json(project);
}});

app.post('/api/generate', (req, res) => {{
  const prompt = (req.body?.prompt || '').trim();
  if (!prompt) {{
    return res.status(400).json({{ success: false, error: 'prompt is required' }});
  }}

  return res.json({{
    success: true,
    result: {{
      message: 'Add your domain-specific generation flow here.',
      prompt,
    }},
  }});
}});

app.listen(4000, () => {{
  console.log('API running on http://localhost:4000');
}});
""",
            "README.md": f"# {project_name}\n\nExpress API starter generated by Aizen.\n",
        }

    def _java_cli(self, project_name: str, prompt: str) -> dict[str, str]:
        return {
            "src/Main.java": f"""public class Main {{
    public static void main(String[] args) {{
        System.out.println("Welcome to {project_name}.");
        System.out.println("Prompt: {prompt}");
        System.out.println("Extend this Java starter for your real workflow.");
    }}
}}
""",
            "README.md": f"# {project_name}\n\nJava CLI starter generated by Aizen.\n",
        }

    def _cpp_cli(self, project_name: str, prompt: str) -> dict[str, str]:
        return {
            "src/main.cpp": f"""#include <iostream>
#include <string>

int main() {{
    std::cout << "Welcome to {project_name}" << std::endl;
    std::cout << "Prompt: {prompt}" << std::endl;
    std::cout << "Extend this C++ starter for your real workflow." << std::endl;
    return 0;
}}
""",
            "README.md": f"# {project_name}\n\nC++ CLI starter generated by Aizen.\n",
        }

    def _php_site(self, project_name: str, prompt: str) -> dict[str, str]:
        project_title = project_name.replace("-", " ").title()
        return {
            "index.php": f"""<?php
$title = '{project_title}';
$prompt = {json.dumps(prompt)};
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo $title; ?></title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Aizen PHP Starter</p>
        <h1><?php echo $title; ?></h1>
        <p class="lede"><?php echo $prompt; ?></p>
      </section>
    </main>
  </body>
</html>
""",
            "preview.html": f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{project_title} Preview</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Aizen PHP Starter</p>
        <h1>{project_title}</h1>
        <p class="lede">{prompt}</p>
      </section>
    </main>
  </body>
</html>
""",
            "style.css": """body {
  margin: 0;
  min-height: 100vh;
  font-family: Georgia, serif;
  color: #1e120e;
  background: linear-gradient(180deg, #fdf0db, #f4dfbc);
}
.page { width: min(960px, calc(100% - 2rem)); margin: 0 auto; padding: 5rem 0; }
.hero { padding: 3rem; border-radius: 2rem; background: rgba(255, 248, 236, 0.85); border: 1px solid rgba(115, 80, 34, 0.14); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.22em; font-size: 0.75rem; }
h1 { font-size: clamp(3rem, 8vw, 5rem); line-height: 0.94; margin: 0.6rem 0 1rem; }
.lede { max-width: 44rem; font-size: 1.05rem; }
""",
            "README.md": f"# {project_name}\n\nPHP site starter generated by Aizen.\n",
        }

    def _starter(self, project_name: str, prompt: str) -> dict[str, str]:
        return {
            "README.md": f"""# {project_name}

Prompt: {prompt}

This is a minimal starter scaffold from Aizen.

## Suggested structure

- `src/`
- `tests/`
- `docs/`
""",
            "src/main.txt": "Replace this file with your first implementation.\n",
        }


def write_workspace(workspace_dir: str, files: dict[str, str]) -> list[str]:
    if os.path.exists(workspace_dir):
        for root, dirs, existing_files in os.walk(workspace_dir, topdown=False):
            for name in existing_files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))

    os.makedirs(workspace_dir, exist_ok=True)

    written = []
    for relative_path, content in files.items():
        destination = os.path.join(workspace_dir, relative_path)
        parent_dir = os.path.dirname(destination)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
        with open(destination, "w", encoding="utf-8") as file_handle:
            file_handle.write(content)
        written.append(relative_path.replace("\\", "/"))

    return written
