# TELISIK — Windows 11 local setup

Requirements: Python 3.11+ (with the `py` launcher), Node.js 22+, internet access for package installation and the public feed.

1. Extract the ZIP to a writable folder, e.g. `C:\Projects\telisik`.
2. Double-click `scripts\start-local.cmd`. It creates a Python virtual environment, installs dependencies, starts the API and frontend together.
3. Open http://localhost:5173. Go to **Data & sources → Collection**.
4. Choose **Live collection**, save keywords/languages, then **Start collection**. Wait for **Receiving feed**. Jakarta-related matches may be sparse; an empty result is valid.
5. Open **Posts**, **Snapshot**, or **Network → Collected data**. The default Cendana network and all other case-study tools remain fictional.
6. Press Ctrl+C in the launcher window to stop. The database remains at `data\telisik.sqlite`; restart to reuse it. Collection does not run when your backend is stopped.

No service account is needed. Gemini is intentionally disabled; no credential upload field, SDK, paid AI API or sample SA JSON is included. Later integration belongs exclusively in the backend. Never place a service-account file in `public/`, in a `VITE_*` value, or in Git.

## Manual startup

```powershell
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

```powershell
npm ci
$env:VITE_USE_LOCAL_API="true"
npm run dev -- --port 5173 --strictPort
```

The Vite `/api` proxy sends requests to `127.0.0.1:8000`. Frontend mode is explicit: with `VITE_USE_LOCAL_API=true`, API failures show an error and never substitute fictional data. With the flag unset, the frontend is the self-contained public preview. A local build intended to call the API also needs a same-origin `/api` reverse proxy; `npm run dev` supplies it during development. Do not open `dist/index.html` directly for local API mode.

If startup fails: ensure ports 8000 and 5173 are free, `py --version` reports Python 3.11+, and `node --version` reports 22+. Re-run the launcher after resolving the error. It does not change Windows execution policy.

## What is live, and what is still a case demo?

| Area | Data |
| --- | --- |
| Collection settings, session, posts, snapshot | Local SQLite; live public Bluesky posts after switching mode and starting collection |
| Network → Collected data | Up to 800 most recent stored posts; only explicit reply/quote pairs with both endpoints stored |
| Network → Fictional case study | Original 192-account Cendana scenario |
| Narrative, Coordination, Evidence review, Impact review | Original fictional training scenarios and browser-local reviews |

A real feed does not make the case-study recommendations or outcome evaluations real. This release does not publish responses, classify truth using AI, synchronize evaluation records, or establish causal impact.

## Free feed and coverage

Source: https://bsky.network/docs/jetstream/

The collector uses the unauthenticated Jetstream v2 **live tail**, with a post collection filter and local keyword/language filtering. It does not call paid historical Replay/Snapshot APIs. Posts are keyed by their AT URI, updates replace a matching record, deletions remove stored live posts, and deactivated or divergent accounts are removed from the live store. Sequence cursors are saved in SQLite; v1 timestamp cursors are never reused as v2 sequence cursors. Replay duplicates at or below the last handled v2 sequence are skipped.

The feed and bounded replay can have gaps. Parent posts outside the collected slice remain unresolved; identical wording never manufactures a network link. Reposts/likes are not collected. No follower, residence, bot, reach, exposure or intent claims are inferred. Topics are transparent keyword rules. Stored records are pruned every 30 seconds while the collector runs, at startup and after filter saves, by retention and a 20,000-post cap. Counts can transiently exceed the cap between maintenance runs; analysis is capped. Existing saved brief snapshots are not rewritten by feed deletions.

A public feed costs no API credits for this live-tail flow, but uses your computer, internet connection and disk. GCP deployment is not included in this local release; cloud hosting can incur infrastructure costs.

## Tests

```powershell
.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
.venv\Scripts\python.exe -m pytest tests/backend -q
npm run build
```

Backend tests cover lifecycle, v2 cursor replay, update/delete handling, missing parent references, exact graph evidence, API persistence, mode separation, origin checks and an in-process WebSocket feed. Public Bluesky reachability is a separate smoke check, not replaced by those tests. The Windows launcher is provided for native Windows; automated execution validation is performed in Linux and does not certify every Windows configuration.

### Validation note for this build

Backend/API tests and a real public-feed collection smoke check passed in the development environment. Browser QA covers the static frontend preview at desktop and phone widths. The managed preview environment does not provide the local Python virtual environment, so a browser-to-Python end-to-end run and the native Windows launcher still need validation on your laptop.
