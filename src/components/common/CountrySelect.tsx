import { cn } from "@/lib/utils";
import { SelectItem } from "@/components/ui/select";

// Priority countries shown at top
export const PRIORITY_COUNTRIES = [
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
export const OTHER_COUNTRIES = [
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

export const ALL_COUNTRIES = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES];

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
  placeholder = "Select country",
  required,
  id,
}: CountrySelectProps) {
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
      <option value="" disabled>{placeholder}</option>
      <optgroup label="─── Asia Pacific ───">
        {PRIORITY_COUNTRIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </optgroup>
      <optgroup label="─── Other Countries ───">
        {OTHER_COUNTRIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </optgroup>
    </select>
  );
}

// ── Shadcn <SelectItem> list ── drop inside <SelectContent> for Shadcn Select components
export function CountrySelectItems() {
  return (
    <>
      <SelectItem value="__priority_header__" disabled className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest pointer-events-none py-1">
        ── Asia Pacific ──
      </SelectItem>
      {PRIORITY_COUNTRIES.map((c) => (
        <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>
      ))}
      <SelectItem value="__other_header__" disabled className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest pointer-events-none py-1 mt-1 border-t border-border">
        ── Other Countries ──
      </SelectItem>
      {OTHER_COUNTRIES.map((c) => (
        <SelectItem key={c} value={c}>{c}</SelectItem>
      ))}
    </>
  );
}
