import { strpos } from "locutus/php/strings";
import { TimeLogParsingException } from "./exceptions/TimeLogParsingException";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "./exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import { cloneVariable } from "./php-wrappers";
import {
  RowMetadata,
  TimeLogEntryWithMetadata,
  TimeLogProcessor,
  TimeLogSession,
} from "./TimeLogProcessor";
import { TimeSpendingLog } from "./TimeSpendingLog";

export interface ProcessingError {
  data;
  ref;
  message;
}

export class ProcessedTimeSpendingLog {
  public processingErrors: ProcessingError[] = [];
  public unprocessedTimeSpendingLog: TimeSpendingLog;

  public processingDebugInfo;
  public timeReportICal;

  private timeLogProcessor: TimeLogProcessor;

  constructor(unprocessedTimeSpendingLog: TimeSpendingLog) {
    this.unprocessedTimeSpendingLog = unprocessedTimeSpendingLog;
    this.ensureParsedRawLogContents();
  }

  public getProcessingErrors() {
    return this.processingErrors;
  }

  public getTimeLogProcessor() {
    if (!this.timeLogProcessor) {
      this.timeLogProcessor = new TimeLogProcessor();
    }

    return this.timeLogProcessor;
  }

  /*
  TODO: Update and restore as dev documentation at least
  public attributeLabels() {
    return {
      preProcessedContents: "Pre-processed log contents",
      processedLogContentsWithTimeMarkers:
        "Log contents with time markers (for sorting) - When finished sorting/categorizing, paste into here once again",
      processedLogContentsWithTimeMarkersDebug: "Time markers parse metadata",
      rawLogContents: "Log contents",
      timeReportCsv:
        "Time report CSV (Date, Hours in each category, Log messages)",
      timeReportCsvDebug: "Time report parse/generate metadata",
      timeReportICal: "Time report iCal",
    };
  }
  */

  public ensureParsedRawLogContents() {
    this.parseRawLogContents();
    const timeLogProcessor = this.getTimeLogProcessor();
    this.parseDetectSessionsOneByOne(timeLogProcessor);

    if (this.processingErrors.length > 0) {
      const e = new TimeSpendingLogProcessingErrorsEncounteredException(
        "Issues encountered (see e->processedTimeSpendingLog->processingErrors for details)",
      );
      e.processedTimeSpendingLog = this;
      throw e;
    }
  }

  public parseRawLogContents() {
    if (!this.unprocessedTimeSpendingLog.tzFirst) {
      this.addError(
        "issues-during-initial-parsing",
        "Empty timezone",
        this.unprocessedTimeSpendingLog,
      );
      throw new TimeSpendingLogProcessingErrorsEncounteredException(
        "Empty timezone",
      );
    }

    if (!this.unprocessedTimeSpendingLog.rawLogContents) {
      this.addError(
        "issues-during-initial-parsing",
        "Empty raw log contents" +
          JSON.stringify(this.unprocessedTimeSpendingLog),
      );
      throw new TimeSpendingLogProcessingErrorsEncounteredException(
        "Empty raw log contents",
      );
    }

    const timeLogProcessor = this.getTimeLogProcessor();
    timeLogProcessor.tzFirst = this.unprocessedTimeSpendingLog.tzFirst;
    timeLogProcessor.contents = this.unprocessedTimeSpendingLog.rawLogContents;

    try {
      timeLogProcessor.addTimeMarkers();
    } catch (e) {
      if (e instanceof TimeLogParsingException) {
        this.addError(
          "addTimeMarkers TimeLogParsingException",
          e.message,
          e.debug,
        );
        return;
      } else {
        throw e;
      }
    }

    if (
      timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents.length >
        0 ||
      timeLogProcessor.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput
        .length > 0
    ) {
      this.addError(
        "issues-during-initial-parsing",
        "The following content was not understood by the parser",
        timeLogProcessor.notParsedAddTimeMarkersErrorSummary(),
      );
    }

    this.parseProcessedLogContentsWithTimeMarkers();
    // this.timeReportICal = timeLogProcessor.generateIcal();
  }

  /**
   * TODO: Possible restore the ability to parse user-supplied ContentsWithTimeMarkers
   */
  public parseProcessedLogContentsWithTimeMarkers() {
    const timeLogProcessor = this.getTimeLogProcessor();

    if (!timeLogProcessor.contentsWithTimeMarkers) {
      throw new Error("No valid contentsWithTimeMarkers");
    }

    timeLogProcessor.generateTimeReport(
      timeLogProcessor.contentsWithTimeMarkers,
    );

    if (
      timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents.length >
        0 ||
      timeLogProcessor.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput
        .length > 0
    ) {
      this.addError(
        "timeReportData-notParsedAddTimeMarkers",
        "Time Report was generated upon log contents which had non-understood parts",
      );
    }

    if (timeLogProcessor.notParsedTimeReport.length > 0) {
      this.addError(
        "timeReportData-notParsedTimeReport",
        "The following content was not understood by the parser and was thus not regarded while generating the report above",
        timeLogProcessor.notParsedTimeReportErrorSummary(),
      );
    }

    this.processingDebugInfo = {
      notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput:
        timeLogProcessor.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput,
      notParsedAddTimeMarkersParsePreProcessedContents:
        timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
      notParsedTimeReport: timeLogProcessor.notParsedTimeReport,
      rowsWithTimeMarkers: timeLogProcessor.rowsWithTimeMarkers,
      sessionStarts: timeLogProcessor.sessionStarts,
      sessions: timeLogProcessor.sessions,
    };

    if (strpos(timeLogProcessor.contentsWithTimeMarkers, "{!}") !== false) {
      this.addError(
        "timeReportData-contentsWithTimeMarkers",
        '{!} was found somewhere in the log file. Note: Estimated (marked with {!}) and needs to be manually adjusted before time report gives an accurate summary. If you already adjusted the durations, don\'t forget to also remove the "{!}"',
      );
    }

    const timeLogProcessorDummy = new TimeLogProcessor();
    timeLogProcessorDummy.tzFirst = this.unprocessedTimeSpendingLog.tzFirst;
    timeLogProcessorDummy.contents = timeLogProcessor.preProcessedContents;
    timeLogProcessorDummy.preProcessContents();

    if (
      timeLogProcessorDummy.preProcessedContents !==
      timeLogProcessor.preProcessedContents
    ) {
      this.addError("preProcessedContents", "Pre-processing is looping");
    }

    if (!timeLogProcessor.timeReportData) {
      this.addError("timeReportCsv", "No time to report found");
    }
  }

  public addError(ref, message, data = null) {
    this.processingErrors.push({ ref, message, data });
  }

  public getTroubleshootingInfo() {
    const timeLogProcessor = this.getTimeLogProcessor();
    return {
      logMetadata: timeLogProcessor.getTimeLogMetadata(),
    };
  }

  public getTimeLogEntriesWithMetadata() {
    const timeLogEntriesWithMetadata: TimeLogEntryWithMetadata[] = [];
    const timeLogProcessor = this.getTimeLogProcessor();
    this.parseDetectSessionsOneByOne(timeLogProcessor);

    for (const session of Object.values(timeLogProcessor.sessions)) {
      const timeLogEntriesWithMetadataArray = session.timeReportSourceComments;

      // TODO: Add a way to set the session_ref based on log contents in a way that doesn't result in duplicates after re-importing a session with changed start-line-date. Something like a convention to append "#previous-start-ref: start [dateRaw]" or similar to the source line
      for (const timeLogEntryWithMetadata of Object.values(
        timeLogEntriesWithMetadataArray,
      )) {
        // for now skip rows without duration
        // if (empty($row_with_time_marker["durationSinceLast"]))
        // Clues needs a gmtTimestamp - we use dateRaw since it is already in UTC
        const gmtTimestamp = timeLogEntryWithMetadata.dateRaw.trim();
        const sessionMeta: any = {};
        sessionMeta.tzFirst = session.tzFirst;
        sessionMeta.session_ref = session.start.dateRaw;
        timeLogEntryWithMetadata.gmtTimestamp = gmtTimestamp;
        timeLogEntryWithMetadata.sessionMeta = sessionMeta;
        timeLogEntriesWithMetadata.push(timeLogEntryWithMetadata);
      }
    }

    delete timeLogProcessor.sessions;
    return timeLogEntriesWithMetadata;
  }

  public parseDetectSessionsOneByOne(timeLogProcessor: TimeLogProcessor) {
    timeLogProcessor.sessions = [];
    const starts: RowMetadata[] = timeLogProcessor.sessionStarts;

    for (let k: number = 0; k < starts.length; k++) {
      const start = starts[k];

      let sessionSpecificProcessedTimeSpendingLogTimeLogProcessor;

      // If only one session was detected, we will not parse the session, but instead simply use the current timeLogProcessor in order to avoid stack overflow
      if (starts.length === 1) {
        sessionSpecificProcessedTimeSpendingLogTimeLogProcessor = timeLogProcessor;
      } else {
        // Get the section of the pre-processed log that corresponds to this session
        const preProcessedLines = timeLogProcessor.preProcessedContents.split(
          "\n",
        );
        const startLine = start.preprocessedContentsSourceLineIndex;
        const nextStart = starts[k + 1];

        const stopLine = !nextStart
          ? preProcessedLines.length
          : nextStart.preprocessedContentsSourceLineIndex - 1;
        const lines = preProcessedLines.slice(startLine, stopLine);

        if (lines.length === 0) {
          // console.debug("parseDetectSessionsOneByOne - {lines, nextStart, preProcessedLines, startLine, start, starts, stopLine}", {lines, nextStart, preProcessedLines, start, startLine, starts, stopLine});
          throw new Error(
            "Encountered an empty lines array after interpreting the starts metadata",
          );
        }

        const sessionSpecificTimeSpendingLog = new TimeSpendingLog();
        sessionSpecificTimeSpendingLog.rawLogContents = lines.join("\n");
        sessionSpecificTimeSpendingLog.tzFirst = start.lastKnownTimeZone;

        try {
          const sessionSpecificProcessedTimeSpendingLog = new ProcessedTimeSpendingLog(
            sessionSpecificTimeSpendingLog,
          );

          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor =
            sessionSpecificProcessedTimeSpendingLog.timeLogProcessor;
        } catch (e) {
          if (
            e instanceof TimeSpendingLogProcessingErrorsEncounteredException
          ) {
            // $te = new TimeSpendingLogSessionSpecificProcessingException(
            //                    'Encountered an exception while detecting/parsing sessions', null, $e
            //                );
            //                $te->sessionStartMetadata = $start;
            //                $te->processedTimeSpendingLog = $e->processedTimeSpendingLog;
            //                throw $te;
            if (e.processedTimeSpendingLog) {
              if (this.getProcessingErrors().length === 0) {
                this.addError(
                  "session-parsing",
                  "Encountered a processing error which was only evident when detecting/parsing sessions individually: " +
                    e.message,
                  {
                    processingErrors: e.processedTimeSpendingLog.getProcessingErrors(),
                    sessionStartMetadata: start,
                  },
                );
              } else {
                this.addError(
                  "session-parsing",
                  "Encountered a processing error when detecting/parsing sessions individually: " +
                    e.message,
                  {
                    processingErrors: e.processedTimeSpendingLog.getProcessingErrors(),
                    sessionStartMetadata: start,
                  },
                );
              }
            } else {
              this.addError(
                "session-parsing",
                "Encountered a processing error when detecting/parsing sessions individually, and no e.processedTimeSpendingLog was supplied: " +
                  e.message,
                {
                  sessionStartMetadata: start,
                },
              );
            }
          } else {
            // console.error(e);
            throw e;
          }
        }
      }

      if (sessionSpecificProcessedTimeSpendingLogTimeLogProcessor) {
        const timeReportSourceComments =
          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor.timeReportSourceComments;
        const tzFirst =
          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor.tzFirst;
        const metadata = sessionSpecificProcessedTimeSpendingLogTimeLogProcessor.getTimeLogMetadata();
        // var_dump($metadata);
        // Store the session metadata
        const timeLogSession: TimeLogSession = {
          k,
          metadata,
          start,
          timeReportSourceComments,
          tzFirst,
        };
        timeLogProcessor.sessions.push(timeLogSession);
      }
    }
  }

  public calculateTotalReportedTime(): number {
    let total = 0;
    {
      const timeReportData = cloneVariable(
        this.timeLogProcessor.timeReportData,
      );

      for (const date of Object.keys(timeReportData)) {
        const hoursOrHoursArrayByCategory = timeReportData[date];

        if (hoursOrHoursArrayByCategory === null) {
          continue;
        }

        if (typeof hoursOrHoursArrayByCategory === "number") {
          total += hoursOrHoursArrayByCategory;
        } else {
          delete hoursOrHoursArrayByCategory.text;
          for (const category of Object.keys(hoursOrHoursArrayByCategory)) {
            const hours = hoursOrHoursArrayByCategory[category];
            total += hours;
          }
        }
      }
    }
    return total;
  }
}
