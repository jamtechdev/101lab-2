export interface PhoneCode {
  code: string;
  label: string;
  country: string;
  group: string;
}

export const PHONE_CODES: PhoneCode[] = [
  // ── Popular ──────────────────────────────────────────────────────────
  { code: "+886", label: "🇹🇼 Taiwan (+886)",         country: "Taiwan",          group: "Popular" },
  { code: "+91",  label: "🇮🇳 India (+91)",            country: "India",           group: "Popular" },
  { code: "+65",  label: "🇸🇬 Singapore (+65)",        country: "Singapore",       group: "Popular" },
  { code: "+60",  label: "🇲🇾 Malaysia (+60)",         country: "Malaysia",        group: "Popular" },
  { code: "+86",  label: "🇨🇳 China (+86)",            country: "China",           group: "Popular" },
  { code: "+1",   label: "🇺🇸 USA / Canada (+1)",      country: "USA",             group: "Popular" },
  { code: "+44",  label: "🇬🇧 UK (+44)",               country: "UK",              group: "Popular" },

  // ── East Asia ─────────────────────────────────────────────────────────
  { code: "+81",  label: "🇯🇵 Japan (+81)",            country: "Japan",           group: "East Asia" },
  { code: "+82",  label: "🇰🇷 South Korea (+82)",      country: "South Korea",     group: "East Asia" },
  { code: "+852", label: "🇭🇰 Hong Kong (+852)",       country: "Hong Kong",       group: "East Asia" },
  { code: "+853", label: "🇲🇴 Macau (+853)",           country: "Macau",           group: "East Asia" },
  { code: "+976", label: "🇲🇳 Mongolia (+976)",        country: "Mongolia",        group: "East Asia" },

  // ── Southeast Asia ────────────────────────────────────────────────────
  { code: "+62",  label: "🇮🇩 Indonesia (+62)",        country: "Indonesia",       group: "Southeast Asia" },
  { code: "+66",  label: "🇹🇭 Thailand (+66)",         country: "Thailand",        group: "Southeast Asia" },
  { code: "+84",  label: "🇻🇳 Vietnam (+84)",          country: "Vietnam",         group: "Southeast Asia" },
  { code: "+63",  label: "🇵🇭 Philippines (+63)",      country: "Philippines",     group: "Southeast Asia" },
  { code: "+95",  label: "🇲🇲 Myanmar (+95)",          country: "Myanmar",         group: "Southeast Asia" },
  { code: "+855", label: "🇰🇭 Cambodia (+855)",        country: "Cambodia",        group: "Southeast Asia" },
  { code: "+856", label: "🇱🇦 Laos (+856)",            country: "Laos",            group: "Southeast Asia" },
  { code: "+673", label: "🇧🇳 Brunei (+673)",          country: "Brunei",          group: "Southeast Asia" },

  // ── South Asia ────────────────────────────────────────────────────────
  { code: "+92",  label: "🇵🇰 Pakistan (+92)",         country: "Pakistan",        group: "South Asia" },
  { code: "+880", label: "🇧🇩 Bangladesh (+880)",      country: "Bangladesh",      group: "South Asia" },
  { code: "+94",  label: "🇱🇰 Sri Lanka (+94)",        country: "Sri Lanka",       group: "South Asia" },
  { code: "+977", label: "🇳🇵 Nepal (+977)",           country: "Nepal",           group: "South Asia" },
  { code: "+975", label: "🇧🇹 Bhutan (+975)",          country: "Bhutan",          group: "South Asia" },
  { code: "+960", label: "🇲🇻 Maldives (+960)",        country: "Maldives",        group: "South Asia" },

  // ── Middle East ───────────────────────────────────────────────────────
  { code: "+971", label: "🇦🇪 UAE (+971)",             country: "UAE",             group: "Middle East" },
  { code: "+966", label: "🇸🇦 Saudi Arabia (+966)",    country: "Saudi Arabia",    group: "Middle East" },
  { code: "+974", label: "🇶🇦 Qatar (+974)",           country: "Qatar",           group: "Middle East" },
  { code: "+965", label: "🇰🇼 Kuwait (+965)",          country: "Kuwait",          group: "Middle East" },
  { code: "+973", label: "🇧🇭 Bahrain (+973)",         country: "Bahrain",         group: "Middle East" },
  { code: "+968", label: "🇴🇲 Oman (+968)",            country: "Oman",            group: "Middle East" },
  { code: "+972", label: "🇮🇱 Israel (+972)",          country: "Israel",          group: "Middle East" },
  { code: "+90",  label: "🇹🇷 Turkey (+90)",           country: "Turkey",          group: "Middle East" },
  { code: "+98",  label: "🇮🇷 Iran (+98)",             country: "Iran",            group: "Middle East" },

  // ── Europe ────────────────────────────────────────────────────────────
  { code: "+49",  label: "🇩🇪 Germany (+49)",          country: "Germany",         group: "Europe" },
  { code: "+33",  label: "🇫🇷 France (+33)",           country: "France",          group: "Europe" },
  { code: "+39",  label: "🇮🇹 Italy (+39)",            country: "Italy",           group: "Europe" },
  { code: "+34",  label: "🇪🇸 Spain (+34)",            country: "Spain",           group: "Europe" },
  { code: "+31",  label: "🇳🇱 Netherlands (+31)",      country: "Netherlands",     group: "Europe" },
  { code: "+32",  label: "🇧🇪 Belgium (+32)",          country: "Belgium",         group: "Europe" },
  { code: "+41",  label: "🇨🇭 Switzerland (+41)",      country: "Switzerland",     group: "Europe" },
  { code: "+43",  label: "🇦🇹 Austria (+43)",          country: "Austria",         group: "Europe" },
  { code: "+46",  label: "🇸🇪 Sweden (+46)",           country: "Sweden",          group: "Europe" },
  { code: "+47",  label: "🇳🇴 Norway (+47)",           country: "Norway",          group: "Europe" },
  { code: "+45",  label: "🇩🇰 Denmark (+45)",          country: "Denmark",         group: "Europe" },
  { code: "+358", label: "🇫🇮 Finland (+358)",         country: "Finland",         group: "Europe" },
  { code: "+48",  label: "🇵🇱 Poland (+48)",           country: "Poland",          group: "Europe" },
  { code: "+420", label: "🇨🇿 Czech Republic (+420)",  country: "Czech Republic",  group: "Europe" },
  { code: "+36",  label: "🇭🇺 Hungary (+36)",          country: "Hungary",         group: "Europe" },
  { code: "+40",  label: "🇷🇴 Romania (+40)",          country: "Romania",         group: "Europe" },
  { code: "+30",  label: "🇬🇷 Greece (+30)",           country: "Greece",          group: "Europe" },
  { code: "+351", label: "🇵🇹 Portugal (+351)",        country: "Portugal",        group: "Europe" },
  { code: "+7",   label: "🇷🇺 Russia (+7)",            country: "Russia",          group: "Europe" },
  { code: "+380", label: "🇺🇦 Ukraine (+380)",         country: "Ukraine",         group: "Europe" },

  // ── Americas ──────────────────────────────────────────────────────────
  { code: "+52",  label: "🇲🇽 Mexico (+52)",           country: "Mexico",          group: "Americas" },
  { code: "+55",  label: "🇧🇷 Brazil (+55)",           country: "Brazil",          group: "Americas" },
  { code: "+54",  label: "🇦🇷 Argentina (+54)",        country: "Argentina",       group: "Americas" },
  { code: "+56",  label: "🇨🇱 Chile (+56)",            country: "Chile",           group: "Americas" },
  { code: "+57",  label: "🇨🇴 Colombia (+57)",         country: "Colombia",        group: "Americas" },
  { code: "+51",  label: "🇵🇪 Peru (+51)",             country: "Peru",            group: "Americas" },

  // ── Oceania ───────────────────────────────────────────────────────────
  { code: "+61",  label: "🇦🇺 Australia (+61)",        country: "Australia",       group: "Oceania" },
  { code: "+64",  label: "🇳🇿 New Zealand (+64)",      country: "New Zealand",     group: "Oceania" },

  // ── Africa ────────────────────────────────────────────────────────────
  { code: "+27",  label: "🇿🇦 South Africa (+27)",     country: "South Africa",    group: "Africa" },
  { code: "+234", label: "🇳🇬 Nigeria (+234)",         country: "Nigeria",         group: "Africa" },
  { code: "+254", label: "🇰🇪 Kenya (+254)",           country: "Kenya",           group: "Africa" },
  { code: "+20",  label: "🇪🇬 Egypt (+20)",            country: "Egypt",           group: "Africa" },
  { code: "+212", label: "🇲🇦 Morocco (+212)",         country: "Morocco",         group: "Africa" },
];

// Unique groups in order
export const PHONE_CODE_GROUPS = [
  "Popular", "East Asia", "Southeast Asia", "South Asia",
  "Middle East", "Europe", "Americas", "Oceania", "Africa",
];
