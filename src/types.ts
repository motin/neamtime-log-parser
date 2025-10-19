/**
 * Re-export all commonly used types for convenience
 */

// Type re-exports (TypeScript 3.0 compatible syntax)
export {
  TimeLogEntryWithMetadata,
  TimeLogSession,
  TimeLogMetadata,
  TimeReportSourceComment,
} from "./lib/TimeLogProcessor";

export {
  ProcessingError,
  TimeLogParseResult,
  ParseMetadata,
} from "./lib/ProcessedTimeSpendingLog";

export { ParseOptions } from "./lib/parse";

// Main classes for advanced use
export { TimeSpendingLog } from "./lib/TimeSpendingLog";

export { ProcessedTimeSpendingLog } from "./lib/ProcessedTimeSpendingLog";

export { TimeLogProcessor } from "./lib/TimeLogProcessor";

// High-level parsing functions (recommended)
export { parseTimeLog, parseTimeLogFile } from "./lib/parse";
