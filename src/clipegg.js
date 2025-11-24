/**
 * ClipEgg - Lightweight clipboard egg protocol
 * Copy references, not payloads.
 */

const MIME_EGG = 'application/x-clipegg+json';
const MIME_URI = 'text/uri-list';
const MIME_PLAIN = 'text/plain';
const MIME_HTML = 'text/html';

const VERSION = 1;

class ClipEgg {
  constructor() {
    this.extractors = new Map();
    this.pasteHandlers = [];
    this._boundCopy = this._handleCopy.bind(this);
    this._boundPaste = this._handlePaste.bind(this);
  }

  /**
   * Register an extractor for elements matching selector.
   * @param {string} selector - CSS selector for copyable elements
   * @param {Function} extractor - (element) => { uri, label, type?, thumb?, meta? }
   */
  register(selector, extractor) {
    this.extractors.set(selector, extractor);
    return this;
  }

  /**
   * Register a paste handler.
   * @param {Function} handler - (egg, event) => void
   */
  onPaste(handler) {
    this.pasteHandlers.push(handler);
    return this;
  }

  /**
   * Activate clipboard interception.
   */
  activate() {
    document.addEventListener('copy', this._boundCopy);
    document.addEventListener('paste', this._boundPaste);
    return this;
  }

  /**
   * Deactivate clipboard interception.
   */
  deactivate() {
    document.removeEventListener('copy', this._boundCopy);
    document.removeEventListener('paste', this._boundPaste);
    return this;
  }

  /**
   * Create an egg object.
   */
  createEgg(uri, label, opts = {}) {
    return {
      v: VERSION,
      uri,
      label,
      type: opts.type || 'unknown',
      thumb: opts.thumb || null,
      meta: opts.meta || null,
      ts: Date.now()
    };
  }

  /**
   * Serialize egg to clipboard formats.
   */
  writeToClipboard(egg, clipboardData) {
    // Primary: structured egg
    clipboardData.setData(MIME_EGG, JSON.stringify(egg));
    
    // Fallback: URI list
    clipboardData.setData(MIME_URI, egg.uri);
    
    // Fallback: plain text
    clipboardData.setData(MIME_PLAIN, `${egg.label}\n${egg.uri}`);
    
    // Fallback: minimal HTML (smart link, optional thumbnail)
    const thumbHtml = egg.thumb 
      ? `<img src="${egg.thumb}" alt="" style="max-width:64px;max-height:64px;vertical-align:middle;margin-right:8px;">` 
      : '';
    clipboardData.setData(MIME_HTML, `<a href="${egg.uri}">${thumbHtml}${egg.label}</a>`);
  }

  /**
   * Parse egg from clipboard data.
   * @returns {Object|null} egg or null if not found
   */
  readFromClipboard(clipboardData) {
    // Try structured egg first
    const eggJson = clipboardData.getData(MIME_EGG);
    if (eggJson) {
      try {
        return JSON.parse(eggJson);
      } catch (e) {
        console.warn('ClipEgg: malformed egg JSON');
      }
    }
    
    // Fallback: construct from URI
    const uri = clipboardData.getData(MIME_URI);
    if (uri) {
      const plain = clipboardData.getData(MIME_PLAIN) || uri;
      return {
        v: VERSION,
        uri: uri.trim(),
        label: plain.split('\n')[0] || uri,
        type: 'uri-fallback',
        thumb: null,
        meta: null,
        ts: Date.now()
      };
    }
    
    return null;
  }

  // Internal: handle copy event
  _handleCopy(e) {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode?.parentElement;
    if (!anchor) return;

    // Find matching extractor
    for (const [selector, extractor] of this.extractors) {
      const target = anchor.closest(selector);
      if (target) {
        e.preventDefault();
        const data = extractor(target);
        const egg = this.createEgg(data.uri, data.label, {
          type: data.type,
          thumb: data.thumb,
          meta: data.meta
        });
        this.writeToClipboard(egg, e.clipboardData);
        console.debug('ClipEgg: copied', egg);
        return;
      }
    }
  }

  // Internal: handle paste event
  _handlePaste(e) {
    const egg = this.readFromClipboard(e.clipboardData);
    if (egg && this.pasteHandlers.length) {
      e.preventDefault();
      this.pasteHandlers.forEach(h => h(egg, e));
      console.debug('ClipEgg: pasted', egg);
    }
  }
}

// Singleton export
const clipegg = new ClipEgg();

export { ClipEgg, clipegg, VERSION, MIME_EGG };
export default clipegg;
