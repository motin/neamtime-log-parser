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

### Programmatic API

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

### Core Functions

#### `getProcessedTimeSpendingLog(timeSpendingLogPath: string): ProcessedTimeSpendingLog`

Parses a time spending log file and returns a processed log object.

#### `timeSpendingLogPathsInFolder(pathToFolder: string): string[]`

Finds all time spending log files (`.tslog`) in a folder, including subdirectories.

### ProcessedTimeSpendingLog

The main result object with methods:

- `calculateTotalReportedTime(): number` - Total time in minutes
- `getTimeLogEntriesWithMetadata(): TimeLogEntryWithMetadata[]` - Individual entries
- `getProcessingErrors(): ProcessingError[]` - Any errors encountered
- `getTroubleshootingInfo()` - Metadata for debugging
- `getTimeLogProcessor(): TimeLogProcessor` - Access to raw processor

### TimeLogProcessor

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

## License

MIT © motin

## Related Projects

- **RememberThis.ai** - Ecosystem using this parser
- **RememberThis Obsidian Plugin** - Primary consumer for time tracking in Obsidian

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- [Issue Tracker](https://github.com/motin/neamtime-log-parser/issues)
- [Repository](https://github.com/motin/neamtime-log-parser)
