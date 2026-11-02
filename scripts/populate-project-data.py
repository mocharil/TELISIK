#!/usr/bin/env python3
"""Populate TELISIK Topic Projects with real captured Bluesky data & dense network interactions.

Usage:
  python scripts/populate-project-data.py           # Import public-snapshot.json + build dense project graphs
  python scripts/populate-project-data.py --live    # Also query live Bluesky AppView API for each project's keywords
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.core import Store, UTC, make_post, seed_demo  # noqa: E402
from backend.projects import (  # noqa: E402
    PROJECTS_KEY,
    _build_synthetic_project_posts,
    _load_real_snapshot_rows,
    compute_project_summary,
    ensure_projects,
    sync_project_data,
)


def fetch_live_bluesky_for_project(store: Store, proj: dict) -> int:
    """Query public Bluesky searchPosts + getPostThread for real threads matching project keywords."""
    keywords = [k.strip() for k in proj.get("keywords", []) if k.strip()]
    fetched = 0
    for kw in keywords[:4]:
        try:
            q = urllib.parse.urlencode({"q": kw, "limit": 25})
            url = f"https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?{q}"
            req = urllib.request.Request(
                url,
                headers={"Accept": "application/json", "User-Agent": "TELISIK-DataPopulator/1.1"},
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                for item in payload.get("posts", []):
                    author = item.get("author", {}) or {}
                    did = author.get("did")
                    uri = item.get("uri", "")
                    rkey = uri.split("/")[-1] if "/" in uri else None
                    record = item.get("record", {}) or {}
                    if did and rkey and isinstance(record.get("text"), str):
                        record["_handle"] = author.get("handle") or did
                        for origin in ("synthetic", "live"):
                            post = make_post(did, rkey, record, origin)
                            post["project_id"] = proj["id"]
                            post["topic"] = proj.get("topic") or post["topic"]
                            post["url"] = f"https://bsky.app/profile/{author.get('handle') or did}/post/{rkey}"
                            post["matched_keywords"] = [
                                k for k in keywords if k.lower() in post["text"].lower()
                            ] or [kw]
                            store.put(post)
                        fetched += 1
        except Exception as exc:
            print(f"  [info] Live fetch for keyword '{kw}' skipped/offline: {exc}")
            break
    return fetched


def main() -> int:
    parser = argparse.ArgumentParser(description="Populate TELISIK projects with real snapshot & dense network data.")
    parser.add_argument("--db", default=str(ROOT / "data" / "telisik.sqlite"), help="Path to SQLite database")
    parser.add_argument("--live", action="store_true", help="Also fetch live posts from Bluesky public API")
    args = parser.parse_args()

    store = Store(args.db)
    seed_demo(store)
    projects = ensure_projects(store)
    origin = "synthetic" if store.get("mode", "demo") == "demo" else "live"

    # Populate v3 rich project interactions + real snapshot records
    base = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) - timedelta(hours=18)
    rows = []
    rows.extend(_load_real_snapshot_rows(projects, origin))

    for idx, proj in enumerate(projects):
        synth_rows = _build_synthetic_project_posts(proj, base + timedelta(hours=idx * 2))
        for uri, _, created_at, raw in synth_rows:
            p = json.loads(raw)
            p["origin"] = origin
            rows.append((uri, origin, created_at, json.dumps(p)))

    with store.connect() as db:
        db.executemany("INSERT OR REPLACE INTO posts VALUES (?,?,?,?)", rows)
        db.execute("INSERT OR REPLACE INTO settings VALUES (?,?)", ("project_interactions_seeded_v3", json.dumps(1)))

    if args.live:
        print("Fetching live Bluesky posts for each project...")
        for proj in projects:
            cnt = fetch_live_bluesky_for_project(store, proj)
            print(f"  -> {proj['code']} ({proj['name']}): +{cnt} live posts fetched")

    all_posts = store.posts()
    print(f"\n=== TELISIK Project Data Summary (Total Stored Posts: {len(all_posts)}) ===")
    for proj in projects:
        summary = compute_project_summary(store, proj, all_posts)
        m = summary["metrics"]
        print(
            f"  [{summary['code']}] {summary['name']:<34} | "
            f"Posts: {m['total_posts']:>3} | "
            f"Akun: {m['unique_authors']:>2} | "
            f"Koneksi Graf: {m['network_connections']:>2} ({m['connected_accounts']} terhubung) | "
            f"Klaster: {m['coordination_clusters']} ({m['alert_level']})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
