# ClipEgg Specification

**Version:** 0.1.0-draft  
**Status:** Draft  
**Author:** Dave Human
**Date:** November 2025
**Repository:** https://github.com/daaaave-atx/clipegg

---

## Abstract

ClipEgg defines a reference-based clipboard protocol for web applications. Instead of copying data payloads to the system clipboard, ClipEgg copies minimal structured references ("eggs") that can be resolved on demand by authorized recipients. This approach reduces clipboard payload size by orders of magnitude, enables copy-time access control, and provides complete auditability of data movement across application boundaries.

---

## 1. Introduction

### 1.1 Problem Statement

Current clipboard implementations copy complete data representations at copy time. When a user copies a document, image, or structured object from a web application, the clipboard receives:

- Full content payloads (often megabytes)
- Embedded assets and formatting
- Metadata and styling information
- Redundant multi-format representations

This creates several problems:

1. **Performance degradation** — Large payloads consume memory and slow cross-application data transfer
2. **Data loss prevention failure** — Sensitive data leaves controlled environments at copy time, before any paste-time controls can apply
3. **No auditability** — Once data is on the clipboard, its movement is untracked
4. **No revocability** — Copied data cannot be invalidated after the copy operation

### 1.2 Proposed Solution

ClipEgg introduces a reference-based model where:

- **Copy** writes a minimal descriptor (an "egg") containing identity and metadata
- **Paste** resolves the reference through an authenticated hydration endpoint
- **Access control** is enforced at resolution time, not copy time
- **Audit logs** capture who resolved what, when, and from which application context

### 1.3 Design Goals

1. **Minimal payload** — Eggs should be <1KB regardless of source content size
2. **Graceful degradation** — Non-egg-aware paste targets receive usable fallbacks
3. **Security by default** — References without valid auth resolve to fallback only
4. **Zero dependencies** — Implementable with standard Clipboard APIs
5. **Interoperability** — Multiple applications can exchange eggs via shared schema

---

## 2. Terminology

**Egg**: A minimal structured reference placed on the clipboard, containing sufficient information to identify and optionally resolve the source resource.

**Hydration**: The process of resolving an egg reference to retrieve full content from an authorized endpoint.

**Fallback**: Plain text or minimal HTML representation included in the egg for paste targets that do not support egg resolution.

**Origin Application**: The web application that creates and writes the egg during a copy operation.

**Target Application**: The application or context receiving the paste operation.

---

## 3. Egg Schema

### 3.1 Structure

An egg is a JSON object with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `v` | integer | yes | Schema version (currently `1`) |
| `uri` | string | yes | Canonical URI identifying the resource |
| `label` | string | yes | Human-readable name (used in fallbacks) |
| `type` | string | no | Resource type hint (e.g., `document`, `product`, `user`) |
| `thumb` | string | no | URI to lightweight thumbnail (<10KB recommended) |
| `meta` | object | no | Arbitrary metadata for application-specific use |
| `ts` | integer | no | Unix timestamp of copy operation (milliseconds) |
| `origin` | string | no | Origin domain of the copy operation |
| `hydrate` | string | no | Explicit hydration endpoint if different from `uri` |
| `auth` | string | no | Auth hint (e.g., `bearer`, `cookie`, `none`) |

### 3.2 Example

```json
{
  "v": 1,
  "uri": "https://app.example.com/doc/a1b2c3d4",
  "label": "Q3 Financial Summary",
  "type": "document",
  "thumb": "https://app.example.com/thumb/a1b2c3d4.webp",
  "meta": {
    "author": "Jane Smith",
    "modified": "2025-11-20T14:30:00Z"
  },
  "ts": 1732456789000,
  "origin": "app.example.com",
  "hydrate": "https://api.example.com/v1/clipboard/resolve",
  "auth": "bearer"
}
```

### 3.3 Size Constraints

Eggs SHOULD NOT exceed 1024 bytes when serialized as JSON. This ensures clipboard operations remain lightweight regardless of source content size.

---

## 4. Clipboard Representation

### 4.1 MIME Types

When writing an egg to the clipboard, implementations MUST provide multiple representations for compatibility:

| MIME Type | Content | Purpose |
|-----------|---------|---------|
| `application/x-clipegg+json` | Full egg JSON | Primary format for egg-aware recipients |
| `web application/x-clipegg+json` | Full egg JSON | Web Custom Format for Chromium 104+ |
| `text/uri-list` | Egg `uri` field | URI-aware applications |
| `text/plain` | `{label}\n{uri}` | Universal fallback |
| `text/html` | Minimal anchor element | Rich text editors |

### 4.2 HTML Fallback Format

The HTML representation SHOULD be a minimal anchor element:

```html
<a href="{uri}" data-clipegg="{base64-encoded-egg}">{label}</a>
```

Optionally, a thumbnail may be included:

```html
<a href="{uri}" data-clipegg="{base64-encoded-egg}">
  <img src="{thumb}" alt="" style="max-width:64px;max-height:64px;vertical-align:middle;margin-right:8px;">
  {label}
</a>
```

The `data-clipegg` attribute enables egg-aware applications to extract the full egg from HTML clipboard content.

### 4.3 Write Operation

```javascript
async function writeEgg(egg) {
  const json = JSON.stringify(egg);
  const base64 = btoa(json);
  
  const html = `<a href="${egg.uri}" data-clipegg="${base64}">${egg.label}</a>`;
  const plain = `${egg.label}\n${egg.uri}`;
  
  const clipboardItem = new ClipboardItem({
    'application/x-clipegg+json': new Blob([json], { type: 'application/x-clipegg+json' }),
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([plain], { type: 'text/plain' }),
  });
  
  await navigator.clipboard.write([clipboardItem]);
}
```

### 4.4 Read Operation

Implementations SHOULD attempt to read egg data in the following priority order:

1. `application/x-clipegg+json` — Direct egg format
2. `web application/x-clipegg+json` — Web Custom Format
3. `text/html` with `data-clipegg` attribute — Embedded egg
4. `text/uri-list` — Construct minimal egg from URI

```javascript
async function readEgg() {
  const items = await navigator.clipboard.read();
  
  for (const item of items) {
    // Try direct egg format
    if (item.types.includes('application/x-clipegg+json')) {
      const blob = await item.getType('application/x-clipegg+json');
      return JSON.parse(await blob.text());
    }
    
    // Try HTML with embedded egg
    if (item.types.includes('text/html')) {
      const blob = await item.getType('text/html');
      const html = await blob.text();
      const match = html.match(/data-clipegg="([^"]+)"/);
      if (match) {
        return JSON.parse(atob(match[1]));
      }
    }
  }
  
  return null; // No egg found
}
```

---

## 5. Hydration Protocol

### 5.1 Overview

Hydration is the process by which a target application resolves an egg reference to retrieve full content. Hydration is OPTIONAL — applications MAY use the egg metadata directly without resolution.

### 5.2 Endpoint Discovery

The hydration endpoint is determined by:

1. Explicit `hydrate` field in egg (if present)
2. Well-known path: `{uri.origin}/.well-known/clipegg/resolve`
3. Direct GET request to `uri`

### 5.3 Request Format

```http
POST /.well-known/clipegg/resolve HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "uri": "https://app.example.com/doc/a1b2c3d4",
  "accept": ["application/json", "text/html", "image/png"],
  "context": {
    "target_origin": "https://recipient-app.com",
    "purpose": "paste"
  }
}
```

### 5.4 Response Format

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "content_type": "application/json",
  "content": { ... },
  "expires": "2025-11-24T12:00:00Z",
  "audit_id": "evt_abc123"
}
```

### 5.5 Access Control

The hydration endpoint SHOULD:

1. Validate authentication credentials
2. Check authorization for the requested resource
3. Optionally validate `target_origin` against an allowlist
4. Log the resolution for audit purposes
5. Return appropriate error codes for unauthorized requests

### 5.6 Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Authentication required |
| 403 | Access denied for this resource |
| 404 | Resource not found or deleted |
| 410 | Resource has been revoked |
| 451 | Resource unavailable for legal reasons |

---

## 6. Security Considerations

### 6.1 Data Loss Prevention

ClipEgg fundamentally changes the data loss prevention model:

- **Traditional clipboard**: Data leaves controlled environment at copy time
- **ClipEgg**: Only references leave; data remains protected until authorized resolution

This enables:

- **Paste-target validation** — Refuse hydration for unauthorized destinations
- **Time-limited access** — References can expire
- **Revocation** — Access can be revoked after copy
- **Content transformation** — Return redacted content based on destination

### 6.2 Audit Trail

Every hydration request provides an audit opportunity:

- Who copied (from origin application auth context)
- What was copied (resource URI)
- When it was pasted (hydration request timestamp)
- Where it was pasted (target_origin in request)
- Whether access was granted (response status)

### 6.3 Fallback Data Leakage

The `label` and `thumb` fields in fallbacks may leak information. Implementations SHOULD:

- Use generic labels for sensitive content (e.g., "Confidential Document")
- Omit thumbnails for sensitive content
- Consider the fallback content as public information

### 6.4 URI Privacy

The `uri` field is included in plaintext fallbacks. Implementations SHOULD:

- Use opaque identifiers rather than human-readable paths
- Avoid embedding sensitive information in URIs
- Consider that URIs will be visible in non-egg-aware contexts

### 6.5 HTTPS Requirement

All URIs in eggs MUST use HTTPS. Hydration endpoints MUST be served over HTTPS.

---

## 7. Privacy Considerations

### 7.1 Hydration Tracking

Hydration requests reveal paste behavior to origin applications. Users should be aware that:

- Origin applications can see when and where content is pasted
- This creates a data flow record not present in traditional clipboard

### 7.2 Fingerprinting

Egg metadata should not include information that could fingerprint users across applications.

### 7.3 Consent

Applications implementing ClipEgg SHOULD inform users that copy operations create trackable references rather than copying data directly.

---

## 8. Implementation Notes

### 8.1 Browser Compatibility

| Browser | application/x-clipegg+json | web prefix format | data-clipegg in HTML |
|---------|---------------------------|-------------------|---------------------|
| Chrome 104+ | Limited | Yes | Yes |
| Safari | No | No | Yes |
| Firefox | No | No | Yes |

The HTML `data-clipegg` attribute approach provides maximum compatibility across browsers.

### 8.2 Native Application Support

Native applications can support ClipEgg by:

1. Reading HTML clipboard content
2. Parsing the `data-clipegg` attribute
3. Implementing hydration client logic

### 8.3 Graceful Degradation

When pasting into non-egg-aware applications:

- Plain text editors receive: `{label}\n{uri}`
- Rich text editors receive: clickable link with optional thumbnail
- Users can manually navigate to the URI

---

## 9. IANA Considerations

This specification registers the following MIME type:

- **Type name**: application
- **Subtype name**: x-clipegg+json
- **Required parameters**: None
- **Optional parameters**: None
- **Encoding considerations**: UTF-8
- **Security considerations**: See Section 6
- **Interoperability considerations**: See Section 8

---

## 10. References

### 10.1 Normative References

- [RFC 2119] Key words for use in RFCs to Indicate Requirement Levels
- [RFC 3986] Uniform Resource Identifier (URI): Generic Syntax
- [RFC 8259] The JavaScript Object Notation (JSON) Data Interchange Format
- [W3C Clipboard API] https://www.w3.org/TR/clipboard-apis/

### 10.2 Informative References

- [Web Custom Formats] https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md
- [Async Clipboard API] https://web.dev/articles/async-clipboard

---

## 11. Acknowledgments

[To be added]

---

## Appendix A: Full Implementation Reference

See `src/clipegg.js` in the reference implementation repository.

---

## Appendix B: Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0-draft | November 2025 | Initial draft |

---

## Author's Address

Dave Human
daaaave-atx@users.noreply.github.com
https://github.com/daaaave-atx  

---

*This specification is released under CC BY 4.0.*
