import { LanguageCode } from '../types';

/**
 * Trigger deep full-page DOM translation using Google Translate
 */
export function triggerFullPageTranslation(lang: LanguageCode) {
  try {
    const googleLang = lang === 'en' ? 'en' : lang;

    // 1. Set Google Translate cookie
    const host = window.location.hostname;
    if (lang === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
      document.cookie = `googtrans=/en/en; path=/;`;
      document.cookie = `googtrans=/en/en; path=/; domain=${host};`;
    } else {
      document.cookie = `googtrans=/en/${googleLang}; path=/;`;
      document.cookie = `googtrans=/en/${googleLang}; path=/; domain=${host};`;
    }

    // 2. Dispatch change event to Google Translate combo selector
    const tryApply = () => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        combo.value = googleLang;
        combo.dispatchEvent(new Event('change'));
        return true;
      }
      return false;
    };

    if (!tryApply()) {
      // Try again after short intervals if Google Translate script was loading
      const interval = setInterval(() => {
        if (tryApply()) {
          clearInterval(interval);
        }
      }, 300);
      setTimeout(() => clearInterval(interval), 5000);
    }
  } catch (e) {
    console.error("Translation trigger error:", e);
  }
}
