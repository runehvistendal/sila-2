import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'da', flag: '🇩🇰', name: 'Dansk', abbr: 'DA' },
  { code: 'en', flag: '🇬🇧', name: 'English', abbr: 'EN' },
  { code: 'kl', flag: '🇬🇱', name: 'Kalaallisut', abbr: 'KL' },
];

export default function LanguageSwitcher({ transparent = false, mobileCompact = false }) {
  const { lang, setLang } = useLanguage();
  const currentLang = languages.find(l => l.code === lang);

  if (mobileCompact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
            transparent
              ? 'text-white/80 hover:text-white hover:bg-white/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}>
            <Globe className="w-4 h-4" />
            <span>{currentLang?.abbr}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => setLang(language.code)}
              className={`flex items-center gap-2 cursor-pointer ${lang === language.code ? 'bg-muted' : ''}`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm">{language.abbr}</span>
              {lang === language.code && (
                <span className="ml-auto text-primary font-bold">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          transparent
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}>
          <span className="text-base">{currentLang?.flag}</span>
          <span className="hidden sm:inline">{currentLang?.name}</span>
          <Globe className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Vælg sprog</div>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLang(language.code)}
            className={`flex items-center gap-2 cursor-pointer ${lang === language.code ? 'bg-muted' : ''}`}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
            {lang === language.code && (
              <span className="ml-auto text-primary font-bold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}