import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { normalizeStoredLanguage } from '@/utils/languageUtils';

const LANGUAGES = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'zh', label: '繁體中文',  flag: '🇹🇼' },
  { code: 'ja', label: '日本語',    flag: '🇯🇵' },
  { code: 'th', label: 'ไทย',      flag: '🇹🇭' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (code: string) => {
    const canonical = normalizeStoredLanguage(code);
    i18n.changeLanguage(canonical);
    localStorage.setItem('language', canonical);
  };

  const current = LANGUAGES.find((l) => l.code === normalizeStoredLanguage(i18n.language)) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted/60"
        >
          <span className="text-sm leading-none">{current.flag}</span>
          <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => changeLanguage(l.code)}
            className={`gap-2 text-xs cursor-pointer ${
              current.code === l.code
                ? 'bg-primary/8 text-primary font-semibold'
                : 'text-foreground'
            }`}
          >
            <span className="text-sm">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
