import { LanguageCode } from '../types';
import { tr } from '../translations';

// Store original English text for text nodes to allow seamless switching between languages
const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

let activeLang: LanguageCode = 'en';
let observer: MutationObserver | null = null;
let rafHandle: number | null = null;

// Tags that should not have their text content translated
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (IGNORED_TAGS.has(parent.tagName)) return true;
  // Skip inputs where user is actively typing
  if (parent.tagName === 'INPUT') return true;
  return false;
}

/**
 * Fast synchronous in-memory DOM text translation
 */
function translateDOM(targetLang: LanguageCode) {
  if (typeof document === 'undefined' || !document.body) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (IGNORED_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeType === Node.TEXT_NODE) {
          if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let currentNode: Node | null = walker.nextNode();

  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.nodeValue || '';
      const trimmed = text.trim();

      if (trimmed.length > 0 && !/^[\d\s.,:/()₹%+-]+$/.test(trimmed)) {
        if (!originalTextMap.has(currentNode)) {
          originalTextMap.set(currentNode, text);
        }

        const orig = originalTextMap.get(currentNode)!;
        const origTrimmed = orig.trim();

        if (targetLang === 'en') {
          if (currentNode.nodeValue !== orig) {
            currentNode.nodeValue = orig;
          }
        } else {
          const leadingWs = orig.match(/^\s*/)?.[0] || '';
          const trailingWs = orig.match(/\s*$/)?.[0] || '';
          const translated = tr(origTrimmed, targetLang);

          if (translated !== origTrimmed) {
            const nextValue = `${leadingWs}${translated}${trailingWs}`;
            if (currentNode.nodeValue !== nextValue) {
              currentNode.nodeValue = nextValue;
            }
          }
        }
      }
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const el = currentNode as Element;

      // Translate placeholders (e.g. search inputs, form inputs)
      const placeholder = el.getAttribute('placeholder');
      if (placeholder && placeholder.trim()) {
        if (!originalPlaceholderMap.has(el)) {
          originalPlaceholderMap.set(el, placeholder);
        }
        const origPlaceholder = originalPlaceholderMap.get(el)!;
        if (targetLang === 'en') {
          el.setAttribute('placeholder', origPlaceholder);
        } else {
          const translated = tr(origPlaceholder, targetLang);
          el.setAttribute('placeholder', translated);
        }
      }

      // Translate titles (tooltips)
      const title = el.getAttribute('title');
      if (title && title.trim()) {
        if (!originalTitleMap.has(el)) {
          originalTitleMap.set(el, title);
        }
        const origTitle = originalTitleMap.get(el)!;
        if (targetLang === 'en') {
          el.setAttribute('title', origTitle);
        } else {
          const translated = tr(origTitle, targetLang);
          el.setAttribute('title', translated);
        }
      }
    }

    currentNode = walker.nextNode();
  }
}

/**
 * Schedule a fast DOM sweep using requestAnimationFrame to prevent lag
 */
function scheduleDOMTranslation() {
  if (rafHandle !== null) {
    cancelAnimationFrame(rafHandle);
  }
  rafHandle = requestAnimationFrame(() => {
    rafHandle = null;
    if (observer) {
      try {
        observer.disconnect();
      } catch {}
    }
    try {
      translateDOM(activeLang);
    } catch (e) {
      console.warn('DOM translation error:', e);
    } finally {
      if (observer && typeof document !== 'undefined' && document.body) {
        try {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        } catch {}
      }
    }
  });
}

/**
 * Universal, 0ms fast, 100% in-memory full-page translator.
 * Eliminates external Google Translate scripts, iframes, cookies, and lag.
 */
export function triggerFullPageTranslation(lang: LanguageCode) {
  activeLang = lang;

  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
    const host = window.location.hostname;
    // Clear legacy Google Translate cookies
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${host};`;
  } catch (e) {}

  // Run instant synchronous sweep safely
  try {
    translateDOM(lang);
  } catch (e) {
    console.warn('Initial translateDOM error:', e);
  }

  // Set up or maintain a mutation observer so that any dynamic UI, modals, or tab changes are translated
  if (typeof MutationObserver !== 'undefined' && !observer && typeof document !== 'undefined' && document.body) {
    try {
      observer = new MutationObserver(() => {
        if (activeLang !== 'en') {
          scheduleDOMTranslation();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch {}
  }
}

