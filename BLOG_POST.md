# ClipEgg: Why Your Clipboard is a Security Hole (And How to Fix It)

*November 2025*

---

## The Problem Nobody's Talking About

Every time you copy something from a web application, you're creating an untracked, uncontrolled data export.

That "Q3 Financial Summary" you just copied? It's now sitting in your system clipboard — a buffer that any application on your machine can read. Paste it into ChatGPT, a personal email, or a competitor's tool, and the data has left your organization's control completely.

This isn't theoretical. According to recent research, **77% of employees paste corporate data into AI prompts**, and copy-paste has surpassed file transfers as the primary data exfiltration vector in enterprise environments.

Your DLP tools are watching your file uploads, your email attachments, your cloud storage. But they're blind to the clipboard.

---

## How Clipboard Works Today

When you copy a document, image, or structured object from a web application, here's what actually happens:

1. **Full payload extraction** — The complete content is serialized
2. **Multi-format duplication** — The same data is written in multiple formats (HTML, plain text, images)
3. **System buffer storage** — Everything lands in OS-controlled memory
4. **Zero access control** — Any application can read it
5. **No audit trail** — The copy operation is invisible to security tools

The data has already left the building. Paste-time controls are too late.

---

## The Reference-Based Alternative

What if copy didn't extract data at all?

**ClipEgg** is a simple protocol that changes the fundamental model:

- **Copy** writes a *reference* to the clipboard — a tiny descriptor (~200 bytes) containing an identifier, a label, and metadata
- **Paste** *resolves* that reference through an authenticated endpoint
- **Access control** happens at resolution time, not copy time
- **Every resolution is logged** — who, what, when, where

The data never leaves your control until you explicitly authorize it.

---

## What This Enables

### 1. Paste-Target Validation

Your hydration endpoint can check where the paste is happening:

```
POST /resolve
{
  "uri": "internal://doc/q3-financials",
  "context": {
    "target_origin": "https://chat.openai.com"
  }
}

Response: 403 Forbidden
```

Copy all you want. If the destination isn't approved, they get nothing but a label.

### 2. Time-Limited Access

References can expire:

```json
{
  "uri": "internal://doc/q3-financials",
  "expires": "2025-11-24T17:00:00Z"
}
```

That clipboard content becomes useless after the meeting ends.

### 3. Revocation

User copied something they shouldn't have? Revoke the reference:

```
DELETE /clipboard-grants/abc123
```

Even if it's still on their clipboard, resolution will return 410 Gone.

### 4. Complete Audit Trail

Every successful (and failed) resolution attempt is logged:

```json
{
  "event": "clipboard_resolve",
  "resource": "doc/q3-financials",
  "user": "jane@company.com",
  "source_app": "internal-docs.company.com",
  "target_app": "slides.google.com",
  "status": "granted",
  "timestamp": "2025-11-24T14:32:01Z"
}
```

For the first time, you can see exactly how clipboard data moves through your organization.

### 5. Context-Aware Content

Return different content based on destination:

- Paste into approved internal app → full document
- Paste into personal email → redacted summary
- Paste into unknown target → title only

---

## The Graceful Degradation Story

ClipEgg doesn't break existing workflows. When someone pastes into a non-egg-aware application, they get sensible fallbacks:

- **Plain text editors**: Document title + link
- **Rich text editors**: Clickable link, optionally with thumbnail
- **Native apps**: Same as above

Users can still navigate to the resource manually. But the *data* doesn't leak automatically.

---

## Implementation

ClipEgg is a convention, not a platform change. It works with existing Clipboard APIs:

```javascript
// On copy
document.addEventListener('copy', (e) => {
  e.preventDefault();
  
  const egg = {
    v: 1,
    uri: 'https://app.example.com/doc/abc123',
    label: 'Q3 Financial Summary',
    type: 'document'
  };
  
  e.clipboardData.setData('text/plain', `${egg.label}\n${egg.uri}`);
  e.clipboardData.setData('application/x-clipegg+json', JSON.stringify(egg));
});
```

50 lines of JavaScript. No browser extensions. No OS modifications.

---

## Who Should Care

- **Enterprise security teams** — Finally, visibility into clipboard data flows
- **SaaS application developers** — Differentiate on data protection
- **Compliance officers** — Auditable copy operations for regulated industries
- **Anyone building AI-adjacent tools** — Control what enters the context window

---

## The Spec

ClipEgg is open. The full specification covers:

- Egg schema and versioning
- Clipboard MIME type handling
- Hydration protocol
- Security and privacy considerations
- Browser compatibility matrix

**Repository**: [github.com/daaaave-atx/clipegg](https://github.com/daaaave-atx/clipegg)

---

## What's Next

This is a draft specification. I'm publishing it now because:

1. The problem is urgent — AI tools have made clipboard exfiltration ubiquitous
2. The solution is simple — no new browser APIs required
3. Someone needs to start the conversation

If you're building enterprise software, security tools, or dealing with data loss prevention, I'd love to hear from you.

If you're on a browser standards team, let's talk about making this a first-class pattern.

The clipboard has been a security blind spot for 30 years. It's time to fix it.

---

*Dave Human*
*November 2025*

---

*ClipEgg is released under MIT (implementation) and CC BY 4.0 (specification).*
