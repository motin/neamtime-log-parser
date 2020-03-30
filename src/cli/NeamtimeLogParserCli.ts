import {
  getProcessedTimeSpendingLog,
  TimeLogEntryWithMetadata,
  TimeLogMetadata,
} from "..";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "../lib/exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import {
  ProcessedTimeSpendingLog,
  ProcessingError,
} from "../lib/ProcessedTimeSpendingLog";

export interface AppNeamtimeLogParserResults {
  totalReportedTime?: number;
  thrownException?: any;
  // preProcessedContents?: string;
  // contentsWithTimeMarkers?: string;
  // timeReportCsv?: string;
  timeReportData?: { [k: string]: any };
  sessionCount?: number;
  timeLogEntriesWithMetadata?: TimeLogEntryWithMetadata[];
  processingErrors?: ProcessingError[];
  troubleshootingInfo?: {
    logMetadata: TimeLogMetadata;
  };
  // processingDebugInfo?: any;
  nonEmptyPreprocessedLinesCount?: number;
}

export class NeamtimeLogParserCli {
  public async run(filePath: string): Promise<AppNeamtimeLogParserResults> {
    let thrownException;
    let processedTimeSpendingLog: ProcessedTimeSpendingLog;

    try {
      processedTimeSpendingLog = getProcessedTimeSpendingLog(filePath);
      /*
      logger.info(" * DEBUG * Neamtime parse completed successfully", {
        processedTimeSpendingLog,
      });
      */
    } catch (e) {
      if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
        thrownException = e;
        processedTimeSpendingLog = e.processedTimeSpendingLog;
      } else {
        throw e;
      }
    }

    /*
    let dateYmd = null;
    if (neamtimeLogParserResult.date && neamtimeLogParserResult.date.data) {
      dateYmd = moment(neamtimeLogParserResult.date.data).format("YYYY-MM-DD");
    }
    */

    /*
    Parsing status
     */

    const timeLogProcessor = processedTimeSpendingLog.getTimeLogProcessor();
    const troubleshootingInfo = processedTimeSpendingLog.getTroubleshootingInfo();

    /* tslint:disable:object-literal-sort-keys */
    return {
      totalReportedTime: processedTimeSpendingLog.calculateTotalReportedTime(),
      thrownException,
      // preProcessedContents: timeLogProcessor.preProcessedContents,
      // contentsWithTimeMarkers: timeLogProcessor.contentsWithTimeMarkers,
      sessionCount: timeLogProcessor.sessions.length,
      timeReportData: timeLogProcessor.timeReportData,
      // timeReportCsv: timeLogProcessor.timeReportCsv,
      timeLogEntriesWithMetadata: processedTimeSpendingLog.getTimeLogEntriesWithMetadata(),
      processingErrors: processedTimeSpendingLog.getProcessingErrors(),
      troubleshootingInfo,
      // processingDebugInfo: processedTimeSpendingLog.processingDebugInfo,
      nonEmptyPreprocessedLinesCount: timeLogProcessor.nonEmptyPreprocessedLines()
        .length,
    };
    /* tslint:enable:object-literal-sort-keys */
  }
}
