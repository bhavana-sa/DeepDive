from __future__ import annotations

import json
import logging
import os
import time
from typing import Callable, Type, TypeVar

from pydantic import BaseModel

LOGGER = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def _build_mock_response(response_model: Type[T], fallback: Callable[[], T]) -> T:
    try:
        return fallback()
    except Exception:
        return response_model.model_construct()


def call_structured_llm(
    *,
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    fallback: Callable[[], T],
    api_key: str | None = None,
    model: str | None = None,
    timeout_seconds: int = 15,
    max_attempts: int = 2,
) -> T:
    """Structured LLM wrapper with retry + safe fallback.

    Supports OpenAI (uses beta structured-output parse endpoint) and Groq
    (uses JSON-mode chat completions with manual Pydantic parsing).
    If no key is configured or all calls fail, returns the stub fallback.
    """
    # ── 1. Resolve API key ──────────────────────────────────────────────────
    key = (
        api_key
        or os.getenv("XAI_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("GROQ_API_KEY")
        or os.getenv("ANTHROPIC_API_KEY")
    )
    if not key:
        try:
            from dotenv import load_dotenv
            load_dotenv()
            key = (
                os.getenv("XAI_API_KEY")
                or os.getenv("OPENAI_API_KEY")
                or os.getenv("GROQ_API_KEY")
                or os.getenv("ANTHROPIC_API_KEY")
            )
        except ImportError:
            pass

    if key:
        key = key.strip()

    # ── 2. Detect provider ──────────────────────────────────────────────────
    is_groq = bool(key and key.startswith("gsk_"))
    is_xai = bool(
        key and (
            key.startswith("xai-")
            or (len(key) == 36 and key.count("-") == 4)
        )
    )

    if is_groq:
        base_url = "https://api.groq.com/openai/v1"
        model_name = model or os.getenv("LLM_MODEL") or "openai/gpt-oss-120b"
    elif is_xai:
        base_url = "https://api.x.ai/v1"
        model_name = model or os.getenv("LLM_MODEL") or "grok-4.6"
    else:
        base_url = None
        model_name = model or os.getenv("LLM_MODEL") or "gpt-4o-mini"

    if not key:
        LOGGER.warning("No LLM API key configured; using fallback structured response for %s", response_model.__name__)
        return fallback()

    try:
        import openai  # type: ignore
    except Exception:
        LOGGER.warning("OpenAI client library not installed; using fallback structured response for %s", response_model.__name__)
        return fallback()

    # ── 3. Call with provider-appropriate method ────────────────────────────
    for attempt in range(1, max_attempts + 1):
        try:
            client = openai.OpenAI(api_key=key, base_url=base_url, timeout=timeout_seconds)

            if is_groq or is_xai:
                # Groq/xAI: use JSON mode + manual parse
                schema = response_model.model_json_schema()
                system_msg = (
                    f"{system_prompt}\n\n"
                    f"Respond ONLY with a valid JSON object that strictly matches this schema:\n"
                    f"{json.dumps(schema, indent=2)}"
                )
                completion = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format={"type": "json_object"},
                )
                raw = completion.choices[0].message.content or ""
                parsed = response_model.model_validate_json(raw)
                return parsed
            else:
                # OpenAI: use native structured-output beta endpoint
                completion = client.beta.chat.completions.parse(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    response_format=response_model,
                )
                return completion.choices[0].message.parsed

        except Exception as exc:
            LOGGER.warning(
                "LLM call failed for %s (attempt %s/%s): %s",
                response_model.__name__, attempt, max_attempts, exc,
            )
            if attempt == max_attempts:
                break
            time.sleep(0.25)

    fallback_result = fallback()
    try:
        json.loads(json.dumps(fallback_result.model_dump()))
        return fallback_result
    except Exception:
        return _build_mock_response(response_model, fallback)

