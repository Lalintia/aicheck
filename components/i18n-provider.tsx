'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { I18nContext, getTranslations } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

interface I18nProviderProps {
  readonly children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>('en');

  const setLocale = useCallback((newLocale: Locale): void => {
    setLocaleState(newLocale);
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
