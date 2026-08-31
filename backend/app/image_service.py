"""Hero illustration generation via Pollinations.ai.

Two endpoints, tried in order:
  1. gen.pollinations.ai/image/{prompt} — current endpoint; requires an API key
     from https://enter.pollinations.ai/keys, set as POLLINATIONS_API_KEY in .env
  2. image.pollinations.ai/prompt/{prompt} — free legacy endpoint, no key needed

Generates one flat-illustration hero image per concept and caches it under
backend/generated_images/. Any network failure returns None — the frontend
falls back to a CSS gradient hero.
"""
from __future__ import annotations

import logging
import os
import re
from pathlib import Path

LOGGER = logging.getLogger(__name__)

_IMAGES_DIR = Path(__file__).resolve().parent.parent / "generated_images"

# Flux cold starts can take well over 30s; the old short timeout caused
# "read operation timed out" failures on first generation.
_TIMEOUT_SECONDS = 90.0
_ATTEMPTS_PER_ENDPOINT = 2


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass


def _safe_slug(text: str, max_len: int = 120) -> str:
    """URL-encode a prompt string for Pollinations."""
    import urllib.parse
    return urllib.parse.quote(text[:max_len], safe="")


def _prompt_for(title: str, definition: str, key_facts: list[str]) -> str:
    facts = "; ".join(key_facts[:3]) if key_facts else ""
    return (
        f"flat vector illustration for an educational app lesson about {title}. "
        f"Visual concept: {definition[:120]}. "
        f"Key elements: {facts}. "
        "Style: modern flat illustration, soft rounded shapes, cheerful vibrant palette "
        "(greens, blues, warm yellow accents), clean white background, no text, no letters, "
        "square composition, polished learning-app hero image."
    )


def _endpoint_candidates(prompt: str) -> list[tuple[str, str | None]]:
    """Ordered (url, bearer-token) pairs: keyed current endpoint first when a
    key is configured, then the free legacy endpoint as fallback."""
    slug = _safe_slug(prompt)
    query = "width=800&height=400&nologo=true&seed=42&model=flux"
    _load_env()
    api_key = (os.getenv("POLLINATIONS_API_KEY") or "").strip()

    candidates: list[tuple[str, str | None]] = []
    if api_key:
        candidates.append((f"https://gen.pollinations.ai/image/{slug}?{query}", api_key))
    candidates.append((f"https://image.pollinations.ai/prompt/{slug}?{query}", None))
    return candidates


def hero_image_url(
    concept_id: str,
    title: str,
    definition: str,
    key_facts: list[str] | None = None,
) -> str | None:
    """Return a URL for the concept's hero image, generating + caching on first call."""
    if not concept_id:
        return None

    _IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Sanitise concept_id to only alphanum + hyphen for filename safety
    safe_id = re.sub(r"[^a-z0-9\-]", "-", concept_id.lower())[:60]
    cache_path = _IMAGES_DIR / f"{safe_id}.png"

    if cache_path.exists() and cache_path.stat().st_size > 1024:
        return f"/static/images/{safe_id}.png"

    prompt = _prompt_for(title, definition, key_facts or [])

    try:
        import httpx

        for url, token in _endpoint_candidates(prompt):
            for attempt in range(1, _ATTEMPTS_PER_ENDPOINT + 1):
                try:
                    headers = {"Authorization": f"Bearer {token}"} if token else {}
                    response = httpx.get(
                        url, headers=headers, timeout=_TIMEOUT_SECONDS, follow_redirects=True
                    )
                    content_type = response.headers.get("content-type", "")
                    if response.status_code == 200 and "image" in content_type:
                        cache_path.write_bytes(response.content)
                        host = url.split("/")[2]
                        LOGGER.info("Generated hero image via %s for %s", host, concept_id)
                        return f"/static/images/{safe_id}.png"
                    LOGGER.warning(
                        "Pollinations %s attempt %s returned %s (%s) for %s",
                        url.split("/")[2], attempt, response.status_code,
                        content_type or "no content-type", concept_id,
                    )
                except Exception as exc:  # noqa: BLE001 — try next attempt/endpoint
                    LOGGER.warning(
                        "Pollinations %s attempt %s failed for %s: %s",
                        url.split("/")[2], attempt, concept_id, exc,
                    )

        LOGGER.warning("All Pollinations endpoints failed for %s", concept_id)
        return None

    except Exception as exc:  # noqa: BLE001 — hero art is best-effort
        LOGGER.warning("Hero image generation failed for %s: %s", concept_id, exc)
        return None
