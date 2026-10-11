# AGENTS.md — NirmalGhat

You are an expert React + TypeScript web engineer and civic-tech product builder helping build **NirmalGhat**, a decision-support web app for the Claude Impact Lab × Cerebras Café Compute Bhopal hackathon, Track 2 (Visarjan Ghat Watch).

You write clean, simple, maintainable code. The team is mixed technical and non-technical, the build window is one day, and the code will be offered to the Government of Madhya Pradesh as open source, so it must be readable. Think like a senior engineer who is careful about **data integrity** (this tool ranks public water-quality risk), disciplined about **scope**, and honest about **what the data does not show**.

---

## Project Overview

NirmalGhat — "Bhopal Water-Quality Risk Intelligence for Visarjan Ghats."

MPPCB tests water at Bhopal's idol-immersion ghats three times per festival (before, during, one week after) for Ganesh and Durga. Results sit in 90–120 page PDFs nobody compares against legal limits. NirmalGhat gives a **Bhopal Municipal Corporation (BMC) officer**, before **Durga visarjan on 20 October 2026**, a ranked list of ghats by risk, the plain-language reason for each rank, readings traceable to report and page, and a short per-ghat Hindi + English field brief they can hand to a field agent.

**One user. One workflow. One outcome:**
Historical data → risk ranking → evidence review → proposed actions → bilingual per-ghat field brief.

It is **decision support**, not live monitoring, and not an official regulatory determination. No connection to any government system. No paid services. No API keys. Supabase (free tier, Auth + Postgres with Row Level Security, called directly from the browser with the public anon key) provides sign-in, field agent accounts, brief assignment and field reports.

### MVP scope (do not build ahead without being asked)

- Dashboard (Overview), Ghat risk ranking with filters/sorting, Site detail (charts + evidence table), Proposed actions, Bilingual officer brief (print/PDF/copy), Data quality panel.
- The risk analysis runs client-side from the supplied CSVs. Supabase adds officer sign-in (email + password), field agent accounts (name + 6-digit PIN, via Supabase Auth), brief assignments and field reports, protected by Row Level Security (supabase/migrations). The Supabase URL and public anon key live in a git-ignored .env; the service_role key is never used or committed.
- Bhopal dataset only (7 ghats). The statewide CSV is out of scope and must never be mixed into Bhopal rankings.
- A map exists (Leaflet + OpenStreetMap, no key) but no coordinates are ever invented: an admin sets each ghat's position and it is labelled as admin-set. No LLM-generated rankings or numbers.
- Optional only after the core is done: a clearly labelled "Future: task tracking — mock, not active" teaser.

Design system: **Uber-inspired** — black/white dominant, bold large stats, flat surfaces, pill buttons, restrained color used only for meaning. Reference designs will be provided as screenshots in `design-references/`; match them closely.

---

## Hackathon Rules to Respect

- Code must be written during the event; libraries/frameworks are fine.
- Public data only. No scraping or logging into government portals. No personal data.
- Any extra data source must be named and linked in the README.
- Repo public on GitHub by **5:00 PM, Sunday 11 October 2026**; include README, "how to run in 5 steps or fewer", "what works and what doesn't", and an **MIT LICENSE**.
- No API keys or secrets in the repo.

---

## Tech Stack

- Vite + React + TypeScript (strict)
- Tailwind CSS (use the version already installed; check `package.json` before writing config or classes)
- shadcn/ui where helpful, restyled to the design language
- Lucide icons
- Recharts
- PapaParse (CSV)
- Vitest + React Testing Library
- React Router (only if routing is needed; otherwise simple state-based views)
- Zustand or React context for UI state (filters, language, selected site). Keep it small.
- localStorage for UI preferences and draft action selections only
- Print-to-PDF via a print stylesheet (`window.print()`); no PDF library unless approved

Do not add new major libraries without a strong reason. If a library would meaningfully help, recommend it, explain why, and **ask before installing**. Do not silently add map libraries, backends, databases, auth, or LLM SDKs.

---

## Development Philosophy

Build feature by feature, smallest useful version first:

1. Understand the request.
2. Read this file before coding.
3. Keep it simple; readable beats clever.
4. Prefer pure, testable functions for anything numeric.
5. Refactor only when repetition or complexity appears.
6. After every feature, explain what changed and how to test it in plain language (non-technical teammates read this).
7. Finish the end-to-end workflow before polishing any one screen.

---

## Decision Making & Clarifications

If something is unclear, a data column differs from this file, or a better approach exists: say so, suggest it, and proceed with the safest interpretation that does not fabricate data. **The loaded data wins over this file**; report any mismatch.

---

## Data Integrity Rules (MOST IMPORTANT — NEVER VIOLATE)

1. Never fabricate readings, sampling dates, coordinates, source references, actions, or approvals. No random or placeholder numbers in charts, cards, or briefs.
2. **Missing is not clean.** A blank/not-sampled value is "Unknown", never compliant, never non-compliant, never zero. Never let missing data lower a site's risk.
3. **BDL** = below detection limit: very low, not zero, not missing. **ND** = not detected: very low. Keep their own status; never convert to 0; never compute exceedance ratios from them.
4. Codes in the source: blank, `_`, `-`, `not sampled`, `*`, `**` = missing. If `value` is empty but `value_as_printed` is BDL/ND, preserve the printed status.
5. Preserve for every reading: value (nullable), `unit_assumed`, `flag`, `value_as_printed`, `parameter_as_printed`, `site_as_printed`, `site_match_confidence`, `source_page`, year, festival, phase. The reports print no units; the units are standard assumptions — say so in the UI.
6. Medium site-match confidence must always show a visible warning. "Rani Kamlapati ghat / Kamla Park kund" may cover two places (Ganesh tables say "Kamla Park kund", Durga tables say "Lower Lake ghat").
7. Bairagarh and Malikhedi have **no Durga 2025 table** in the report. Show this as a limitation, never as a clean result.
8. Do not claim health effects. Report readings against limits only. Do not claim an action will fix water quality, and never show an action as completed.
9. Never present historical readings as current conditions. Keep the disclaimer visible: "Historical data 2023–2025 · Not live monitoring."
10. Do not invent clickable links to PDF pages or imply a page was verified. Show source report name + page number as text.
11. If a CSV fails to load, show a clear error naming the file. **Never silently fall back to sample data.** If `sample_bhopal_2025.csv` is used for dev, label it "Sample data".
12. Summary counts must be computed from loaded data, never hardcoded.

---

## Data Sources

Inspect the repo for real paths before coding (do not guess). Expected:

```txt
data/bhopal_ghats_2023_2025.csv      // PRIMARY: 1,524 rows, 7 Bhopal ghats
data/sample_bhopal_2025.csv          // 453 rows, 2025 subset for quick testing
data/mp_immersion_sites_2023_2025.csv // statewide, OUT OF SCOPE
data/cpcb_water_quality_criteria.csv // CPCB limits, classes A–E
resources/                           // original MPPCB reports (2023, 2024, 2025) + lake reports
```

Columns (Bhopal file): `year, festival, site, water_body, phase (pre|during|after), parameter, value, unit_assumed, flag, value_as_printed, parameter_as_printed, site_as_printed, site_match_confidence (high|medium), source_page`.

Validate on load: unexpected/missing columns, non-numeric values, unknown phases/festivals. Surface issues in the Data Quality screen instead of crashing or silently dropping rows.

13 parameters: pH, Dissolved oxygen, BOD, COD, Total solids, Dissolved solids, Suspended solids (not in Durga 2023 and Durga 2025 tables), Turbidity, Conductivity, Chromium, Lead, Zinc, Copper.

Seven standardised ghats (confirm against data):
1. Bairagarh (Sant Hirdaram) kund — Upper Lake — high — no Durga 2025 table
2. Khatlapura ghat — Lower Lake — high
3. Prempura ghat — Upper Lake — high
4. Rani Kamlapati ghat / Kamla Park kund — Lower Lake — **medium**
5. Hathaikheda dam / kund — Hathaikheda dam — high
6. Malikhedi kund — Kund — high — no Durga 2025 table
7. Shahpura lake ghat — Shahpura Lake — high

Context figures from the guide (show only if the data confirms them; otherwise show computed values): Bairagarh dissolved oxygen was 0 mg/l four times across 2023 and 2025; 42 of 116 DO readings were below 5 mg/l; 100 of 112 BOD readings were above 3 mg/l.

---

## Architecture Guidelines

```txt
src/
  components/      // shared UI (StatCard, RiskBadge, EvidenceRow, FilterChips, ...)
  features/
    overview/
    ranking/
    site-detail/
    actions/
    brief/
    data-quality/
  lib/
    data/          // csv loading, parsing, validation
    risk/          // CPCB comparison + ranking + explanations (pure functions)
    brief/         // EN/HI template generation (pure functions)
    format.ts      // number/unit/date helpers
    cn.ts
  constants/
    cpcb.ts        // Class B reference values
    weights.ts     // risk score weights + rationale
    colors.ts
    i18n.ts        // static UI strings EN/HI
  store/
  types/
  assets/
public/data/       // CSVs served to the app (copied from /data, documented in README)
design-references/ // screenshots from the user
tests/
```

- Features compose components and call `lib/` functions; **no business logic inside components.**
- Create a component only when it is reused or clearly improves readability. When unsure, ask whether to extract it or keep it inline for now.

---

## Risk Engine Rules (`lib/risk`, pure TypeScript, unit-tested)

CPCB **Class B (outdoor bathing)** is the reference (read from `cpcb_water_quality_criteria.csv` where possible; keep a typed constant in `constants/cpcb.ts` with a test asserting they agree):

- pH 6.5–8.5 (inclusive at both ends)
- Dissolved oxygen ≥ 5 mg/l (5 is within)
- BOD ≤ 3 mg/l (3 is within)
- Total coliform ≤ 500 MPN/100 ml — only evaluate if valid measurements exist; the immersion data likely has none. Never infer or claim compliance.
- No Class B limit for COD, solids, turbidity, conductivity, or metals: display values, label "No Class B limit set." Do not silently apply Class E conductivity.

Per-reading derived record: original + printed value, unit, criterion, result (`below criterion | within | above criterion | outside range | no threshold | not sampled | BDL | ND`), site, year, festival, phase, source page, uncertainty notes.

Score (deterministic, documented in code and README with every weight and its rationale):
- **Scored per reading:** raw breach points are averaged over the ghat's valid readings and scaled to a full-coverage ghat, so ghats with different numbers of readings compare fairly; show the number of readings behind every score.
- **Observed-evidence component:** valid DO and BOD breaches weighted heaviest, pH out of range lighter; severity (DO = 0 mg/l highest tier; scaled by distance from the limit using valid numeric values only); recurrence across years/festivals/phases; mild recency weighting labelled as recency of observation, not current condition.
- **Data-confidence component (separate; never subtracts risk):** missing phases, no Durga 2025 table, medium match, few valid readings. These can only raise an "Insufficient data / needs review" flag or attention level.
- Labels: **High priority, Moderate priority, Lower observed concern, Insufficient data.** These are internal classifications, not official categories. Insufficient data is never "safe" or "low."
- Stable tie-breaking (score desc → breach count desc → site name) so rankings are reproducible.
- Explanations are generated only from computed evidence. Example: "Historical dissolved oxygen was below the CPCB Class B reference value in recorded samples, including 0 mg/l (2023 Ganesh, during, p. X). Additional assessment is recommended; current water conditions are unknown." Never include a statement the site's data doesn't support.

Filters: site, festival, year, phase, parameter, risk label, "missing/uncertain only." Sort: risk priority, latest observation, number of breaches. Filters must actually change displayed data and counts.

---

## Screens

Sidebar (desktop) / bottom tab bar or sheet menu (mobile): Overview, Ghat risk ranking, Water-quality evidence, Action recommendations, Data quality. (There is no separate Officer brief tab: the brief is per ghat, for the field agent, created from the ranking cards.)

Persistent header: product name + subtitle, badge "Historical data 2023–2025 · Not live monitoring", chip "Preparing for Durga visarjan · 20 Oct 2026" (days remaining computed from today's date), EN/हिन्दी toggle, Export/Share menu (Copy brief, Print/Save as PDF). Disclaimer strip that historical readings don't establish current conditions.

- **Overview:** four computed summary cards (ghats analysed, sites with high-priority historical signals, observed parameter-limit breaches, sites with missing/incomplete data), headline findings, top-3 priority list, risk-label distribution with "Insufficient data" as its own segment, short caveats card.
- **Ranking:** no filters or sort controls. A fixed list for the next immersion event (Durga visarjan, 20 Oct 2026) with rank, risk label, site, water body, latest observation, DO, BOD, breaches, completeness, short explanation, "View evidence"; warning icons for medium match / missing Durga 2025 / unsampled phases; collapsible "How the ranking works" with score breakdown. Each card has a **Field brief** panel: tick that ghat's recommended actions, optionally pick a field agent from the officer-entered roster linked to that ghat, then preview/copy/print a bilingual brief addressed to that agent. A "Manage field agents" panel holds the roster (name or squad label + ghats covered), typed by the officer and stored only in localStorage.
- **Site detail:** overview (standard + printed names, water body, match confidence, latest measurement, completeness, limitations); DO/BOD/pH charts over ordered Year·Festival·Phase with Class B reference lines (pH as a band); **no connecting lines across gaps**; hollow marker "Not sampled"; distinct BDL/ND markers; tooltips with value, unit, year, festival, phase, source page; evidence table (parameter, value+unit, printed value, criterion, result, year, festival, phase, source page, source report, copy-citation).
- **Actions:** evidence-linked proposed actions, each stamped "Proposed — not assigned," with reason, supporting readings, priority, suggested team (only if appropriate), and evidence required to verify completion. "Include in brief" toggle stored locally.
- **Field brief (per ghat, opened from a ranking card):** one printable page; English / हिन्दी / Bilingual; addressed to the chosen field agent (or "not specified"); stamped as a draft, nothing is sent or recorded as an assignment; generated from structured data via deterministic templates (works with no AI); includes title + date, purpose + data period, top sites and why, key DO/BOD/pH vs Class B, missing-data and site-identity caveats, proposed actions, and the "historical readings do not establish current conditions" note. Natural, concise Hindi for a municipal officer; preserve numbers, units, site names, caveats. Copy-to-clipboard + print stylesheet.
- **Data quality:** coverage matrix (site × year·festival·phase: sampled / BDL / ND / not sampled / no table in report), missing readings by site, missing parameters by phase, incomplete coverage, site-name uncertainty, parameters with no Class B limit, code legend, loader validation warnings, list of source reports.

States: loading skeletons, empty-filter state with "Clear filters," data-load error naming the file. All controls must work — no decorative buttons or fake links.

---

## UI Implementation Rules (VERY IMPORTANT)

When screenshots are in `design-references/`:

- **View every screenshot first** and summarise the visual language in 5–8 bullets before building.
- Replicate layout, spacing, padding, type sizes and hierarchy, colors, border radius, shadows, alignment, proportions, and all visible UI elements. Do not approximate or simplify unless asked.
- After building the first screen, compare it with the screenshot and fix discrepancies before moving on.
- Desktop-first for the officer's workflow, but fully responsive down to 390px; mobile uses sheets and large tap rows.

### Design defaults (use where screenshots are silent)

- Backgrounds: white `#FFFFFF`, surface `#F6F6F6`, divider `#E2E2E2`.
- Text: `#000000`, secondary `#545454`, tertiary `#6B6B6B`.
- Primary action: solid black pill/rounded button with white text; secondary: light-grey fill; tertiary: text link.
- Semantic (always with icon + text): High priority red `#E11900` on tint; Moderate amber `#FFC043`; informational blue `#276EF1`; **Insufficient data = neutral grey with diagonal hatch**. "Lower observed concern" uses neutral blue/grey, **not green**. Green only for a verified positive status (none exists now).
- Type: Inter or DM Sans (self-hosted via `@fontsource`; no external requests) + Noto Sans Devanagari for Hindi. Scale: display 40/48 bold, H1 32/40, H2 24/32, H3 20/28, body 16/24, caption 14/20. Tabular numerals for readings.
- 4/8px spacing grid, 8px card radius, pill chips/segmented controls, flat surfaces with 1px borders, almost no shadows.
- Do not copy logos, trademarked fonts, or brand marks.
- Accessibility: WCAG AA, visible focus rings, 44px touch targets, never convey status by color alone; respect `prefers-reduced-motion`.

---

## Styling Rules

- Use Tailwind with the **installed version's** syntax. Check `package.json` first; do not upgrade without approval.
- Define design tokens as CSS variables / Tailwind theme values, not scattered hex codes.
- Reusable patterns go in a small set of utilities or shared components. Avoid long repeated class strings.
- Recharts styling goes through shared chart config so all charts look consistent.
- A dedicated `@media print` stylesheet for the brief: A4, black on white, no nav, no shadows.

---

## Image / Asset Rule

Centralise assets in `src/constants/images.ts` (create it if needed) and import through that object. Minimal imagery is expected; use Lucide icons and inline SVG first.

---

## i18n Rules

- Static UI strings live in `constants/i18n.ts` as `{ en, hi }` pairs.
- Brief content is generated by `lib/brief` from structured data using templates; **never translate numbers, units, or site names** into different values.
- Hindi must be concise and natural for a municipal official. Mark any phrasing you are unsure about with a `// TODO: native review` comment so a teammate can check it.

---

## TypeScript Rules

Strict mode. No `any`. Define `Reading`, `Site`, `Criterion`, `ReadingResult`, `RiskLabel`, `SiteRisk`, `Filters` in `types/`. Keep types simple. Use discriminated unions for reading status (`valid | BDL | ND | missing`) so missing data cannot be treated as a number by accident.

---

## Testing Rules (Vitest — required)

Cover at minimum:
- DO at, above, and below 5; BOD at, below, and above 3; pH at 6.5 and 8.5 and outside
- Missing readings never become zero or count as compliant
- BDL and ND handling (no numeric exceedance)
- Sites with no Durga 2025 observation; medium-confidence and ambiguous site names
- Different years, festivals, phases
- Source-page traceability preserved end to end
- Ranking reproducibility (same input → same order); insufficient-data sites never ranked as low risk
- English and Hindi brief generation (required sections present; numbers, units, site names preserved)
- Filters and sorting change results
- CPCB constants match `cpcb_water_quality_criteria.csv`
- Smoke test: the real CSV loads and yields the seven ghats

---

## Linting and Validation

Run before calling any feature done:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Fix errors before finishing. Also run `npm run dev` and click through the workflow.

---

## Feature Implementation Rules

For every feature:
1. Read this file.
2. Identify the files to change; keep changes focused.
3. Do not rewrite unrelated code; follow existing patterns.
4. Make it work end to end with real data.
5. Fix errors.
6. Explain what changed and how to test it in plain language.

Suggested order: inspect repo + screenshots → data loader/validation → risk engine + tests → design tokens + shell → Overview → Ranking + filters → Site detail (charts + evidence) → Actions → Bilingual brief + print → Data quality → full test/build pass → README + LICENSE.

If time is short, protect this core: **trustworthy ranking → traceable evidence → bilingual brief.** Cut polish and extras first.

---

## README Requirements

Team name, members, track, and the one user (BMC officer); problem statement; key features; run in ≤5 steps; stack; dataset sources; methodology (every weight and why; missing-data treatment); CPCB Class B criteria used; missing-data policy; known limitations; what works / what doesn't; screenshots; a clear statement that this is decision support, not an official regulatory determination; extra public sources with links (MPPCB reports 2023/2024/2025, CPCB water-quality criteria, Free Press Journal NGT/BMC ghats article, Drik Panchang for 20 Oct 2026). Add an MIT `LICENSE`. No secrets in the repo.

---

## Communication Style

Be concise. Explain changes and how to test them in plain terms. Be upfront about anything that doesn't work or that you could not verify. Honesty about gaps is scored favorably.

---

## Important Constraints (do not build ahead without being asked)

- No paid APIs. Supabase (free tier) is the only external service and must be named in the README; the service_role key never enters this app or git
- No invented coordinates (positions come only from an admin placing a pin)
- No LLM-generated rankings, scores, or numbers
- Two roles only: BMC officer and field agent. No notifications or approval workflows. A field report is shown as "submitted · not verified", never as an action completed or verified
- No statewide data mixed into Bhopal rankings
- No health-effect claims; no "safe" labels; no completed-action claims

---

## Field agents and field reports (added scope)

- Officers create field agent accounts (name or squad label + 6-digit PIN + ghats covered), assign a ghat's brief (ticked recommended actions) to one or more linked agents, and see their field reports. Field agents sign in, see only their own briefs (English/Hindi), and fill a simple form after the visit.
- **Field-recorded readings are new, unverified data.** Store them apart from the MPPCB CSVs. Never feed them into the risk score, ranking, summary counts or briefs' historical figures. Label them "Field-recorded, unverified, not MPPCB data" wherever shown. A BDL / ND / not measured answer never becomes a number.
- Keep the sign-in honest: it is a prototype (Supabase Auth, short PINs), not a substitute for a real identity system. Because the browser talks to Supabase directly, Row Level Security is the only protection: every table must keep RLS enabled. No personal contact details, no secrets in the repo.

## Final Reminder

Before every feature: read this file, follow it strictly, build clean teachable code, replicate the screenshots, and respect the data-integrity rules. **Missing is never clean. Historical is never current. Rankings are decision support, not regulation.**
