# neamtime-log-parser API Improvements

## Current Issues

### 1. Missing Exports
**Problem:** `ProcessedTimeSpendingLog` is used but not exported from `index.ts`

**Impact:** Consumers need to use `// @ts-ignore` to import it:
```typescript
// @ts-ignore - ProcessedTimeSpendingLog is not exported but exists
import { ProcessedTimeSpendingLog } from 'neamtime-log-parser/build/main/lib/ProcessedTimeSpendingLog';
```

### 2. Awkward Error Handling
**Problem:** Errors are thrown as exceptions that need to be caught and inspected:

```typescript
try {
  processedLog = new ProcessedTimeSpendingLog(timeSpendingLog);
} catch (error: any) {
  if (error.processedTimeSpendingLog?.processingErrors) {
    // Handle errors
  }
}
```

**Impact:**
- Not TypeScript-friendly
- Unclear API (hidden error structure)
- Can't distinguish between "parsing succeeded with warnings" vs "parsing failed"

### 3. No High-Level API
**Problem:** Users need to understand internal classes:

```typescript
const timeSpendingLog = new TimeSpendingLog();
timeSpendingLog.rawLogContents = content;
timeSpendingLog.tzFirst = 'UTC';
const processedLog = new ProcessedTimeSpendingLog(timeSpendingLog);
const entries = processedLog.getTimeLogEntriesWithMetadata();
```

**Impact:**
- Steep learning curve
- More code to write
- Easy to make mistakes

### 4. Loose Types
**Problem:** Many `any` types in interfaces:

```typescript
export interface ProcessingError {
  data: any;
  ref: any;
  message: any;
}
```

**Impact:**
- No IDE autocomplete
- No type safety
- Harder to understand error structure

### 5. No Structured Result Pattern
**Problem:** Follows exception pattern instead of result pattern

**Impact:**
- Can't easily distinguish success with warnings from failure
- Partial results lost on error
- Doesn't follow modern TypeScript patterns

---

## Proposed Improvements

### Phase 1: Export Missing Types ✅

**File:** `src/index.ts`

**Add:**
```typescript
export * from "./lib/ProcessedTimeSpendingLog";
```

**Impact:** No more `// @ts-ignore` needed

---

### Phase 2: Improve Type Definitions

**File:** `src/lib/ProcessedTimeSpendingLog.ts`

**Replace:**
```typescript
export interface ProcessingError {
  data;
  ref;
  message;
}
```

**With:**
```typescript
export interface ProcessingError {
  /** Reference identifier for this error type (e.g., "issues-during-initial-parsing") */
  ref: string;
  /** Human-readable error message */
  message: string;
  /** Additional context data for this error */
  data?: any;
  /** Source line number where error occurred */
  sourceLine?: number;
  /** Raw date entry that caused the error */
  dateRaw?: string;
  /** Log entry line with comment */
  lineWithComment?: string;
  /** Error log details */
  log?: string;
}
```

**New interfaces:**
```typescript
export interface ParseMetadata {
  /** Total hours tracked in the log */
  totalHours: number;
  /** Number of sessions detected */
  sessionCount: number;
  /** Number of non-empty lines processed */
  processedLines: number;
  /** Oldest timestamp in the log */
  oldestTimestamp?: Date;
  /** Most recent timestamp in the log */
  mostRecentTimestamp?: Date;
  /** Calendar time span in hours */
  leadTimeHours?: number;
  /** Log name/comment */
  name?: string;
}

export interface TimeLogParseResult {
  /** Whether parsing completed without fatal errors */
  success: boolean;
  /** Parsed time log entries with metadata */
  entries: TimeLogEntryWithMetadata[];
  /** Metadata about the parsed log */
  metadata: ParseMetadata;
  /** Processing errors encountered (can have errors even if success=true) */
  errors: ProcessingError[];
  /** Number of errors */
  errorCount: number;
  /** Parse status: OK (no errors), Warnings (errors but usable), Failed (unusable) */
  status: 'OK' | 'Warnings' | 'Failed';
  /** Troubleshooting information */
  troubleshootingInfo?: any;
  /** The processed time log processor (for advanced use) */
  processor?: TimeLogProcessor;
}
```

---

### Phase 3: High-Level Parse Function

**File:** `src/lib/parse.ts` (new file)

```typescript
import { ProcessedTimeSpendingLog, ProcessingError, TimeLogParseResult } from './ProcessedTimeSpendingLog';
import { TimeSpendingLog } from './TimeSpendingLog';
import { TimeSpendingLogProcessingErrorsEncounteredException } from './exceptions/TimeSpendingLogProcessingErrorsEncounteredException';

export interface ParseOptions {
  /** Timezone to use (default: 'UTC') */
  timezone?: string;
  /** Whether to include troubleshooting info in result */
  includeTroubleshootingInfo?: boolean;
  /** Whether to include the processor instance in result */
  includeProcessor?: boolean;
}

/**
 * Parse a neamtime time tracking log
 *
 * @param content - Raw log content (markdown format)
 * @param options - Parse options
 * @returns Parse result with entries, metadata, and any errors
 *
 * @example
 * ```typescript
 * const result = parseTimeLog(logContent);
 *
 * if (result.status === 'OK') {
 *   console.log(`Parsed ${result.entries.length} entries`);
 * } else if (result.status === 'Warnings') {
 *   console.warn(`Parsed with ${result.errorCount} warnings`);
 * } else {
 *   console.error(`Failed to parse: ${result.errors[0].message}`);
 * }
 *
 * // Access entries regardless of warnings
 * for (const entry of result.entries) {
 *   console.log(`${entry.gmtTimestamp}: ${entry.hours}h - ${entry.text}`);
 * }
 * ```
 */
export function parseTimeLog(
  content: string,
  options: ParseOptions = {}
): TimeLogParseResult {
  const {
    timezone = 'UTC',
    includeTroubleshootingInfo = false,
    includeProcessor = false,
  } = options;

  // Initialize result
  const result: TimeLogParseResult = {
    success: false,
    entries: [],
    metadata: {
      totalHours: 0,
      sessionCount: 0,
      processedLines: 0,
    },
    errors: [],
    errorCount: 0,
    status: 'Failed',
  };

  try {
    // Create time spending log
    const timeSpendingLog = new TimeSpendingLog();
    timeSpendingLog.rawLogContents = content;
    timeSpendingLog.tzFirst = timezone;

    let processedLog: ProcessedTimeSpendingLog;

    try {
      // Process the log
      processedLog = new ProcessedTimeSpendingLog(timeSpendingLog);
    } catch (error: any) {
      // Check if this is a processing error with details
      if (error instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
        if (error.processedTimeSpendingLog) {
          processedLog = error.processedTimeSpendingLog;

          // Extract errors
          result.errors = processedLog.getProcessingErrors().map(e => ({
            ref: e.ref || 'unknown',
            message: e.message || 'Unknown error',
            data: e.data,
          }));
          result.errorCount = result.errors.length;
        } else {
          // No processed log available - total failure
          result.errors = [{
            ref: 'parsing-exception',
            message: error.message || 'Parsing failed',
          }];
          result.errorCount = 1;
          return result;
        }
      } else {
        // Unexpected error
        result.errors = [{
          ref: 'unexpected-error',
          message: error.message || String(error),
        }];
        result.errorCount = 1;
        return result;
      }
    }

    // If we got here, we have a processedLog (either clean or with errors)
    if (processedLog!) {
      // Extract entries
      result.entries = processedLog.getTimeLogEntriesWithMetadata();

      // Extract metadata
      const processor = processedLog.getTimeLogProcessor();
      const logMetadata = processor.getTimeLogMetadata();

      result.metadata = {
        totalHours: processedLog.calculateTotalReportedTime(),
        sessionCount: processor.sessions.length,
        processedLines: logMetadata.nonEmptyPreprocessedLinesCount || 0,
        oldestTimestamp: logMetadata.startTs
          ? new Date(logMetadata.startTs * 1000)
          : undefined,
        mostRecentTimestamp: logMetadata.lastTs
          ? new Date(logMetadata.lastTs * 1000)
          : undefined,
        leadTimeHours: logMetadata.hoursLeadTime,
        name: logMetadata.name,
      };

      // Add optional data
      if (includeTroubleshootingInfo) {
        result.troubleshootingInfo = processedLog.getTroubleshootingInfo();
      }

      if (includeProcessor) {
        result.processor = processor;
      }

      // Determine status
      if (result.errorCount === 0) {
        result.success = true;
        result.status = 'OK';
      } else if (result.entries.length > 0) {
        // Have errors but also have entries - partial success
        result.success = true;
        result.status = 'Warnings';
      } else {
        // Have errors and no entries
        result.success = false;
        result.status = 'Failed';
      }
    }

    return result;
  } catch (error: any) {
    // Catch-all for any unexpected errors
    result.errors = [{
      ref: 'unexpected-error',
      message: error.message || String(error),
    }];
    result.errorCount = 1;
    result.status = 'Failed';
    return result;
  }
}

/**
 * Parse a neamtime time tracking log from a file path
 *
 * @param filePath - Path to the log file
 * @param options - Parse options
 * @returns Parse result with entries, metadata, and any errors
 */
export async function parseTimeLogFile(
  filePath: string,
  options: ParseOptions = {}
): Promise<TimeLogParseResult> {
  const fs = await import('fs/promises');

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check if .tzFirst file exists
    let timezone = options.timezone;
    if (!timezone) {
      try {
        const tzContent = await fs.readFile(filePath + '.tzFirst', 'utf-8');
        timezone = tzContent.trim();
      } catch {
        timezone = 'UTC';
      }
    }

    return parseTimeLog(content, { ...options, timezone });
  } catch (error: any) {
    return {
      success: false,
      entries: [],
      metadata: {
        totalHours: 0,
        sessionCount: 0,
        processedLines: 0,
      },
      errors: [{
        ref: 'file-read-error',
        message: `Failed to read file: ${error.message}`,
      }],
      errorCount: 1,
      status: 'Failed',
    };
  }
}
```

**Export from index.ts:**
```typescript
export * from "./lib/parse";
```

---

### Phase 4: Add Convenience Types

**File:** `src/types.ts` (new file)

```typescript
/**
 * Re-export all commonly used types for convenience
 */

export type {
  TimeLogEntryWithMetadata,
  TimeLogSession,
  TimeLogMetadata,
} from './lib/TimeLogProcessor';

export type {
  ProcessingError,
  TimeLogParseResult,
  ParseMetadata,
} from './lib/ProcessedTimeSpendingLog';

export type {
  ParseOptions,
} from './lib/parse';

// Main classes for advanced use
export {
  TimeSpendingLog,
} from './lib/TimeSpendingLog';

export {
  ProcessedTimeSpendingLog,
} from './lib/ProcessedTimeSpendingLog';

export {
  TimeLogProcessor,
} from './lib/TimeLogProcessor';
```

**Export from index.ts:**
```typescript
export * from "./types";
```

---

## Migration Guide

### Before (Current API)

```typescript
import { TimeSpendingLog } from 'neamtime-log-parser';
// @ts-ignore - ProcessedTimeSpendingLog is not exported
import { ProcessedTimeSpendingLog } from 'neamtime-log-parser/build/main/lib/ProcessedTimeSpendingLog';

try {
  const timeSpendingLog = new TimeSpendingLog();
  timeSpendingLog.rawLogContents = content;
  timeSpendingLog.tzFirst = 'UTC';

  let processedLog: any;
  try {
    processedLog = new ProcessedTimeSpendingLog(timeSpendingLog);
  } catch (error: any) {
    if (error.processedTimeSpendingLog?.processingErrors) {
      const errors = error.processedTimeSpendingLog.processingErrors;
      console.error('Parsing errors:', errors);
      // Save error report...
      const errorSummary = errors.map((e: any) => `${e.ref}: ${e.message}`).join('\\n');
      throw new Error(`Parsing failed with ${errors.length} error(s):\\n${errorSummary}`);
    }
    throw error;
  }

  const entries = processedLog.getTimeLogEntriesWithMetadata();
  const processor = processedLog.getTimeLogProcessor();

  // Use entries...
} catch (error) {
  console.error('Failed to parse:', error);
  throw error;
}
```

### After (New API)

```typescript
import { parseTimeLog } from 'neamtime-log-parser';

const result = parseTimeLog(content, {
  timezone: 'UTC',
  includeProcessor: true,
});

if (result.status === 'Failed') {
  console.error('Parsing failed:', result.errors);
  throw new Error(`Parsing failed: ${result.errors[0].message}`);
}

if (result.status === 'Warnings') {
  console.warn(`Parsed with ${result.errorCount} warnings:`, result.errors);
  // Save error report...
}

// Use result.entries regardless of warnings
console.log(`Parsed ${result.entries.length} entries`);
console.log(`Total hours: ${result.metadata.totalHours}`);

// Access processor if needed
if (result.processor) {
  const markdown = result.processor.contentsWithTimeMarkers;
}
```

### Benefits

1. **No `// @ts-ignore`** - All types properly exported
2. **Type-safe** - Full TypeScript support with proper interfaces
3. **Cleaner code** - Single function call instead of multi-step process
4. **Better error handling** - Structured result instead of exception catching
5. **Partial success** - Can get entries even with warnings
6. **More flexible** - Options for advanced use cases

---

## Implementation Plan

### Phase 1: Non-Breaking Additions (v0.6.0)
- ✅ Export `ProcessedTimeSpendingLog` from index
- ✅ Add improved type definitions
- ✅ Add `parseTimeLog()` function
- ✅ Add `parseTimeLogFile()` function
- ✅ Add convenience types export
- ✅ Update README with new API examples
- ⚠️ **Keep old API working** - Fully backward compatible

### Phase 2: Documentation (v0.6.1)
- Update README with migration guide
- Add JSDoc comments to all public APIs
- Create examples directory with usage samples
- Generate API documentation

### Phase 3: Deprecation (v0.7.0)
- Mark old patterns as deprecated in docs
- Add migration guide to README
- Keep old API working but discouraged

### Phase 4: Future (v1.0.0?)
- Consider removing old patterns
- Breaking change - would need major version bump

---

## Testing Strategy

1. **Add new tests** for `parseTimeLog()` and `parseTimeLogFile()`
2. **Ensure existing tests pass** - backward compatibility
3. **Test error scenarios**:
   - Empty content
   - Invalid syntax
   - Whitespace-only
   - Mixed valid/invalid entries
4. **Test result patterns**:
   - Status = 'OK' (no errors)
   - Status = 'Warnings' (errors but entries extracted)
   - Status = 'Failed' (errors, no entries)

---

## Example Usage Patterns

### Basic Usage
```typescript
import { parseTimeLog } from 'neamtime-log-parser';

const result = parseTimeLog(content);

if (result.status === 'OK') {
  console.log('✅ Parsed successfully');
  result.entries.forEach(entry => {
    console.log(`${entry.gmtTimestamp}: ${entry.hours}h`);
  });
}
```

### With Error Handling
```typescript
const result = parseTimeLog(content);

switch (result.status) {
  case 'OK':
    console.log('✅ No errors');
    break;

  case 'Warnings':
    console.warn(`⚠️ ${result.errorCount} warnings`);
    result.errors.forEach(err => {
      console.warn(`- ${err.ref}: ${err.message}`);
    });
    // Still use entries!
    break;

  case 'Failed':
    console.error('❌ Parsing failed');
    throw new Error(result.errors[0].message);
}
```

### File Parsing
```typescript
import { parseTimeLogFile } from 'neamtime-log-parser';

const result = await parseTimeLogFile('/path/to/log.md');

console.log(`Status: ${result.status}`);
console.log(`Entries: ${result.entries.length}`);
console.log(`Total hours: ${result.metadata.totalHours}`);
```

### Advanced: Access Processor
```typescript
const result = parseTimeLog(content, {
  includeProcessor: true,
  includeTroubleshootingInfo: true,
});

if (result.processor) {
  // Get processed markdown with duration markers
  const markdown = result.processor.contentsWithTimeMarkers;

  // Get sessions
  const sessions = result.processor.sessions;
}
```

### Type-Safe Error Handling
```typescript
import type { ProcessingError } from 'neamtime-log-parser';

function handleErrors(errors: ProcessingError[]): void {
  errors.forEach(error => {
    // TypeScript knows about all fields
    console.log(`${error.ref}: ${error.message}`);

    if (error.sourceLine) {
      console.log(`  Line: ${error.sourceLine}`);
    }

    if (error.data) {
      console.log(`  Data:`, error.data);
    }
  });
}
```

---

## Benefits Summary

### For Library Consumers
- 🎯 **Simpler API** - One function call instead of multi-step process
- 🔒 **Type Safe** - Full TypeScript support with IntelliSense
- 🎨 **Better DX** - Clear, documented interfaces
- 🛡️ **Robust** - Graceful error handling with partial results
- 📚 **Discoverable** - All types and functions properly exported

### For Library Maintainers
- 🔄 **Backward Compatible** - Old code still works
- 🧪 **Testable** - Result pattern easier to test
- 📖 **Documented** - Clear contracts via TypeScript
- 🚀 **Extensible** - Easy to add new options
- 🎁 **Modern** - Follows current TypeScript best practices
