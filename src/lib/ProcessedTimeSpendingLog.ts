import { array_slice } from "locutus/php/array";
import { strpos } from "locutus/php/strings";
import { TimeLogParsingException } from "./exceptions/TimeLogParsingException";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "./exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import { TimeLogProcessor, TimeLogSession } from "./TimeLogProcessor";
import { TimeSpendingLog } from "./TimeSpendingLog";

export interface ProcessingError {
  data;
  ref;
  message;
}

export class ProcessedTimeSpendingLog {
  public timeReportData: [];
  public processingErrors: ProcessingError[];
  public unprocessedTimeSpendingLog: TimeSpendingLog;
  public timeReportCsv;

  public preProcessedContents;
  public debug;
  public timeReportSourceComments;
  public processedLogContentsWithTimeMarkers;
  public timeReportICal;

  private timeLogProcessor: TimeLogProcessor;

  constructor(unprocessedTimeSpendingLog: TimeSpendingLog) {
    this.timeReportData = [];
    this.processingErrors = [];
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

  public ensureParsedRawLogContents() {
    this.parseRawLogContents();
    const tlp = this.getTimeLogProcessor();
    this.parseDetectSessionsOneByOne(tlp);

    if (!!this.processingErrors) {
      const e = new TimeSpendingLogProcessingErrorsEncounteredException(
        "Issues encountered (see e->processedTimeSpendingLog->processingErrors for details)",
      );
      e.processedTimeSpendingLog = this;
      throw e;
    }
  }

  public parseRawLogContents() {
    if (!this.unprocessedTimeSpendingLog.tzFirst) {
      this.addError("issues-during-initial-parsing", "Empty timezone");
      throw new TimeSpendingLogProcessingErrorsEncounteredException(
        "Empty timezone",
      );
    }

    if (!this.unprocessedTimeSpendingLog.rawLogContents) {
      this.addError("issues-during-initial-parsing", "Empty raw log contents");
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
        this.addError("addTimeMarkers TimeLogParsingException", e.message);
        return;
      }
    }

    if (!!timeLogProcessor.notParsedAddTimeMarkers) {
      this.addError(
        "issues-during-initial-parsing",
        "The following content was not understood by the parser",
        timeLogProcessor.notParsedAddTimeMarkersErrorSummary(),
      );
    }

    this.processedLogContentsWithTimeMarkers = timeLogProcessor.timeReportCsv;
    this.parseProcessedLogContentsWithTimeMarkers();
    // this.timeReportICal = timeLogProcessor.generateIcal();
  }

  public parseProcessedLogContentsWithTimeMarkers() {
    if (!this.processedLogContentsWithTimeMarkers) {
      throw new Error("No valid processedLogContentsWithTimeMarkers");
    }

    const timeLogProcessor = this.getTimeLogProcessor();
    timeLogProcessor.generateTimeReport();

    if (!!timeLogProcessor.notParsedAddTimeMarkers) {
      this.addError(
        "timeReportCsv-notParsedAddTimeMarkers",
        "Time Report was generated upon log contents which had non-understood parts",
      );
    }

    if (!!timeLogProcessor.notParsedTimeReport) {
      this.addError(
        "timeReportCsv-notParsedTimeReport",
        "The following content was not understood by the parser and was thus not regarded while generating the report above",
        timeLogProcessor.notParsedTimeReportErrorSummary(),
      );
    }

    this.timeReportCsv = timeLogProcessor.timeReportCsv;
    this.timeReportData = timeLogProcessor.timeReportData;
    this.preProcessedContents = timeLogProcessor.preProcessedContents;
    this.debug = {
      notParsedAddTimeMarkers: timeLogProcessor.notParsedAddTimeMarkers,
      notParsedTimeReport: timeLogProcessor.notParsedTimeReport,
      rowsWithTimeMarkers: timeLogProcessor.rowsWithTimeMarkers,
    };
    this.timeReportSourceComments = timeLogProcessor.timeReportSourceComments;
    this.timeReportSourceComments = timeLogProcessor.timeReportSourceComments;

    if (strpos(timeLogProcessor.timeReportCsv, "{!}") !== false) {
      this.addError(
        "timeReportCsv",
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
    const timeLogEntriesWithMetadata = Array();
    const timeLogProcessor = this.getTimeLogProcessor();
    this.parseDetectSessionsOneByOne(timeLogProcessor);

    for (const session of Object.values(timeLogProcessor.sessions)) {
      const timeLogEntriesWithMetadataArray = session.timeReportSourceComments;

      // if (empty($row_with_time_marker["durationSinceLast"]))
      // Clues needs a gmtTimestamp - we use dateRaw since it is already in UTC
      // TODO: Add a way to set the session_ref based on log contents in a way that doesn't result in duplicates after re-importing a session with changed start-line-date. Something like a convention to append "#previous-start-ref: start [dateRaw]" or similar to the source line
      for (const timeLogEntryWithMetadata of Object.values(
        timeLogEntriesWithMetadataArray,
      )) {
        // for now skip rows without duration
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
    const starts: any[] = timeLogProcessor.sessionStarts;

    // If only one session was detected, we will not parse the session, but instead simply use the current timeLogProcessor in order to avoid stack overflow

    for (const k of Object.keys(starts)) {
      const start = starts[k];

      let sessionSpecificProcessedTimeSpendingLogTimeLogProcessor;

      try {
        // var_dump($metadata);
        // Store the session metadata
        if (starts.length === 1) {
          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor = timeLogProcessor;
        } else {
          // Get the section of the pre-processed log that corresponds to this session
          const preProcessedLines = timeLogProcessor.preProcessedContents.split(
            "\n",
          );
          const startLine = start.preprocessedContentsSourceLineIndex;

          let length;
          if (!starts[k + 1]) {
            // do nothing
          } else {
            length =
              starts[k + 1].preprocessedContentsSourceLineIndex - 1 - startLine;
          }

          const lines = array_slice(preProcessedLines, startLine, length, true);
          const sessionSpecificTimeSpendingLog = new TimeSpendingLog();
          sessionSpecificTimeSpendingLog.rawLogContents = lines.join("\n");
          sessionSpecificTimeSpendingLog.tzFirst = start.lastKnownTimeZone;
          const sessionSpecificProcessedTimeSpendingLog = new ProcessedTimeSpendingLog(
            sessionSpecificTimeSpendingLog,
          );
          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor =
            sessionSpecificProcessedTimeSpendingLog.timeLogProcessor;
        }

        const timeReportSourceComments =
          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor.timeReportSourceComments;
        const tzFirst =
          sessionSpecificProcessedTimeSpendingLogTimeLogProcessor.tzFirst;
        const metadata = sessionSpecificProcessedTimeSpendingLogTimeLogProcessor.getTimeLogMetadata();
        const timeLogSession: TimeLogSession = {
          k,
          metadata,
          start,
          timeReportSourceComments,
          tzFirst,
        };
        timeLogProcessor.sessions.push(timeLogSession);
      } catch (e) {
        if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
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
              "Encountered a processing error when detecting/parsing sessions individually: " +
                e.message,
              {
                sessionStartMetadata: start,
              },
            );
          }
        }
      }
    }
  }

  /*
  public calculateTotalReportedTime() {
    let total = 0;
    {
      const tmp0 = this.timeReportData;

      for (const date in tmp0) {
        const hoursOrHoursArrayByCategory = tmp0[date];

        if (typeof hoursOrHoursArrayByCategory === "number") {
          total += hoursOrHoursArrayByCategory;
        } else {
          delete hoursOrHoursArrayByCategory.text;
          for (const category in hoursOrHoursArrayByCategory) {
            const hours = hoursOrHoursArrayByCategory[category];
            total += hours;
          }
        }
      }
    }
    return total;
  }
  */
}
