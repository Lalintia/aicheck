'use client';

import { createContext, useContext } from 'react';
import { en } from './en';
import type { Locale, Translations } from './types';

export type { Locale, Translations };
export { getTranslations } from './translations';

interface I18nContextValue {
  readonly locale: Locale;
  readonly t: Translations;
  readonly setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {
    // no-op default — the provider always wraps the app so this is unreachable
  },
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
