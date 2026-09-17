"""English-to-SQL generation ("SQL Assistant").

This module powers Aizen's SQL Assistant panel: given a plain-English
question and, optionally, a description of the target database schema, it
asks the model to produce one correct, runnable SQL query plus a short
explanation of what that query does.

Literally fine-tuning a model's weights on a question -> SQL dataset isn't
something this environment can do, so the same specialisation is achieved
the practical way instead: a narrow, dedicated system prompt turns the
general-purpose chat model into a component that only ever does one job
(translate English into SQL for a given dialect/schema) and that is only
ever allowed to answer in one strict shape. That prompt is defined once
below and reused for every request, which is what actually drives the
feature the UI calls "SQL Assistant".
"""

from __future__ import annotations

import json
import re

from utils.config import get_groq_client

MODEL = "openai/gpt-oss-120b"

_SYSTEM_PROMPT = """You are the SQL engine inside Aizen's "SQL Assistant" feature.
Your only job is to turn a plain-English question into one correct, runnable
SQL query for the given database dialect and (if provided) schema.

Rules:
- Read the schema carefully if one is given, and only reference tables and
  columns that actually appear in it. If no schema is given, write a
  reasonable, generic query and say so plainly in the explanation.
- Prefer the simplest query that answers the question. Do not invent extra
  filters, joins, or columns the user did not ask for.
- Default to read-only SELECT statements. Only write INSERT, UPDATE,
  DELETE, or DDL statements when the question explicitly asks to change
  data or structure, and call that out in "warnings".
- Respond with ONLY a JSON object, no markdown code fences, no commentary
  outside the JSON, shaped exactly like this:
  {"sql": "...", "explanation": "...", "warnings": "..."}
  "warnings" should be an empty string when there is nothing worth flagging.
"""


def _extract_json(raw: str) -> dict:
    text = raw.strip()

    # Strip a ```json ... ``` or ``` ... ``` fence if the model added one anyway.
    fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fall back to grabbing the first {...} block in the response.
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    # Last resort: treat the whole response as the SQL itself.
    return {
        "sql": text,
        "explanation": "",
        "warnings": "Could not parse a structured response from the model; showing its raw output as the query.",
    }


def generate_sql(question: str, schema: str = "", dialect: str = "SQLite") -> dict:
    """Generate a SQL query (+ explanation) for an English question.

    Returns {"sql": str, "explanation": str, "warnings": str}.
    Raises ValueError for bad input, or whatever the Groq client raises on
    a transport/auth failure — callers should catch that and turn it into
    an API error response.
    """
    question = (question or "").strip()
    if not question:
        raise ValueError("A question is required")

    schema = (schema or "").strip()
    dialect = (dialect or "SQLite").strip() or "SQLite"

    user_content = f"Dialect: {dialect}\n"
    user_content += f"Schema:\n{schema}\n\n" if schema else "Schema: (none provided)\n\n"
    user_content += f"Question: {question}"

    client = get_groq_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.15,
    )
    raw = response.choices[0].message.content.strip()
    parsed = _extract_json(raw)

    return {
        "sql": (parsed.get("sql") or "").strip(),
        "explanation": (parsed.get("explanation") or "").strip(),
        "warnings": (parsed.get("warnings") or "").strip(),
    }
