# neamtime-log-parser Development Plan

## Overview

neamtime-log-parser is a TypeScript library for parsing timestamped markdown time logs into structured data. It handles a specific format of time tracking where work sessions are documented with timestamps, making them machine-parseable for reporting and analysis.

**Current Status:** v0.4.0 - Local package with pending changes, not yet published to npm

---

## Next Release: v0.5.0 - NPM Publishing & Recent Improvements

**Target: Q4 2025**

This release includes pending improvements to the parser plus proper npm publishing setup.

### 1. Licensing & Legal

**Current State:** UNLICENSED (not suitable for npm)

**Required Changes:**
- Choose appropriate open source license (MIT recommended for max compatibility)
- Add LICENSE file to repository root
- Update package.json `license` field
- Add copyright notice to source files

### 2. NPM Publishing Setup

**Current State:** Configured for local registry (localhost:4873)

**Required Changes:**
```json
// package.json changes:
{
  "license": "MIT",  // Update from "UNLICENSED"
  "publishConfig": {
    "access": "public"  // Change from local registry
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/[org]/neamtime-log-parser.git"
  },
  "bugs": {
    "url": "https://github.com/[org]/neamtime-log-parser/issues"
  },
  "homepage": "https://github.com/[org]/neamtime-log-parser#readme"
}
```

**Publishing Checklist:**
- [ ] Set up npm organization account (if not using personal)
- [ ] Create GitHub repository
- [ ] Add README.md with installation and usage docs
- [ ] Add CHANGELOG.md for version history
- [ ] Set up CI/CD for automated publishing
- [ ] Run `npm publish --dry-run` to test
- [ ] Publish v0.5.0 to npm

### 3. Documentation

**Required Documentation:**
- **README.md**: Installation, quick start, API overview
- **API.md**: Detailed API reference with TypeScript types
- **EXAMPLES.md**: Common usage patterns and recipes
- **CONTRIBUTING.md**: Development setup, testing, PR guidelines
- **CHANGELOG.md**: Version history from v0.1.0 onwards

**Key API Documentation:**
```typescript
// Core parser interface
interface TimeLogParser {
  parseFile(filePath: string): ParsedSession[];
  parseString(content: string): ParsedSession[];
  configure(options: ParserOptions): void;
}

// Parsed session structure
interface ParsedSession {
  startTime: Date;
  endTime?: Date;
  duration?: number;  // minutes
  project?: string;
  task?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// Configuration options
interface ParserOptions {
  timestampFormat?: string;
  timezone?: string;
  customPatterns?: RegExp[];
}
```

---

## Future Roadmap

### v0.6.0 - RememberThis.ai Integration Features
**Target: Q1 2026**

Advanced export and integration capabilities for the RememberThis.ai ecosystem.

**Planned Features (if applicable):**
- **iCal/ICS export** (calendar integration with actual timestamps)
- **Diary entry helpers** (structured data for journal creation)
- Timeline generation for visual representation
- Enhanced metadata for RememberThis Obsidian plugin integration
- Time aggregation by project, date range, tags

**Primary Consumer: RememberThis Obsidian Plugin**

The RememberThis Obsidian plugin will use neamtime-log-parser for time tracking features (formerly planned as separate ttbwsd plugin).

**Key Capability:** Timestamped notes capture not just duration, but **actual date/time when work happened**. This enables:
- **Calendar exports** (iCal format) showing when you worked on what
- **Diary entry creation** as part of RememberThis ingestion flow
- **Timeline visualization** of your actual work schedule

**Installation:**
```bash
npm install neamtime-log-parser
```

**Usage in Obsidian Plugin:**
```typescript
import { TimeLogParser } from 'neamtime-log-parser';

const parser = new TimeLogParser({
  timestampFormat: 'HH:mm',
  timezone: 'Europe/Stockholm'
});

// Parse daily note - get actual date/time of each session
const sessions = parser.parseFile('2025-10-12.md');

// Generate report
const todayHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;

// Export to calendar (preserves actual timestamps)
const icalData = parser.exportToICal(sessions);

// Use for diary entries (actual times matter!)
sessions.forEach(session => {
  createDiaryEntry({
    date: session.startTime,  // Actual datetime when work happened
    content: `Worked on ${session.project}: ${session.task}`,
    duration: session.duration,
    category: 'work'
  });
});
```

**Secondary Integration: ccremote Queue Processing**

Time log files can be processed via ccremote queue system:

**Workflow:**
1. User drops time log file in `_q/medium/`
2. ccremote spawns Claude Code session with custom prompt
3. Claude uses neamtime-log-parser (via CLAUDE.md instructions) to:
   - Parse time entries
   - Validate format
   - Generate reports
   - Update project databases

**Note:** This is an optional integration, not a hard requirement.

### v0.7.0+ - Real-time Monitoring
**Target: TBD**

Support for live time tracking and session monitoring.

**Planned Features:**
- File watcher for live updates
- Active session detection
- Notification hooks for session events
- Integration with OS time tracking APIs

---

## Out of Scope

### Multiple Time Log Format Support

Support for multiple time log formats beyond neamtime's markdown style is **out of scope** for this library, unless the package is renamed to `ttbwsd-parser` to reflect broader format support.

**Rationale:**
- neamtime-log-parser is specifically designed for the neamtime markdown time log format
- Adding multiple format support would require significant architectural changes
- If broader format support is needed, consider:
  - Renaming to `ttbwsd-parser` (Time Tracking By Writing Stuff Down Parser)
  - Creating a plugin architecture for format-specific parsers
  - Separate packages for different formats

**If Renamed to ttbwsd-parser:**
- Plugin architecture for custom parsers
- Built-in parsers for common formats:
  - Neamtime markdown (default)
  - Plain text timestamps
  - CSV time logs
  - JSON time entries
- Parser auto-detection based on content
- Format conversion utilities

---

## Technical Considerations

### Architecture Principles

**1. Parser Independence:**
- Core parser has no external dependencies (beyond TypeScript/Node)
- Optional features (file watching, notifications) as separate modules
- Clean interfaces for extensibility

**2. Type Safety:**
- Full TypeScript type coverage
- Exported types for consumers
- Runtime validation with zod or similar

**3. Performance:**
- Efficient parsing for large files (streaming)
- Caching for repeated parses
- Lazy loading for optional features

### Testing Strategy

**Current State:** Unknown test coverage (needs assessment)

**Required for v0.5.0:**
- Unit tests for parser logic (90%+ coverage)
- Integration tests for file I/O
- Edge case tests (malformed input, timezone handling)
- Performance benchmarks

**Testing Tools:**
- Jest or Vitest for unit tests
- Test fixtures for various markdown formats
- CI/CD integration (GitHub Actions)

### Backward Compatibility

**Version Policy:**
- Semantic versioning (semver)
- Major versions for breaking API changes
- Deprecation warnings for removed features
- Migration guides for major versions

**Compatibility Promise:**
- v0.x: No stability guarantees (pre-1.0)
- v1.x: API stability for minor/patch versions
- Document breaking changes in CHANGELOG

---

## Dependencies & Maintenance

### Current Dependencies
(To be documented from package.json)

**Core:**
- TypeScript
- Node.js runtime (minimum version TBD)

**Dev:**
- Build tools (tsc, tsup, or similar)
- Testing framework
- Linting/formatting (ESLint, Prettier)

### Maintenance Plan

**Ownership:**
- Primary maintainer: motin
- Open to community contributions
- Clear contribution guidelines

**Release Cadence:**
- Patch releases: As needed for bugs
- Minor releases: Quarterly (new features)
- Major releases: Yearly (breaking changes)

**Support Policy:**
- Latest version: Active development
- Previous minor: Security fixes only
- Older versions: Community support

---

## Success Criteria

### v0.5.0 (NPM Publishing & Recent Improvements)
- [ ] Published to npm with public access
- [ ] README with clear installation/usage docs
- [ ] 90%+ test coverage
- [ ] CI/CD pipeline operational
- [ ] MIT license applied
- [ ] Pending improvements from v0.4.0 included

### v0.6.0 (RememberThis.ai Integration)
- [ ] iCal/ICS export functionality (if needed)
- [ ] Diary entry helper functions (if needed)
- [ ] Integration documented with examples
- [ ] Used successfully by RememberThis Obsidian plugin

### v1.0.0 (Stability Milestone)
- [ ] API declared stable
- [ ] Comprehensive documentation
- [ ] Used in production by RememberThis plugin
- [ ] Community adoption (>100 weekly downloads)

---

## Implementation Notes

### Publishing Workflow

1. **Pre-publish:**
   ```bash
   npm run test        # Ensure all tests pass
   npm run lint        # Check code style
   npm run build       # Build dist/
   npm run docs        # Generate API docs
   ```

2. **Version Bump:**
   ```bash
   npm version patch   # or minor/major
   git push --tags
   ```

3. **Publish:**
   ```bash
   npm publish --access public
   ```

4. **Post-publish:**
   - Update CHANGELOG.md
   - Create GitHub release
   - Announce in relevant channels

### Repository Structure

```
neamtime-log-parser/
├── src/
│   ├── parser/          # Core parser logic
│   ├── formats/         # Format-specific parsers
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper utilities
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── fixtures/        # Test data
├── docs/
│   ├── API.md           # API reference
│   ├── EXAMPLES.md      # Usage examples
│   └── CONTRIBUTING.md  # Contribution guide
├── CHANGELOG.md         # Version history
├── LICENSE              # MIT license
├── README.md            # Main documentation
├── package.json         # Package config
└── tsconfig.json        # TypeScript config
```

---

## Related Projects

- **RememberThis.ai** - Umbrella project using this parser
- **ccremote** - Can process time logs via queue system
- **RememberThis Obsidian Plugin** - Primary consumer

This library is a foundational component of the RememberThis.ai ecosystem, enabling time tracking and work session documentation across multiple tools.
