"""Agent runtime for chat-first assistance with workspace-aware coding."""

from __future__ import annotations

import json
import os
import re
import traceback
from dataclasses import dataclass

from services.project_builder import BuildResult, ProjectBuilder, write_workspace
from utils.config import get_groq_client
from utils.tools import list_files, read_file, run_command, workspace_snapshot, write_to_file


@dataclass
class AgentRunResult:
    project_name: str
    blueprint: str
    summary: str
    files: dict[str, str]
    manifest: dict
    source: str


@dataclass
class RequestIntent:
    mode: str
    label: str
    confidence: str
    operation: str


class AgentRuntime:
    def __init__(self, workspace_dir: str) -> None:
        self.workspace_dir = workspace_dir
        self.builder = ProjectBuilder()
        self.model = "openai/gpt-oss-120b"
        self._last_client_error: str | None = None

    def run(self, prompt: str, emit, conversation: list[dict] | None = None) -> AgentRunResult:
        intent = self._classify_request(prompt)
        workspace = workspace_snapshot()

        if intent.mode == "chat":
            return self._run_chat(prompt, intent, conversation or [])

        client = self._try_get_client()

        if intent.operation == "refine" and workspace.get("exists") and workspace.get("files"):
            return self._refine_existing_workspace(prompt, intent, client, workspace, conversation=conversation)

        scaffold = self.builder.build(prompt, conversation=conversation)
        write_workspace(self.workspace_dir, scaffold.files)
        return self._improve_generated_workspace(prompt, scaffold, client, conversation=conversation)

    def _run_chat(
        self,
        prompt: str,
        intent: RequestIntent,
        conversation: list[dict],
    ) -> AgentRunResult:
        try:
            client = get_groq_client()
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are Aizen, a sharp and thoughtful AI assistant built into a coding workspace. "
                        "Think each question through before answering instead of reaching for a generic template response.\n\n"
                        "How you answer:\n"
                        "- Match your depth to the question. A quick factual question gets a direct, concise answer. "
                        "A genuinely complex or open-ended question earns a fuller, more considered one — but never pad an answer "
                        "just to sound thorough.\n"
                        "- Write in natural prose by default. Only reach for bullet points or numbered lists when the content is "
                        "actually a list (steps, options, comparisons) — not as a reflex formatting habit for every answer.\n"
                        "- Reason through technical, mathematical, or logical questions step by step before stating the answer, "
                        "so the answer is actually correct rather than merely plausible-sounding. Show that reasoning when it "
                        "helps the user follow along; skip it when the question is simple.\n"
                        "- Be concrete. Use real examples, real code, real numbers — not vague generalities.\n"
                        "- If something is ambiguous or you're missing information, say so plainly and ask a short clarifying "
                        "question, or state the assumption you're making. Never guess silently and present a guess as fact.\n"
                        "- If you're not sure about something, say that directly instead of inventing a confident-sounding answer.\n"
                        "- Keep a warm, direct, conversational tone, like a sharp colleague thinking out loud with you — not a "
                        "corporate FAQ page and not an over-eager assistant stacking compliments.\n"
                        "- Only mention project generation, scaffolding, or build mode if the user is explicitly asking to build "
                        "or write software. Don't force every answer toward coding.\n"
                        "- Never mention your internal tools, workspace, hidden reasoning process, or that you are following "
                        "these instructions."
                    ),
                },
                {
                    "role": "system",
                    "content": (
                        f"Detected intent: {intent.label}. Confidence: {intent.confidence}. "
                        "Do not mention internal tools, workspaces, scaffolds, or hidden reasoning."
                    ),
                },
            ]
            memory_summary = self._conversation_memory_summary(conversation)
            if memory_summary:
                messages.append(
                    {
                        "role": "system",
                        "content": (
                            "Conversation memory from earlier in this thread:\n"
                            f"{memory_summary}\n"
                            "Use this to stay consistent with the ongoing conversation."
                        ),
                    }
                )
            messages.extend(self._history_to_model_messages(conversation))
            messages.append({"role": "user", "content": prompt})
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.6,
                max_tokens=3072,
            )
            content = response.choices[0].message.content.strip()
        except Exception as exc:
            print(f"[Aizen] Chat model call failed ({type(exc).__name__}): {exc}")
            traceback.print_exc()
            content = self._chat_fallback(prompt, intent)
            content += f"\n\n_(debug: model call failed, showing generic fallback — {type(exc).__name__}: {exc})_"

        return AgentRunResult(
            project_name="conversation",
            blueprint="chat",
            summary=content,
            files={},
            manifest={
                "project_name": "conversation",
                "blueprint": "chat",
                "files": [],
                "suggested_commands": [],
                "source": "chat",
                "runtime": {
                    "preview_supported": False,
                    "preview_entry": "",
                    "run_commands": [],
                    "primary_language": "Natural language",
                    "stack_label": "Conversation",
                },
                "validation": ["Chat response only. No generated files were needed."],
                "plan": [],
                "operation": "chat",
            },
            source="chat",
        )

    def _improve_generated_workspace(
        self,
        prompt: str,
        scaffold: BuildResult,
        client,
        conversation: list[dict] | None = None,
    ) -> AgentRunResult:
        tool_history: list[dict] = []
        final_response = None

        if client:
            for _ in range(6):
                decision = self._next_action(
                    client=client,
                    prompt=prompt,
                    base_summary=scaffold.summary,
                    blueprint=scaffold.blueprint,
                    tool_history=tool_history,
                    workspace_mode="create",
                    conversation=conversation,
                )
                if not decision:
                    break
                if decision.get("type") == "final":
                    final_response = decision.get("response")
                    break
                tool_result = self._perform_action(decision)
                tool_history.append(tool_result)

        files = self._load_workspace_files()
        manifest = {
            **scaffold.manifest,
            "files": list(files.keys()),
            "source": "agentic",
            "operation": "create",
        }
        validation_result = self._run_validation(manifest)
        if validation_result:
            manifest.setdefault("validation_results", []).append(validation_result)

        files["manifest.json"] = json.dumps(manifest, indent=2)
        summary = final_response or self._build_completion_summary(scaffold, validation_result, operation="created")
        if not final_response and "_(debug:" in (scaffold.summary or ""):
            debug_note = scaffold.summary[scaffold.summary.index("_(debug:"):]
            summary = f"{summary}\n\n{debug_note}"
        return AgentRunResult(
            project_name=scaffold.project_name,
            blueprint=scaffold.blueprint,
            summary=summary,
            files=files,
            manifest=manifest,
            source="agentic",
        )

    def _refine_existing_workspace(
        self,
        prompt: str,
        intent: RequestIntent,
        client,
        workspace: dict,
        conversation: list[dict] | None = None,
    ) -> AgentRunResult:
        manifest = workspace.get("manifest") or {}
        blueprint = manifest.get("blueprint", "starter")
        project_name = manifest.get("project_name") or manifest.get("name") or "current-workspace"
        base_summary = (
            f"Refining the existing `{blueprint}` workspace `{project_name}`. "
            "Preserve the project where possible and make targeted improvements."
        )

        tool_history: list[dict] = []
        final_response = None

        if client:
            for _ in range(8):
                decision = self._next_action(
                    client=client,
                    prompt=prompt,
                    base_summary=base_summary,
                    blueprint=blueprint,
                    tool_history=tool_history,
                    workspace_mode="refine",
                    conversation=conversation,
                )
                if not decision:
                    break
                if decision.get("type") == "final":
                    final_response = decision.get("response")
                    break
                tool_result = self._perform_action(decision)
                tool_history.append(tool_result)

        files = self._load_workspace_files()
        updated_manifest = {
            **manifest,
            "project_name": project_name,
            "blueprint": blueprint,
            "files": list(files.keys()),
            "source": "agentic",
            "operation": intent.operation,
        }
        validation_result = self._run_validation(updated_manifest)
        if validation_result:
            updated_manifest.setdefault("validation_results", []).append(validation_result)

        files["manifest.json"] = json.dumps(updated_manifest, indent=2)
        summary = final_response or self._build_refine_summary(project_name, blueprint, prompt, validation_result)
        if not final_response and not client and getattr(self, "_last_client_error", None):
            summary += f"\n\n_(debug: AI-backed refinement was unavailable — {self._last_client_error})_"

        return AgentRunResult(
            project_name=project_name,
            blueprint=blueprint,
            summary=summary,
            files=files,
            manifest=updated_manifest,
            source="agentic",
        )

    def _next_action(
        self,
        client,
        prompt: str,
        base_summary: str,
        blueprint: str,
        tool_history: list[dict],
        workspace_mode: str,
        conversation: list[dict] | None = None,
    ) -> dict | None:
        workspace_listing = json.loads(list_files()).get("files", [])
        history_json = json.dumps(tool_history[-6:], indent=2)
        system_prompt = """
You are Aizen, an autonomous coding agent improving a workspace.
Return ONLY valid JSON in one of these forms:

{"type":"tool","tool":"list_files","args":{}}
{"type":"tool","tool":"read_file","args":{"path":"README.md"}}
{"type":"tool","tool":"write_file","args":{"path":"README.md","content":"new full file content"}}
{"type":"tool","tool":"run_command","args":{"command":"python app.py"}}
{"type":"final","response":"markdown response to the user summarizing the result"}

Rules:
- Improve the project toward the user's request.
- Prefer reading a file before rewriting it.
- Use run_command only for lightweight validation or to confirm a dev command shape.
- Make at most one tool call per response.
- If the workspace is already good enough, return type=final.
- Use ASCII only.
- Do not mention hidden reasoning, tool ids, or internal chains of thought.
"""
        user_prompt = (
            f"Operation mode: {workspace_mode}\n"
            f"Original request:\n{prompt}\n\n"
            f"Current project type: {blueprint}\n"
            f"Working summary:\n{base_summary}\n\n"
            f"Workspace files:\n{json.dumps(workspace_listing, indent=2)}\n\n"
            f"Recent tool history:\n{history_json}"
        )

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
                temperature=0.2,
            )
            content = response.choices[0].message.content.strip()
            return self._parse_json(content)
        except Exception as exc:
            print(f"[Aizen] Agent next-action call failed ({type(exc).__name__}): {exc}")
            traceback.print_exc()
            return None

    def _perform_action(self, decision: dict) -> dict:
        tool_name = decision.get("tool")
        args = decision.get("args", {})
        if tool_name == "list_files":
            result = json.loads(list_files())
        elif tool_name == "read_file":
            result = json.loads(read_file(args.get("path", "")))
        elif tool_name == "write_file":
            result = json.loads(write_to_file(args.get("path", ""), args.get("content", "")))
        elif tool_name == "run_command":
            result = json.loads(run_command(args.get("command", "")))
        else:
            result = {"success": False, "error": f"Unknown tool: {tool_name}"}

        return {"tool": tool_name, "args": args, "result": result}

    def _run_validation(self, manifest: dict) -> dict | None:
        runtime = manifest.get("runtime") or {}
        commands = runtime.get("run_commands") or []
        if not commands:
            return None

        command = commands[0]
        if "&&" in command or "cd " in command.lower():
            return {
                "success": False,
                "command": command,
                "note": "Validation skipped because the command requires shell chaining or directory changes.",
            }

        result = json.loads(run_command(command))
        if "stdout" in result and len(result["stdout"]) > 500:
            result["stdout"] = result["stdout"][:500] + "\n...[truncated]"
        if "stderr" in result and len(result["stderr"]) > 500:
            result["stderr"] = result["stderr"][:500] + "\n...[truncated]"
        return result

    def _try_get_client(self):
        try:
            client = get_groq_client()
            self._last_client_error = None
            return client
        except Exception as exc:
            print(f"[Aizen] Could not create Groq client ({type(exc).__name__}): {exc}")
            traceback.print_exc()
            self._last_client_error = f"{type(exc).__name__}: {exc}"
            return None

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
            if not joined:
                continue
            compact = re.sub(r"\s+", " ", joined).strip()
            if len(compact) > 180:
                compact = compact[:177].rstrip() + "..."
            prefix = "User" if role == "user" else "Assistant"
            memory_lines.append(f"- {prefix}: {compact}")

        return "\n".join(memory_lines[:24])

    def _classify_request(self, prompt: str) -> RequestIntent:
        lowered = prompt.strip().lower()

        if not lowered:
            return RequestIntent(mode="chat", label="empty-chat", confidence="high", operation="chat")

        # ── Hard chat signals: greetings ─────────────────────────────────────
        if any(re.search(pattern, lowered) for pattern in [
            r"^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b",
            r"\bhow are you\b",
            r"\bwho are you\b",
            r"\bwhat can you do\b",
            r"\bthank you\b",
            r"\bthanks\b",
        ]):
            return RequestIntent(mode="chat", label="general-chat", confidence="high", operation="chat")

        # ── Hard chat signals: knowledge / factual questions ──────────────────
        # Sentences that begin with question words, or ask about facts/topics
        factual_question_patterns = [
            r"^(what is|what are|what was|what were|what does|what do)\b",
            r"^(why is|why are|why was|why were|why does|why do)\b",
            r"^(how is|how are|how was|how were|how does|how do|how can|how did)\b",
            r"^(who is|who are|who was|who were)\b",
            r"^(where is|where are|where was|where were)\b",
            r"^(when is|when are|when was|when were|when did)\b",
            r"^(is it|is there|are there|can you tell|do you know|did you know)\b",
            r"^(explain|describe|tell me about|talk about|give me info|give me information)\b",
            r"^(define|difference between|compare)\b",
            r"\bexample\b",
            r"\btutorial\b",
            r"\bsummarize\b",
            r"\bnotes\b",
            r"\bknown as\b",
            r"\bfamous for\b",
        ]
        build_markers = [
            "build", "create", "make", "write code", "generate", "scaffold",
            "app", "website", "web app", "api", "project", "dashboard",
            "landing page", "fullstack", "full stack", "saas", "backend", "frontend",
            "react", "flask", "express", "node",
        ]
        if any(re.search(pattern, lowered) for pattern in factual_question_patterns):
            if not any(marker in lowered for marker in build_markers):
                return RequestIntent(mode="chat", label="explanation", confidence="high", operation="chat")

        # ── Hard chat: plain question mark without a build marker ─────────────
        if "?" in lowered and not any(marker in lowered for marker in build_markers):
            return RequestIntent(mode="chat", label="question", confidence="high", operation="chat")

        # ── Explicit build request required before touching build mode ────────
        # Only classify as BUILD if the prompt contains a clear, explicit build verb
        explicit_build_verbs = [
            "build me", "build a", "build an",
            "create me", "create a", "create an",
            "make me", "make a", "make an",
            "generate a", "generate an",
            "scaffold a", "scaffold an",
            "write code", "write a", "write an", "write some code",
            "code a solution", "code up", "solve this", "solve the",
            "i want to build", "i want to create", "i want to make",
            "can you build", "can you create", "can you make", "can you generate",
            "develop a", "develop an",
            "set up a", "set up an",
            "implement a", "implement an", "implement",
        ]
        has_explicit_build = any(verb in lowered for verb in explicit_build_verbs)

        # ── Refine patterns: only trigger if user is clearly talking about code/workspace ─
        refine_signals = ["fix", "debug", "refactor", "rewrite", "edit", "improve", "update", "change", "extend", "continue", "make it better"]
        refine_workspace_context = ["the code", "this code", "the project", "this project", "the app", "this app",
                                     "the file", "this file", "the function", "the api", "the component",
                                     "the backend", "the frontend", "the website", "the page"]
        has_refine = any(token in lowered for token in refine_signals)
        has_workspace_context = any(ctx in lowered for ctx in refine_workspace_context)
        if has_refine and has_workspace_context:
            return RequestIntent(mode="build", label="workspace-refine", confidence="high", operation="refine")

        # ── Explicit build request ────────────────────────────────────────────
        if has_explicit_build:
            return RequestIntent(mode="build", label="project-build", confidence="high", operation="create")

        # ── Standalone build nouns only if very clearly a project intent ──────
        # e.g. "SaaS dashboard" alone should NOT build — but "build a SaaS dashboard" above handles it
        strong_standalone_build = [
            "portfolio website", "landing page for", "web app for", "mobile app for",
            "full stack app", "saas dashboard", "react app", "flask app",
        ]
        if any(token in lowered for token in strong_standalone_build):
            return RequestIntent(mode="build", label="project-build", confidence="medium", operation="create")

        # ── Default to chat for everything else ───────────────────────────────
        return RequestIntent(mode="chat", label="general-chat", confidence="low", operation="chat")


    def _chat_fallback(self, prompt: str, intent: RequestIntent) -> str:
        lowered = prompt.strip().lower()
        if intent.label == "general-chat":
            if any(greeting in lowered for greeting in ["hi", "hello", "hey", "yo"]):
                return "Hi! I'm Aizen. I can chat normally, explain technical ideas, and help with coding when you want to build something."
            if "how are you" in lowered:
                return "I'm doing well and ready to help. Ask me anything, from quick questions to coding tasks."
            return "I'm here and ready to help. You can ask a question, brainstorm an idea, or switch into coding mode anytime."

        if intent.label in {"explanation", "question"}:
            return "I can help explain concepts, compare ideas, and walk through examples. Ask the topic directly and I'll answer it in chat."

        return "I can help in two ways: normal chat for questions and explanations, or coding mode when you want software built or improved."

    def _build_completion_summary(self, scaffold: BuildResult, validation_result: dict | None, operation: str) -> str:
        command_lines = "\n".join(f"- `{command}`" for command in scaffold.suggested_commands)
        validation_line = self._validation_sentence(validation_result)
        return (
            f"I {operation} a `{scaffold.blueprint}` project called `{scaffold.project_name}` and prepared the core files here in chat.\n\n"
            f"What is included:\n"
            f"- A focused starter structure instead of a huge boilerplate\n"
            f"- Files you can inspect, preview, and extend right away\n"
            f"- Runtime metadata and validation notes in the artifact\n\n"
            f"{validation_line}\n\n"
            f"Suggested next steps:\n{command_lines or '- Review the generated files and keep iterating.'}"
        )

    def _build_refine_summary(
        self,
        project_name: str,
        blueprint: str,
        prompt: str,
        validation_result: dict | None,
    ) -> str:
        validation_line = self._validation_sentence(validation_result)
        return (
            f"I refined the existing `{blueprint}` workspace `{project_name}` based on your request.\n\n"
            f"What I focused on:\n"
            f"- Preserving the current workspace instead of starting over\n"
            f"- Making targeted improvements for: {prompt}\n"
            f"- Keeping the updated files available in the chat artifact\n\n"
            f"{validation_line}"
        )

    def _validation_sentence(self, validation_result: dict | None) -> str:
        if not validation_result:
            return "I did not run an automatic validation command for this pass."
        if validation_result.get("success"):
            return f"I also validated the result with `{validation_result.get('command', 'a safe command')}`."
        note = validation_result.get("note") or validation_result.get("error") or validation_result.get("stderr") or "Validation did not complete cleanly."
        return f"Validation note: {note}"

    def _load_workspace_files(self) -> dict[str, str]:
        file_map: dict[str, str] = {}
        if not os.path.exists(self.workspace_dir):
            return file_map

        for root, _, files in os.walk(self.workspace_dir):
            for name in files:
                full_path = os.path.join(root, name)
                relative_path = os.path.relpath(full_path, self.workspace_dir).replace("\\", "/")
                try:
                    with open(full_path, "r", encoding="utf-8") as handle:
                        file_map[relative_path] = handle.read()
                except Exception:
                    continue
        return file_map

    def _parse_json(self, text: str) -> dict:
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())
