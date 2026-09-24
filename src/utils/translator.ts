import { LanguageCode } from '../types';

/**
 * Clean up any legacy external translation cookies so the browser runs 100% native fast translations
 */
export function triggerFullPageTranslation(lang: LanguageCode) {
  try {
    const host = window.location.hostname;
    // Clear any residual Google Translate cookies
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
  } catch (e) {}
}

