import { en } from './en';
import { th } from './th';
import type { Locale, Translations } from './types';

const translations: Record<Locale, Translations> = { en, th };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}
