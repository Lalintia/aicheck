'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { I18nContext, getTranslations } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

interface I18nProviderProps {
  readonly children: React.ReactNode;
  readonly initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = 'en' }: I18nProviderProps): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale): void => {
    setLocaleState(newLocale);
    // Persist to cookie so the next SSR render has the correct lang
    if (typeof document !== 'undefined') {
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    t: getTranslations(locale),
    setLocale,
  }), [locale, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
