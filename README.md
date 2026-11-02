# Visual feature walkthrough (v15)

The hero now uses only the generated lens/city illustration beside the introduction. The real network moves into the first of five full feature chapters, followed by Narrative DNA, Coordination Fingerprint, Evidence Review and Impact Review. A sticky chapter index tracks scroll position, with progressive once-only entrances and reduced-motion/focus fallbacks.

All pictorial landing icons are custom Imagegen assets. Stock Lucide imports are removed from the landing. Common arrows, menu lines, and FAQ expand controls use text/CSS. The application workspace keeps its existing controls. Hero and icon delivery assets total approximately 120 KB as WebP, with transparency preserved for the icons.

Each chapter includes an interactive visual: original snapshot edge evidence; exact word diff from the app fixture; timing-window filtering using the actual repeated-share function; source-document context checks; and an impact comparison that is withheld when comparison data is missing. All analytical examples after the network are explicitly fictional. No source data, analytical model, API mode or user credentials were changed.

Build and browser interaction checks cover the new presentation. Asset paths and Imagegen prompts: [docs/feature-icons.md](docs/feature-icons.md).

---

# Landing visual polish (v14)

Landing components reveal once on scroll with a short sibling stagger. The header also enters on load. Reduced-motion settings, keyboard focus, and unsupported IntersectionObserver fallbacks keep content visible. Existing Magic UI beams/tickers are retained.

Cobalt/teal mesh gradients add depth to the hero, workflow and CTA. A generated 1536 × 1024 concept illustration appears beside the benefits introduction, explicitly labeled as AI-generated and lazy-loaded with reserved dimensions. Application analysis still makes no AI calls. Asset provenance and prompt: [docs/visual-assets.md](docs/visual-assets.md).

---

# TELISIK landing page (v13)

The root route now introduces TELISIK in Indonesian, with an interactive evidence preview, benefits, a three-stage workflow, data provenance, FAQ and working workspace links. The original workspace is retained at `#/collected`; the brand link returns to `#/home`.

The light cobalt/teal design draws on these Dribbble landing-page references:
- https://dribbble.com/shots/26108934-AI-Analytics-landing-page
- https://dribbble.com/shots/27319739-SaaS-Landing-Page-Design-Data-Enrichment-AI-Scaling

The page directly uses the existing MIT-adapted Magic UI Animated Beam, Border Beam and Number Ticker components. See `src/magicui/LICENSE.md`. Motion respects reduced-motion settings; the navigation and tab interactions support keyboards. No paid component, template or AI API is used.

The network preview derives its five reply edges from the genuine snapshot. Workflow diagrams are illustrations; analyst review and impact evaluation remain clearly labeled fictional case studies. Gemini is not connected. The reduced public dataset is explicitly included in source; raw captures and local backend databases remain ignored.

---

# Real-data public preview (v12)

The published collection now uses **28 genuine public Bluesky posts**: 23 unique keyword-matched posts plus 5 explicitly linked context replies. Seven public accounts and five directed account pairs occur in this bounded sample. There are three unconnected authors; no similarity edges are invented. A small real network is shown at `#/collected`, while the Cendana fictional network remains under `#/coordination`.

Capture provenance is in `src/data/public-snapshot.json`: API capture time, selected public feeds, inspected item counts, keyword settings, source URIs and publication times. At most one available page per feed was read from jakpost.bsky.social, kumparan-poster.bsky.social, antara-poster.bsky.social and nurapixel.bsky.social. Keyword filtering used case-insensitive whole-word matching on jakarta, banjir, transjakarta and mrt. Reposts were deduplicated by record URI. Up to two levels of explicit public thread context were added for an engaged matching post. Handles are source identifiers, not claims of verified account ownership.

This is a fixed, attributed snapshot, **not a live service or a representative sample of Jakarta**. It spans publication dates from January through October 2026; capture and publication time are different. Text is limited to excerpts of up to 25 original words, with original-post links; images and article bodies are not copied. Topics use transparent keyword rules; no sentiment, truth classification, community labels or coordination verdicts are assigned to this snapshot. Narrative, Coordination, Evidence Review and Impact Review still use their fictional fixtures and have an explicit notice.

Public data is isolated from the original synthetic collection fixture. Snapshot source settings are read-only; refreshing reloads the captured data and never pretends to fetch new posts. Local API mode and the existing Jetstream collector remain unchanged, including its original substring-based keyword filter.

To make another bounded snapshot locally:

```sh
python scripts/capture-public-snapshot.py --output data/snapshot-raw.json
python scripts/import-public-snapshot.py data/snapshot-raw.json src/data/public-snapshot.json
npm run build
```

The capture uses only public read endpoints and no authentication or AI service. Endpoint reachability can vary. The raw capture belongs under ignored `data/`; only the reduced, attributed UI dataset belongs in source. New capture/deployment is explicit; published snapshots do not automatically process later deletions. Open source links for current availability.

Snapshot integrity checks:

```sh
./node_modules/.bin/esbuild tests/public-snapshot.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/telisik-public-snapshot.cjs
node /tmp/telisik-public-snapshot.cjs
```

---

# TELISIK — evidence investigation + free Bluesky collection

**New local release:** follow [LOCAL_SETUP.md](LOCAL_SETUP.md). Native Windows launcher: `scripts/start-local.cmd`.

- Local FastAPI backend + SQLite + unauthenticated Jetstream v2 live tail.
- Explicit frontend API mode, collection controls, real post search, sample-derived snapshot and evidence-backed reply/quote network.
- Gemini disabled. No SA JSON, paid AI service, Docker requirement or secret upload.
- The published website remains a static UI preview. The Cendana case study, Narrative/Coordination/Evidence tools and Impact Review remain fictional, including when the local collection is live.

## Earlier design and analytical history

# TELISIK public frontend preview

Static React/Vite edition of TELISIK. The default experience is an interactive Investigation Lab; the collection workspace remains available from the stacked-layers rail icon. All posts and accounts are fictional. No backend, social API or LLM is called.

The demo includes searchable sample posts, pattern inspection, seeded evidence briefs, browser-local draft/review actions, Markdown downloads, adjustable synthetic simulation and browser-local source settings. Live collection and Gemini are intentionally unavailable here.

`npm install`, then `npm run dev` for local development. `npm run build` checks TypeScript and produces `dist/` for static hosting.

The full-stack implementation remains in the separate TELISIK repository. This preview is designed for interface feedback. Browser-local brief and setting changes stay on that device.

## Visual refresh

The second design iteration uses a bright indigo/teal palette, icon-led metric cards, sample-derived sparklines, a topic donut chart, and an evidence network. The original light theme and all six screens are retained. Magic UI's open-source Number Ticker, Animated Beam and Border Beam are adapted for the app's CSS and honor reduced-motion preferences. Third-party attribution is in `src/magicui/LICENSE.md`.

Design references:
- Dribbble: https://dribbble.com/shots/27240877-AI-Data-Analytics-SaaS-Dashboard
- Magic UI Number Ticker: https://magicui.design/docs/components/number-ticker
- Magic UI Animated Beam: https://magicui.design/docs/components/animated-beam
- Magic UI Border Beam: https://magicui.design/docs/components/border-beam

All chart values and illustrated author connections are derived from the existing fictional fixture. The animated pipeline is explicitly an illustration, not a live feed status. No paid UI components, external AI calls or real social data are used.

## Investigation Lab (v3)

The default route is an investigation canvas rather than a KPI dashboard. Case 001, “The Cendana closure story”, is wholly fictional: 192 accounts, 637 post events, 551 directed account-pair relationships and 12 unconnected authors. Its fixture is separate from the older collection workspace fixture.

Three guided questions trace wording changes, identify structural bridges, and inspect clarification references. Users can drag nodes, pan and zoom, select accounts or connections for evidence, replay the four-hour sample, filter interaction layers, search accounts, inspect reference ancestry, remove/restore accounts in a structural experiment, and download a Markdown evidence pack. All computation happens in the browser. No social API, paid component, or AI endpoint is called.

- Each edge aggregates explicit reply, quote or repost parent references, from referenced author to interacting author. Identical wording alone creates no edge.
- D3-force computes connected-account positions. Isolated authors appear in a separate bottom row; they have no fabricated links. Full-case positions stay fixed during replay.
- Graphology Louvain detects communities on the weighted undirected full-case graph. Colors remain fixed during replay and layer filtering.
- Brandes betweenness uses the current unweighted undirected graph. Removal recalculates components and directed structural reachability. These are graph properties, not predicted exposure, causal diffusion, intent or coordination.
- Frame annotations are supplied by the fictional scenario. An interaction is not endorsement. Synthetic record identifiers are inspectable evidence IDs, not links to real accounts.

Model checks cover parent chronology, evidence-to-edge consistency, replay boundaries, layer isolation, identical-text isolates, ancestry, known star-graph betweenness, reproducible community labels, and removal/recalculation. Run:

```sh
./node_modules/.bin/esbuild tests/network.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/risara-network.test.cjs
node /tmp/risara-network.test.cjs
npm run build
```

D3-force: https://d3js.org/d3-force/
Graphology Louvain: https://graphology.github.io/standard-library/communities-louvain.html

## Five investigation tools (v4)

The shared tool navigation adds five distinct interfaces alongside the interaction network. All routes are browser-local and work without a backend or AI service:

| Route | Tool | Interaction |
| --- | --- | --- |
| `#/dna` | Narrative DNA | Choose/swap case post versions, inspect lossless token diffs and wording cues, open source records and follow their actual reference ancestry in the network. |
| `#/fingerprint` | Coordination Fingerprint | Adjust exact-minute timing and distinct-URL thresholds, select account pairs or matrix cells, and inspect every supporting share record. |
| `#/hypotheses` | Hypothesis Arena | Assess six evidence items independently for two explanations, move cards using accessible menus, record rationales, persist drafts in the browser, and export a Markdown review. |
| `#/ground-truth` | Ground Truth Lens | Compare three test statements with three fictional documents, inspect citation sections, pin passages, record a separate analyst assessment per statement/document pair, and export the review. |
| `#/blind-spots` | Blind Spot Explorer | Inject an outage, unavailable parent posts or an omitted community; recalculate surviving records/links and unresolved references; inspect time windows and the optional simulation oracle. |

`src/investigation/case-analysis.ts` contains the pure analysis functions and supplemental fixture. It adds 30 fictional URL-share events, three fictional documents and six evidence items. Supplemental shares are explicitly separate from the original network’s 637 post events. Example `.invalid` URLs are displayed as text and never fetched. No new packages were required.

Narrative DNA uses a longest-common-subsequence token diff, not semantic AI. Wording cues are transparent rules and cannot establish intent. The first three selected narrative versions have explicit reference ancestry; the clarification is a separate source. Source-document readings and initial hypothesis placements are scenario annotations, visibly separate from the user’s editable assessment.

Fingerprint matching removes only known tracking parameters and fragments, preserves content query parameters, and requires distinct accounts sharing identical canonical URLs within the configured minute window. Repeated event IDs do not inflate evidence, and repeated URLs do not count as multiple distinct resources. Timing matches are candidates for review, not a coordination verdict.

Blind Spot Explorer uses the complete fictional fixture only as a controlled simulation reference. Missing population activity is shown as unknown unless the user explicitly reveals the simulation oracle. A reference resolves only if both child and parent records survive. The sampling experiment never mutates the main network fixture. Acknowledging a limitation does not resolve missing data.

Browser drafts use `risara-arena-v1` and `risara-source-review-v1` localStorage keys. They are validated on read, remain on that browser, and are not shared across visitors. Clearing browser storage removes the draft. If storage is unavailable, the tools continue for the current session.

Run the additional analysis checks:

```sh
./node_modules/.bin/esbuild tests/case-analysis.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/risara-case-analysis.test.cjs
node /tmp/risara-case-analysis.test.cjs
```

These checks cover exact reconstruction of Unicode/punctuation diffs, source-ID resolution, canonical URL preservation, exact-time pair matching, duplicate/self-match exclusion, independent validated hypothesis drafts, source citation IDs, and all eight combinations of sampling failures. Browser QA covers the five tools, cross-tool record tracing, local draft persistence, and 375-pixel content widths without page overflow. The matrix itself scrolls horizontally on narrow screens.


## TELISIK identity and navigation (v5)

The app is now TELISIK, with one shared sidebar across the six investigation tools and the collection workspace. `src/app-shell.tsx` owns all route navigation. Page-level export, restore and reset actions render into its sidebar slot through `PageActions`; filters, evidence selection and other controls stay beside the content they affect. The old horizontal feature menu, duplicate icon rail and collection header navigation are removed. On narrow screens the same sidebar opens as a drawer with Escape handling, focus containment and an inactive background.

The high-contrast light palette uses cobalt `#2457E7`, navy `#12213D`, teal `#008E78`, dark body text and clear control borders. Graph, timeline and matrix colors use saturated data marks. `src/brand.css` centralizes the shell and visual overrides. The tab title, favicon, visible brand, site title and download filenames use TELISIK. Existing browser-storage keys stay unchanged to preserve local drafts on the current origin.

The sidebar’s “Algorithmic demo / AI not connected” disclosure explains the method used by each feature. Runtime behavior is unchanged: this static public preview does not invoke Gemini or any AI service. A generated brand asset is a design-time artifact, not runtime AI functionality.

### Logo asset

`public/brand/telisik-mark.png` is a transparent PNG generated with the built-in imagegen tool and used in the sidebar and favicon. The original output remains unchanged. It combines a T monogram, an inspection frame and a teal evidence point. The adjacent TELISIK wordmark is live text for crisp UI rendering.

Generation brief: create one distinctive geometric T monogram integrated with an open square viewfinder and a small evidence point; use saturated cobalt, deep navy and teal; keep a strong silhouette and modest transparent padding; no extra text, mockup, generic eye, robot, shield or watermark. The supplied asset is raster, not an SVG or a claimed vector source.

## Selected Lens identity and loading (v6)

Logo option 03 (Lens) is now used in the sidebar, favicon and shared loading state. `public/brand/telisik-lens.png` is the transparent imagegen extraction; the earlier asset is retained. Built-in imagegen prompt: extract only the exact upper-right 03 aperture symbol from the five-option comparison, preserve its cobalt/navy curved segments, negative-space channels and central teal dot, remove text/background, and center it on transparency. The image is a raster asset.

`LensLoader` rotates the selected mark while React Suspense waits for an actual route-module import, or while the collection workspace awaits sample records. It adds no artificial delay, makes no AI/collection claims, has an accessible status label, and stops animating for reduced-motion preferences. Navigation metadata is separated from case analysis so the shared shell can render before the investigation chunks load.

Product direction: the investigation tools can support a future Decision Brief with findings, cited evidence, uncertainty and proposed actions for human review. That response-recommendation workflow is proposed, not implemented in this demo; Gemini is still not connected.

## Impact Review (v7)

`#/impact` closes the demo workflow: define success, lock a measurement plan, record a fictional execution, inspect before/after and comparison results, and save a human review. It is available in the shared sidebar and from the network's “Evaluate response” action. All route actions remain in the sidebar.

The worked example uses a separate supplemental fixture of 800 uniquely identified fictional posts: two groups × eight hourly bins × 50 posts. It does not reuse or inflate the network's 637 events. The response sample has 120/200 permanent-closure assertions before and 60/200 after; the comparison has 100/200 before and 80/200 after. The descriptive difference of changes is (30−60)−(40−50) = −20 percentage points. The worse-outcome scenario produces +15 points; the missing scenario removes all 200 comparison follow-up records, preserves missing rates as null, and withholds the adjusted estimate and complete target assessment.

Execution, observed target attainment and evidence strength have independent statuses. The adjusted difference and illustrative counterfactual path are only displayed with a recorded execution, complete windows and all four reviewer-assessed conditions. These checkboxes are not independent verification, causal proof or a confidence score. No statistical significance is computed. Public understanding, resident outcomes, impressions and population prevalence are unmeasured. The exact source rows and denominators are browsable and exportable as CSV. The report includes the plan, execution reference, calculations, assumptions, limitations, human review and local activity.

The editable review starts with an unlocked target and unresolved evidence conditions. Execution requires a locked valid plan and populated officer/channel/evidence-reference/wording fields. Execution fields are committed only on submission. Post-action conclusions are gated until then. Locked plan and execution snapshots cannot be overwritten through the UI. A separate worked example remains available. Browser records use `telisik-impact-v1-example` and `telisik-impact-v1-draft`, are validated on load, and fall back safely for malformed versions. Reviewer sign-off is cleared when evidence conditions or scenarios change. Browser persistence is local and editable, not a shared, authenticated or tamper-proof audit log. Storage failure falls back to session-only use.

No AI, live collection, publication API, scheduled monitoring or real-world impact verification has been added. Demo execution records do not publish anything and reference text is not fetched. A backend and real evaluation data will be needed for an operational deployment.

Validation:

```sh
./node_modules/.bin/esbuild tests/impact.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/telisik-impact.test.cjs
node /tmp/telisik-impact.test.cjs
```

Checks cover exact counts and rates, unique IDs, adjusted estimates, worsening and missing data, all four unresolved conditions, plan/execution gates, target/attribution separation, sign-off invalidation, validated draft round trips and report boundaries. TypeScript and the production build also pass. Browser QA covers example scenarios, a new locked plan and execution, saved reviewer notes, evidence-condition invalidation, source pagination and mobile containment.

## Dual outcome evaluation (v8)

Impact Review now presents two outcome tracks for the same fictional case: public-narrative change (action B) and resident-complaint follow-through (linked action C). Each track has its own locked measurement plan, recorded execution, comparison conditions and human review. The case summary reports both targets met, partial success, neither target met or incomplete outcome evaluation. It does not combine the metrics into a score or treat target attainment as causal proof.

The complaint fixture has 40 uniquely identified information complaints: 20 per fixed cohort, registered by Day 2 08:00 WIB, with a 12:00 baseline and 16:00 cutoff. Two cases per cohort were already verified at baseline and remain in the denominator. The worked example moves response verification from 2/20 to 14/20 (10% to 70%) and comparison verification from 2/20 to 6/20 (10% to 30%), for an illustrative difference of changes of +40 percentage points. Administrative closure is 18/20 (90%); reopening is 2/20 (10%). The default service target requires at least 70% verified resolutions and at most 10% reopened by the cutoff. These represent answers to closure-status questions, not physical reopening of the stop.

A verified resolution requires a documented officer answer, resident confirmation after that answer and before the cutoff, and no reopening. Open cases, reopened cases and unavailable follow-up cannot be marked verified through the form. A local demo confirmation can be added for an eligible closed case, using scenario 15:59 WIB and separately recording the browser submission time. That updates the numerator without changing the cohort denominator and clears service sign-off. Receipts and resident quotes are fictional and not independently authenticated.

The high-closure/low-confirmation scenario retains 90% administrative closure but only 30% verified resolution and a zero adjusted difference. Missing comparison follow-up preserves the comparison denominator at 20 while returning unavailable rates; it withholds the service adjusted estimate while leaving the response target independently assessable. Comparison assumptions are separate from the public-post checks. Changing the service scenario clears added demo confirmations and service sign-off. Changing service checks preserves confirmations but clears service sign-off.

Existing v7 public-review keys and data formats are retained. Service state is independently validated in `telisik-service-v1-example` and `telisik-service-v1-draft`. Both tracks export in one Markdown report; the CSV action exports the selected track, with service follow-up fields gated until service execution. Complaint CSV cells neutralize formula prefixes in editable references. There is still no real complaint connector, live collection, resident messaging, AI runtime, authenticated audit log or scheduled monitor. This remains a static, local-browser prototype with fictional data.

Additional checks:

```sh
./node_modules/.bin/esbuild tests/service.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/telisik-service.test.cjs
node /tmp/telisik-service.test.cjs
```

The service checks cover fixed cohorts, exact before/after counts, closure versus verification, cutoff/reopening safeguards, missing data, independent attribution conditions, confirmation eligibility and persistence, sign-off invalidation, dual outcome statuses, report/CSV boundaries and v7 draft compatibility. Public-impact checks also pass after extracting shared UI. Browser QA verifies independent service plan/execution, preserved public targets, confirmations and reviewer notes across reloads, partial-success and missing-data scenarios, and 375-pixel mobile containment.

## Focused navigation and shorter task views (v9)

The shared sidebar now groups investigation tools under “Investigate”, keeps Impact Review visible, and places collection screens and page actions in separate expandable groups. Tool labels and the active-case card are shorter. The default sidebar fits the checked desktop viewport without scrolling; primary route navigation remains in the sidebar.

Impact Review opens on a compact case summary. Selecting public narrative or resident complaints opens that outcome alone, with a back-to-summary control and compact Plan / Action / Results stages. Results are separated into Outcome, Trend, Comparison, Source/Complaint records and Human review panels. Case context and measurement methodology are optional disclosures. Administrative closure, verified resolution, missing-data handling, independent plans and comparison conditions retain their prior meanings and calculations.

Complaint evidence and resident confirmation have separate panels within the selected ticket. Narrative DNA separates text comparison, timeline and wording cues; selecting a timeline version opens its comparison. Coordination Fingerprint separates matrix, candidate pairs and share records; selecting a pair or occupied matrix cell opens the associated records. Public-impact source browsing now uses five records per page.

`FocusPanels` provides linked tab/panel ARIA attributes, one active tab stop, arrow/Home/End keyboard navigation and inactive panels hidden from display and accessibility. Panels and workflow stages remain mounted, so unfinished review and action-field edits survive switches within the mounted workspace, including returning to its case summary. Unsubmitted fields are not promised to survive a reload or leaving the route; existing saved browser records retain their v7/v8 formats. The component returns focus to the active tab when a selection hides the formerly focused panel. No arbitrary loading delay or new service dependency is introduced.

Validation: TypeScript and production build pass. Browser QA verifies a desktop summary with document height equal to the viewport, a sidebar without default overflow, keyboard tab navigation, unsaved review retention across panels and the case summary, timeline-to-comparison selection, candidate-to-source-record navigation, and a 375-pixel mobile viewport with no page-width overflow. The UI still uses fictional data and no runtime AI or live complaint collection.
