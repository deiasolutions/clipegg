# ClipEgg - Claude Code Handoff

## What This Is

ClipEgg is a reference-based clipboard protocol. Instead of copying full data payloads to the clipboard, web apps copy minimal references ("eggs") that get resolved on demand through authenticated endpoints.

**Core insight:** The clipboard is an uncontrolled data exfiltration channel. 77% of employees paste corporate data into AI tools. ClipEgg shifts access control from copy-time to paste-time, enabling DLP, audit trails, and revocation.

## Project Status

**Complete:**
- Core JS library (`src/clipegg.js`) - ~120 lines, zero dependencies
- Working demo (`demo.html`)
- NPM package structure (`package.json`, `rollup.config.js`)
- Formal specification (`SPEC.md`)
- Blog post draft (`BLOG_POST.md`)
- WICG proposal template (`WICG_PROPOSAL.md`)
- MIT License under Annelise Corporation

**Not yet done:**
- ~~Personal details not filled in~~ COMPLETED
- Not pushed to GitHub
- Not published anywhere

## File Structure

```
clipegg/
├── src/
│   └── clipegg.js      # Core library - copy intercept, egg serialization
├── demo.html           # Browser demo showing copy/paste with eggs
├── package.json        # NPM package config
├── rollup.config.js    # Build config for CJS output
├── README.md           # Developer-facing quick start
├── SPEC.md             # Formal specification (IETF-style)
├── BLOG_POST.md        # Security-focused pitch for HN/LinkedIn
├── WICG_PROPOSAL.md    # Web Incubator submission template
└── LICENSE             # MIT, Annelise Corporation
```

## Next Steps (In Order)

### 1. Fill in personal details

~~Find and replace in all `.md` files:~~
- ~~`[LastName]` → Dave's last name~~ DONE: Dave Human
- ~~`[your-handle]` → GitHub username~~ DONE: daaaave-atx
- ~~`[Email]` → Contact email~~ DONE: daaaave-atx@users.noreply.github.com

### 2. Initialize git and push to GitHub

```bash
cd clipegg
git init
git add .
git commit -m "ClipEgg v0.1.0-draft: Reference-based clipboard protocol"
git branch -M main
git remote add origin https://github.com/USERNAME/clipegg.git
git push -u origin main
```

### 3. Post to Hacker News

- Title: `Show HN: ClipEgg – Your clipboard is a security hole`
- URL: Link to GitHub repo
- Or post the blog content as a text post

### 4. Optional: WICG submission

- Go to https://discourse.wicg.io/c/proposals/7
- Create new topic with content from `WICG_PROPOSAL.md`
- This is informal - just a discussion forum for web standards folks

### 5. Optional: Blog post

- Publish `BLOG_POST.md` to Medium, dev.to, or personal site
- Cross-post to LinkedIn

## Technical Context

### How it works

1. **Copy intercept:** Web app listens for `copy` event, calls `preventDefault()`
2. **Egg creation:** Serialize minimal reference: `{ uri, label, type, thumb }`
3. **Multi-format write:** Write to clipboard as:
   - `application/x-clipegg+json` (primary)
   - `text/html` with `data-clipegg` attribute (cross-browser fallback)
   - `text/plain` (universal fallback)
   - `text/uri-list` (URI-aware apps)
4. **Paste detection:** Check for egg format, extract and parse
5. **Hydration (optional):** Resolve reference through authenticated endpoint

### Egg schema

```json
{
  "v": 1,
  "uri": "https://app.example.com/doc/abc123",
  "label": "Q3 Financial Summary",
  "type": "document",
  "thumb": "https://app.example.com/thumb/abc123.webp",
  "ts": 1732456789000,
  "origin": "app.example.com",
  "hydrate": "https://api.example.com/clipboard/resolve",
  "auth": "bearer"
}
```

### Security value proposition

| Traditional | ClipEgg |
|-------------|---------|
| Data copied at copy-time | Reference copied |
| No paste-target validation | Endpoint can validate destination |
| No audit trail | Every resolution logged |
| No revocation | References can be invalidated |
| DLP blind spot | Full visibility |

## Related Work

- **Web Custom Formats** (Chromium 104+): Allows arbitrary MIME types but doesn't address payload size, access control, or audit
- **Figma's approach:** Base64-encodes proprietary format into HTML `data-buffer` attribute - clever hack but still full payloads
- **Nobody** is working on reference-based clipboard or clipboard DLP at the protocol level

## Connection to iDea

ClipEgg is an "egg" in the iDea model sense:
- Minimal self-contained unit
- Carries identity, not payload
- Lazy materialization on demand
- Context-aware hydration

The clipboard becomes a message bus for eggs, not a cargo hold for payloads.

## Business Angles (if relevant later)

1. **Open spec, paid enterprise tooling** - ClipEgg Enterprise with analytics, DLP integration, compliance dashboards
2. **Acquisition target** - Pattern fits into Microsoft/Google security stack
3. **Public good** - Release everything, get recognition, let it compound

Current plan: Open spec, get recognition.

## Questions Claude Code Might Have

**Q: Should I modify clipegg.js?**
A: Only if Dave asks. Current implementation is complete for MVP.

**Q: What about tests?**
A: Not written yet. Would be good to add if Dave wants to harden before publish.

**Q: TypeScript?**
A: Not currently. Dave prefers Python and doesn't use type hints. Keep it simple JS.

**Q: What's the priority?**
A: Get it public with Dave's name on it. Timestamp matters. Polish can come later.
