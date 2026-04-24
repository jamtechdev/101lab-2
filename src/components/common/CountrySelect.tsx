import { cn } from "@/lib/utils";
import { SelectItem } from "@/components/ui/select";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// Priority countries shown at top
const PRIORITY_COUNTRIES = [
  "China",
  "Indonesia",
  "India",
  "Malaysia",
  "Taiwan",
  "Thailand",
  "Japan",
  "Vietnam",
];

// All other countries alphabetically
const OTHER_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Azerbaijan", "Bahrain", "Bangladesh", "Belgium", "Bolivia", "Brazil",
  "Bulgaria", "Cambodia", "Canada", "Chile", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Ecuador", "Egypt", "Estonia", "Ethiopia",
  "Finland", "France", "Germany", "Ghana", "Greece", "Guatemala",
  "Hong Kong", "Hungary", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg", "Macau",
  "Mexico", "Mongolia", "Morocco", "Mozambique", "Myanmar", "Nepal",
  "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan",
  "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore",
  "Slovakia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sweden", "Switzerland", "Syria", "Tanzania", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Venezuela", "Yemen", "Zambia", "Zimbabwe",
];

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bahrain: "BH",
  Bangladesh: "BD",
  Belgium: "BE",
  Bolivia: "BO",
  Brazil: "BR",
  Bulgaria: "BG",
  Cambodia: "KH",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Croatia: "HR",
  "Czech Republic": "CZ",
  Denmark: "DK",
  Ecuador: "EC",
  Egypt: "EG",
  Estonia: "EE",
  Ethiopia: "ET",
  Finland: "FI",
  France: "FR",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Guatemala: "GT",
  "Hong Kong": "HK",
  Hungary: "HU",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Japan: "JP",
  Jordan: "JO",
  Kazakhstan: "KZ",
  Kenya: "KE",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  Laos: "LA",
  Latvia: "LV",
  Lebanon: "LB",
  Libya: "LY",
  Lithuania: "LT",
  Luxembourg: "LU",
  Macau: "MO",
  Malaysia: "MY",
  Mexico: "MX",
  Mongolia: "MN",
  Morocco: "MA",
  Mozambique: "MZ",
  Myanmar: "MM",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nigeria: "NG",
  Norway: "NO",
  Oman: "OM",
  Pakistan: "PK",
  Panama: "PA",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  "Saudi Arabia": "SA",
  Serbia: "RS",
  Singapore: "SG",
  Slovakia: "SK",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sweden: "SE",
  Switzerland: "CH",
  Syria: "SY",
  Taiwan: "TW",
  Tanzania: "TZ",
  Thailand: "TH",
  Tunisia: "TN",
  Turkey: "TR",
  Turkmenistan: "TM",
  Uganda: "UG",
  Ukraine: "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
  Venezuela: "VE",
  Vietnam: "VN",
  Yemen: "YE",
  Zambia: "ZM",
  Zimbabwe: "ZW",
};

function getI18nLocale(language: string | undefined): string {
  if (!language) return "en";
  if (language === "zh") return "zh-Hant";
  return language;
}

function getLocalizedCountryName(country: string, language: string | undefined): string {
  const iso = COUNTRY_NAME_TO_ISO[country];
  if (!iso) return country;

  try {
    const displayNames = new Intl.DisplayNames([getI18nLocale(language)], { type: "region" });
    return displayNames.of(iso) || country;
  } catch {
    return country;
  }
}

// ── Native <select> version ── for plain HTML form fields (Auth, RoleSwitcher, etc.)
interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  className,
  placeholder,
  required,
  id,
}: CountrySelectProps) {
  const { i18n, t } = useTranslation();
  const defaultPlaceholder = t("countrySelect.placeholder");

  const localizedPriority = useMemo(
    () => PRIORITY_COUNTRIES.map((country) => ({ value: country, label: getLocalizedCountryName(country, i18n.language) })),
    [i18n.language]
  );
  const localizedOther = useMemo(
    () => OTHER_COUNTRIES.map((country) => ({ value: country, label: getLocalizedCountryName(country, i18n.language) })),
    [i18n.language]
  );

  return (
    <select
      id={id}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full px-3 py-2 rounded-md border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
        !value && "text-muted-foreground",
        className
      )}
    >
      <option value="" disabled>{placeholder || defaultPlaceholder}</option>
      <optgroup label={t("countrySelect.asiaPacificGroup")}>
        {localizedPriority.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </optgroup>
      <optgroup label={t("countrySelect.otherCountriesGroup")}>
        {localizedOther.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </optgroup>
    </select>
  );
}

// ── Shadcn <SelectItem> list ── drop inside <SelectContent> for Shadcn Select components
export function CountrySelectItems() {
  const { i18n, t } = useTranslation();
  const localizedPriority = useMemo(
    () => PRIORITY_COUNTRIES.map((country) => ({ value: country, label: getLocalizedCountryName(country, i18n.language) })),
    [i18n.language]
  );
  const localizedOther = useMemo(
    () => OTHER_COUNTRIES.map((country) => ({ value: country, label: getLocalizedCountryName(country, i18n.language) })),
    [i18n.language]
  );

  return (
    <>
      <SelectItem value="__priority_header__" disabled className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest pointer-events-none py-1">
        {t("countrySelect.asiaPacificHeader")}
      </SelectItem>
      {localizedPriority.map((c) => (
        <SelectItem key={c.value} value={c.value} className="font-medium">{c.label}</SelectItem>
      ))}
      <SelectItem value="__other_header__" disabled className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest pointer-events-none py-1 mt-1 border-t border-border">
        {t("countrySelect.otherCountriesHeader")}
      </SelectItem>
      {localizedOther.map((c) => (
        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
      ))}
    </>
  );
}
