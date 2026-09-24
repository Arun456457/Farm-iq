import { LanguageCode } from '../types';
import { applyDomTranslation } from './domTranslator';

/**
 * Trigger deep full-page DOM translation using both real-time DOM translation engine
 * and Google Translate fallback for 100% word-by-word coverage
 */
export function triggerFullPageTranslation(lang: LanguageCode) {
  try {
    // 1. Immediately apply universal recursive DOM translation
    applyDomTranslation(lang);

    const googleLang = lang === 'en' ? 'en' : lang;
    const host = window.location.hostname;

    // 1. Set Google Translate cookie on all paths and domain variations
    if (lang === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
      document.cookie = 'googtrans=/en/en; path=/;';
    } else {
      document.cookie = `googtrans=/en/${googleLang}; path=/;`;
      try {
        document.cookie = `googtrans=/en/${googleLang}; path=/; domain=${host};`;
        if (host.includes('.') && !host.endsWith('onrender.com')) {
          document.cookie = `googtrans=/en/${googleLang}; path=/; domain=.${host};`;
        }
      } catch {}
    }

    // 2. Dispatch change event to Google Translate combo selector
    const tryApply = (): boolean => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (combo) {
        combo.value = googleLang;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    if (!tryApply()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (tryApply() || attempts > 12) {
          clearInterval(interval);
        }
      }, 250);
    }
  } catch (e) {
    console.error("Translation trigger error:", e);
  }
}
