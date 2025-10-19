# neamtime-log-parser

A TypeScript library for parsing timestamped markdown time logs into structured data. Handles the neamtime format where work sessions are documented with timestamps, making them machine-parseable for reporting and analysis.

## Features

- **Timestamp Format Support**: Parse markdown files with timestamped entries
- **Session Detection**: Extract work sessions with start/end times
- **Duration Calculations**: Automatically calculate session durations
- **Timezone Support**: Handle multiple timezone specifications
- **Pause Detection**: Track breaks and pauses in work sessions
- **Data Export**: Generate structured time reports and CSV exports
- **CLI & API**: Use as a command-line tool or integrate into your application

## Installation

```bash
npm install neamtime-log-parser
```

## Format Overview

The neamtime log format is a simple markdown-based time tracking format:

```
start 2021-01-02 (+0200) 10:11

2021-01-02 (+0200) 10:21, working on documentation

paus 12:10->

start 13:00

2021-01-02 (+0200) 14:30, finished documentation

#endts
```

**Key Elements:**
- `start` - Begin a new work session
- `paus` or `pause` - Mark a pause/break
- Timestamps with format: `YYYY-MM-DD (±ZZZZ) HH:MM`
- Task descriptions after timestamps
- `#endts` - End of time log

## Usage

### Command Line Interface

Parse a time log file and output structured JSON:

```bash
neamtime-log-parser --filePath path/to/timelog.tslog
```

Output includes:
- Total reported time
- Session count
- Time report data
- Individual time log entries with metadata
- Processing errors (if any)

### Programmatic API (Recommended)

The new high-level API provides a clean, type-safe interface with structured error handling:

```typescript
import { parseTimeLog } from 'neamtime-log-parser';

// Parse a time log from string content
const result = parseTimeLog(content, {
  timezone: 'UTC', // optional, defaults to UTC
  includeProcessor: true, // optional, for advanced use
});

// Check status
if (result.status === 'OK') {
  console.log('✅ Parsed successfully!');
} else if (result.status === 'Warnings') {
  console.warn(`⚠️ Parsed with ${result.errorCount} warnings`);
  result.errors.forEach(err => console.warn(`  ${err.ref}: ${err.message}`));
} else {
  console.error('❌ Parsing failed:', result.errors[0].message);
}

// Access parsed data (available even with warnings)
console.log(`Total hours: ${result.metadata.totalHours}`);
console.log(`Sessions: ${result.metadata.sessionCount}`);

// Use time log entries
result.entries.forEach(entry => {
  console.log(`${entry.gmtTimestamp}: ${entry.hours}h - ${entry.text}`);
});

// Access processor for advanced use (if includeProcessor: true)
if (result.processor) {
  const markdown = result.processor.contentsWithTimeMarkers;
  const sessions = result.processor.sessions;
}
```

**Parse from file:**

```typescript
import { parseTimeLogFile } from 'neamtime-log-parser';

// Automatically reads .tzFirst file if present
const result = await parseTimeLogFile('/path/to/timelog.tslog');

console.log(`Status: ${result.status}`);
console.log(`Entries: ${result.entries.length}`);
```

**Type-safe error handling:**

```typescript
import type { ProcessingError } from 'neamtime-log-parser';

function handleErrors(errors: ProcessingError[]): void {
  errors.forEach(error => {
    console.log(`${error.ref}: ${error.message}`);

    if (error.sourceLine) {
      console.log(`  Line: ${error.sourceLine}`);
    }

    if (error.lineWithComment) {
      console.log(`  Entry: ${error.lineWithComment}`);
    }
  });
}
```

### Legacy API (Still Supported)

The original class-based API continues to work for backward compatibility:

```typescript
import { getProcessedTimeSpendingLog } from 'neamtime-log-parser';

// Parse a time log file
const processed = getProcessedTimeSpendingLog('/path/to/timelog.tslog');

// Get total time
const totalTime = processed.calculateTotalReportedTime();

// Get time log entries
const entries = processed.getTimeLogEntriesWithMetadata();

// Get processing errors
const errors = processed.getProcessingErrors();

// Get time report data
const timeLogProcessor = processed.getTimeLogProcessor();
const reportData = timeLogProcessor.timeReportData;
const sessions = timeLogProcessor.sessions;
```

### Advanced Usage

**Finding Time Log Files in a Folder:**

```typescript
import { timeSpendingLogPathsInFolder } from 'neamtime-log-parser';

// Get all .tslog files in a directory
const logPaths = timeSpendingLogPathsInFolder('/path/to/logs');

// Process each log
for (const logPath of Object.values(logPaths)) {
  const processed = getProcessedTimeSpendingLog(logPath);
  console.log(`Total time: ${processed.calculateTotalReportedTime()} minutes`);
}
```

**Timezone Specification:**

You can specify a timezone by creating a `.tzFirst` file alongside your `.tslog` file:

```bash
echo "Europe/Stockholm" > timelog.tslog.tzFirst
```

If not specified, UTC is used as the default timezone.

## API Reference

### Recommended API

#### `parseTimeLog(content: string, options?: ParseOptions): TimeLogParseResult`

Parse a time log from string content.

**Options:**
- `timezone?: string` - Timezone to use (default: 'UTC')
- `includeTroubleshootingInfo?: boolean` - Include troubleshooting info in result
- `includeProcessor?: boolean` - Include the processor instance in result

**Returns:** `TimeLogParseResult` with:
- `success: boolean` - Whether parsing completed without fatal errors
- `status: 'OK' | 'Warnings' | 'Failed'` - Parse status
- `entries: TimeLogEntryWithMetadata[]` - Parsed time log entries
- `metadata: ParseMetadata` - Statistics (totalHours, sessionCount, etc.)
- `errors: ProcessingError[]` - Any errors encountered
- `errorCount: number` - Number of errors
- `processor?: TimeLogProcessor` - Raw processor (if includeProcessor: true)
- `troubleshootingInfo?: any` - Debug info (if includeTroubleshootingInfo: true)

#### `parseTimeLogFile(filePath: string, options?: ParseOptions): Promise<TimeLogParseResult>`

Parse a time log from a file. Automatically reads `.tzFirst` file if present.

**Returns:** Promise resolving to `TimeLogParseResult`

### Type Definitions

#### `TimeLogParseResult`

```typescript
interface TimeLogParseResult {
  success: boolean;
  status: 'OK' | 'Warnings' | 'Failed';
  entries: TimeLogEntryWithMetadata[];
  metadata: ParseMetadata;
  errors: ProcessingError[];
  errorCount: number;
  processor?: TimeLogProcessor;
  troubleshootingInfo?: any;
}
```

#### `ParseMetadata`

```typescript
interface ParseMetadata {
  totalHours: number;
  sessionCount: number;
  processedLines: number;
  oldestTimestamp?: Date;
  mostRecentTimestamp?: Date;
  leadTimeHours?: number;
  name?: string;
}
```

#### `ProcessingError`

```typescript
interface ProcessingError {
  ref: string;              // Error reference identifier
  message: string;          // Human-readable error message
  data?: any;              // Additional context data
  sourceLine?: number;     // Source line number
  dateRaw?: string;        // Raw date entry
  lineWithComment?: string; // Log entry line
  log?: string;            // Error log details
}
```

### Legacy API

#### `getProcessedTimeSpendingLog(timeSpendingLogPath: string): ProcessedTimeSpendingLog`

Parses a time spending log file and returns a processed log object.

#### `timeSpendingLogPathsInFolder(pathToFolder: string): string[]`

Finds all time spending log files (`.tslog`) in a folder, including subdirectories.

#### ProcessedTimeSpendingLog

The main result object with methods:

- `calculateTotalReportedTime(): number` - Total time in minutes
- `getTimeLogEntriesWithMetadata(): TimeLogEntryWithMetadata[]` - Individual entries
- `getProcessingErrors(): ProcessingError[]` - Any errors encountered
- `getTroubleshootingInfo()` - Metadata for debugging
- `getTimeLogProcessor(): TimeLogProcessor` - Access to raw processor

#### TimeLogProcessor

Contains parsed data:

- `sessions: Session[]` - Array of work sessions
- `timeReportData: object` - Structured time report
- `timeReportCsv: string` - CSV formatted report
- `nonEmptyPreprocessedLines(): string[]` - Cleaned log lines

## Examples

See the [fixtures directory](./fixtures/correct/basics) for example time log files.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run tests (versioned fixtures only - suitable for CI/CD)
npm test

# Run tests including unversioned fixtures (if available locally)
npm run test:all

# Or set environment variable directly
INCLUDE_UNVERSIONED_FIXTURES=true npm test
```

**Note**: By default, tests skip unversioned fixtures that are not committed to git. This ensures tests pass in CI/CD environments and fresh clones. If you have unversioned fixtures locally (in directories matching `*unversioned*`), you can include them in tests by setting the `INCLUDE_UNVERSIONED_FIXTURES` environment variable.

### Coverage

```bash
npm run cov
```

## Release Process

### Key Principles

- **Test before merging**: Test features (`npm pack` + local install) on feature branches
- **Publish from main**: Only publish to npm from `main` branch after PR merge
- **Tag releases**: Create git tags for published versions (automated via `bumpp`)

### Workflow

1. **Merge features**: All features merged to main via GitHub PRs
2. **Release**: On main branch, run `npm run release`
   - Validates you're on main branch
   - Runs all checks (lint, tests, build)
   - Creates and tests package locally
   - Interactive version bump (via `bumpp`)
   - Publishes to npm and creates git tag
   - Pushes tag to GitHub (triggers automated release notes)
3. **Bug fixes**: If issues found, fix via PR then re-run `npm run release`

### Testing Releases

Before publishing, test the package locally:

```bash
npm run release:test
```

This will:
- Run all checks
- Build the package
- Install it globally from the tarball
- Test the CLI works

### GitHub Actions

The project uses GitHub Actions for:
- **CI**: Runs on all PRs and pushes to main (tests on Node 18, 20, 22)

## License

MIT © motin

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- [Issue Tracker](https://github.com/motin/neamtime-log-parser/issues)
- [Repository](https://github.com/motin/neamtime-log-parser)
