'use client';

import { FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher(): React.ReactElement {
  const { locale, setLocale } = useI18n();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-white/80 backdrop-blur-md border border-frost-200 rounded-full p-1 shadow-sm">
      <LangButton locale="en" label="EN" current={locale} onClick={setLocale} />
      <LangButton locale="th" label="TH" current={locale} onClick={setLocale} />
      <div className="w-px h-4 bg-frost-200 mx-0.5" aria-hidden="true" />
      <a
        href="/docs/project-overview.html"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-frost-500 hover:text-frost-700 hover:bg-frost-50 transition-all duration-200"
        aria-label="Project documentation"
      >
        <FileText className="w-3 h-3" aria-hidden="true" />
        DOC
      </a>
    </div>
  );
}

interface LangButtonProps {
  readonly locale: Locale;
  readonly label: string;
  readonly current: Locale;
  readonly onClick: (locale: Locale) => void;
}

function LangButton({ locale, label, current, onClick }: LangButtonProps): React.ReactElement {
  const isActive = locale === current;

  return (
    <button
      type="button"
      onClick={() => { onClick(locale); }}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
        isActive
          ? 'bg-frost-500 text-white shadow-sm'
          : 'text-frost-500 hover:text-frost-700 hover:bg-frost-50'
      }`}
      aria-label={`Switch to ${label}`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}
