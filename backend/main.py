import asyncio
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from urllib.parse import urlsplit
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field, field_validator

from .collector import Collector, ENDPOINT, CURSOR_KEY
from .core import Store, analyse, now, overview, seed_demo, simulate, template_brief
from .gemini import gemini_brief, gemini_config
from .projects import (
    compute_project_summary,
    create_project,
    delete_project,
    ensure_projects,
    filter_posts_for_project,
    get_active_project_id,
    get_project,
    list_projects_with_summaries,
    set_active_project_id,
    sync_project_data,
)

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
store = Store(os.getenv("TELISIK_DB_PATH", str(ROOT / "data" / "telisik.sqlite")))
seed_demo(store)
ensure_projects(store)
collector = Collector(store)


@asynccontextmanager
async def lifespan(app):
    store.prune(collector.settings()["retention_days"])
    yield
    await collector.stop()


app = FastAPI(title="TELISIK local API", version="1.1.0", lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=['localhost','127.0.0.1','[::1]','testserver','terminal.local'])

@app.middleware('http')
async def local_origin_only(request: Request, call_next):
    origin = request.headers.get('origin')
    if origin and request.method not in ('GET','HEAD','OPTIONS'):
        allowed = {'http://localhost:5173','http://127.0.0.1:5173','http://localhost:8000','http://127.0.0.1:8000','http://terminal.local:4173'}
        if origin not in allowed:
            return JSONResponse({'detail':'This local API only accepts writes from the local frontend.'}, status_code=403)
    return await call_next(request)



class Mode(BaseModel):
    mode: Literal["demo", "live"]


class SourceSettings(BaseModel):
    keywords: list[str] = Field(default_factory=list, max_length=30)
    languages: list[str] = Field(default_factory=list, max_length=10)
    retention_days: int = Field(default=7, ge=1, le=30)

    @field_validator("keywords", "languages")
    @classmethod
    def clean(cls, values):
        return sorted(set(v.strip().lower()[:100] for v in values if v.strip()))


class BriefRequest(BaseModel):
    use_gemini: bool = False
    cluster_id: str | None = Field(default=None, max_length=64)
    minimum: int = Field(default=3, ge=2, le=30)
    window: int = Field(default=300, ge=10, le=3600)


class SimulationRequest(BaseModel):
    actors: int = Field(default=12, ge=2, le=60)
    interval: int = Field(default=8, ge=1, le=600)
    minimum: int = Field(default=3, ge=2, le=30)
    window: int = Field(default=300, ge=10, le=3600)
    seed: int = Field(default=42, ge=0, le=99999)


class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    topic: str = Field(default="Public services", max_length=80)
    description: str = Field(default="", max_length=400)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    languages: list[str] = Field(default_factory=lambda: ["id", "en"], max_length=10)


class ActiveProjectRequest(BaseModel):
    project_id: str | None = Field(default=None, max_length=80)


class SyncProjectRequest(BaseModel):
    add_keywords: list[str] = Field(default_factory=list, max_length=20)
    manual_handle: str = Field(default="", max_length=100)
    manual_text: str = Field(default="", max_length=1000)
    manual_url: str = Field(default="", max_length=400)


def scoped_posts(project_id: str | None = None):
    pid = project_id if project_id is not None else get_active_project_id(store)
    proj = get_project(store, pid)
    return filter_posts_for_project(store.posts(), proj), proj


@app.get("/api/health")
def health():
    cfg = gemini_config()
    return {"status": "ok", "service": "telisik", "storage": "sqlite", "gemini_configured": cfg["configured"], "gemini_project": cfg["project_id"], "gemini_model": cfg["model"]}


@app.get("/api/projects")
def get_projects():
    return list_projects_with_summaries(store)


@app.post("/api/projects", status_code=201)
def add_project(request: CreateProjectRequest):
    created = create_project(
        store,
        name=request.name,
        keywords=request.keywords,
        topic=request.topic,
        description=request.description,
        languages=request.languages,
    )
    collector.settings(refresh=True)
    return {"created": created, **list_projects_with_summaries(store)}


@app.put("/api/projects/active")
def switch_active_project(request: ActiveProjectRequest):
    set_active_project_id(store, request.project_id)
    return list_projects_with_summaries(store)


@app.post("/api/projects/{project_id}/sync")
def sync_project(project_id: str, request: SyncProjectRequest | None = None):
    proj = get_project(store, project_id)
    if not proj:
        raise HTTPException(404, "Project not found.")
    sync_info = sync_project_data(store, proj, request.model_dump() if request else None)
    return {"sync": sync_info, "project": compute_project_summary(store, proj), **list_projects_with_summaries(store)}


@app.delete("/api/projects/{project_id}")
def remove_project(project_id: str):
    return delete_project(store, project_id)


@app.get("/api/overview")
def get_overview(project_id: str | None = Query(default=None)):
    posts, proj = scoped_posts(project_id)
    return {
        **overview(posts, analyse(posts)),
        "mode": store.get("mode", "demo"),
        "active_project": proj,
    }


@app.get("/api/posts")
def get_posts(q: str = Query(default="", max_length=200), topic: str = Query(default="", max_length=100), language: str = Query(default="", max_length=20), page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), project_id: str | None = Query(default=None)):
    base_posts, proj = scoped_posts(project_id)
    posts = [p for p in base_posts if (not q or q.casefold() in (p["text"] + p["did"]).casefold()) and (not topic or p["topic"] == topic) and (not language or language in p["langs"])]
    return {"items": posts[(page - 1) * limit:page * limit], "total": len(posts), "page": page, "limit": limit, "active_project": proj}


@app.get("/api/coordination")
def get_coordination(minimum: int = Query(default=3, ge=2, le=30), window: int = Query(default=300, ge=10, le=3600), project_id: str | None = Query(default=None)):
    posts, proj = scoped_posts(project_id)
    return {"clusters": analyse(posts, window, minimum), "active_project": proj, "method": "Exact normalized text or shared URL, distinct authors, sliding time window.", "caution": "Signals for analyst review. Matching patterns do not establish coordinated intent or automation."}


@app.get("/api/briefs")
def get_briefs(project_id: str | None = Query(default=None)):
    pid = project_id if project_id is not None else get_active_project_id(store)
    mode = store.get("mode", "demo")
    all_briefs = [b for b in store.briefs() if b.get("mode") == mode]
    if pid:
        items = [b for b in all_briefs if b.get("project_id") == pid]
        if not items:
            posts, proj = scoped_posts(pid)
            if posts and proj:
                clusters = analyse(posts, 300, 3)
                seeded = template_brief(posts, clusters, proj)
                seeded.update(
                    id=f"brief-{pid[:12]}",
                    status="Draft",
                    created_at=now(),
                    mode=mode,
                    project_id=proj["id"],
                    project_name=proj["name"],
                )
                store.save_brief(seeded)
                items = [seeded]
        return {"items": items}
    return {"items": all_briefs}


@app.post("/api/briefs", status_code=201)
async def create_brief(request: BriefRequest):
    posts, proj = scoped_posts()
    if not posts:
        raise HTTPException(400, "No stored evidence in the selected mode/project.")
    clusters = analyse(posts, request.window, request.minimum)
    if request.cluster_id:
        clusters = [c for c in clusters if c["id"] == request.cluster_id]
        if not clusters:
            raise HTTPException(404, "Pattern no longer available; refresh the radar.")
    if request.use_gemini:
        cfg = gemini_config()
        if not cfg["configured"]:
            raise HTTPException(409, "AI Synthesis Engine is not configured.")
        try:
            brief = await asyncio.to_thread(gemini_brief, posts, clusters)
        except Exception as exc:
            raise HTTPException(502, f"AI Synthesis Engine call failed: {exc}") from exc
        if proj:
            brief["title"] = f"[{proj['code']}] {proj['name']} — {brief.get('title', 'Kajian Integritas & Bukti')}"
    else:
        brief = template_brief(posts, clusters, proj)
    if proj:
        brief["project_id"] = proj["id"]
        brief["project_name"] = proj["name"]
    brief.update(id=uuid.uuid4().hex[:16], status="Draft", created_at=now(), mode=store.get("mode", "demo"))
    store.save_brief(brief)
    return brief


def find_brief(brief_id):
    brief = next((b for b in store.briefs() if b["id"] == brief_id and b.get("mode") == store.get("mode", "demo")), None)
    if not brief:
        raise HTTPException(404, "Brief not found in this mode.")
    return brief


@app.post("/api/briefs/{brief_id}/review")
def review_brief(brief_id: str):
    brief = find_brief(brief_id)
    brief.update(status="Reviewed", reviewed_at=now())
    store.save_brief(brief)
    return brief


@app.get("/api/briefs/{brief_id}/export", response_class=PlainTextResponse)
def export_brief(brief_id: str):
    b = find_brief(brief_id)
    text = f"# {b['title']}\n\n{b['status']} · {b['mode']} · {b['provider']}\n\n{b['summary']}\n\n"
    for f in b["findings"]:
        text += f"- {f['text']}\n" + "".join(f"  - {uri}\n" for uri in f["citations"]) + "\n"
    text += "## Limitations\n\n" + "\n".join(f"- {x}" for x in b["limitations"])
    text += "\n\n## Next steps\n\n" + "\n".join(f"- {x}" for x in b["next_steps"])
    text += "\n\n## Evidence snapshot\n\n" + "\n\n".join(f"{p['uri']}\n{p['created_at']}\n{p['text']}" for p in b["evidence"])
    return PlainTextResponse(text, headers={"Content-Disposition": f'attachment; filename="telisik-brief-{brief_id}.md"'})


@app.post("/api/simulation")
def run_simulation(request: SimulationRequest):
    return simulate(**request.model_dump())


@app.get("/api/sources")
def sources():
    cfg = gemini_config()
    return {"mode": store.get("mode", "demo"), "settings": collector.settings(), "collector": collector.state, "endpoint": ENDPOINT, "live_posts": len(store.posts("live")), "gemini_configured": cfg["configured"], "gemini_project": cfg["project_id"], "gemini_client_email": cfg["client_email"], "gemini_model": cfg["model"], "cursor": store.get(CURSOR_KEY), "limit": 20000, "protocol":"Jetstream v2", "storage":"SQLite on this machine", "ai_enabled": cfg["configured"]}


@app.put("/api/sources/settings")
def save_settings(request: SourceSettings):
    store.set("source_settings", request.model_dump())
    store.prune(request.retention_days)
    collector.settings(refresh=True)
    return sources()


@app.put("/api/mode")
async def set_mode(request: Mode):
    store.set("mode", request.mode)
    if request.mode == "demo":
        await collector.stop()
    return sources()


@app.post("/api/sources/start")
async def start_source():
    if store.get("mode", "demo") != "live":
        raise HTTPException(409, "Switch to live mode before collecting.")
    collector.start()
    return sources()


@app.post("/api/sources/stop")
async def stop_source():
    await collector.stop()
    return sources()


@app.get('/api/network')
def get_network(limit: int = Query(default=500, ge=1, le=1000), project_id: str | None = Query(default=None)):
    from .network import network
    posts, proj = scoped_posts(project_id)
    res = network(posts[:limit], store.get('mode','demo'))
    res['active_project'] = proj
    return res


@app.get('/api/posts/export', response_class=PlainTextResponse)
def export_posts(project_id: str | None = Query(default=None)):
    import json
    posts, _ = scoped_posts(project_id)
    return PlainTextResponse('\n'.join(json.dumps(p, ensure_ascii=False) for p in posts), media_type='application/x-ndjson', headers={'Content-Disposition':'attachment; filename="telisik-posts.ndjson"'})
