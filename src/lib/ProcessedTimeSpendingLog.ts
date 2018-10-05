//class TimeSpendingLogSessionSpecificProcessingException extends Exception
//{
//    public $processedTimeSpendingLog;
//    public $sessionMetadata;
//}

class ProcessedTimeSpendingLog {
    getProcessingErrors() {
        return this.processingErrors;
    }

    constructor(unprocessedTimeSpendingLog: TimeSpendingLog) {
        this.timeReportData = Array();
        this.processingErrors = Array();
        this.unprocessedTimeSpendingLog = unprocessedTimeSpendingLog;
        this.ensureParsedRawLogContents();
    }

    getTimeLogParser() {
        if (!this.TimeLogParser) {
            this.TimeLogParser = new TimeLogParser();
        }

        return this.TimeLogParser;
    }

    rules() {
        return [["rawLogContents", "required"]];
    }

    attributeLabels() {
        return {
            rawLogContents: "Log contents",
            processedLogContentsWithTimeMarkers: "Log contents with time markers (for sorting) - When finished sorting/categorizing, paste into here once again",
            timeReportCsv: "Time report CSV (Date, Hours in each category, Log messages)",
            timeReportICal: "Time report iCal",
            preProcessedContents: "Pre-processed log contents",
            processedLogContentsWithTimeMarkers_debug: "Time markers parse metadata",
            timeReportCsv_debug: "Time report parse/generate metadata"
        };
    }

    ensureParsedRawLogContents() {
        this.parseRawLogContents();
        var tlp = this.getTimeLogParser();
        this.parseDetectSessionsOneByOne(tlp);

        if (!!this.processingErrors) {
            var e = new TimeSpendingLogProcessingErrorsEncounteredException("Issues encountered (see e->processedTimeSpendingLog->processingErrors for details)");
            e.processedTimeSpendingLog = this;
            throw e;
        }
    }

    parseRawLogContents() {
        if (!this.unprocessedTimeSpendingLog.tzFirst) {
            this.addError("issues-during-initial-parsing", "Empty timezone");
            throw new TimeSpendingLogProcessingErrorsEncounteredException("Empty timezone");
        }

        if (!this.unprocessedTimeSpendingLog.rawLogContents) {
            this.addError("issues-during-initial-parsing", "Empty raw log contents");
            throw new TimeSpendingLogProcessingErrorsEncounteredException("Empty raw log contents");
        }

        var tlp = this.getTimeLogParser();
        tlp.tz_first = this.unprocessedTimeSpendingLog.tzFirst;
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
            this.addError("issues-during-initial-parsing", "The following content was not understood by the parser", tlp.notParsedAddTimeMarkersErrorSummary(tlp.notParsedAddTimeMarkers));
        }

        this.processedLogContentsWithTimeMarkers = tlp.contentsWithTimeMarkers;
        this.parseProcessedLogContentsWithTimeMarkers();
        this.timeReportICal = tlp.generateIcal();
    }

    parseProcessedLogContentsWithTimeMarkers() {
        if (!this.processedLogContentsWithTimeMarkers) {
            throw new Error("No valid processedLogContentsWithTimeMarkers");
        }

        var tlp = this.getTimeLogParser();
        tlp.generateTimeReport();

        if (!!tlp.notParsedAddTimeMarkers) {
            this.addError("timeReportCsv-notParsedAddTimeMarkers", "Time Report was generated upon log contents which had non-understood parts");
        }

        if (!!tlp.notParsedTimeReport) {
            this.addError("timeReportCsv-notParsedTimeReport", "The following content was not understood by the parser and was thus not regarded while generating the report above", tlp.notParsedTimeReportErrorSummary(tlp.notParsedTimeReport));
        }

        this.timeReportCsv = tlp.contentsOfTimeReport;
        this.timeReportData = tlp.timeReportData;
        this.preProcessedContents = tlp.preProcessedContents;
        this.processedLogContentsWithTimeMarkers_debug = JSON.stringify(tlp.debugAddTimeMarkers);
        this.timeReportCsv_debug = JSON.stringify(tlp.debugGenerateTimeReport);
        this.time_report_source_comments = JSON.stringify(tlp.timeReportSourceComments);

        if (strpos(tlp.contentsWithTimeMarkers, "{!}") !== false) {
            this.addError("timeReportCsv-contentsWithTimeMarkers", "{!} was found somewhere in the log file. Note: Estimated (marked with {!}) and needs to be manually adjusted before time report gives an accurate summary. If you already adjusted the durations, don't forget to also remove the \"{!}\"");
        }

        var tlp_dummy = new TimeLogParser();
        tlp_dummy.tz_first = this.unprocessedTimeSpendingLog.tzFirst;
        tlp_dummy.contents = tlp.preProcessedContents;
        tlp_dummy.preProcessContents();

        if (tlp_dummy.preProcessedContents != tlp.preProcessedContents) {
            this.addError("preProcessedContents", "Pre-processing is looping");
        }

        if (!tlp.timeReportData) {
            this.addError("timeReportCsv", "No time to report found");
        }
    }

    addError(ref, message, data = undefined) {
        this.processingErrors.push(compact("ref", "message", "data"));
    }

    getTroubleshootingInfo() {
        var tlp = this.getTimeLogParser();
        return {
            logMetadata: tlp.getTimeLogMetadata()
        };
    }

    getTimeLogEntriesWithMetadata() {
        var timeLogEntriesWithMetadata = Array();
        var tlp = this.getTimeLogParser();
        this.parseDetectSessionsOneByOne(tlp);

        for (var session of Object.values(tlp.sessions)) {
            var timeLogEntriesWithMetadataArray = session.timeReportSourceComments;

            for (var timeLogEntryWithMetadata of Object.values(timeLogEntriesWithMetadataArray)) //for now skip rows without duration
            //if (empty($row_with_time_marker["duration_since_last"]))
            //Clues needs a gmt_timestamp - we use date_raw since it is already in UTC
            //TODO: Add a way to set the session_ref based on log contents in a way that doesn't result in duplicates after re-importing a session with changed start-line-date. Something like a convention to append "#previous-start-ref: start [date_raw]" or similar to the source line
            {
                var gmt_timestamp = timeLogEntryWithMetadata.date_raw.trim();
                var sessionMeta = new stdClass();
                sessionMeta.tz_first = session.tz_first;
                sessionMeta.session_ref = session.start.date_raw;
                var timeLogEntryWithMetadata = Object(timeLogEntryWithMetadata);
                timeLogEntryWithMetadata.gmt_timestamp = gmt_timestamp;
                timeLogEntryWithMetadata.sessionMeta = sessionMeta;
                timeLogEntriesWithMetadata.push(timeLogEntryWithMetadata);
            }
        }

        delete tlp.sessions;
        return timeLogEntriesWithMetadata;
    }

    parseDetectSessionsOneByOne(tlp: TimeLogParser) {
        tlp.sessions = Array();
        var starts = tlp.sessionStarts;

        for (var k in starts) {
            var start = starts[k];

            try //If only one session was detected, we will not parse the session, but instead simply use the current tlp in order to avoid stack overflow
            //var_dump($metadata);
            //Store the session metadata
            {
                if (starts.length == 1) {
                    var sessionSpecificProcessedTimeSpendingLogTimeLogParser = tlp;
                } else //Get the section of the pre-processed log that corresponds to this session
                    {
                        var preProcessedLines = tlp.preProcessedContents.split("\n");
                        var startLine = start.preprocessed_contents_source_line_index;

                        if (!starts[k + 1]) {
                            var length = undefined;
                        } else {
                            length = starts[k + 1].preprocessed_contents_source_line_index - 1 - startLine;
                        }

                        var lines = preProcessedLines.slice(startLine, length, true);
                        var sessionSpecificTimeSpendingLog = new TimeSpendingLog();
                        sessionSpecificTimeSpendingLog.rawLogContents = lines.join("\n");
                        sessionSpecificTimeSpendingLog.tzFirst = start.lastKnownTimeZone;
                        var sessionSpecificProcessedTimeSpendingLog = new ProcessedTimeSpendingLog(sessionSpecificTimeSpendingLog);
                        sessionSpecificProcessedTimeSpendingLogTimeLogParser = sessionSpecificProcessedTimeSpendingLog.TimeLogParser;
                    }

                var timeReportSourceComments = sessionSpecificProcessedTimeSpendingLogTimeLogParser.timeReportSourceComments;
                var tz_first = sessionSpecificProcessedTimeSpendingLogTimeLogParser.tz_first;
                var metadata = sessionSpecificProcessedTimeSpendingLogTimeLogParser.getTimeLogMetadata();
                tlp.sessions.push(compact("timeReportSourceComments", "tz_first", "metadata", "k", "start"));
            } catch (e) {
                if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) //$te = new TimeSpendingLogSessionSpecificProcessingException(
                    //                    'Encountered an exception while detecting/parsing sessions', null, $e
                    //                );
                    //                $te->sessionStartMetadata = $start;
                    //                $te->processedTimeSpendingLog = $e->processedTimeSpendingLog;
                    //                throw $te;
                    {
                        if (e.processedTimeSpendingLog) {
                            if (this.getProcessingErrors().length === 0) {
                                this.addError("session-parsing", "Encountered a processing error which was only evident when detecting/parsing sessions individually: " + e.getMessage(), {
                                    sessionStartMetadata: start,
                                    processingErrors: e.processedTimeSpendingLog.getProcessingErrors()
                                });
                            } else {
                                this.addError("session-parsing", "Encountered a processing error when detecting/parsing sessions individually: " + e.getMessage(), {
                                    sessionStartMetadata: start,
                                    processingErrors: e.processedTimeSpendingLog.getProcessingErrors()
                                });
                            }
                        } else {
                            this.addError("session-parsing", "Encountered a processing error when detecting/parsing sessions individually: " + e.getMessage(), {
                                sessionStartMetadata: start
                            });
                        }
                    }
            }
        }
    }

    calculateTotalReportedTime() {
        var total = 0;
        {
            let _tmp_0 = this.timeReportData;

            for (var date in _tmp_0) {
                var hoursOrHoursArrayByCategory = _tmp_0[date];

                if ("number" === typeof hoursOrHoursArrayByCategory) {
                    total += hoursOrHoursArrayByCategory;
                }

                if (Array.isArray(hoursOrHoursArrayByCategory)) {
                    delete hoursOrHoursArrayByCategory.text;

                    for (var category in hoursOrHoursArrayByCategory) {
                        var hours = hoursOrHoursArrayByCategory[category];
                        total += hours;
                    }
                }
            }
        }
        return total;
    }

};

//@var ProcessedTimeSpendingLog
class TimeSpendingLogProcessingErrorsEncounteredException extends Error {};
