# 🥚 ClipEgg

[![npm version](https://img.shields.io/npm/v/clipegg.svg)](https://www.npmjs.com/package/clipegg)
[![npm downloads](https://img.shields.io/npm/dm/clipegg.svg)](https://www.npmjs.com/package/clipegg)
[![license](https://img.shields.io/npm/l/clipegg.svg)](https://github.com/deiasolutions/clipegg/blob/master/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/clipegg)](https://bundlephobia.com/package/clipegg)

**Copy references, not payloads.**

---

## The Problem

Every time you copy something from a web app, your clipboard gets stuffed with:
- Full resolution images
- Inline CSS styling
- Nested HTML DOM trees
- Metadata nobody asked for

You wanted to share "Product X". You got 6MB of garbage.

## The Solution

ClipEgg intercepts copy operations and writes a minimal **egg** to the clipboard:

```json
{
  "v": 1,
  "uri": "https://app.com/item/12345",
  "label": "Product X",
  "type": "product",
  "thumb": "https://app.com/thumb/12345.webp"
}
```

That's it. ~200 bytes. The receiver hydrates on demand.

---

## Quick Start

```javascript
import clipegg from 'clipegg';

// Register copyable elements
clipegg.register('.product-card', (el) => ({
  uri: el.dataset.href,
  label: el.dataset.name,
  type: 'product',
  thumb: el.dataset.thumbnail
}));

// Handle incoming eggs
clipegg.onPaste((egg) => {
  console.log('Received:', egg.label, egg.uri);
  // Hydrate as needed
});

// Activate
clipegg.activate();
```

Done.

---

## Egg Schema

| Field | Required | Description |
|-------|----------|-------------|
| `v` | yes | Schema version (currently `1`) |
| `uri` | yes | Canonical reference to the resource |
| `label` | yes | Human-readable fallback text |
| `type` | no | Resource type hint (`product`, `document`, `user`, etc.) |
| `thumb` | no | URL to lightweight thumbnail |
| `meta` | no | Arbitrary metadata object |
| `ts` | auto | Timestamp of copy operation |

---

## Clipboard Formats Written

ClipEgg writes multiple formats for maximum compatibility:

| MIME Type | Content |
|-----------|---------|
| `application/x-clipegg+json` | Full egg JSON |
| `text/uri-list` | Just the URI |
| `text/plain` | Label + URI |
| `text/html` | Minimal `<a>` tag with optional thumbnail |

Paste targets that understand eggs get structured data. Everything else gets sensible fallbacks.

---

## API

### `clipegg.register(selector, extractor)`

Register a CSS selector and extraction function.

```javascript
clipegg.register('.my-element', (el) => ({
  uri: el.href,
  label: el.textContent,
  type: 'link'
}));
```

### `clipegg.onPaste(handler)`

Register a paste handler.

```javascript
clipegg.onPaste((egg, event) => {
  // egg = { v, uri, label, type, thumb, meta, ts }
});
```

### `clipegg.activate()` / `clipegg.deactivate()`

Start/stop clipboard interception.

### `clipegg.createEgg(uri, label, opts)`

Manually create an egg object.

### `clipegg.writeToClipboard(egg, clipboardData)`

Write egg to a ClipboardEvent's clipboardData.

### `clipegg.readFromClipboard(clipboardData)`

Parse egg from clipboardData, with fallback detection.

---

## Why "Egg"?

An egg is:
- **Minimal** — just enough to identify what it will become
- **Self-contained** — carries its own reference
- **Lazy** — doesn't materialize until needed

The clipboard carries potential, not payload.

---

## The Bigger Picture

This is the same pattern used in:
- **Agent coordination** — pass task references, not full context
- **API design** — return IDs, let clients fetch details
- **Database normalization** — store references, join on demand

ClipEgg brings that pattern to the user's clipboard.

---

## License

MIT — Annelise Corporation

---

*"The world's clipboards hold an estimated 2.3 exabytes of `font-family: Calibri` declarations at any given moment."*
