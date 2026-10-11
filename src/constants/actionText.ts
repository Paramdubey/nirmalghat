// Templates for proposed actions. Text only describes what the data shows and what to check next:
// no health claims, no promise that an action improves water quality, nothing marked as done.
// TODO: native review — all Hindi below should be checked by a native speaker.
import { fill, type Lang } from './i18n'
import type { ActionKind } from '../lib/actions/generate'

interface Template {
  title: { en: string; hi: string }
  reason: { en: string; hi: string }
  verify: { en: string; hi: string }
  team: { en: string; hi: string }
}

const TEMPLATES: Record<ActionKind, Template> = {
  resample: {
    title: { en: 'Commission fresh DO and BOD sampling at {site} before immersion', hi: 'विसर्जन से पहले {site} पर नए डीओ और बीओडी नमूने लेने का प्रस्ताव' },
    reason: {
      en: 'Historical dissolved oxygen was below 5 mg/l in {doBreach} of {validDo} recorded samples and BOD above 3 mg/l in {bodBreach} of {validBod}. Current conditions are unknown.',
      hi: 'ऐतिहासिक रूप से घुलित ऑक्सीजन {validDo} दर्ज नमूनों में से {doBreach} में 5 mg/l से कम और बीओडी {validBod} में से {bodBreach} में 3 mg/l से अधिक रही। वर्तमान स्थिति अज्ञात है।',
    },
    verify: { en: 'Dated laboratory results for DO and BOD at this ghat, with the sampling date and the name of the testing body.', hi: 'इस घाट के डीओ और बीओडी के दिनांकित प्रयोगशाला परिणाम, नमूना तिथि और परीक्षण संस्था के नाम सहित।' },
    team: { en: 'Water-quality sampling team (for example the MPPCB regional office)', hi: 'जल-गुणवत्ता नमूना दल (उदाहरण: एमपीपीसीबी क्षेत्रीय कार्यालय)' },
  },
  'zero-do': {
    title: { en: 'Review immersion arrangements at {site}', hi: '{site} पर विसर्जन व्यवस्था की समीक्षा' },
    reason: {
      en: 'Dissolved oxygen was recorded as 0 mg/l {n} time(s) at this ghat, the lowest possible reading. Additional assessment is recommended.',
      hi: 'इस घाट पर घुलित ऑक्सीजन {n} बार 0 mg/l दर्ज हुई, जो न्यूनतम संभव माप है। अतिरिक्त आकलन की सिफ़ारिश है।',
    },
    verify: { en: 'A dated inspection note for the ghat and a fresh DO reading, each with its source.', hi: 'घाट का दिनांकित निरीक्षण नोट और नया डीओ माप, दोनों स्रोत सहित।' },
    team: { en: 'BMC ghat management', hi: 'बीएमसी घाट प्रबंधन' },
  },
  'missing-table': {
    title: { en: 'Obtain or confirm the missing {table} table for {site}', hi: '{site} की अनुपलब्ध {table} तालिका प्राप्त करें या पुष्टि करें' },
    reason: {
      en: 'The report has no {table} table for this ghat, so that festival is unknown, not clean.',
      hi: 'रिपोर्ट में इस घाट की {table} तालिका नहीं है, इसलिए वह उत्सव अज्ञात है, साफ़ नहीं।',
    },
    verify: { en: 'A copy of the table, or written confirmation from MPPCB that none was produced.', hi: 'तालिका की प्रति, या एमपीपीसीबी से लिखित पुष्टि कि कोई तालिका नहीं बनी।' },
    team: { en: 'BMC records / MPPCB liaison', hi: 'बीएमसी अभिलेख / एमपीपीसीबी समन्वय' },
  },
  identity: {
    title: { en: 'Confirm which place "{site}" refers to', hi: 'पुष्टि करें कि "{site}" किस स्थान को दर्शाता है' },
    reason: {
      en: 'The standard name is matched with medium confidence and may cover two places. Names as printed: {printed}.',
      hi: 'मानक नाम मध्यम विश्वास से मिलाया गया है और दो स्थानों को दर्शा सकता है। रिपोर्ट में छपे नाम: {printed}।',
    },
    verify: { en: 'Written confirmation from MPPCB whether the printed names are one location or two.', hi: 'एमपीपीसीबी से लिखित पुष्टि कि छपे नाम एक स्थान हैं या दो।' },
    team: { en: 'BMC records / MPPCB liaison', hi: 'बीएमसी अभिलेख / एमपीपीसीबी समन्वय' },
  },
  'missing-stages': {
    title: { en: 'Ask why {n} sampling stage(s) at {site} have no valid reading', hi: '{site} के {n} नमूना चरणों में कोई मान्य माप क्यों नहीं, पूछें' },
    reason: {
      en: '{n} sampling stage(s) have no valid DO, BOD or pH reading in the report. Missing values are unknown, never treated as clean.',
      hi: 'रिपोर्ट में {n} नमूना चरणों का कोई मान्य डीओ, बीओडी या पीएच माप नहीं है। अनुपलब्ध मान अज्ञात हैं, कभी साफ़ नहीं माने जाते।',
    },
    verify: { en: 'MPPCB reply stating whether results exist for those stages, with the report page if they do.', hi: 'एमपीपीसीबी का उत्तर कि उन चरणों के परिणाम हैं या नहीं, और हैं तो रिपोर्ट पृष्ठ सहित।' },
    team: { en: 'BMC records / MPPCB liaison', hi: 'बीएमसी अभिलेख / एमपीपीसीबी समन्वय' },
  },
}

export function actionText(kind: ActionKind, field: keyof Template, lang: Lang, vars: Record<string, string | number>): string {
  return fill(TEMPLATES[kind][field][lang], vars)
}
