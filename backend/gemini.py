"""Vertex AI Gemini integration using a Google Cloud Service Account JSON file."""
import json
import logging
import os
from pathlib import Path
from typing import Any

import httpx
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import service_account

log = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
DEFAULT_LOCATIONS = ["global", "us-central1", "asia-southeast1"]

_cached_creds: tuple[str, float, service_account.Credentials] | None = None


def resolve_sa_path(explicit_path: str | Path | None = None) -> Path | None:
    """Locate the service account JSON file from argument, env var, or default root gemini_sa.json."""
    if os.getenv("GEMINI_DISABLED") == "1" and not explicit_path and not os.getenv("GEMINI_SA_PATH"):
        return None
    candidates: list[Path] = []
    if explicit_path:
        candidates.append(Path(explicit_path))
    if os.getenv("GEMINI_SA_PATH"):
        candidates.append(Path(os.environ["GEMINI_SA_PATH"]))
    candidates.append(ROOT / "gemini_sa.json")
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        candidates.append(Path(os.environ["GOOGLE_APPLICATION_CREDENTIALS"]))

    for path in candidates:
        resolved = path if path.is_absolute() else (ROOT / path)
        if resolved.is_file():
            return resolved
    return None


def gemini_config(explicit_path: str | Path | None = None) -> dict[str, Any]:
    """Return current Gemini Service Account configuration metadata without exposing secrets."""
    path = resolve_sa_path(explicit_path)
    model = os.getenv("GEMINI_MODEL", DEFAULT_MODELS[0])
    location = os.getenv("GEMINI_LOCATION", DEFAULT_LOCATIONS[0])
    if not path:
        return {
            "configured": False,
            "project_id": None,
            "client_email": None,
            "model": model,
            "location": location,
        }
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        if raw.get("type") != "service_account" or not raw.get("project_id") or not raw.get("private_key"):
            return {
                "configured": False,
                "project_id": None,
                "client_email": None,
                "model": model,
                "location": location,
            }
        return {
            "configured": True,
            "project_id": raw.get("project_id"),
            "client_email": raw.get("client_email"),
            "model": model,
            "location": location,
        }
    except Exception:
        return {
            "configured": False,
            "project_id": None,
            "client_email": None,
            "model": model,
            "location": location,
        }


def _get_credentials(path: Path) -> service_account.Credentials:
    global _cached_creds
    mtime = path.stat().st_mtime
    key = str(path.resolve())
    if _cached_creds and _cached_creds[0] == key and _cached_creds[1] == mtime:
        creds = _cached_creds[2]
    else:
        creds = service_account.Credentials.from_service_account_file(str(path), scopes=SCOPES)
        _cached_creds = (key, mtime, creds)
    if not creds.valid or creds.expired or not creds.token:
        creds.refresh(GoogleAuthRequest())
    return creds


def _endpoint_url(project_id: str, location: str, model: str) -> str:
    host = "aiplatform.googleapis.com" if location == "global" else f"{location}-aiplatform.googleapis.com"
    return (
        f"https://{host}/v1/projects/{project_id}/locations/{location}"
        f"/publishers/google/models/{model}:generateContent"
    )


def call_vertex_gemini(
    prompt: str,
    system_instruction: str,
    response_schema: dict[str, Any] | None = None,
    explicit_path: str | Path | None = None,
) -> tuple[dict[str, Any] | str, str]:
    """Authenticate with Service Account and call Vertex AI Gemini generateContent."""
    path = resolve_sa_path(explicit_path)
    if not path:
        raise RuntimeError("Service Account file (gemini_sa.json) was not found.")
    creds = _get_credentials(path)
    project_id = creds.project_id
    if not project_id:
        raise RuntimeError("Service Account JSON is missing project_id.")

    env_model = os.getenv("GEMINI_MODEL")
    models = [env_model] + [m for m in DEFAULT_MODELS if m != env_model] if env_model else DEFAULT_MODELS
    env_loc = os.getenv("GEMINI_LOCATION")
    locations = [env_loc] + [loc for loc in DEFAULT_LOCATIONS if loc != env_loc] if env_loc else DEFAULT_LOCATIONS

    generation_config: dict[str, Any] = {
        "temperature": 0.2,
        "maxOutputTokens": 2048,
    }
    if response_schema is not None:
        generation_config["responseMimeType"] = "application/json"
        generation_config["responseSchema"] = response_schema

    payload: dict[str, Any] = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": generation_config,
    }

    headers = {
        "Authorization": f"Bearer {creds.token}",
        "Content-Type": "application/json",
    }

    last_error = "Unknown Vertex AI error"
    with httpx.Client(timeout=30.0) as client:
        for location in locations:
            for model in models:
                url = _endpoint_url(project_id, location, model)
                try:
                    resp = client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        body = resp.json()
                        candidates = body.get("candidates") or []
                        if not candidates:
                            last_error = f"Empty candidates from {model} ({location})"
                            continue
                        parts = (candidates[0].get("content") or {}).get("parts") or []
                        text = "".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
                        if not text:
                            last_error = f"Empty response text from {model} ({location})"
                            continue
                        if response_schema is not None:
                            return json.loads(text), "TELISIK AI Synthesis Engine"
                        return text, "TELISIK AI Synthesis Engine"
                    else:
                        detail = resp.text[:300]
                        last_error = f"HTTP {resp.status_code} from {model}@{location}: {detail}"
                        if resp.status_code in (401, 403):
                            break
                except Exception as exc:
                    last_error = f"{type(exc).__name__}: {exc}"
                    log.warning("Gemini attempt failed on %s@%s: %s", model, location, last_error)

    raise RuntimeError(f"Gemini Vertex AI call failed: {last_error}")


BRIEF_SCHEMA: dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING"},
        "summary": {"type": "STRING"},
        "findings": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "text": {"type": "STRING"},
                    "citations": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["text", "citations"],
            },
        },
        "limitations": {"type": "ARRAY", "items": {"type": "STRING"}},
        "next_steps": {"type": "ARRAY", "items": {"type": "STRING"}},
    },
    "required": ["title", "summary", "findings", "limitations", "next_steps"],
}


def gemini_brief(posts: list[dict[str, Any]], clusters: list[dict[str, Any]], explicit_path: str | Path | None = None) -> dict[str, Any]:
    """Generate an evidence-grounded analyst brief via Vertex AI Gemini using the Service Account."""
    selected = (clusters[0]["evidence"][:6] if clusters else posts[:6])
    allowed_uris = [p["uri"] for p in selected]
    allowed_set = set(allowed_uris)

    evidence_lines = [
        f"- URI: {p['uri']} | Author: {p.get('handle') or p['did']} | Time: {p['created_at']} | Topic: {p['topic']} | Text: {p['text'][:400]}"
        for p in selected
    ]
    cluster_lines = [
        f"- Cluster {c['id']}: rule={c['rule']}, topic={c['topic']}, distinct_authors={c['authors']}, posts={c['posts']}, span_seconds={c['span_seconds']}"
        for c in clusters[:5]
    ]

    system_instruction = (
        "You are an objective public-signal and information-integrity analyst for TELISIK. "
        "Synthesize an evidence-backed analyst brief strictly from the provided sample posts and candidate patterns. "
        "Rules:\n"
        "1. Never claim coordinated intent, bot activity, automation, or author residence.\n"
        "2. Every finding MUST cite one or more exact AT URIs from the provided Evidence Records list.\n"
        "3. State methodological limitations clearly (filtered sample, timing matches are review candidates only).\n"
        "4. Write clear, concise professional analysis."
    )
    prompt = (
        f"Total stored posts in sample: {len(posts)}\n"
        f"Candidate coordination clusters detected: {len(clusters)}\n\n"
        f"Candidate clusters:\n" + ("\n".join(cluster_lines) if cluster_lines else "None above threshold.") + "\n\n"
        f"Evidence Records (cite ONLY these exact URIs):\n" + "\n".join(evidence_lines)
    )

    parsed, provider = call_vertex_gemini(
        prompt=prompt,
        system_instruction=system_instruction,
        response_schema=BRIEF_SCHEMA,
        explicit_path=explicit_path,
    )
    assert isinstance(parsed, dict)

    findings = []
    for item in parsed.get("findings") or []:
        if not isinstance(item, dict) or not item.get("text"):
            continue
        valid_cites = [u for u in (item.get("citations") or []) if u in allowed_set]
        if not valid_cites and allowed_uris:
            valid_cites = [allowed_uris[0]]
        findings.append({"text": str(item["text"]).strip(), "citations": valid_cites})

    if not findings and allowed_uris:
        findings.append({
            "text": f"Reviewed {len(selected)} evidence records across {', '.join(sorted({p['topic'] for p in selected}))}.",
            "citations": allowed_uris[:3],
        })

    limitations = [str(x).strip() for x in (parsed.get("limitations") or []) if str(x).strip()] or [
        "Collection is a filtered sample, not population coverage.",
        "Matching text, links, and timing do not prove coordinated intent.",
    ]
    next_steps = [str(x).strip() for x in (parsed.get("next_steps") or []) if str(x).strip()] or [
        "Read source posts and surrounding context.",
        "Have a human analyst review the evidence before sharing.",
    ]

    return {
        "title": str(parsed.get("title") or "Information integrity review").strip()[:160],
        "summary": str(parsed.get("summary") or f"Review of {len(posts)} stored posts and {len(clusters)} candidate patterns.").strip(),
        "findings": findings,
        "limitations": limitations,
        "next_steps": next_steps,
        "provider": provider,
        "evidence": selected,
    }
