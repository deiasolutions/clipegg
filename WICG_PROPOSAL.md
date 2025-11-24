# ClipEgg: Reference-Based Clipboard Protocol

## Authors

- Dave Human (@daaaave-atx)

## Participate

- [GitHub Repository](https://github.com/daaaave-atx/clipegg)
- [Issue Tracker](https://github.com/daaaave-atx/clipegg/issues)
- [Full Specification](https://github.com/daaaave-atx/clipegg/blob/main/SPEC.md)

## Introduction

ClipEgg is a protocol convention for web applications that replaces payload-based clipboard operations with reference-based operations. Instead of copying complete data to the clipboard, applications copy minimal structured references ("eggs") that can be resolved on demand through authenticated endpoints.

## Motivation

### The Data Loss Prevention Gap

Current clipboard operations create an uncontrolled data export channel:

1. User copies content from a web application
2. Full payload (often megabytes) is written to system clipboard
3. Any application can read this data
4. No audit trail exists
5. No access control is possible after copy

Recent industry research indicates that copy-paste has become the primary data exfiltration vector in enterprise environments, with 77% of employees pasting corporate data into generative AI tools.

### Current Solutions Are Insufficient

- **DLP tools** monitor file transfers, email, and cloud storage — but not clipboard
- **Browser isolation** prevents some cross-context access — but not within the same session
- **Clipboard history tools** provide convenience — but increase attack surface

### The Reference-Based Alternative

ClipEgg shifts access control from copy-time to resolution-time:

| Traditional Clipboard | ClipEgg |
|-----------------------|---------|
| Full payload copied | Reference copied |
| Data leaves control at copy | Data remains controlled |
| No paste-time validation | Paste target can be validated |
| No audit trail | Complete resolution logging |
| No revocation possible | References can be revoked |

## Goals

1. **Enable paste-time access control** — Validate destination before releasing data
2. **Provide audit capability** — Log all clipboard resolution attempts
3. **Allow revocation** — Invalidate copied references after the fact
4. **Maintain compatibility** — Graceful fallback for non-egg-aware applications
5. **Require no browser changes** — Implementable with existing Clipboard APIs

## Non-Goals

1. Modify browser clipboard implementation
2. Replace standard MIME types
3. Prevent all data exfiltration (users can still screenshot, transcribe, etc.)
4. Require user-agent cooperation for basic functionality

## Technical Summary

### Egg Structure

An egg is a JSON object containing:

```json
{
  "v": 1,
  "uri": "https://app.example.com/doc/abc123",
  "label": "Q3 Financial Summary",
  "type": "document",
  "thumb": "https://app.example.com/thumb/abc123.webp",
  "hydrate": "https://api.example.com/clipboard/resolve"
}
```

### Clipboard Representation

Eggs are written to the clipboard in multiple formats:

- `application/x-clipegg+json` — Primary format
- `text/html` — With `data-clipegg` attribute for cross-browser support
- `text/plain` — Label + URI fallback
- `text/uri-list` — URI only

### Hydration Protocol

Resolution requests include context about the paste target:

```http
POST /clipboard/resolve
{
  "uri": "https://app.example.com/doc/abc123",
  "context": {
    "target_origin": "https://docs.google.com"
  }
}
```

The endpoint can:
- Validate credentials
- Check target against allowlist
- Log the resolution
- Return full content, redacted content, or deny access

## Security and Privacy Considerations

### Security Benefits

- Data remains in controlled environment until authorized release
- Paste targets can be validated before data delivery
- Complete audit trail of clipboard data movement
- References can be revoked after copy

### Privacy Considerations

- Hydration requests reveal paste behavior to origin applications
- Users should be informed that copy creates trackable references
- Fallback content (label, URI) should be treated as public

### Threat Model

ClipEgg addresses:
- Accidental paste into unauthorized targets
- Bulk exfiltration via clipboard
- Inability to audit data movement

ClipEgg does not address:
- Malicious users who intentionally transcribe content
- Screenshot-based exfiltration
- Compromised endpoints

## Alternatives Considered

### Web Custom Formats (Clipboard Pickling)

The existing Web Custom Formats proposal addresses format flexibility but not:
- Payload size reduction
- Access control
- Audit capability
- Revocation

ClipEgg can use Web Custom Formats as a transport mechanism where available.

### Browser-Level DLP

Browser vendors could implement clipboard scanning, but:
- Requires browser cooperation
- Raises privacy concerns
- Doesn't provide application-level control

### OS-Level Clipboard Monitoring

Enterprise tools can monitor clipboard access, but:
- Requires endpoint agents
- Can only observe, not prevent
- No application-level granularity

## Stakeholder Feedback

*[To be gathered]*

## Acknowledgments

*[To be added]*

## References

- [W3C Clipboard API Specification](https://www.w3.org/TR/clipboard-apis/)
- [Web Custom Formats Explainer](https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md)
- [Async Clipboard API](https://web.dev/articles/async-clipboard)
