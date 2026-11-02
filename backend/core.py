"""Local evidence store and explainable, deterministic analysis. No external AI required."""
import hashlib
import json
import re
import sqlite3
from contextlib import contextmanager
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit

UTC = timezone.utc
TOPICS = {
    "Transport": ["mrt", "transjakarta", "transport", "bus", "macet"],
    "Flooding": ["banjir", "flood", "drainase", "hujan"],
    "Public services": ["layanan", "service", "dukcapil", "puskesmas"],
    "Environment": ["sampah", "polusi", "udara", "lingkungan"],
    "Information integrity": ["hoaks", "hoax", "verifikasi", "disinformasi"],
}


def now():
    return datetime.now(UTC).isoformat()


def parse_time(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)
    except (ValueError, AttributeError):
        return datetime.now(UTC)


def topic(text):
    low = text.lower()
    return max(TOPICS, key=lambda t: sum(w in low for w in TOPICS[t])) if any(w in low for ws in TOPICS.values() for w in ws) else "Other"


def fingerprint(text):
    return re.sub(r"\W+", " ", re.sub(r"https?://\S+", "", text.lower())).strip()


def make_post(did, rkey, record, origin="live"):
    text = record.get("text", "")[:10000]
    links = re.findall(r"https?://[^\s<>]+", text)
    for facet in record.get("facets", []) if isinstance(record.get("facets", []), list) else []:
        if not isinstance(facet, dict): continue
        for feature in facet.get("features", []):
            if not isinstance(feature, dict): continue
            if feature.get("uri", "").startswith(("https://", "http://")):
                links.append(feature["uri"])
    embed = record.get("embed", {}) or {}
    if not isinstance(embed, dict): embed = {}
    external = embed.get("external", {}) or {}
    if not isinstance(external, dict): external = {}
    if external.get("uri", "").startswith(("https://", "http://")):
        links.append(external["uri"])
    reply = record.get("reply", {}) or {}
    if not isinstance(reply, dict): reply = {}
    quoted = embed.get("record", {}) or {}
    if not isinstance(quoted, dict): quoted = {}
    if isinstance(quoted.get("record"), dict):
        quoted = quoted["record"]
    return {
        "uri": f"at://{did}/app.bsky.feed.post/{rkey}", "did": did,
        "handle": record.get("_handle", did), "text": text,
        "created_at": parse_time(record.get("createdAt", now())).isoformat(),
        "collected_at": now(), "langs": record.get("langs", []),
        "links": sorted(set(links)), "topic": topic(text), "origin": origin,
        "reply_to": (reply.get("parent", {}) or {}).get("uri"),
        "quote_of": quoted.get("uri"),
        "url": f"https://bsky.app/profile/{did}/post/{rkey}" if origin == "live" else None,
    }


class Store:
    def __init__(self, path):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS posts(uri TEXT PRIMARY KEY, origin TEXT, created_at TEXT, data TEXT);
                CREATE INDEX IF NOT EXISTS post_mode_time ON posts(origin, created_at);
                CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
                CREATE TABLE IF NOT EXISTS briefs(id TEXT PRIMARY KEY, data TEXT);
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            with db:
                yield db
        finally:
            db.close()

    def get(self, key, default=None):
        with self.connect() as db:
            row = db.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
            return json.loads(row[0]) if row else default

    def set(self, key, value):
        with self.connect() as db:
            db.execute("INSERT OR REPLACE INTO settings VALUES (?,?)", (key, json.dumps(value)))

    def put(self, post):
        with self.connect() as db:
            db.execute("INSERT OR REPLACE INTO posts VALUES (?,?,?,?)", (post["uri"], post["origin"], post["created_at"], json.dumps(post)))

    def delete(self, uri):
        with self.connect() as db:
            db.execute("DELETE FROM posts WHERE uri=? AND origin='live'", (uri,))

    def delete_did(self, did):
        with self.connect() as db:
            db.execute("DELETE FROM posts WHERE origin='live' AND uri LIKE ?", (f"at://{did}/%",))

    def posts(self, mode=None):
        mode = mode or self.get("mode", "demo")
        origin = "synthetic" if mode == "demo" else "live"
        with self.connect() as db:
            return [json.loads(r[0]) for r in db.execute("SELECT data FROM posts WHERE origin=? ORDER BY created_at DESC LIMIT 20000", (origin,))]

    def save_brief(self, brief):
        with self.connect() as db:
            db.execute("INSERT OR REPLACE INTO briefs VALUES (?,?)", (brief["id"], json.dumps(brief)))

    def briefs(self):
        with self.connect() as db:
            return [json.loads(r[0]) for r in db.execute("SELECT data FROM briefs ORDER BY rowid DESC")]

    def prune(self, days):
        cutoff = (datetime.now(UTC) - timedelta(days=days)).isoformat()
        with self.connect() as db:
            db.execute("DELETE FROM posts WHERE origin='live' AND created_at<?", (cutoff,))
            db.execute("DELETE FROM posts WHERE origin='live' AND uri NOT IN (SELECT uri FROM posts WHERE origin='live' ORDER BY created_at DESC LIMIT 20000)")


def seed_demo(store):
    if store.get("demo_version") == 1:
        return
    base = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) - timedelta(hours=23)
    samples = [
        "Jadwal MRT Jakarta makin nyaman. Integrasi bus Transjakarta perlu ditingkatkan.",
        "Hujan sore ini, cek drainase dan informasi banjir dari kanal resmi.",
        "Antrean layanan dukcapil mulai lebih cepat, semoga konsisten.",
        "Kualitas udara Jakarta perlu perhatian. Kurangi polusi dari kendaraan.",
        "Sebelum membagikan kabar viral, lakukan verifikasi. Waspada hoaks.",
        "Taman kota jadi tempat baca favorit keluarga di akhir pekan.",
    ]
    rows = []
    for i in range(180):
        did = f"did:example:resident{i % 67:03}"
        record = {"text": f"{samples[i % 6]} Catatan warga area {i % 13 + 1}, sesi {i}.", "createdAt": (base + timedelta(minutes=i * 7)).isoformat(), "langs": ["id"], "_handle": f"warga-{i % 67:03}.example"}
        post = make_post(did, f"sample{i:04}", record, "synthetic")
        rows.append((post["uri"], post["origin"], post["created_at"], json.dumps(post)))
    for group, text in enumerate([
        "Info layanan bus Jakarta berubah besok. Cek jadwal resmi sebelum berangkat. https://example.org/jadwal-bus",
        "Hujan deras Jakarta: verifikasi informasi banjir sebelum menyebarkan. https://example.org/info-banjir",
        "Udara bersih untuk semua. Baca agenda lingkungan Jakarta. https://example.org/udara",
    ]):
        for j in range(8 + group * 2):
            record = {"text": text, "createdAt": (base + timedelta(hours=18 + group, seconds=j * 8)).isoformat(), "langs": ["id"], "_handle": f"contoh-{group}-{j}.example"}
            post = make_post(f"did:example:group{group}actor{j}", f"cluster{group}-{j}", record, "synthetic")
            rows.append((post["uri"], post["origin"], post["created_at"], json.dumps(post)))
    with store.connect() as db:
        db.executemany("INSERT OR REPLACE INTO posts VALUES (?,?,?,?)", rows)
        db.execute("INSERT OR REPLACE INTO settings VALUES (?,?)", ("demo_version", json.dumps(1)))


def analyse(posts, window=300, minimum=3):
    """Exact normalized text/shared URLs, distinct authors, fixed time windows. No bot inference."""
    groups = defaultdict(list)
    for p in posts:
        fp = fingerprint(p["text"])
        if len(fp) >= 40:
            groups[("Repeated text", fp)].append(p)
        for link in p["links"]:
            groups[("Shared link", link)].append(p)
    clusters, signatures = [], set()
    for (kind, key), members in groups.items():
        members.sort(key=lambda p: p["created_at"])
        left = 0
        for right, p in enumerate(members):
            while (parse_time(p["created_at"]) - parse_time(members[left]["created_at"])).total_seconds() > window:
                left += 1
            # Skip non-maximal windows before copying/counting the evidence bucket.
            if right + 1 < len(members) and (parse_time(members[right + 1]["created_at"]) - parse_time(members[left]["created_at"])).total_seconds() <= window:
                continue
            bucket = members[left:right + 1]
            authors = sorted({x["did"] for x in bucket})
            if len(authors) < minimum:
                continue
            signature = tuple(sorted(x["uri"] for x in bucket))
            if signature in signatures:
                continue
            signatures.add(signature)
            cid = hashlib.sha256("|".join(signature).encode()).hexdigest()[:12]
            span = int((parse_time(bucket[-1]["created_at"]) - parse_time(bucket[0]["created_at"])).total_seconds())
            clusters.append({"id": cid, "label": f"{bucket[0]['topic']} · {kind.lower()}", "rule": kind, "key": key, "authors": len(authors), "posts": len(bucket), "span_seconds": span, "start": bucket[0]["created_at"], "topic": bucket[0]["topic"], "evidence": bucket, "author_ids": authors})
    return sorted(clusters, key=lambda c: (-c["authors"], c["start"]))[:30]


def overview(posts, clusters):
    hours = Counter(parse_time(p["created_at"]).strftime("%Y-%m-%dT%H:00:00+00:00") for p in posts)
    if posts:
        start = min(parse_time(p["created_at"]) for p in posts).replace(minute=0, second=0, microsecond=0)
        end = max(parse_time(p["created_at"]) for p in posts)
        # Bound chart density to the most recent 7 days.
        start = max(start, end - timedelta(days=7))
        series = []
        while start <= end:
            series.append({"time": start.isoformat(), "posts": hours[start.isoformat()]})
            start += timedelta(hours=1)
    else:
        series = []
    topics = Counter(p["topic"] for p in posts)
    return {"posts": len(posts), "authors": len({p["did"] for p in posts}), "topics": len(topics), "clusters": len(clusters), "series": series, "topic_counts": [{"topic": k, "count": v} for k, v in topics.most_common()], "latest": posts[:4], "coverage": "Stored sample only; not representative of Jakarta or all Bluesky users.", "range_start": min((p["created_at"] for p in posts), default=None), "range_end": max((p["created_at"] for p in posts), default=None)}


def template_brief(posts, clusters, proj=None):
    selected = clusters[0]["evidence"][:6] if clusters else posts[:6]
    citations = [p["uri"] for p in selected]
    findings = []
    proj_label = f"[{proj['code']}] {proj['name']}" if proj else "Koleksi Global"
    if clusters:
        c = clusters[0]
        rule_id = "teks identik berulang" if c["rule"] == "Repeated text" else "tautan URL bersama"
        findings.append({
            "text": f"Terdeteksi {c['authors']} akun berbeda mempublikasikan {c['posts']} post dengan pola {rule_id} dalam rentang {c['span_seconds']} detik pada topik {c['topic']}. Pola ini melampaui ambang batas kandidat koordinasi dan memerlukan verifikasi konteks manual.",
            "citations": [p["uri"] for p in selected[:4]],
        })
        if len(clusters) > 1:
            c2 = clusters[1]
            rule2_id = "teks identik berulang" if c2["rule"] == "Repeated text" else "tautan URL bersama"
            c2_uris = [p["uri"] for p in c2["evidence"][:2]]
            for u in c2_uris:
                if u not in citations and len(selected) < 8:
                    selected.append(next(p for p in c2["evidence"] if p["uri"] == u))
                    citations.append(u)
            findings.append({
                "text": f"Klaster sekunder menunjukkan {c2['authors']} akun membagikan {c2['posts']} post ({rule2_id}) dalam jendela {c2['span_seconds']} detik, mengindikasikan amplifikasi paralel pada topik yang sama.",
                "citations": c2_uris or citations[:2],
            })
        else:
            findings.append({
                "text": f"Di luar klaster utama, terdapat {len(posts)} total post dari {len({p['did'] for p in posts})} akun unik dalam cakupan {proj_label} yang mayoritas merupakan percakapan organik warga.",
                "citations": citations[-2:] if len(citations) >= 2 else citations,
            })
    elif selected:
        topics_str = ", ".join(sorted({p["topic"] for p in selected}))
        findings.append({
            "text": f"Sampel terpilih pada {proj_label} mencakup {len(posts)} post pada kategori {topics_str}. Belum ditemukan jendela waktu koordinasi yang melewati ambang batas saat ini.",
            "citations": citations,
        })
    title = f"[{proj['code']}] {proj['name']} — Kajian Integritas & Bukti" if proj else "Kajian Integritas Informasi & Bukti Koleksi"
    summary = (
        f"Ringkasan pemeriksaan bukti atas {len(posts)} post tersimpan dan {len(clusters)} kandidat pola koordinasi "
        f"pada project pemantauan \"{proj['name']}\" (kata kunci: {', '.join(proj.get('keywords', [])[:5])})."
        if proj
        else f"Ringkasan pemeriksaan bukti atas {len(posts)} post tersimpan dan {len(clusters)} kandidat pola koordinasi lintas topik."
    )
    return {
        "title": title,
        "summary": summary,
        "findings": findings,
        "limitations": [
            "Koleksi merupakan sampel terfilter berdasarkan kata kunci project, bukan populasi penuh seluruh pengguna.",
            "Kesamaan teks, tautan, dan kedekatan waktu publikasi belum membuktikan adanya bot atau niat manipulatif.",
            "Penyebutan nama lokasi di dalam teks post tidak mengidentifikasi domisili asli pemilik akun.",
        ],
        "next_steps": [
            "Periksa post asli beserta balasan (reply/quote) di sekitarnya untuk memahami konteks percakapan.",
            "Pastikan apakah lonjakan kesamaan pesan dipicu oleh rilis berita resmi atau peringatan layanan publik.",
            "Lakukan tinjauan analis manusia (Mark Reviewed) sebelum membagikan dokumen brief ini ke pihak eksternal.",
        ],
        "provider": "TELISIK Deterministic Synthesis (Template Bukti Lokal)",
        "evidence": selected,
    }


def simulate(actors=12, interval=8, minimum=3, window=300, seed=42):
    base = datetime(2026, 1, 1, tzinfo=UTC)
    posts = []
    for i in range(actors):
        posts.append(make_post(f"did:example:simulation{i}", f"sim{seed}-{i}", {"text": "Simulasi: periksa kanal resmi untuk jadwal bus Jakarta. https://example.org/simulation", "createdAt": (base + timedelta(seconds=i * interval)).isoformat()}, "synthetic"))
    for i in range(30):
        posts.append(make_post(f"did:example:control{i}", f"control{seed}-{i}", {"text": f"Catatan warga tentang taman, perjalanan dan buku nomor {i} seed {seed}.", "createdAt": (base + timedelta(seconds=i * 67)).isoformat()}, "synthetic"))
    clusters = analyse(posts, window, minimum)
    matched = {p["uri"] for c in clusters for p in c["evidence"]}
    positive = {p["uri"] for p in posts if "/sim" in p["uri"]}
    tp, fp = len(matched & positive), len(matched - positive)
    return {"actors": actors, "total_posts": len(posts), "detected": len(clusters), "flagged": len(matched), "recall": round(tp / len(positive), 3), "precision": round(tp / len(matched), 3) if matched else 0, "false_positives": fp, "series": [{"actor": i + 1, "seconds": i * interval} for i in range(actors)], "clusters": clusters, "note": "Synthetic exact-match benchmark only. These metrics do not estimate real-world accuracy. No posts are published or added to the collection."}
