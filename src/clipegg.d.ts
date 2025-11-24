/**
 * ClipEgg - Lightweight clipboard egg protocol
 * Copy references, not payloads.
 *
 * @packageDocumentation
 */

/**
 * ClipEgg protocol version
 */
export const VERSION: number;

/**
 * MIME type for ClipEgg structured data
 */
export const MIME_EGG: 'application/x-clipegg+json';

/**
 * MIME type for URI list fallback
 */
export const MIME_URI: 'text/uri-list';

/**
 * MIME type for plain text fallback
 */
export const MIME_PLAIN: 'text/plain';

/**
 * MIME type for HTML fallback
 */
export const MIME_HTML: 'text/html';

/**
 * Represents a clipboard egg object containing reference metadata
 */
export interface Egg {
  /**
   * Protocol version
   */
  v: number;

  /**
   * The URI/reference being copied
   */
  uri: string;

  /**
   * Human-readable label for the egg
   */
  label: string;

  /**
   * Type of content (e.g., 'image', 'video', 'document', 'unknown')
   */
  type: string;

  /**
   * Optional thumbnail URL for visual representation
   */
  thumb: string | null;

  /**
   * Optional metadata object for additional app-specific data
   */
  meta: Record<string, unknown> | null;

  /**
   * Timestamp when the egg was created (milliseconds since epoch)
   */
  ts: number;
}

/**
 * Options for creating an egg
 */
export interface CreateEggOptions {
  /**
   * Content type of the egg (default: 'unknown')
   */
  type?: string;

  /**
   * URL to a thumbnail image
   */
  thumb?: string | null;

  /**
   * Additional metadata
   */
  meta?: Record<string, unknown> | null;
}

/**
 * Extractor function that converts an element to egg data
 */
export type Extractor = (element: HTMLElement) => ExtractorResult;

/**
 * Result returned by an extractor function
 */
export interface ExtractorResult {
  /**
   * The URI/reference to copy
   */
  uri: string;

  /**
   * Human-readable label
   */
  label: string;

  /**
   * Optional content type
   */
  type?: string;

  /**
   * Optional thumbnail URL
   */
  thumb?: string | null;

  /**
   * Optional metadata
   */
  meta?: Record<string, unknown> | null;
}

/**
 * Paste event handler function
 */
export type PasteHandler = (egg: Egg, event: ClipboardEvent) => void;

/**
 * Main ClipEgg class for managing clipboard egg protocol
 */
export class ClipEgg {
  /**
   * Map of CSS selectors to extractor functions
   */
  extractors: Map<string, Extractor>;

  /**
   * Array of registered paste handlers
   */
  pasteHandlers: PasteHandler[];

  constructor();

  /**
   * Register an extractor function for elements matching a CSS selector.
   * When a copy event occurs on a matching element, the extractor is called
   * to extract the egg data.
   *
   * @param selector - CSS selector for elements that can be copied
   * @param extractor - Function that extracts egg data from the element
   * @returns This instance for method chaining
   *
   * @example
   * ```ts
   * clipegg.register('a[data-id]', (el) => ({
   *   uri: el.href,
   *   label: el.textContent || '',
   *   type: 'link',
   *   meta: { id: el.dataset.id }
   * }));
   * ```
   */
  register(selector: string, extractor: Extractor): this;

  /**
   * Register a handler to be called when an egg is pasted.
   *
   * @param handler - Function called with the pasted egg and clipboard event
   * @returns This instance for method chaining
   *
   * @example
   * ```ts
   * clipegg.onPaste((egg, event) => {
   *   console.log('Pasted:', egg.label);
   *   console.log('URI:', egg.uri);
   * });
   * ```
   */
  onPaste(handler: PasteHandler): this;

  /**
   * Activate clipboard event interception.
   * Starts listening to copy and paste events on the document.
   *
   * @returns This instance for method chaining
   */
  activate(): this;

  /**
   * Deactivate clipboard event interception.
   * Stops listening to copy and paste events on the document.
   *
   * @returns This instance for method chaining
   */
  deactivate(): this;

  /**
   * Create an egg object with the given URI and label.
   *
   * @param uri - The reference URI to include in the egg
   * @param label - Human-readable label for the egg
   * @param opts - Optional configuration for the egg
   * @returns A new Egg object
   *
   * @example
   * ```ts
   * const egg = clipegg.createEgg(
   *   'https://example.com/doc/123',
   *   'My Document',
   *   { type: 'document', meta: { id: '123' } }
   * );
   * ```
   */
  createEgg(uri: string, label: string, opts?: CreateEggOptions): Egg;

  /**
   * Write an egg to clipboard data in multiple formats.
   * Sets both structured egg format and fallback formats (URI, plain text, HTML).
   *
   * @param egg - The egg to serialize
   * @param clipboardData - The clipboard data object from a clipboard event
   *
   * @example
   * ```ts
   * document.addEventListener('copy', (e) => {
   *   const egg = clipegg.createEgg('https://example.com', 'Example');
   *   clipegg.writeToClipboard(egg, e.clipboardData!);
   * });
   * ```
   */
  writeToClipboard(egg: Egg, clipboardData: DataTransfer): void;

  /**
   * Read an egg from clipboard data.
   * Tries to parse structured egg format first, falls back to URI-based reconstruction.
   *
   * @param clipboardData - The clipboard data object from a clipboard event
   * @returns The parsed egg, or null if no egg data was found
   *
   * @example
   * ```ts
   * document.addEventListener('paste', (e) => {
   *   const egg = clipegg.readFromClipboard(e.clipboardData!);
   *   if (egg) {
   *     console.log('Got egg:', egg.label);
   *   }
   * });
   * ```
   */
  readFromClipboard(clipboardData: DataTransfer): Egg | null;
}

/**
 * Singleton instance of ClipEgg, ready to use.
 * Most applications will use this instead of creating a new ClipEgg instance.
 *
 * @example
 * ```ts
 * import { clipegg } from './clipegg.js';
 *
 * clipegg.register('a.copyable', (el) => ({
 *   uri: el.href,
 *   label: el.textContent || ''
 * }));
 *
 * clipegg.onPaste((egg) => {
 *   console.log('Pasted:', egg);
 * });
 *
 * clipegg.activate();
 * ```
 */
export const clipegg: ClipEgg;

/**
 * Default export - same as the clipegg singleton instance
 */
export default clipegg;
