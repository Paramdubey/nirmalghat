// Templates for the officer brief. Deterministic: numbers, units, site names and page numbers come
// from the data and are never translated. No AI is involved.
// TODO: native review — every Hindi string below should be checked by a native speaker.
import type { Lang } from './i18n'

type Pair = { en: string; hi: string }

export const BRIEF = {
  title: { en: 'Water-quality risk brief — Bhopal visarjan ghats', hi: 'जल-गुणवत्ता जोखिम सारांश — भोपाल विसर्जन घाट' },
  dateLine: { en: 'Prepared {date} · Durga visarjan {visarjan} · {n} days to go', hi: '{date} को तैयार · दुर्गा विसर्जन {visarjan} · {n} दिन शेष' },
  dateLineNoCount: { en: 'Prepared {date} · Durga visarjan date: {visarjan}', hi: '{date} को तैयार · दुर्गा विसर्जन तिथि: {visarjan}' },
  purposeHeading: { en: 'Purpose and data period', hi: 'उद्देश्य और डेटा अवधि' },
  purpose: {
    en: 'To help BMC prioritise ghats before Durga visarjan by comparing historical MPPCB readings ({from}–{to}) with CPCB Class B (outdoor bathing) reference values. This is decision support, not an official regulatory determination.',
    hi: 'दुर्गा विसर्जन से पहले एमपीपीसीबी के ऐतिहासिक माप ({from}–{to}) की सीपीसीबी श्रेणी-बी (बाहरी स्नान) संदर्भ मानों से तुलना कर घाटों की प्राथमिकता तय करने में बीएमसी की सहायता। यह निर्णय सहायता है, आधिकारिक नियामक निर्धारण नहीं।',
  },
  topHeading: { en: 'Top ghats by historical priority', hi: 'ऐतिहासिक प्राथमिकता में शीर्ष घाट' },
  topItem: { en: '{rank}. {site} ({waterBody}) — {label}.', hi: '{rank}. {site} ({waterBody}) — {label}।' },
  doPart: { en: 'Dissolved oxygen was below 5 mg/l in {a} of {b} recorded samples (lowest {v} mg/l; {ref}).', hi: 'घुलित ऑक्सीजन {b} दर्ज नमूनों में से {a} में 5 mg/l से कम रही (न्यूनतम {v} mg/l; {ref})।' },
  bodPart: { en: 'BOD was above 3 mg/l in {a} of {b} recorded samples (highest {v} mg/l; {ref}).', hi: 'बीओडी {b} दर्ज नमूनों में से {a} में 3 mg/l से अधिक रहा (अधिकतम {v} mg/l; {ref})।' },
  phPart: { en: 'pH was outside 6.5–8.5 in {a} recorded samples.', hi: 'पीएच {a} दर्ज नमूनों में 6.5–8.5 से बाहर रहा।' },
  noBreach: { en: 'No Class B breaches in the recorded DO, BOD or pH readings.', hi: 'दर्ज डीओ, बीओडी या पीएच मापों में श्रेणी-बी का कोई उल्लंघन नहीं।' },
  readingsHeading: { en: 'Key readings against CPCB Class B', hi: 'सीपीसीबी श्रेणी-बी के विरुद्ध मुख्य माप' },
  classBRef: { en: 'Class B reference: dissolved oxygen 5 mg/l or more; BOD 3 mg/l or less; pH 6.5–8.5.', hi: 'श्रेणी-बी संदर्भ: घुलित ऑक्सीजन 5 mg/l या अधिक; बीओडी 3 mg/l या कम; पीएच 6.5–8.5।' },
  phLine: { en: '{a} of {b} valid pH readings were outside 6.5–8.5.', hi: '{b} मान्य पीएच मापों में से {a} 6.5–8.5 से बाहर थे।' },
  caveatsHeading: { en: 'Data limits and caveats', hi: 'डेटा सीमाएँ और सावधानियाँ' },
  noTable: { en: '{site}: the report has no {table} table, so that festival is unknown, not clean.', hi: '{site}: रिपोर्ट में {table} तालिका नहीं है, इसलिए वह उत्सव अज्ञात है, साफ़ नहीं।' },
  mediumMatch: { en: '{site}: site name matched with medium confidence; it may cover two places.', hi: '{site}: स्थल का नाम मध्यम विश्वास से मिलाया गया है; यह दो स्थानों को दर्शा सकता है।' },
  missingStages: { en: '{site}: {n} sampling stage(s) have no valid DO, BOD or pH reading; unknown, not clean.', hi: '{site}: {n} नमूना चरणों में कोई मान्य डीओ, बीओडी या पीएच माप नहीं; अज्ञात, साफ़ नहीं।' },
  units: { en: 'The reports print no units; standard units are assumed (mg/l for DO and BOD).', hi: 'रिपोर्टों में इकाइयाँ नहीं छपी हैं; मानक इकाइयाँ मानी गई हैं (डीओ और बीओडी के लिए mg/l)।' },
  actionsHeading: { en: 'Proposed actions (not assigned)', hi: 'प्रस्तावित कार्य (सौंपे नहीं गए)' },
  noActions: { en: 'No actions were selected for this brief.', hi: 'इस सारांश के लिए कोई कार्य चुना नहीं गया।' },
  closing: {
    en: 'Historical readings do not establish current water conditions. Missing or unsampled values are unknown, never clean. Labels are internal groupings, not official categories.',
    hi: 'ऐतिहासिक माप वर्तमान जल स्थिति सिद्ध नहीं करते। अनुपलब्ध या अनमापे मान अज्ञात हैं, कभी साफ़ नहीं। श्रेणियाँ आंतरिक समूह हैं, आधिकारिक वर्ग नहीं।',
  },
  fieldTitle: { en: 'Field brief — {site}', hi: 'फील्ड सारांश — {site}' },
  fieldFor: { en: 'Field agent: {agent}', hi: 'फील्ड एजेंट: {agent}' },
  fieldForNone: { en: 'Field agent: not specified', hi: 'फील्ड एजेंट: निर्दिष्ट नहीं' },
  fieldDraft: { en: 'Draft for the field agent. Nothing has been sent or recorded as an assignment.', hi: 'फील्ड एजेंट के लिए मसौदा। कुछ भी भेजा या कार्य-सौंपने के रूप में दर्ज नहीं किया गया है।' },
  whyHeading: { en: 'Why this ghat', hi: 'यह घाट क्यों' },
  fieldItem: { en: '{site} ({waterBody}) — {label}.', hi: '{site} ({waterBody}) — {label}।' },
  tasksHeading: { en: 'Proposed tasks (not assigned)', hi: 'प्रस्तावित कार्य (सौंपे नहीं गए)' },
  noTasks: { en: 'No tasks were selected.', hi: 'कोई कार्य चुना नहीं गया।' },
  limitsHeading: { en: 'Data limits for this ghat', hi: 'इस घाट के डेटा की सीमाएँ' },
  noLimits: { en: 'No data limits were flagged for this ghat.', hi: 'इस घाट के लिए कोई डेटा सीमा चिह्नित नहीं।' },
  bringHeading: { en: 'Evidence to bring back', hi: 'वापस लाने योग्य साक्ष्य' },
  fieldClosing: {
    en: 'Historical readings do not establish current water conditions. Missing or unsampled values are unknown, never clean. This is decision support, not an official regulatory determination.',
    hi: 'ऐतिहासिक माप वर्तमान जल स्थिति सिद्ध नहीं करते। अनुपलब्ध या अनमापे मान अज्ञात हैं, कभी साफ़ नहीं। यह निर्णय सहायता है, आधिकारिक नियामक निर्धारण नहीं।',
  },
  festival: { Ganesh: { en: 'Ganesh', hi: 'गणेश' }, Durga: { en: 'Durga', hi: 'दुर्गा' } } as Record<string, Pair>,
  phase: { pre: { en: 'pre', hi: 'पहले' }, during: { en: 'during', hi: 'दौरान' }, after: { en: 'after', hi: 'बाद' } } as Record<string, Pair>,
  page: { en: 'p.', hi: 'पृ.' },
} satisfies Record<string, Pair | Record<string, Pair>>

export const pick = (p: Pair, lang: Lang) => p[lang]
