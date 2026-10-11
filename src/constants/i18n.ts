// Static UI strings as { en, hi } pairs. Brief content is generated separately in lib/brief.
// TODO: native review — all Hindi strings below should be checked by a native speaker.
export type Lang = 'en' | 'hi'

export const strings = {
  appName: { en: 'NirmalGhat', hi: 'निर्मल घाट' },
  orgLine: { en: 'Bhopal Municipal Corporation · DSS', hi: 'भोपाल नगर निगम · निर्णय सहायता' },
  dataBadge: { en: 'Historical data 2023–2025 · Not live monitoring', hi: 'ऐतिहासिक डेटा 2023–2025 · लाइव निगरानी नहीं' },
  prepChip: { en: 'Durga Visarjan Preparation', hi: 'दुर्गा विसर्जन की तैयारी' },
  loginSubtitle: { en: 'Bhopal Municipal Corporation · Environmental Risk Intelligence', hi: 'भोपाल नगर निगम · पर्यावरण जोखिम विश्लेषण' },
  loginSubtitleHi: { en: 'भोपाल नगर निगम • निर्णय सहायता एवं पर्यावरण प्रबोधन प्रणाली', hi: 'Decision support for visarjan ghat water-quality risk' },
  selectCredential: { en: 'Select credential', hi: 'भूमिका चुनें' },
  roleAdmin: { en: 'BMC Admin', hi: 'बीएमसी प्रशासक' },
  roleField: { en: 'Field Squad', hi: 'फील्ड दल' },
  roleAdminTitle: { en: 'BMC Administrative Officer · Policy HQ', hi: 'बीएमसी प्रशासनिक अधिकारी · नीति मुख्यालय' },
  roleAdminBody: {
    en: 'Review the ghat risk ranking, evidence and the bilingual brief built from MPPCB 2023–2025 reports.',
    hi: 'एमपीपीसीबी 2023–2025 रिपोर्ट पर आधारित घाट जोखिम क्रम, साक्ष्य और द्विभाषी सारांश देखें।',
  },
  roleFieldTitle: { en: 'Field Squad · Ghat inspection', hi: 'फील्ड दल · घाट निरीक्षण' },
  roleFieldBody: {
    en: 'Same view as the officer. Task assignment is not part of this version.',
    hi: 'अधिकारी जैसा ही दृश्य। कार्य सौंपना इस संस्करण में शामिल नहीं है।',
  },
  demoNotice: { en: 'Demo — no real authentication. Nothing you type is stored or sent.', hi: 'डेमो — वास्तविक प्रमाणीकरण नहीं। आप जो लिखते हैं वह सहेजा या भेजा नहीं जाता।' },
  orMunicipalId: { en: 'Or municipal ID', hi: 'या नगर निगम आईडी' },
  emailLabel: { en: 'Officer Identification / Email', hi: 'अधिकारी पहचान / ईमेल' },
  emailPlaceholder: { en: 'officer@example.in', hi: 'officer@example.in' },
  passLabel: { en: 'Security Token / Passcode', hi: 'सुरक्षा टोकन / पासकोड' },
  showPass: { en: 'Show passcode', hi: 'पासकोड दिखाएँ' },
  hidePass: { en: 'Hide passcode', hi: 'पासकोड छिपाएँ' },
  remember: { en: 'Remember this browser', hi: 'इस ब्राउज़र को याद रखें' },
  enter: { en: 'Access Intelligence Dashboard', hi: 'डैशबोर्ड खोलें' },
  enterHi: { en: 'बौद्धिक डैशबोर्ड में सुरक्षित प्रवेश करें', hi: 'Opens the dashboard — demo entry' },
  noteTitle: { en: 'Decision support, not regulation', hi: 'निर्णय सहायता, नियामक निर्धारण नहीं' },
  noteTag: { en: 'Please read', hi: 'कृपया पढ़ें' },
  noteBody: {
    en: 'Built from historical MPPCB immersion-site readings (2023–2025) compared with CPCB Class B reference values. It does not describe current water conditions and is not an official regulatory determination. Missing data is shown as unknown, never as clean.',
    hi: 'यह एमपीपीसीबी के ऐतिहासिक विसर्जन-स्थल मापों (2023–2025) की सीपीसीबी श्रेणी-बी संदर्भ मानों से तुलना पर आधारित है। यह वर्तमान जल स्थिति नहीं बताता और आधिकारिक नियामक निर्धारण नहीं है। अनुपलब्ध डेटा "अज्ञात" दिखाया जाता है, कभी "साफ़" नहीं।',
  },
  footer: { en: 'Open-source hackathon prototype · No connection to any government system', hi: 'ओपन-सोर्स हैकाथॉन प्रोटोटाइप · किसी सरकारी प्रणाली से कोई संबंध नहीं' },
  footerLicense: { en: 'MIT licensed', hi: 'एमआईटी लाइसेंस' },
  signOut: { en: 'Leave dashboard', hi: 'डैशबोर्ड से बाहर' },
  dashboardSoon: { en: 'Dashboard is next to build.', hi: 'डैशबोर्ड अगला बनना है।' },
} as const satisfies Record<string, { en: string; hi: string }>

export type StringKey = keyof typeof strings

export function t(key: StringKey, lang: Lang): string {
  return strings[key][lang]
}
