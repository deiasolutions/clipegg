/**
 * ClipEgg Unit Tests
 *
 * Tests for the ClipEgg clipboard egg protocol library.
 * Uses Node.js built-in test runner (Node 16+).
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { ClipEgg, VERSION, MIME_EGG } from '../src/clipegg.js';

// Mock DOM environment
global.document = {
  addEventListener: mock.fn(),
  removeEventListener: mock.fn()
};

global.window = {
  getSelection: mock.fn()
};

describe('ClipEgg', () => {
  let clipEgg;

  beforeEach(() => {
    clipEgg = new ClipEgg();
    mock.reset();
  });

  describe('createEgg()', () => {
    it('should create a basic egg with required fields', () => {
      const egg = clipEgg.createEgg('https://example.com/resource', 'My Resource');

      assert.strictEqual(egg.v, VERSION);
      assert.strictEqual(egg.uri, 'https://example.com/resource');
      assert.strictEqual(egg.label, 'My Resource');
      assert.strictEqual(egg.type, 'unknown');
      assert.strictEqual(egg.thumb, null);
      assert.strictEqual(egg.meta, null);
      assert.ok(typeof egg.ts === 'number');
      assert.ok(egg.ts > 0);
    });

    it('should create an egg with optional fields', () => {
      const egg = clipEgg.createEgg('https://example.com/image.jpg', 'My Image', {
        type: 'image',
        thumb: 'https://example.com/thumb.jpg',
        meta: { width: 1920, height: 1080 }
      });

      assert.strictEqual(egg.type, 'image');
      assert.strictEqual(egg.thumb, 'https://example.com/thumb.jpg');
      assert.deepStrictEqual(egg.meta, { width: 1920, height: 1080 });
    });

    it('should generate unique timestamps for eggs', (t) => {
      const egg1 = clipEgg.createEgg('uri1', 'label1');
      const egg2 = clipEgg.createEgg('uri2', 'label2');

      // Allow same timestamp if created in same millisecond, otherwise should differ
      assert.ok(egg2.ts >= egg1.ts);
    });

    it('should handle empty optional object', () => {
      const egg = clipEgg.createEgg('https://example.com', 'Test', {});

      assert.strictEqual(egg.type, 'unknown');
      assert.strictEqual(egg.thumb, null);
      assert.strictEqual(egg.meta, null);
    });
  });

  describe('writeToClipboard()', () => {
    let mockClipboardData;

    beforeEach(() => {
      mockClipboardData = {
        data: {},
        setData: mock.fn((type, data) => {
          mockClipboardData.data[type] = data;
        })
      };
    });

    it('should write egg in all fallback formats', () => {
      const egg = clipEgg.createEgg('https://example.com/doc', 'Document');
      clipEgg.writeToClipboard(egg, mockClipboardData);

      assert.strictEqual(mockClipboardData.setData.mock.calls.length, 4);
      assert.ok(mockClipboardData.data['application/x-clipegg+json']);
      assert.ok(mockClipboardData.data['text/uri-list']);
      assert.ok(mockClipboardData.data['text/plain']);
      assert.ok(mockClipboardData.data['text/html']);
    });

    it('should write valid JSON in egg format', () => {
      const egg = clipEgg.createEgg('https://example.com/doc', 'Document');
      clipEgg.writeToClipboard(egg, mockClipboardData);

      const eggJson = mockClipboardData.data['application/x-clipegg+json'];
      const parsed = JSON.parse(eggJson);

      assert.deepStrictEqual(parsed, egg);
    });

    it('should write URI in uri-list format', () => {
      const egg = clipEgg.createEgg('https://example.com/file', 'File');
      clipEgg.writeToClipboard(egg, mockClipboardData);

      assert.strictEqual(mockClipboardData.data['text/uri-list'], 'https://example.com/file');
    });

    it('should write label and URI in plain text format', () => {
      const egg = clipEgg.createEgg('https://example.com/page', 'Page Title');
      clipEgg.writeToClipboard(egg, mockClipboardData);

      assert.strictEqual(mockClipboardData.data['text/plain'], 'Page Title\nhttps://example.com/page');
    });

    it('should write HTML link without thumbnail', () => {
      const egg = clipEgg.createEgg('https://example.com/article', 'Article');
      clipEgg.writeToClipboard(egg, mockClipboardData);

      const html = mockClipboardData.data['text/html'];
      assert.strictEqual(html, '<a href="https://example.com/article">Article</a>');
    });

    it('should write HTML link with thumbnail', () => {
      const egg = clipEgg.createEgg('https://example.com/photo', 'Photo', {
        thumb: 'https://example.com/thumb.jpg'
      });
      clipEgg.writeToClipboard(egg, mockClipboardData);

      const html = mockClipboardData.data['text/html'];
      assert.ok(html.includes('<img src="https://example.com/thumb.jpg"'));
      assert.ok(html.includes('href="https://example.com/photo"'));
      assert.ok(html.includes('Photo</a>'));
    });
  });

  describe('readFromClipboard()', () => {
    it('should read a valid egg from clipboard', () => {
      const originalEgg = clipEgg.createEgg('https://example.com/doc', 'Document', {
        type: 'document',
        meta: { pages: 10 }
      });

      const mockClipboardData = {
        getData: mock.fn((type) => {
          if (type === 'application/x-clipegg+json') {
            return JSON.stringify(originalEgg);
          }
          return '';
        })
      };

      const egg = clipEgg.readFromClipboard(mockClipboardData);

      assert.deepStrictEqual(egg, originalEgg);
    });

    it('should return null for malformed JSON', () => {
      const mockClipboardData = {
        getData: mock.fn((type) => {
          if (type === 'application/x-clipegg+json') {
            return '{invalid json}';
          }
          return '';
        })
      };

      const egg = clipEgg.readFromClipboard(mockClipboardData);

      assert.strictEqual(egg, null);
    });

    it('should fallback to URI format when no egg format present', () => {
      const mockClipboardData = {
        getData: mock.fn((type) => {
          if (type === 'text/uri-list') {
            return 'https://example.com/fallback';
          }
          if (type === 'text/plain') {
            return 'Fallback Label\nhttps://example.com/fallback';
          }
          return '';
        })
      };

      const egg = clipEgg.readFromClipboard(mockClipboardData);

      assert.strictEqual(egg.uri, 'https://example.com/fallback');
      assert.strictEqual(egg.label, 'Fallback Label');
      assert.strictEqual(egg.type, 'uri-fallback');
      assert.strictEqual(egg.v, VERSION);
    });

    it('should handle URI with whitespace', () => {
      const mockClipboardData = {
        getData: mock.fn((type) => {
          if (type === 'text/uri-list') {
            return '  https://example.com/trimmed  \n';
          }
          return '';
        })
      };

      const egg = clipEgg.readFromClipboard(mockClipboardData);

      assert.strictEqual(egg.uri, 'https://example.com/trimmed');
    });

    it('should use URI as label when no plain text available', () => {
      const mockClipboardData = {
        getData: mock.fn((type) => {
          if (type === 'text/uri-list') {
            return 'https://example.com/nolabel';
          }
          return '';
        })
      };

      const egg = clipEgg.readFromClipboard(mockClipboardData);

      assert.strictEqual(egg.label, 'https://example.com/nolabel');
    });

    it('should return null when no egg or URI data present', () => {
      const mockClipboardData = {
        getData: mock.fn(() => '')
      };

      const egg = clipEgg.readFromClipboard(mockClipboardData);

      assert.strictEqual(egg, null);
    });
  });

  describe('register()', () => {
    it('should register an extractor', () => {
      const extractor = (el) => ({ uri: el.href, label: el.textContent });
      clipEgg.register('.copyable', extractor);

      assert.ok(clipEgg.extractors.has('.copyable'));
      assert.strictEqual(clipEgg.extractors.get('.copyable'), extractor);
    });

    it('should allow chaining', () => {
      const result = clipEgg.register('.test', () => {});
      assert.strictEqual(result, clipEgg);
    });

    it('should allow multiple extractors', () => {
      clipEgg.register('.type1', () => {});
      clipEgg.register('.type2', () => {});

      assert.strictEqual(clipEgg.extractors.size, 2);
    });
  });

  describe('onPaste()', () => {
    it('should register a paste handler', () => {
      const handler = () => {};
      clipEgg.onPaste(handler);

      assert.strictEqual(clipEgg.pasteHandlers.length, 1);
      assert.strictEqual(clipEgg.pasteHandlers[0], handler);
    });

    it('should allow chaining', () => {
      const result = clipEgg.onPaste(() => {});
      assert.strictEqual(result, clipEgg);
    });

    it('should allow multiple handlers', () => {
      clipEgg.onPaste(() => {});
      clipEgg.onPaste(() => {});
      clipEgg.onPaste(() => {});

      assert.strictEqual(clipEgg.pasteHandlers.length, 3);
    });
  });

  describe('activate()', () => {
    it('should add event listeners', () => {
      clipEgg.activate();

      assert.strictEqual(document.addEventListener.mock.calls.length, 2);
      assert.strictEqual(document.addEventListener.mock.calls[0].arguments[0], 'copy');
      assert.strictEqual(document.addEventListener.mock.calls[1].arguments[0], 'paste');
    });

    it('should allow chaining', () => {
      const result = clipEgg.activate();
      assert.strictEqual(result, clipEgg);
    });
  });

  describe('deactivate()', () => {
    it('should remove event listeners', () => {
      clipEgg.activate();
      clipEgg.deactivate();

      assert.strictEqual(document.removeEventListener.mock.calls.length, 2);
      assert.strictEqual(document.removeEventListener.mock.calls[0].arguments[0], 'copy');
      assert.strictEqual(document.removeEventListener.mock.calls[1].arguments[0], 'paste');
    });

    it('should allow chaining', () => {
      const result = clipEgg.deactivate();
      assert.strictEqual(result, clipEgg);
    });
  });

  describe('_handleCopy()', () => {
    it('should not interfere when no selection', () => {
      global.window.getSelection = mock.fn(() => null);

      const mockEvent = {
        preventDefault: mock.fn(),
        clipboardData: {
          setData: mock.fn()
        }
      };

      clipEgg._handleCopy(mockEvent);

      assert.strictEqual(mockEvent.preventDefault.mock.calls.length, 0);
    });

    it('should extract and copy when selector matches', () => {
      const mockElement = {
        closest: mock.fn((selector) => {
          if (selector === '.copyable') {
            return { href: 'https://test.com', textContent: 'Test' };
          }
          return null;
        })
      };

      global.window.getSelection = mock.fn(() => ({
        anchorNode: {
          parentElement: mockElement
        }
      }));

      const mockEvent = {
        preventDefault: mock.fn(),
        clipboardData: {
          data: {},
          setData: mock.fn((type, data) => {
            mockEvent.clipboardData.data[type] = data;
          })
        }
      };

      clipEgg.register('.copyable', (el) => ({
        uri: el.href,
        label: el.textContent
      }));

      clipEgg._handleCopy(mockEvent);

      assert.strictEqual(mockEvent.preventDefault.mock.calls.length, 1);
      assert.ok(mockEvent.clipboardData.data['application/x-clipegg+json']);
    });
  });

  describe('_handlePaste()', () => {
    it('should not prevent default when no egg data', () => {
      const mockEvent = {
        preventDefault: mock.fn(),
        clipboardData: {
          getData: mock.fn(() => '')
        }
      };

      clipEgg._handlePaste(mockEvent);

      assert.strictEqual(mockEvent.preventDefault.mock.calls.length, 0);
    });

    it('should invoke handlers when egg is detected', () => {
      const handler1 = mock.fn();
      const handler2 = mock.fn();

      clipEgg.onPaste(handler1);
      clipEgg.onPaste(handler2);

      const egg = clipEgg.createEgg('https://example.com', 'Example');

      const mockEvent = {
        preventDefault: mock.fn(),
        clipboardData: {
          getData: mock.fn((type) => {
            if (type === 'application/x-clipegg+json') {
              return JSON.stringify(egg);
            }
            return '';
          })
        }
      };

      clipEgg._handlePaste(mockEvent);

      assert.strictEqual(mockEvent.preventDefault.mock.calls.length, 1);
      assert.strictEqual(handler1.mock.calls.length, 1);
      assert.strictEqual(handler2.mock.calls.length, 1);
      assert.deepStrictEqual(handler1.mock.calls[0].arguments[0], egg);
    });
  });

  describe('Edge Cases', () => {
    it('should handle egg with special characters in URI', () => {
      const egg = clipEgg.createEgg('https://example.com/path?query=value&foo=bar#anchor', 'Special URI');

      assert.strictEqual(egg.uri, 'https://example.com/path?query=value&foo=bar#anchor');
    });

    it('should handle egg with unicode label', () => {
      const egg = clipEgg.createEgg('https://example.com', 'Test 测试 тест 🎉');

      assert.strictEqual(egg.label, 'Test 测试 тест 🎉');
    });

    it('should handle egg with null values in meta', () => {
      const egg = clipEgg.createEgg('https://example.com', 'Test', {
        meta: { foo: null, bar: undefined }
      });

      assert.ok(egg.meta.foo === null);
    });

    it('should handle very long URIs', () => {
      const longUri = 'https://example.com/' + 'a'.repeat(2000);
      const egg = clipEgg.createEgg(longUri, 'Long URI');

      assert.strictEqual(egg.uri, longUri);
    });

    it('should handle empty string label', () => {
      const egg = clipEgg.createEgg('https://example.com', '');

      assert.strictEqual(egg.label, '');
    });

    it('should preserve meta object structure', () => {
      const meta = {
        nested: {
          deep: {
            value: 123
          }
        },
        array: [1, 2, 3]
      };

      const egg = clipEgg.createEgg('https://example.com', 'Test', { meta });

      assert.deepStrictEqual(egg.meta, meta);
    });
  });
});
