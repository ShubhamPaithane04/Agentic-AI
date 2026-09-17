"""Tools for autonomous agent execution inside the workspace."""

from __future__ import annotations

import json
import os
import shlex
import subprocess

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "workspace"))

SAFE_COMMAND_PREFIXES = {
    "python": ["python", "python3"],
    "node": ["node"],
    "npm": ["npm", "npm.cmd"],
    "php": ["php"],
    "javac": ["javac"],
    "java": ["java"],
    "g++": ["g++"],
}


def _get_safe_path(filename: str) -> str:
    filename = filename.lstrip("/\\")
    safe_path = os.path.abspath(os.path.join(WORKSPACE_DIR, filename))
    if not safe_path.startswith(WORKSPACE_DIR):
        raise ValueError(f"Security Error: Attempted to access file outside workspace ({filename})")
    return safe_path


def _workspace_exists() -> bool:
    return os.path.exists(WORKSPACE_DIR)


def write_to_file(filename: str, content: str) -> str:
    try:
        filepath = _get_safe_path(filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as handle:
            handle.write(content)
        return json.dumps({"success": True, "message": f"Successfully wrote to {filename}"})
    except Exception as exc:
        return json.dumps({"success": False, "error": str(exc)})


def read_file(filename: str) -> str:
    try:
        filepath = _get_safe_path(filename)
        if not os.path.exists(filepath):
            return json.dumps({"success": False, "error": f"File not found: {filename}"})
        with open(filepath, "r", encoding="utf-8") as handle:
            content = handle.read()
        return json.dumps({"success": True, "content": content})
    except Exception as exc:
        return json.dumps({"success": False, "error": str(exc)})


def list_files(directory: str = ".") -> str:
    try:
        dir_path = _get_safe_path(directory)
        if not os.path.exists(dir_path):
            return json.dumps({"success": False, "error": f"Directory not found: {directory}"})

        items = []
        for root, _, files in os.walk(dir_path):
            for file_name in files:
                full_path = os.path.join(root, file_name)
                rel_path = os.path.relpath(full_path, WORKSPACE_DIR)
                items.append(rel_path.replace("\\", "/"))

        items.sort()
        return json.dumps({"success": True, "files": items})
    except Exception as exc:
        return json.dumps({"success": False, "error": str(exc)})


def workspace_snapshot(limit: int = 30) -> dict:
    if not _workspace_exists():
        return {"exists": False, "files": [], "manifest": {}}

    payload = json.loads(list_files())
    files = payload.get("files", [])[:limit] if payload.get("success") else []

    manifest = {}
    manifest_path = os.path.join(WORKSPACE_DIR, "manifest.json")
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as handle:
                manifest = json.load(handle)
        except Exception:
            manifest = {}

    return {"exists": True, "files": files, "manifest": manifest}


def run_command(command: str) -> str:
    if not command or not command.strip():
        return json.dumps({"success": False, "error": "Command is required."})

    try:
        tokens = shlex.split(command, posix=False)
    except Exception:
        return json.dumps({"success": False, "error": "Command could not be parsed safely."})

    if not tokens:
        return json.dumps({"success": False, "error": "Command is required."})

    executable = tokens[0].lower()
    allowed = any(executable == prefix.lower() for prefixes in SAFE_COMMAND_PREFIXES.values() for prefix in prefixes)
    if not allowed:
        return json.dumps(
            {
                "success": False,
                "error": "Command is not in the safe allowlist. Allowed prefixes: python, node, npm, php, javac, java, g++.",
            }
        )

    workdir = WORKSPACE_DIR
    if len(tokens) >= 3 and tokens[0].lower() == "cd" and tokens[1] in {"&&", "&"}:
        return json.dumps({"success": False, "error": "Chained shell commands are not allowed."})

    try:
        result = subprocess.run(
            tokens,
            cwd=workdir,
            capture_output=True,
            text=True,
            timeout=20,
            shell=False,
        )
        return json.dumps(
            {
                "success": result.returncode == 0,
                "stdout": result.stdout or "",
                "stderr": result.stderr or "",
                "exit_code": result.returncode,
                "command": command,
            }
        )
    except subprocess.TimeoutExpired:
        return json.dumps({"success": False, "error": "Command timed out after 20 seconds.", "command": command})
    except Exception as exc:
        return json.dumps({"success": False, "error": str(exc), "command": command})
