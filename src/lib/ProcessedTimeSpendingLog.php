<?php

class ProcessedTimeSpendingLog
{
    protected $unprocessedTimeSpendingLog;

    public $preProcessedContents;
    public $processedLogContentsWithTimeMarkers;
    public $timeReportCsv;
    public $timeReportData = [];
    public $timeReportICal;
    public $processedLogContentsWithTimeMarkers_debug;
    public $timeReportCsv_debug;
    public $time_report_source_comments;

    public $TimeLogParser;

    protected $processingErrors = [];

    public function getProcessingErrors()
    {
        return $this->processingErrors;
    }

    public function __construct(TimeSpendingLog $unprocessedTimeSpendingLog)
    {
        $this->unprocessedTimeSpendingLog = $unprocessedTimeSpendingLog;
        $this->ensureParsedRawLogContents();
    }

    public function getTimeLogParser()
    {
        if (empty($this->TimeLogParser)) {
            $this->TimeLogParser = new TimeLogParser();
        }
        return $this->TimeLogParser;
    }

    public function rules()
    {
        return array(
            array('rawLogContents', 'required'),
        );
    }

    public function attributeLabels()
    {
        return array(
            'rawLogContents' => 'Log contents',
            'processedLogContentsWithTimeMarkers' => 'Log contents with time markers (for sorting) - When finished sorting/categorizing, paste into here once again',
            'timeReportCsv' => 'Time report CSV (Date, Hours in each category, Log messages)',
            'timeReportICal' => 'Time report iCal',
            'preProcessedContents' => 'Pre-processed log contents',
            'processedLogContentsWithTimeMarkers_debug' => 'Time markers parse metadata',
            'timeReportCsv_debug' => 'Time report parse/generate metadata',
        );
    }

    public function ensureParsedRawLogContents()
    {
        $this->parseRawLogContents();
        $tlp = $this->getTimeLogParser();
        $this->parseDetectSessionsOneByOne($tlp);
        if (!empty($this->processingErrors)) {
            $e = new TimeSpendingLogProcessingErrorsEncounteredException(
                'Issues encountered (see e->processedTimeSpendingLog->processingErrors for details)'
            );
            $e->processedTimeSpendingLog = $this;
            throw $e;
        }
    }

    public function parseRawLogContents()
    {

        if (empty($this->unprocessedTimeSpendingLog->tzFirst)) {
            $this->addError(
                'issues-during-initial-parsing',
                "Empty timezone"
            );
            throw new TimeSpendingLogProcessingErrorsEncounteredException("Empty timezone");
        }
        if (empty($this->unprocessedTimeSpendingLog->rawLogContents)) {
            $this->addError(
                'issues-during-initial-parsing',
                "Empty raw log contents"
            );
            throw new TimeSpendingLogProcessingErrorsEncounteredException("Empty raw log contents");
        }

        $tlp = $this->getTimeLogParser();
        $tlp->tz_first = $this->unprocessedTimeSpendingLog->tzFirst;
        $tlp->contents = $this->unprocessedTimeSpendingLog->rawLogContents;

        try {
            $tlp->addTimeMarkers();
        } catch (TimeLogParsingException $e) {
            $this->addError('addTimeMarkers TimeLogParsingException', $e->getMessage());
            return;
        }

        if (!empty($tlp->notParsedAddTimeMarkers)) {
            $this->addError(
                'issues-during-initial-parsing',
                "The following content was not understood by the parser",
                $tlp->notParsedAddTimeMarkersErrorSummary(
                    $tlp->notParsedAddTimeMarkers
                )
            );
        }

        $this->processedLogContentsWithTimeMarkers = $tlp->contentsWithTimeMarkers;

        $this->parseProcessedLogContentsWithTimeMarkers();

        $this->timeReportICal = $tlp->generateIcal();

    }

    public function parseProcessedLogContentsWithTimeMarkers()
    {

        if (empty($this->processedLogContentsWithTimeMarkers)) {
            throw new Exception("No valid processedLogContentsWithTimeMarkers");
        }
        $tlp = $this->getTimeLogParser();

        $tlp->generateTimeReport();
        if (!empty($tlp->notParsedAddTimeMarkers)) {
            $this->addError(
                'timeReportCsv-notParsedAddTimeMarkers',
                'Time Report was generated upon log contents which had non-understood parts'
            );
        }
        if (!empty($tlp->notParsedTimeReport)) {
            $this->addError(
                'timeReportCsv-notParsedTimeReport',
                "The following content was not understood by the parser and was thus not regarded while generating the report above",
                $tlp->notParsedTimeReportErrorSummary(
                    $tlp->notParsedTimeReport
                )
            );
        }

        $this->timeReportCsv = $tlp->contentsOfTimeReport;
        $this->timeReportData = $tlp->timeReportData;

        $this->preProcessedContents = $tlp->preProcessedContents;
        $this->processedLogContentsWithTimeMarkers_debug = json_encode($tlp->debugAddTimeMarkers);
        $this->timeReportCsv_debug = json_encode($tlp->debugGenerateTimeReport);
        $this->time_report_source_comments = json_encode($tlp->timeReportSourceComments);

        if (strpos($tlp->contentsWithTimeMarkers, "{!}") !== false) {
            $this->addError(
                'timeReportCsv-contentsWithTimeMarkers',
                '{!} was found somewhere in the log file. Note: Estimated (marked with {!}) and needs to be manually adjusted before time report gives an accurate summary. If you already adjusted the durations, don\'t forget to also remove the "{!}"'
            );
        }

        // Dummy check. Pre-processed contents should not change when preprocessed
        $tlp_dummy = new TimeLogParser();
        $tlp_dummy->tz_first = $this->unprocessedTimeSpendingLog->tzFirst;
        $tlp_dummy->contents = $tlp->preProcessedContents;
        $tlp_dummy->preProcessContents();
        if ($tlp_dummy->preProcessedContents != $tlp->preProcessedContents) {
            $this->addError('preProcessedContents', 'Pre-processing is looping');
        }

        // Double check that we have any reported time... If not, there is surely an error
        if (empty($tlp->timeReportData)) {
            $this->addError('timeReportCsv', 'No time to report found');
        }

    }

    public function addError($ref, $message, $data = null)
    {
        $this->processingErrors[] = compact("ref", "message", "data");
    }

    public function getTroubleshootingInfo()
    {
        $tlp = $this->getTimeLogParser();
        return ["logMetadata" => $tlp->getTimeLogMetadata()];
    }

    public function getTimeLogEntriesWithMetadata()
    {

        $timeLogEntriesWithMetadata = array();

        $tlp = $this->getTimeLogParser();

        $this->parseDetectSessionsOneByOne($tlp);

        foreach ($tlp->sessions as &$session) {

            $timeLogEntriesWithMetadataArray = $session["timeReportSourceComments"];

            foreach ($timeLogEntriesWithMetadataArray as $timeLogEntryWithMetadata) {

                // for now skip rows without duration
                //if (empty($row_with_time_marker["duration_since_last"]))

                // Clues needs a gmt_timestamp - we use date_raw since it is already in UTC
                $gmt_timestamp = trim($timeLogEntryWithMetadata["date_raw"]);

                $sessionMeta = new stdClass;
                $sessionMeta->tz_first = $session["tz_first"];
                // TODO: Add a way to set the session_ref based on log contents in a way that doesn't result in duplicates after re-importing a session with changed start-line-date. Something like a convention to append "#previous-start-ref: start [date_raw]" or similar to the source line
                $sessionMeta->session_ref = $session["start"]["date_raw"];

                $timeLogEntryWithMetadata = (object) $timeLogEntryWithMetadata;
                $timeLogEntryWithMetadata->gmt_timestamp = $gmt_timestamp;
                $timeLogEntryWithMetadata->sessionMeta = $sessionMeta;
                $timeLogEntriesWithMetadata[] = $timeLogEntryWithMetadata;

            }

        }

        unset($tlp->sessions);

        return $timeLogEntriesWithMetadata;
    }

    function parseDetectSessionsOneByOne(TimeLogParser $tlp)
    {

        $tlp->sessions = [];

        $starts =& $tlp->sessionStarts;

        foreach ($starts as $k => $start) {

            try {

                // If only one session was detected, we will not parse the session, but instead simply use the current tlp in order to avoid stack overflow
                if (count($starts) == 1) {

                    $sessionSpecificProcessedTimeSpendingLogTimeLogParser = $tlp;

                } else {

                    // Get the section of the pre-processed log that corresponds to this session

                    $preProcessedLines = explode("\n", $tlp->preProcessedContents);
                    $startLine = $start["preprocessed_contents_source_line_index"];
                    if (empty($starts[$k + 1])) {
                        $length = null;
                    } else {
                        $length = $starts[$k + 1]["preprocessed_contents_source_line_index"] - 1 - $startLine;
                    }

                    $lines = array_slice($preProcessedLines, $startLine, $length, true);

                    $sessionSpecificTimeSpendingLog = new TimeSpendingLog();

                    $sessionSpecificTimeSpendingLog->rawLogContents = implode("\n", $lines);
                    $sessionSpecificTimeSpendingLog->tzFirst = $start["lastKnownTimeZone"];

                    $sessionSpecificProcessedTimeSpendingLog = new ProcessedTimeSpendingLog(
                        $sessionSpecificTimeSpendingLog
                    );

                    $sessionSpecificProcessedTimeSpendingLogTimeLogParser = $sessionSpecificProcessedTimeSpendingLog->TimeLogParser;

                }

                $timeReportSourceComments = $sessionSpecificProcessedTimeSpendingLogTimeLogParser->timeReportSourceComments;
                $tz_first = $sessionSpecificProcessedTimeSpendingLogTimeLogParser->tz_first;
                $metadata = $sessionSpecificProcessedTimeSpendingLogTimeLogParser->getTimeLogMetadata();

                //var_dump($metadata);

                // Store the session metadata
                $tlp->sessions[] = compact(
                    "timeReportSourceComments",
                    "tz_first",
                    "metadata",
                    "k",
                    "start"
                );

            } catch (TimeSpendingLogProcessingErrorsEncounteredException $e) {

                if ($e->processedTimeSpendingLog) {
                    if (count($this->getProcessingErrors()) === 0) {
                        $this->addError(
                            'session-parsing',
                            'Encountered a processing error which was only evident when detecting/parsing sessions individually: '
                            . $e->getMessage(),
                            [
                                "sessionStartMetadata" => $start,
                                "processingErrors" => $e->processedTimeSpendingLog->getProcessingErrors(),
                            ]
                        );
                    } else {
                        $this->addError(
                            'session-parsing',
                            'Encountered a processing error when detecting/parsing sessions individually: '
                            . $e->getMessage(),
                            [
                                "sessionStartMetadata" => $start,
                                "processingErrors" => $e->processedTimeSpendingLog->getProcessingErrors(),
                            ]
                        );
                    }
                } else {
                    $this->addError(
                        'session-parsing',
                        'Encountered a processing error when detecting/parsing sessions individually: '
                        . $e->getMessage(),
                        [
                            "sessionStartMetadata" => $start
                        ]
                    );
                }

                /*
                $te = new TimeSpendingLogSessionSpecificProcessingException(
                    'Encountered an exception while detecting/parsing sessions', null, $e
                );
                $te->sessionStartMetadata = $start;
                $te->processedTimeSpendingLog = $e->processedTimeSpendingLog;
                throw $te;
                */
            }

        }

    }

    public function calculateTotalReportedTime()
    {

        $total = 0;
        foreach ($this->timeReportData as $date => $hoursOrHoursArrayByCategory) {
            if (is_int($hoursOrHoursArrayByCategory)) {
                $total += $hoursOrHoursArrayByCategory;
            }
            if (is_array($hoursOrHoursArrayByCategory)) {
                unset($hoursOrHoursArrayByCategory["text"]);
                foreach ($hoursOrHoursArrayByCategory as $category => $hours) {
                    $total += $hours;
                }
            }
        }
        return $total;

    }

}

class TimeSpendingLogProcessingErrorsEncounteredException extends Exception
{
    /** @var ProcessedTimeSpendingLog */
    public $processedTimeSpendingLog;
}

/*
class TimeSpendingLogSessionSpecificProcessingException extends Exception
{
    public $processedTimeSpendingLog;
    public $sessionMetadata;
}
*/