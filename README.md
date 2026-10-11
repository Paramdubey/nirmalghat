# NirmalGhat · निर्मल घाट

**Bhopal water-quality risk intelligence for visarjan ghats.**
Claude Impact Lab × Cerebras Café Compute, Bhopal · **Track 2 — Visarjan Ghat Watch**

> **Decision support, not an official regulatory determination.** NirmalGhat compares *historical* MPPCB readings (2023–2025) with CPCB Class B reference values. It says nothing about current water conditions, is not live monitoring, and is not connected to any government system.

| | |
|---|---|
| Team | _TODO: team name_ |
| Members | _TODO: names and roles_ |
| The one user | A **Bhopal Municipal Corporation (BMC) officer** preparing for **Durga visarjan, 20 October 2026** |

## The problem

MPPCB tests the water at Bhopal's idol-immersion ghats three times per festival (before, during, one week after) for Ganesh and Durga. The results sit in 90–120 page PDFs that nobody compares against the legal limits. NirmalGhat gives the officer, before 20 October:

1. a **ranked list of ghats** by historical risk, with a plain-language reason for each rank,
2. every reading **traceable to its report and PDF page**,
3. **proposed actions** tied to those readings, and
4. a short **Hindi + English field brief** per ghat that can be handed to a field agent.

One user, one workflow: *historical data → risk ranking → evidence review → proposed actions → bilingual field brief.*

## Screenshots

| Overview | Ghat risk ranking |
|---|---|
| ![Overview](docs/screenshots/overview.png) | ![Ranking](docs/screenshots/ranking.png) |
| **Water-quality evidence** | **Action recommendations** |
| ![Evidence](docs/screenshots/evidence.png) | ![Actions](docs/screenshots/actions.png) |
| **Field brief (from a ranking card)** | **Data quality** |
| ![Field brief](docs/screenshots/field-brief.png) | ![Data quality](docs/screenshots/data-quality.png) |

The entry page is a demo screen: [docs/screenshots/login.png](docs/screenshots/login.png).

## Run it in 5 steps

```bash
git clone <this repo>        # 1. get the code
cd nirmalghat                # 2. enter the folder
npm install                  # 3. install dependencies (Node 20+)
npm run dev                  # 4. start the app
# 5. open http://localhost:5173 and click "Access Intelligence Dashboard"
```

Checks: `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`

No backend, database, API keys or paid services. Everything runs in the browser from the CSVs in `public/data/`.

## Key features

- **Overview** — four summary cards, key findings, top-3 ghats, risk-label distribution. Every number is computed from the loaded CSV, nothing is hardcoded.
- **Ghat risk ranking** — a fixed list for the next immersion event. Each card shows dissolved oxygen (DO), BOD, breaches, latest observation with page, completeness, the explanation, and warnings (medium site match, missing Durga 2025 table, unsampled stages). A collapsible "How the ranking works" shows every weight and a per-ghat score breakdown.
- **Field brief (on each ranking card)** — tick that ghat's recommended actions, optionally choose a field agent linked to that ghat, then preview, copy or print a brief in English, हिन्दी or both. Built from fixed templates: no AI.
- **Water-quality evidence** — DO, BOD and pH charts over every festival stage with Class B reference lines. Lines **break** where there is no number; BDL, ND, not-sampled and no-table each have their own marker. An evidence table lists every reading with value and unit, as-printed text, criterion, result, PDF page, source report and a copy-citation button.
- **Action recommendations** — proposals derived from the evidence, each stamped *Proposed — not assigned*, with reason, supporting readings (with pages), a suggested team and the evidence needed to verify completion.
- **Data quality** — coverage matrix (ghat × festival × stage), missing readings by ghat and by parameter, site-name uncertainty, parameters with no Class B limit, code legend, loader validation, source reports.
- **English / हिन्दी** toggle throughout.

## Stack

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · Recharts · PapaParse · Zustand · Lucide icons · self-hosted Inter and Noto Sans Devanagari (`@fontsource`, no external requests) · Vitest + React Testing Library.

## Datasets

All files are in [data/](data) and copied to [public/data/](public/data) for the app. The data was supplied for the hackathon (parsed from the public MPPCB PDFs; see [data/DATA_DICTIONARY.md](data/DATA_DICTIONARY.md)).

| File | Used for |
|---|---|
| `bhopal_ghats_2023_2025.csv` | **Primary.** 1,524 readings, 7 Bhopal ghats |
| `cpcb_water_quality_criteria.csv` | CPCB limits; a test checks our Class B constants against it |
| `sample_bhopal_2025.csv` | Quick-testing subset (labelled "Sample data" if ever loaded) |
| `mp_immersion_sites_2023_2025.csv` | Statewide data. **Not used.** It is never mixed into Bhopal rankings |

The original MPPCB report PDFs are in [resources/](resources). The app shows the report name and PDF page as **plain text** only. It does not link to PDF pages and the pages have not been re-verified against the PDFs by this app.

## Methodology

Reference: **CPCB Class B (outdoor bathing)** — pH 6.5–8.5 (inclusive), DO ≥ 5 mg/l (5 is within), BOD ≤ 3 mg/l (3 is within). Total coliform (≤ 500 MPN/100 ml) is not evaluated because the immersion data holds no coliform results. COD, solids, turbidity, conductivity and metals have no Class B limit: they are shown as values, labelled "No Class B limit set", and never scored.

**Score = observed evidence only.** Each valid DO, BOD or pH breach adds *parameter weight × severity × recency*; recurrence adds a bonus. The weights live in [src/constants/weights.ts](src/constants/weights.ts):

| Part | Value | Why |
|---|---|---|
| Parameter weight | DO 3 · BOD 3 · pH 1 | Oxygen and organic load are the clearest immersion signals; pH out of range matters less |
| Severity | 1 to 3; DO of exactly 0 mg/l = 3 | Further past the limit scores more, from real numbers only; zero oxygen is the top tier |
| Recency | −0.1 per year older | Newer observations count slightly more. This is recency of *observation*, not current condition |
| Recurrence | +2 per festival-year with a DO or BOD breach | Repeated breaches are less likely to be one-offs |
| Labels | High ≥ 120 · Moderate ≥ 50 · else Lower observed concern | Judgement calls set against the 2023–2025 spread of scores (about 60 to 150) |

**Labels are internal groupings, not official categories.** "Lower observed concern" is never green and never means safe.

### Missing-data policy

- **Missing is not clean.** A blank, `_`, `-`, `not sampled`, `*` or `**` is *unknown*. It is never compliant, never non-compliant, never zero, and never lowers a score.
- **BDL / ND** keep their own status: very low, not zero, not missing. No exceedance is computed from them.
- **Data gaps are separate from the score.** Missing stages, a missing report table, a medium-confidence site match or too few readings can only flag a ghat for review or mark it **Insufficient data**. A ghat with a low score *and* a data gap is "Insufficient data", never "low".
- **No Durga 2025 table** exists in the report for Bairagarh and Malikhedi. This is shown as a limitation everywhere, never as a clean result.
- **Rani Kamlapati ghat / Kamla Park kund** is a medium-confidence match (Ganesh tables say "Kamla Park kund", Durga tables say "Lower Lake ghat") and always carries a visible warning.
- The reports print **no units**; the units shown are the standard ones for each test, and the app says so.
- Ties break by score, then breach count, then ghat name, so the ranking is reproducible.

## What works and what doesn't

**Works** (68 automated tests, lint, typecheck and build pass; the screens were checked in headless Chrome)

- Loading and validating the real CSV (1,524 rows, 7 ghats, 0 loader warnings), with an error that names the file if loading fails and no silent fallback.
- Class B comparison, the ranking, explanations, coverage and data-quality counts, all unit-tested against the real data. The guide's figures are recomputed from the data and match: 42 of 116 DO readings below 5 mg/l, 100 of 112 BOD readings above 3 mg/l.
- All six screens, the English/Hindi toggle, and the field brief (copy and print stylesheet).

**Doesn't, or isn't verified**

- **Not live monitoring.** Nothing here describes current water conditions. Not an official determination.
- **No real login, assignment or notifications.** The entry page is a demo and reads nothing you type. The field-agent roster is typed by the officer and stored **only in this browser** (localStorage). A field brief names the agent but nothing is sent, and nothing is ever shown as assigned or completed. Avoid entering personal contact details.
- **Hindi text has not had a native-speaker review.** Every Hindi string is marked `TODO: native review`. Ghat explanations in the ranking cards stay in English; Hindi appears in the UI strings and the generated briefs.
- **Label thresholds (120 / 50) are judgement calls** and should be reviewed by someone who knows the domain.
- **Suggested teams** in the action text (for example "MPPCB regional office") are generic suggestions, not verified roles.
- **Print/PDF**: the print layout was checked with emulated print media, not through a real browser print dialog or a saved PDF. Tested in Chrome only; not tested on Safari or Firefox, or on a real phone.
- **No map**: no verified coordinates exist, so none are shown. No microbiological (coliform) assessment.
- **Source page numbers** are taken from the supplied CSV and shown as text; they were not re-checked against the PDFs by this app.

## Sources

- MPPCB Ganesh and Durga Visarjan Report 2025 — <https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf>
- MPPCB Ganesh and Durga Visarjan Report 2024 — <https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf>
- MPPCB Idol Immersion Report 2023 (CPCB format) — <https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf>
- CPCB water quality criteria — <https://cpcb.gov.in/water-quality-criteria/>
- Free Press Journal, NGT immersion ban and new BMC ghats (26 Feb 2026) — <https://www.freepressjournal.in/amp/bhopal/mp-news-idol-immersion-to-shift-from-lakes-to-safer-sites-ngt-ban-pushes-bmc-to-build-4-dedicated-ghats>
- Drik Panchang, Durga visarjan date 20 October 2026 — <https://www.drikpanchang.com/navratri/durga-puja/durga-visarjan-date-time.html?year=2026>
- Supplied hackathon material: [Participant guide](resources) and [data dictionary](data/DATA_DICTIONARY.md). The Upper and Lower Lake monthly and comparative reports in `resources/` were supplied but are not used by the app.

## Project layout

```
src/lib/data      CSV loading, parsing, validation
src/lib/risk      Class B comparison, scoring, ranking, chart series, quality stats (pure, tested)
src/lib/actions   proposed actions from evidence
src/lib/brief     field-brief generation (English / Hindi templates)
src/constants     CPCB values, weights and rationale, UI and brief text
src/features      overview · ranking · site-detail · actions · data-quality · login
tests             Vitest, including smoke tests on the real CSV
```

## Licence

[MIT](LICENSE). No API keys or secrets are used or stored in this repository.
