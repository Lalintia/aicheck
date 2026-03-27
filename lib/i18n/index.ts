'use client';

import { createContext, useContext } from 'react';
import { en } from './en';
import { th } from './th';
import type { Locale, Translations } from './types';

export type { Locale, Translations };

const translations: Record<Locale, Translations> = { en, th };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

interface I18nContextValue {
  readonly locale: Locale;
  readonly t: Translations;
  readonly setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
