import { TimeSpendingLogProcessingErrorsEncounteredException } from "./exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import {
  ProcessedTimeSpendingLog,
  TimeLogParseResult,
} from "./ProcessedTimeSpendingLog";
import { TimeSpendingLog } from "./TimeSpendingLog";

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
  options: ParseOptions = {},
): TimeLogParseResult {
  const {
    timezone = "UTC",
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
    status: "Failed",
  };

  try {
    // Create time spending log
    const timeSpendingLog = new TimeSpendingLog();
    timeSpendingLog.rawLogContents = content;
    timeSpendingLog.tzFirst = timezone;

    let processedLog: ProcessedTimeSpendingLog | undefined;

    try {
      // Process the log
      processedLog = new ProcessedTimeSpendingLog(timeSpendingLog);
    } catch (error) {
      // Check if this is a processing error with details
      if (
        error instanceof TimeSpendingLogProcessingErrorsEncounteredException
      ) {
        if (error.processedTimeSpendingLog) {
          processedLog = error.processedTimeSpendingLog;

          // Extract errors
          result.errors = processedLog.getProcessingErrors().map(e => ({
            ref: e.ref || "unknown",
            message: e.message || "Unknown error",
            data: e.data,
            sourceLine: e.sourceLine,
            dateRaw: e.dateRaw,
            lineWithComment: e.lineWithComment,
            log: e.log,
          }));
          result.errorCount = result.errors.length;
        } else {
          // No processed log available - total failure
          result.errors = [
            {
              ref: "parsing-exception",
              message: error.message || "Parsing failed",
            },
          ];
          result.errorCount = 1;
          return result;
        }
      } else {
        // Unexpected error
        result.errors = [
          {
            ref: "unexpected-error",
            message: error.message || String(error),
          },
        ];
        result.errorCount = 1;
        return result;
      }
    }

    // If we got here, we have a processedLog (either clean or with errors)
    if (processedLog) {
      // Extract entries
      result.entries = processedLog.getTimeLogEntriesWithMetadata();

      // Extract metadata
      const processor = processedLog.getTimeLogProcessor();
      const logMetadata = processor.getTimeLogMetadata();

      result.metadata = {
        totalHours: processedLog.calculateTotalReportedTime(),
        sessionCount: processor.sessions.length,
        processedLines: processor.rowsWithTimeMarkers
          ? processor.rowsWithTimeMarkers.length
          : 0,
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
        result.status = "OK";
      } else if (result.entries.length > 0) {
        // Have errors but also have entries - partial success
        result.success = true;
        result.status = "Warnings";
      } else {
        // Have errors and no entries
        result.success = false;
        result.status = "Failed";
      }
    }

    return result;
  } catch (error) {
    // Catch-all for any unexpected errors
    const err = error as Error;
    result.errors = [
      {
        ref: "unexpected-error",
        message: err.message || String(error),
      },
    ];
    result.errorCount = 1;
    result.status = "Failed";
    return result;
  }
}

/**
 * Parse a neamtime time tracking log from a file path
 *
 * @param filePath - Path to the log file
 * @param options - Parse options
 * @returns Parse result with entries, metadata, and any errors
 *
 * @example
 * ```typescript
 * const result = await parseTimeLogFile('/path/to/log.md');
 *
 * console.log(`Status: ${result.status}`);
 * console.log(`Entries: ${result.entries.length}`);
 * console.log(`Total hours: ${result.metadata.totalHours}`);
 * ```
 */
export async function parseTimeLogFile(
  filePath: string,
  options: ParseOptions = {},
): Promise<TimeLogParseResult> {
  const fs = await import("fs");
  const util = await import("util");
  const readFile = util.promisify(fs.readFile);

  try {
    const content = await readFile(filePath, "utf-8");

    // Check if .tzFirst file exists
    let timezone = options.timezone;
    if (!timezone) {
      try {
        const tzContent = await readFile(filePath + ".tzFirst", "utf-8");
        timezone = tzContent.trim();
      } catch {
        timezone = "UTC";
      }
    }

    return parseTimeLog(content, { ...options, timezone });
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      entries: [],
      metadata: {
        totalHours: 0,
        sessionCount: 0,
        processedLines: 0,
      },
      errors: [
        {
          ref: "file-read-error",
          message: `Failed to read file: ${err.message}`,
        },
      ],
      errorCount: 1,
      status: "Failed",
    };
  }
}
