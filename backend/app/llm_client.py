# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import logging
import os
import re
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


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass


def _extract_json(raw: str) -> str:
    """Strip markdown code fences and extract the first {...} or [...] block."""
    raw = raw.strip()
    # Remove ```json ... ``` or ``` ... ``` fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```\s*$", "", raw, flags=re.IGNORECASE)
    raw = raw.strip()
    # If there's still non-JSON preamble, find the first brace
    brace = raw.find("{")
    bracket = raw.find("[")
    if brace == -1 and bracket == -1:
        return raw
    if brace == -1:
        return raw[bracket:]
    if bracket == -1:
        return raw[brace:]
    return raw[min(brace, bracket):]


def call_structured_llm(
    *,
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    fallback: Callable[[], T],
    api_key: str | None = None,
    model: str | None = None,
    timeout_seconds: int = 45,
    max_attempts: int = 2,
) -> T:
    """Structured LLM wrapper with multi-provider retry + safe fallback.

    Provider priority:
      1. Groq gpt-oss-120b (any key starting with gsk_) — very generous free tier, fast
      2. Groq qwen/qwen3.8-27b — second Groq model with separate TPD pool
      3. Groq openai/gpt-oss-20b — third Groq model with separate TPD pool
      4. Gemini (GEMINI_API_KEY)
      5. xAI (XAI_API_KEY, if not a Groq key)
      6. OpenAI (OPENAI_API_KEY)

    Models #2 and #3 do not support response_format=json_object — JSON is extracted
    from the raw text response using _extract_json().

    Falls back to static stub if all providers fail.
    """
    _load_env()

    raw_xai    = (os.getenv("XAI_API_KEY")    or "").strip()
    raw_gemini = (os.getenv("GEMINI_API_KEY") or "").strip()
    raw_openai = (os.getenv("OPENAI_API_KEY") or "").strip()
    raw_groq   = (os.getenv("GROQ_API_KEY")   or "").strip()

    # Any key starting with gsk_ is a Groq key, regardless of which env var holds it
    groq_candidates = [k for k in [raw_xai, raw_groq] if k.startswith("gsk_")]
    groq_key   = groq_candidates[0] if groq_candidates else ""
    gemini_key = raw_gemini if not raw_gemini.startswith("gsk_") else ""
    xai_key    = raw_xai if raw_xai and not raw_xai.startswith("gsk_") else ""
    openai_key = raw_openai

    # Build ordered provider list
    # Each entry: name, key, url, model_id, supports_json_mode
    providers: list[dict] = []

    if groq_key:
        providers.append({
            "key": groq_key,
            "url": "https://api.groq.com/openai/v1",
            "model": "openai/gpt-oss-120b",
            "name": "Groq/gpt-oss-120b",
            "json_mode": True,
        })
        # Fallback Groq models with separate TPD pools — no json_mode support
        providers.append({
            "key": groq_key,
            "url": "https://api.groq.com/openai/v1",
            "model": "qwen/qwen3.8-27b",
            "name": "Groq/qwen3.8-27b",
            "json_mode": False,
        })
        providers.append({
            "key": groq_key,
            "url": "https://api.groq.com/openai/v1",
            "model": "openai/gpt-oss-20b",
            "name": "Groq/gpt-oss-20b",
            "json_mode": False,
        })

    if gemini_key:
        providers.append({
            "key": gemini_key,
            "url": "https://generativelanguage.googleapis.com/v1beta/openai/",
            "model": model or "gemini-3.6-flash",
            "name": "Gemini/gemini-3.6-flash",
            "json_mode": True,
        })

    if xai_key:
        providers.append({
            "key": xai_key,
            "url": "https://api.x.ai/v1",
            "model": "grok-4",
            "name": "xAI/grok-4",
            "json_mode": True,
        })

    if openai_key:
        providers.append({
            "key": openai_key,
            "url": None,
            "model": model or "gpt-4o-mini",
            "name": "OpenAI/gpt-4o-mini",
            "json_mode": True,
        })

    if not providers:
        LOGGER.warning("No LLM API key configured; using fallback for %s", response_model.__name__)
        return fallback()

    schema = response_model.model_json_schema()
    # Compact JSON keeps the injected schema small — pretty-printing can add
    # thousands of tokens, which trips per-request limits (e.g. Groq 8k TPM).
    schema_str = json.dumps(schema, separators=(",", ":"))

    # Full system message with JSON schema (for json_mode providers)
    system_msg_full = (
        f"{system_prompt}\n\n"
        f"Respond ONLY with a valid JSON object matching this schema (no markdown, no code fences):\n"
        f"{schema_str}"
    )
    # Lighter system message for non-json_mode providers — schema is still included
    # but we emphasize plain text JSON without backticks/fences
    system_msg_plain = (
        f"{system_prompt}\n\n"
        f"IMPORTANT: Respond ONLY with a valid JSON object. "
        f"Do NOT wrap in markdown code fences or add any text outside the JSON. "
        f"The JSON must conform to this schema:\n{schema_str}"
    )

    try:
        import openai as _openai  # type: ignore
    except Exception:
        LOGGER.warning("openai library not installed; using fallback for %s", response_model.__name__)
        return fallback()

    for prov in providers:
        for attempt in range(1, max_attempts + 1):
            try:
                client_kwargs: dict = {"api_key": prov["key"], "timeout": timeout_seconds}
                if prov["url"]:
                    client_kwargs["base_url"] = prov["url"]
                client = _openai.OpenAI(**client_kwargs)

                json_mode: bool = prov.get("json_mode", True)
                messages = [
                    {"role": "system", "content": system_msg_full if json_mode else system_msg_plain},
                    {"role": "user", "content": user_prompt},
                ]
                create_kwargs: dict = {
                    "model": prov["model"],
                    "messages": messages,
                }
                if json_mode:
                    create_kwargs["response_format"] = {"type": "json_object"}

                completion = client.chat.completions.create(**create_kwargs)
                raw = completion.choices[0].message.content or ""

                # For non-json_mode models, strip markdown fences before parsing
                if not json_mode:
                    raw = _extract_json(raw)

                parsed = response_model.model_validate_json(raw)
                LOGGER.info("LLM success via %s for %s", prov["name"], response_model.__name__)
                return parsed

            except Exception as exc:
                exc_str = str(exc)
                # Log rate-limit errors at warning, all others at debug
                if "429" in exc_str or "rate_limit" in exc_str.lower() or "quota" in exc_str.lower():
                    LOGGER.warning(
                        "LLM provider %s is rate-limited/quota-exhausted for %s: %s",
                        prov["name"], response_model.__name__, exc_str[:200],
                    )
                    # Don't retry rate-limit errors — move immediately to next provider
                    break
                LOGGER.warning(
                    "LLM provider %s attempt %s/%s failed for %s: %s",
                    prov["name"], attempt, max_attempts, response_model.__name__, exc_str[:200],
                )
                time.sleep(0.5 * attempt)

    LOGGER.warning("All LLM providers failed for %s; using deterministic fallback", response_model.__name__)
    fallback_result = fallback()
    try:
        json.loads(json.dumps(fallback_result.model_dump()))
        return fallback_result
    except Exception:
        return _build_mock_response(response_model, fallback)
