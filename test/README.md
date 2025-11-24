# ClipEgg Test Suite

Comprehensive unit tests for the ClipEgg clipboard egg protocol library.

## Overview

The test suite covers all public API methods and internal functionality of ClipEgg:

- **createEgg()** - Creating egg objects with various configurations
- **writeToClipboard()** - Serializing eggs to multiple clipboard formats
- **readFromClipboard()** - Parsing eggs from clipboard data with fallbacks
- **register()** - Registering element extractors
- **onPaste()** - Registering paste handlers
- **activate() / deactivate()** - Event listener management
- **Edge cases** - Unicode, special characters, long URIs, empty values

## Test Framework

Tests use **Node.js built-in test runner** (available in Node 16.17+, Node 18+).

No external dependencies required.

## Running Tests

### Run all tests once

```bash
npm test
```

### Run tests in watch mode

Tests will automatically re-run when files change:

```bash
npm run test:watch
```

### Run tests directly with Node

```bash
node --test test/*.test.js
```

## Test Structure

The test suite is organized into the following sections:

### 1. createEgg()
- Basic egg creation with required fields
- Eggs with optional fields (type, thumb, meta)
- Timestamp generation
- Default value handling

### 2. writeToClipboard()
- Writing to all fallback formats (JSON, URI, plain text, HTML)
- JSON serialization correctness
- HTML generation with and without thumbnails
- Format compliance

### 3. readFromClipboard()
- Reading structured egg data
- Malformed JSON handling
- URI fallback mode
- Whitespace trimming
- Missing data scenarios

### 4. register()
- Extractor registration
- Method chaining
- Multiple extractors

### 5. onPaste()
- Handler registration
- Method chaining
- Multiple handlers

### 6. activate() / deactivate()
- Event listener attachment/removal
- Method chaining

### 7. _handleCopy() / _handlePaste()
- Internal copy event handling
- Internal paste event handling
- Handler invocation
- Event prevention logic

### 8. Edge Cases
- Special characters in URIs
- Unicode labels
- Null/undefined values
- Very long URIs (2000+ characters)
- Empty strings
- Nested meta objects
- Arrays in meta data

## Test Coverage

The test suite includes:

- **50+ test cases** covering all API surface area
- **Edge case testing** for robustness
- **Error handling validation**
- **Mock DOM environment** for browser-specific code
- **Format compliance** for all clipboard MIME types

## Expected Output

When all tests pass:

```
✔ ClipEgg > createEgg() > should create a basic egg with required fields (Xms)
✔ ClipEgg > createEgg() > should create an egg with optional fields (Xms)
✔ ClipEgg > writeToClipboard() > should write egg in all fallback formats (Xms)
...
✔ ClipEgg > Edge Cases > should preserve meta object structure (Xms)

tests 50
pass 50
fail 0
```

## Requirements

- **Node.js 16.17+** or **Node.js 18+** (for built-in test runner)
- No external test dependencies

## Continuous Integration

To integrate with CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run tests
  run: npm test
```

The test command returns exit code 0 on success, non-zero on failure.

## Writing New Tests

To add new tests:

1. Open `test/clipegg.test.js`
2. Add new test cases within appropriate `describe()` blocks
3. Use `it()` for individual test cases
4. Use `assert` module for assertions
5. Follow existing patterns for mocking clipboard/DOM APIs

Example:

```javascript
it('should handle new scenario', () => {
  const result = clipEgg.someMethod();
  assert.strictEqual(result, expectedValue);
});
```

## Troubleshooting

### "Cannot find module" error

Make sure you're running from the project root:

```bash
cd /path/to/clipegg
npm test
```

### Node version too old

Upgrade to Node 18+ for full test runner support:

```bash
node --version  # Should be 18.0.0 or higher
```

### Tests fail on Windows

Tests are compatible with Windows, macOS, and Linux. File paths are handled correctly across platforms.

## License

Tests are part of the ClipEgg project and use the same MIT license.
