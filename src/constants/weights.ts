// Risk score weights. Every number here is a documented judgement, not an official standard.
// The score only measures OBSERVED evidence. Data gaps never lower it (see lib/risk/score.ts).

/** Base points per breach. Low oxygen and high BOD are the clearest signs of organic load, so they weigh most. */
export const PARAMETER_WEIGHT = { 'Dissolved oxygen': 3, BOD: 3, pH: 1 } as const

/** Multiplier for a dissolved-oxygen reading of exactly 0 mg/l (no oxygen at all): highest severity tier. */
export const DO_ZERO_SEVERITY = 3

/** Severity runs from 1 (just past the limit) up to this cap (far past the limit). */
export const SEVERITY_CAP = 3

/** Recency: each year older than the newest year in the data loses this much weight. Mild on purpose. */
export const RECENCY_STEP = 0.1

/** Added once for every distinct year+festival in which DO or BOD was breached: repeated failure counts more than one bad day. */
export const RECURRENCE_PER_EVENT = 2

/** Score cut-offs for labels. Judgement calls set against the 2023–2025 spread of scores (about 60 to 150) so the list separates ghats instead of marking all of them High; revisit if the data changes. */
export const HIGH_PRIORITY_MIN = 120
export const MODERATE_PRIORITY_MIN = 50

/** Fewer valid DO+BOD+pH readings than this = too little evidence to rank. */
export const MIN_VALID_CORE_READINGS = 9

export const WEIGHT_RATIONALE: { name: string; value: string; why: string }[] = [
  { name: 'Parameter weight', value: 'DO 3 · BOD 3 · pH 1', why: 'Oxygen and organic load are the clearest immersion signals; pH out of range matters less.' },
  { name: 'Severity', value: '1 to 3 (DO = 0 mg/l → 3)', why: 'Further past the limit scores more, using real numbers only. Zero oxygen is the top tier.' },
  { name: 'Recency', value: '−0.1 per year older', why: 'Newer observations count slightly more. This is recency of observation, not current condition.' },
  { name: 'Per-reading scaling', value: 'average per valid reading, scaled to full coverage', why: 'A ghat with fewer valid readings (for example a missing report table) is not ranked lower for having fewer chances to collect points. A ghat with full coverage is unchanged.' },
  { name: 'Recurrence', value: '+2 per festival-year with a DO/BOD breach, per festival-year with data', why: 'Breaches that repeat across years and festivals are less likely to be one-offs.' },
  { name: 'Labels', value: `High ≥ ${HIGH_PRIORITY_MIN} · Moderate ≥ ${MODERATE_PRIORITY_MIN}`, why: 'Internal groupings, not official categories.' },
  { name: 'Data gaps', value: 'flag only', why: 'Gaps can mark a site "Insufficient data"; they never reduce its score or make it look safe.' },
]
