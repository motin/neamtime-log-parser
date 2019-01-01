// class TimeSpendingLogSessionSpecificProcessingException extends Exception
// {
//    public $processedTimeSpendingLog;
//    public $sessionMetadata;
// }

import { TimeLogParser } from "./TimeLogParser";
import { TimeSpendingLog } from "./TimeSpendingLog";

export class ProcessedTimeSpendingLog {
  public timeReportData: [];
  public processingErrors: [];
  public unprocessedTimeSpendingLog: TimeSpendingLog;
  public timeReportCsv;

  private TimeLogParser: TimeLogParser;

  constructor(unprocessedTimeSpendingLog: TimeSpendingLog) {
    this.timeReportData = [];
    this.processingErrors = [];
    this.unprocessedTimeSpendingLog = unprocessedTimeSpendingLog;
    this.ensureParsedRawLogContents();
  }

  public getProcessingErrors() {
    return this.processingErrors;
  }

  public getTimeLogParser() {
    if (!this.TimeLogParser) {
      this.TimeLogParser = new TimeLogParser();
    }

    return this.TimeLogParser;
  }

  public rules() {
    return [["rawLogContents", "required"]];
  }

  public attributeLabels() {
    return {
      rawLogContents: "Log contents",
      processedLogContentsWithTimeMarkers:
        "Log contents with time markers (for sorting) - When finished sorting/categorizing, paste into here once again",
      timeReportCsv:
        "Time report CSV (Date, Hours in each category, Log messages)",
      timeReportICal: "Time report iCal",
      preProcessedContents: "Pre-processed log contents",
      processedLogContentsWithTimeMarkers_debug: "Time markers parse metadata",
      timeReportCsv_debug: "Time report parse/generate metadata",
    };
  }

  public ensureParsedRawLogContents() {
    this.parseRawLogContents();
    const tlp = this.getTimeLogParser();
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

    const tlp = this.getTimeLogParser();
    tlp.tzFirst = this.unprocessedTimeSpendingLog.tzFirst;
    tlp.contents = this.unprocessedTimeSpendingLog.rawLogContents;

    try {
      tlp.addTimeMarkers();
    } catch (e) {
      if (e instanceof TimeLogParsingException) {
        this.addError("addTimeMarkers TimeLogParsingException", e.getMessage());
        return;
      }
    }

    if (!!tlp.notParsedAddTimeMarkers) {
      this.addError(
        "issues-during-initial-parsing",
        "The following content was not understood by the parser",
        tlp.notParsedAddTimeMarkersErrorSummary(tlp.notParsedAddTimeMarkers),
      );
    }

    this.processedLogContentsWithTimeMarkers = tlp.contentsWithTimeMarkers;
    this.parseProcessedLogContentsWithTimeMarkers();
    this.timeReportICal = tlp.generateIcal();
  }

  public parseProcessedLogContentsWithTimeMarkers() {
    if (!this.processedLogContentsWithTimeMarkers) {
      throw new Error("No valid processedLogContentsWithTimeMarkers");
    }

    const tlp = this.getTimeLogParser();
    tlp.generateTimeReport();

    if (!!tlp.notParsedAddTimeMarkers) {
      this.addError(
        "timeReportCsv-notParsedAddTimeMarkers",
        "Time Report was generated upon log contents which had non-understood parts",
      );
    }

    if (!!tlp.notParsedTimeReport) {
      this.addError(
        "timeReportCsv-notParsedTimeReport",
        "The following content was not understood by the parser and was thus not regarded while generating the report above",
        tlp.notParsedTimeReportErrorSummary(tlp.notParsedTimeReport),
      );
    }

    this.timeReportCsv = tlp.contentsOfTimeReport;
    this.timeReportData = tlp.timeReportData;
    this.preProcessedContents = tlp.preProcessedContents;
    this.processedLogContentsWithTimeMarkers_debug = JSON.stringify(
      tlp.debugAddTimeMarkers,
    );
    this.timeReportCsv_debug = JSON.stringify(tlp.debugGenerateTimeReport);
    this.time_report_source_comments = JSON.stringify(
      tlp.timeReportSourceComments,
    );

    if (strpos(tlp.contentsWithTimeMarkers, "{!}") !== false) {
      this.addError(
        "timeReportCsv-contentsWithTimeMarkers",
        '{!} was found somewhere in the log file. Note: Estimated (marked with {!}) and needs to be manually adjusted before time report gives an accurate summary. If you already adjusted the durations, don\'t forget to also remove the "{!}"',
      );
    }

    const tlp_dummy = new TimeLogParser();
    tlp_dummy.tzFirst = this.unprocessedTimeSpendingLog.tzFirst;
    tlp_dummy.contents = tlp.preProcessedContents;
    tlp_dummy.preProcessContents();

    if (tlp_dummy.preProcessedContents !== tlp.preProcessedContents) {
      this.addError("preProcessedContents", "Pre-processing is looping");
    }

    if (!tlp.timeReportData) {
      this.addError("timeReportCsv", "No time to report found");
    }
  }

  public addError(ref, message, data = undefined) {
    this.processingErrors.push({ ref, message, data });
  }

  public getTroubleshootingInfo() {
    const tlp = this.getTimeLogParser();
    return {
      logMetadata: tlp.getTimeLogMetadata(),
    };
  }

  public getTimeLogEntriesWithMetadata() {
    const timeLogEntriesWithMetadata = Array();
    const tlp = this.getTimeLogParser();
    this.parseDetectSessionsOneByOne(tlp);

    for (const session of Object.values(tlp.sessions)) {
      const timeLogEntriesWithMetadataArray = session.timeReportSourceComments;

      // if (empty($row_with_time_marker["durationSinceLast"]))
      // Clues needs a gmtTimestamp - we use dateRaw since it is already in UTC
      // TODO: Add a way to set the session_ref based on log contents in a way that doesn't result in duplicates after re-importing a session with changed start-line-date. Something like a convention to append "#previous-start-ref: start [dateRaw]" or similar to the source line
      for (const timeLogEntryWithMetadata of Object.values(
        timeLogEntriesWithMetadataArray,
      )) {
        // for now skip rows without duration
        const gmtTimestamp = timeLogEntryWithMetadata.dateRaw.trim();
        const sessionMeta = new stdClass();
        sessionMeta.tzFirst = session.tzFirst;
        sessionMeta.session_ref = session.start.dateRaw;
        const timeLogEntryWithMetadata = Object(timeLogEntryWithMetadata);
        timeLogEntryWithMetadata.gmtTimestamp = gmtTimestamp;
        timeLogEntryWithMetadata.sessionMeta = sessionMeta;
        timeLogEntriesWithMetadata.push(timeLogEntryWithMetadata);
      }
    }

    delete tlp.sessions;
    return timeLogEntriesWithMetadata;
  }

  public parseDetectSessionsOneByOne(tlp: TimeLogParser) {
    tlp.sessions = Array();
    const starts = tlp.sessionStarts;

    for (const k in starts) {
      const start = starts[k];

      try // If only one session was detected, we will not parse the session, but instead simply use the current tlp in order to avoid stack overflow
      {
        // var_dump($metadata);
        // Store the session metadata
        if (starts.length === 1) {
          const sessionSpecificProcessedTimeSpendingLogTimeLogParser = tlp;
        } // Get the section of the pre-processed log that corresponds to this session
        else {
          const preProcessedLines = tlp.preProcessedContents.split("\n");
          const startLine = start.preprocessed_contents_source_line_index;

          if (!starts[k + 1]) {
            let length;
          } else {
            length =
              starts[k + 1].preprocessed_contents_source_line_index -
              1 -
              startLine;
          }

          const lines = preProcessedLines.slice(startLine, length, true);
          const sessionSpecificTimeSpendingLog = new TimeSpendingLog();
          sessionSpecificTimeSpendingLog.rawLogContents = lines.join("\n");
          sessionSpecificTimeSpendingLog.tzFirst = start.lastKnownTimeZone;
          const sessionSpecificProcessedTimeSpendingLog = new ProcessedTimeSpendingLog(
            sessionSpecificTimeSpendingLog,
          );
          sessionSpecificProcessedTimeSpendingLogTimeLogParser =
            sessionSpecificProcessedTimeSpendingLog.TimeLogParser;
        }

        const timeReportSourceComments =
          sessionSpecificProcessedTimeSpendingLogTimeLogParser.timeReportSourceComments;
        const tzFirst =
          sessionSpecificProcessedTimeSpendingLogTimeLogParser.tzFirst;
        const metadata = sessionSpecificProcessedTimeSpendingLogTimeLogParser.getTimeLogMetadata();
        tlp.sessions.push(
          compact(
            "timeReportSourceComments",
            "tzFirst",
            "metadata",
            "k",
            "start",
          ),
        );
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
                  e.getMessage(),
                {
                  sessionStartMetadata: start,
                  processingErrors: e.processedTimeSpendingLog.getProcessingErrors(),
                },
              );
            } else {
              this.addError(
                "session-parsing",
                "Encountered a processing error when detecting/parsing sessions individually: " +
                  e.getMessage(),
                {
                  sessionStartMetadata: start,
                  processingErrors: e.processedTimeSpendingLog.getProcessingErrors(),
                },
              );
            }
          } else {
            this.addError(
              "session-parsing",
              "Encountered a processing error when detecting/parsing sessions individually: " +
                e.getMessage(),
              {
                sessionStartMetadata: start,
              },
            );
          }
        }
      }
    }
  }

  public calculateTotalReportedTime() {
    let total = 0;
    {
      const _tmp_0 = this.timeReportData;

      for (const date in _tmp_0) {
        const hoursOrHoursArrayByCategory = _tmp_0[date];

        if ("number" === typeof hoursOrHoursArrayByCategory) {
          total += hoursOrHoursArrayByCategory;
        }

        if (Array.isArray(hoursOrHoursArrayByCategory)) {
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
}

// @var ProcessedTimeSpendingLog
class TimeSpendingLogProcessingErrorsEncounteredException extends Error {}
