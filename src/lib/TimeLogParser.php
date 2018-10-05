<?php

class TimeLogParser extends LogParser
{

    // Main contents holders
    var $contents = null;
    var $preProcessedContents = "";
    var $contentsWithTimeMarkers = "";
    var $contentsOfTimeReport = "";

    // Metadata arrays
    var $timeReportData = array();
    var $notParsedTimeReport = array();
    var $sessionStarts = array();
    var $sessions = array();
    var $timeReportSourceComments = array();

    // Helper variables
    var $categories = array();
    public $collectDebugInfo = false;
    var $debugAddTimeMarkers = array();
    var $debugGenerateTimeReport = array();
    var $preProcessedContentsSourceLineContentsSourceLineMap = [];

    //var $notParsedAndNotStartStopLinesTimeReport = array();

    function tokens()
    {
        return array(
            'approx' => array('ca', 'appr'),
            // Note: The following tokens needs to be ordered in a way so that inclusive tokens come later than their matches, ie "paus" must come after "pause" since "paus" is included in "pause"
            'pause' => array('pause', 'paus' /*, 'lunch'*/, /*'stop '*/ /*,'t '*/),
            'start-stop' => array('start', 'stop'),
            'start' => array('start'),
            // Note: commenting 't ' disabled detection of 't [timestamp]' but enables starting row with 't ex' - also commented out below
        );
    }

    function startsWithOptionallySuffixedToken($haystack, $keyword, $suffix = "")
    {
        $tokens = $this->tokens();
        foreach ($tokens[$keyword] as $token) {
            if (strpos(trim($haystack), $token . $suffix) === 0) {
                return $token;
            }
        }
        return false;
    }

    function removeSuffixedToken($string, $keyword, $suffix)
    {
        $return = $string;
        $tokens = $this->tokens();
        foreach ($tokens[$keyword] as $token) {
            $return = str_replace($token . $suffix, "", $return);
        }
        return $return;
    }

    /**
     * @param $date_raw
     * @param $ts
     * @param $date
     * @param null $linewithoutdate
     * @param $datetime
     * @throws Exception
     * @throws InvalidDateTimeZoneException
     */
    public function set_ts_and_date($date_raw, &$ts, &$date, $linewithoutdate = null, &$datetime)
    {
        $this->lastSetTsAndDateErrorMessage = "";

        // Invalidate strings that are clearly too large to be a timestamp
        if (strlen($date_raw) > 50) {
            $this->lastSetTsAndDateErrorMessage = "Invalidate strings that are clearly too large to be a timestamp";
            return;
        }

        // Invalidate strings that do not contain numbers, since they can not be a timestamp
        preg_match('/[0-9]+/', $date_raw, $m);
        //var_dump($date_raw,$m);
        if (empty($m)) {
            $this->lastSetTsAndDateErrorMessage = "Invalidate strings that do not contain numbers, since they can not be a timestamp";
            return;
        }

        // Prepend the last known date if the timestamp seems to short
        if (strlen($date_raw) < 8) {
            $date_raw = $this->lastKnownDate . " $date_raw";
            //var_dump($date_raw);
        }

        $tokens = $this->tokens();
        $date_raw = trim(str_replace($tokens["approx"], "", $date_raw));

        parent::set_ts_and_date($date_raw, $ts, $date, $linewithoutdate, $datetime);

    }

    function loadContentsFromFile()
    {

        $tspath = $_SERVER["argv"][1];

        $this->contents = file_get_contents("$tspath.txt");

    }

    function isProbableStartStopLine($line, $dump = false)
    {
        $trimmedLine = trim($line);

        $startsWithPauseTokenFollowedByASpace = $this->startsWithOptionallySuffixedToken($trimmedLine, "pause", " ");
        $startsWithStartStopTokenFollowedByASpace = $this->startsWithOptionallySuffixedToken(
            $trimmedLine,
            "start-stop",
            " "
        );
        $startsWithPauseTokenFollowedByAnArrow = $this->startsWithOptionallySuffixedToken($trimmedLine, "pause", "->");
        $startsWithStartStopTokenFollowedByAnArrow = $this->startsWithOptionallySuffixedToken(
            $trimmedLine,
            "start-stop",
            "->"
        );
        $return =
            (
                // detectors of pause/stop lines
                /*                    strpos($trimmedLine, "-".($cYear-3)) !== false ||
                                    strpos($trimmedLine, "-".($cYear-2)) !== false ||
                                    strpos($trimmedLine, "-".($cYear-1)) !== false ||
                                    strpos($trimmedLine, "-".$cYear) !== false ||
                                    strpos($trimmedLine, "-".($cYear+1)) !== false ||
                                    strpos($trimmedLine, "-".($cYear+2)) !== false ||
                                    strpos($trimmedLine, "-".($cYear+3)) !== false ||*/
                $startsWithPauseTokenFollowedByASpace ||
                $startsWithStartStopTokenFollowedByASpace ||
                $startsWithPauseTokenFollowedByAnArrow ||
                $startsWithStartStopTokenFollowedByAnArrow ||
                false
            ) &&
            // not pause/stop lines if matches any of these conditions
            strpos($trimmedLine, "[") !== 0 &&
            //strpos($trimmedLine, "]") === false &&
            strpos($trimmedLine, "_start") === false &&
            strpos($trimmedLine, "_pause") === false &&
            strpos($trimmedLine, " | ") === false && // probably a summary line
            !$this->isProbableCommitLogLine($trimmedLine) &&
            strpos(
                $trimmedLine,
                "#"
            ) !== 0 && // we can use brackets to prevent parser from treating as any start/stop row, even if it contains a date
            true;
        if ($dump) {
            var_dump($trimmedLine, $trimmedLine, str_hex($trimmedLine), $return);
        }
        return $return;
    }

    function countDigits($str)
    {
        return preg_match_all("/[0-9]/", $str);
    }

    function isProbableCommitLogLine($line)
    {
        $trimmedLine = trim($line);
        return strpos($trimmedLine, "+ ") === 0 ||
            strpos($trimmedLine, "* ") === 0 ||
            strpos($trimmedLine, "^ ") === 0 ||
            strpos($trimmedLine, "! ") === 0;
    }

    public function preProcessContents()
    {
        $this->preProcessedContents = $this->getPreProcessedContents($this->tz_first, $this->contents);
    }

    protected function getPreProcessedContents($tz_first, $contents)
    {

        $this->lastKnownTimeZone = $tz_first;

        $processed = array();
        $lines = static::textIntoLinesArray($contents);
        $nextNeedToBeStart = true;

        // Phase 0 - skip lines after "#endts"
        $_lines = $lines;
        $lines = array();
        foreach ($_lines as $k => $line) {
            if (trim($line) == "#endts") {
                break;
            }
            $lines[] = $line;
        }

        // Phase 1 - paus-fixes
        $phase1_source_line_contents_source_line_map = [];
        foreach ($lines as $source_line_index => $line) {

            // always use trimmed line for comparisons
            $trimmedLine = trim($line);

            // Actual source line is +1
            $source_line = $source_line_index + 1;

            // Skip empty lines
            $testempty = $trimmedLine;
            if (empty($testempty)) {
                $processed[] = $trimmedLine;
                $phase1_source_line_contents_source_line_map[count($processed)] = $source_line;
                continue;
            }

            // Correct a forgivable and fixable typo
            $token = $this->startsWithOptionallySuffixedToken($trimmedLine, "pause", " ->");
            if ($token) {
                $trimmedLine = str_replace("$token ->", "$token->", $trimmedLine);
            }

            // Convert certain special type of lines
            // A. paus <timestamp>-> is a log message row implicitly but without message:
            $token = $this->startsWithOptionallySuffixedToken($trimmedLine, "pause");
            if (!empty($token) &&
                strpos($trimmedLine, "->") !== false
            ) {
                $rowParts = explode("->", $trimmedLine);

                // Checking if a timestamp exists before the "->"
                $tokens = $this->tokens();
                $trimmedLinefordatecheck = str_replace($tokens["pause"], "", trim($rowParts[0]));
                $trimmedLinefordatecheck = str_replace($tokens["approx"], "", $trimmedLinefordatecheck);

                if (strlen($trimmedLinefordatecheck) > 1 && strpos($trimmedLinefordatecheck, "min") === false) {

                    $this->detectTimeStamp($trimmedLinefordatecheck, $metadata);

                    $datetime = null;
                    $this->set_ts_and_date($metadata["date_raw"], $ts, $date, null, $datetime);
                    //var_dump($metadata["date_raw"], $trimmedLinefordatecheck, $ts, $date);
                    //$invalid = empty($date);

                    if (!empty($metadata["date_raw"])) {
                        //$formatted_date = gmdate("Y-m-d H:i", $ts); //:s
                        $implicitMessage = $trimmedLinefordatecheck . ", <just before $token>";
                        $processed[] = $implicitMessage;
                        $phase1_source_line_contents_source_line_map[count($processed)] = $source_line;
                        $processed[] = "$token->" . $rowParts[1];
                        $phase1_source_line_contents_source_line_map[count($processed)] = $source_line;
                        continue;
                    }

                }

            }

            $processed[] = $trimmedLine;
            $phase1_source_line_contents_source_line_map[count($processed)] = $source_line;

        }

        // Phase 2 - missing start-lines
        $lines = $processed;
        $processed = array();
        foreach ($lines as $phase_1_processed_line_index => $line) {

            // always use trimmed line for comparisons
            $trimmedLine = trim($line);

            // Actual source line is +1
            $phase_1_processed_line = $phase_1_processed_line_index + 1;

            // Get raw source line
            $source_line = $phase1_source_line_contents_source_line_map[$phase_1_processed_line];

            // Skip empty lines
            $testempty = $trimmedLine;
            if (empty($testempty)) {
                $processed[] = $trimmedLine;
                $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                continue;
            }

            // Check that a "start" always exists first or after a "paus->". If not, we probably forgot to log the start of a session
            if (strpos($trimmedLine, "start") === 0) {
                $nextNeedToBeStart = false;
            }
            if ($nextNeedToBeStart) {

                // We have a certain syntax that can recover a missing start line, let's check for that:
                $date_raw = null;
                $ts = null;
                $date = null;
                $trimmedLinewithoutdate = null;
                $notTheFirstRowOfALogComment = null;
                /** @var DateTime $datetime */
                $datetime = null;
                $this->parseLogComment(
                    $trimmedLine,
                    $date_raw,
                    $ts,
                    $date,
                    $trimmedLinewithoutdate,
                    $notTheFirstRowOfALogComment,
                    $datetime
                );

                if (!$notTheFirstRowOfALogComment) {

                    $preg = '/^(ca|appr)? ?((\d)+h)?(\d+)min/'; // todo dynamic insertion of apprtokens
                    preg_match($preg, $trimmedLinewithoutdate, $m);

                    if (!empty($m)) {
                        $apprtoken = $m[1];
                        $hours = intval($m[3]);
                        $minutes = intval($m[4]) + $hours * 60;
                    } else {

                        // Check for hours without minutes as well

                        $preg = '/^(ca|appr)? ?(\d)+h/'; // todo dynamic insertion of apprtokens
                        preg_match($preg, $trimmedLinewithoutdate, $m);

                        if (!empty($m)) {
                            $apprtoken = $m[1];
                            $hours = intval($m[2]);
                            $minutes = $hours * 60;
                        }

                    }

                    if (!empty($minutes)) {

                        // Here we, instead of start, have a single line with a duration. We can calculate the start from this...
                        $interval = DateInterval::createFromDateString($minutes . ' minutes');
                        if (!$datetime) {
                            throw new TimeLogParsingException(
                                "To be able to calculate the special-syntax-missing-start-line we need to have the DateTime object of the line to subtract from"
                            );
                        }
                        $probableStartDateTime = $datetime->sub($interval);

                        $probableStart = $probableStartDateTime->format(
                            "Y-m-d H:i"
                        ); //gmdate("Y-m-d H:i", $ts - $minutes * 60);

                        //var_dump(__LINE__, $probableStart, $date, $minutes, $this->lastKnownTimeZone);

                        $processed[] = "start $probableStart" . $apprtoken; //note: timestamp generated from duration info in line below;
                        $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                        $processed[] = "";
                        $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                        $processed[] = $trimmedLine;
                        $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                        //$processed[] = "start MISSING? asdasdas: ".$trimmedLinewithoutdate.print_r(array($trimmedLine, $date_raw, $date, $trimmedLinewithoutdate, $notTheFirstRowOfALogComment), true).print_r($m, true);
                        $nextNeedToBeStart = false;
                        continue;

                    }

                }

                // We have something outside start/paus blocks and have probably missed a start hint
                // However, we must allow/ignore comments here - prefixed with #
                if (strpos($trimmedLine, "#") === 0) {
                    continue;
                }

                // Also allow (and save) tz-specifications
                if (strpos($trimmedLine, "|tz:") === 0) {
                    $processed[] = $trimmedLine;
                    $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                    $nextNeedToBeStart = true;
                    continue;
                }

                $processed[] = "start MISSING?";
                $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                $nextNeedToBeStart = false;

            }
            $token = $this->startsWithOptionallySuffixedToken($trimmedLine . "|$", "pause", "->|$");
            if ($token) {
                $processed[] = $trimmedLine;
                $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;
                $nextNeedToBeStart = true;
                continue;
            }

            $processed[] = $trimmedLine;
            $this->preProcessedContentsSourceLineContentsSourceLineMap[count($processed)] = $source_line;

        }

        return static::linesArrayIntoText($processed);

    }

    function parseLogComment(
        $line,
        &$date_raw,
        &$ts,
        &$date,
        &$linewithoutdate,
        &$notTheFirstRowOfALogComment,
        &$datetime
    )
    {

        // "," is the main separator between date and any written comment...
        $this->parseLogCommentWithSeparator(
            ",",
            $line,
            $date_raw,
            $ts,
            $date,
            $linewithoutdate,
            $notTheFirstRowOfALogComment,
            $datetime
        );
        if (!$notTheFirstRowOfALogComment) {
            return;
        }

        // Try out " -" instead of "," as main separator
        $this->parseLogCommentWithSeparator(
            " -",
            $line,
            $date_raw,
            $ts,
            $date,
            $linewithoutdate,
            $notTheFirstRowOfALogComment,
            $datetime
        );
        if (!$notTheFirstRowOfALogComment) {
            return;
        }

        // Try out ": " instead of "," as main separator
        $this->parseLogCommentWithSeparator(
            ": ",
            $line,
            $date_raw,
            $ts,
            $date,
            $linewithoutdate,
            $notTheFirstRowOfALogComment,
            $datetime
        );
        if (!$notTheFirstRowOfALogComment) {
            return;
        }

    }

    function parseLogCommentWithSeparator(
        $separator,
        $line,
        &$date_raw,
        &$ts,
        &$date,
        &$linewithoutdate,
        &$notTheFirstRowOfALogComment,
        &$datetime
    )
    {

        $parts = explode($separator, $line);
        $date_raw = array_shift($parts);
        $date = null;
        $linewithoutdate = implode($separator, $parts);
        $datetime = null;

        // Check if we have a valid date already
        $this->parseLogCommentDateRawCandidate(
            $date_raw,
            $ts,
            $date,
            $linewithoutdate,
            $notTheFirstRowOfALogComment,
            $datetime
        );

        // If not, allow one more separated chunk into the date_raw and try again
        // since some timestamp formats may include the seperator (at most once)
        if ($notTheFirstRowOfALogComment && count($parts) > 1) {

            $date_raw .= $separator . array_shift($parts);
            $date = null;
            $linewithoutdate = implode($separator, $parts);
            $datetime = null;

            $this->parseLogCommentDateRawCandidate(
                $date_raw,
                $ts,
                $date,
                $linewithoutdate,
                $notTheFirstRowOfALogComment,
                $datetime
            );

        }

    }

    function parseLogCommentDateRawCandidate(
        &$date_raw,
        &$ts,
        &$date,
        &$linewithoutdate,
        &$notTheFirstRowOfALogComment,
        &$datetime
    )
    {

        // invalidate pure numbers (including those with fractional parts) if there is no comment on the other side - probably not a real log comment
        preg_match('/[0-9\.\,]+/', $date_raw, $m);
        if (!empty($m[0])) {
            $firstMatch = $m[0];
            $trimmedDateRaw = trim($date_raw);
            if (str_replace(['.', ','], '', $firstMatch) === str_replace(['.', ','], '', $trimmedDateRaw) && empty(
                trim(
                    $linewithoutdate
                )
                )
            ) {
                $notTheFirstRowOfALogComment = true;
                // Due to some odd logic in some other file, we also can't set ts and date for this row
                return;
            }
        }

        $this->set_ts_and_date($date_raw, $ts, $date, $linewithoutdate, $datetime);

        // invalidate lines without a valid date
        $notTheFirstRowOfALogComment = empty($date);

    }

    public function addTimeMarkers()
    {
        $this->lastKnownTimeZone = $this->tz_first;
        $this->preProcessContents();
        $rows_with_timemarkers = [];
        $not_parsed = [];
        if ($this->collectDebugInfo) {
            $this->debugAddTimeMarkers = [];
        }
        $this->parsePreProcessedContents(
            $this->preProcessedContents,
            $rows_with_timemarkers,
            $not_parsed
        );
        $this->contentsWithTimeMarkers = $this->generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
            $rows_with_timemarkers,
            $not_parsed
        );
        if ($this->collectDebugInfo) {
            $this->debugAddTimeMarkers["rows_with_timemarkers"] = $rows_with_timemarkers;
            $this->debugAddTimeMarkers["not_parsed"] = $not_parsed;
        }
    }

    protected function parsePreProcessedContents(
        $preProcessedContents,
        &$rows_with_timemarkers,
        &$not_parsed
    )
    {

        $original_unsorted_rows = [];
        $rows_with_timemarkers_handled = 0;

        $lines = static::textIntoLinesArray($preProcessedContents);

        foreach ($lines as $preprocessed_contents_source_line_index => $line) {

            $trimmedLine = trim($line);

            // Actual source line is +1
            $preprocessed_contents_source_line = $preprocessed_contents_source_line_index + 1;

            // skip empty rows
            if ($trimmedLine == "") {
                continue;
            }

            // Get raw contents source line
            $source_line = $this->preProcessedContentsSourceLineContentsSourceLineMap[$preprocessed_contents_source_line];

            // Detect and switch timezone change
            if (strpos($trimmedLine, "|tz:") === 0) {
                $this->lastKnownTimeZone = str_replace("|tz:", "", $trimmedLine);
                continue;
            }

            // Remove any comments at the end before datecheck
            $line_with_comment = $trimmedLine;
            $trimmedLine = trim(preg_replace('/#.*/', '', $trimmedLine));

            // Remove whitespace noise
            $trimmedLine = static::newline_convert($trimmedLine, "");

            // Save the trimmed line as $line since the legacy code expects it to be called that
            $line = $trimmedLine;

            // DATETIME
            $date_raw = null;
            $ts = null;
            $date = null;
            $linewithoutdate = null;
            $notTheFirstRowOfALogComment = null;
            $datetime = null;
            $this->parseLogComment(
                $line,
                $date_raw,
                $ts,
                $date,
                $linewithoutdate,
                $notTheFirstRowOfALogComment,
                $datetime
            );

            //$line = utf8_encode($line);
            $timezone = new DateTimeZone('UTC');
            $datetime = new DateTime();
            $datetime->setTimezone($timezone);
            $datetime->setTimestamp($ts);
            $formatted_date = $datetime->format("Y-m-d H:i"); //:s

            $log = array();

            $lastKnownTimeZone = $this->lastKnownTimeZone;
            $lastUsedTimeZone = $this->lastUsedTimeZone;
            $lastSetTsAndDateErrorMessage = $this->lastSetTsAndDateErrorMessage;
            $metadata = compact(
                "rows_with_timemarkers_handled",
                "line",
                "line_with_comment",
                "formatted_date",
                "date",
                "date_raw",
                "ts",
                "log",
                "source_line",
                "preprocessed_contents_source_line_index",
                "lastKnownTimeZone",
                "lastUsedTimeZone",
                "lastSetTsAndDateErrorMessage"
            );

            // If lastKnownTimeZone and lastUsedTimeZone are different: Send to not_parsed but parse anyway (so that general parsing goes through but that the log is not considered correct)
            if ($this->interpretLastKnownTimeZone() !== $this->lastUsedTimeZone) {
                $methodName = "parsePreProcessedContents";
                $metadata["log"][] = "Invalid timezone ('{$this->lastKnownTimeZone}') encountered when parsing a row (source line: $source_line). Not treating this row as valid time-marked row";
                $metadata["log"][] = "Sent to not_parsed in " . $methodName;
                $not_parsed[] = $metadata;
            }

            // Default
            $isNewRowWithTimeMarker = false;

            //codecept_debug(["first check", $notTheFirstRowOfALogComment, $metadata]); // While devving

            $notTheFirstRowOfALogCommentAndProbableStartStopLine = $notTheFirstRowOfALogComment && $this->isProbableStartStopLine(
                    $line
                );
            $isTheFirstRowWithTimeMarker = empty($rows_with_timemarkers[$rows_with_timemarkers_handled - 1]);
            $hasAPreviousRowWithTimemarker = !$isTheFirstRowWithTimeMarker;
            $previousRowWithTimemarkerHasTheSameDate = $hasAPreviousRowWithTimemarker && $rows_with_timemarkers[$rows_with_timemarkers_handled - 1]["formatted_date"] == $formatted_date;

            // Catch lines that has a timestamp but not in the beginning
            if ($notTheFirstRowOfALogCommentAndProbableStartStopLine) {

                $isNewRowWithTimeMarker = true;
                $this->processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
                    $line,
                    $metadata,
                    $rows_with_timemarkers,
                    $rows_with_timemarkers_handled,
                    $not_parsed,
                    $isNewRowWithTimeMarker
                );

            } elseif ($notTheFirstRowOfALogComment) {

                $this->processAdditionalLogCommentRowUntilNextLogComment(
                    $line,
                    $rows_with_timemarkers,
                    $rows_with_timemarkers_handled
                );
                $isNewRowWithTimeMarker = false;

            } elseif ($previousRowWithTimemarkerHasTheSameDate) {

                $this->processAdditionalLogCommentRowUntilNextLogComment(
                    $line,
                    $rows_with_timemarkers,
                    $rows_with_timemarkers_handled
                );
                $isNewRowWithTimeMarker = false;

            } else {

                $theFirstRowOfALogComment = true;

                $this->processTheFirstRowOfALogComment(
                    $ts,
                    $isNewRowWithTimeMarker,
                    $metadata,
                    $rows_with_timemarkers,
                    $rows_with_timemarkers_handled,
                    $not_parsed
                );

            }

            // Handle new-found rows with timemarker
            if ($isNewRowWithTimeMarker) {

                $rows_with_timemarkers[$rows_with_timemarkers_handled] = $metadata;
                $rows_with_timemarkers_handled++;

            }

            $original_unsorted_rows[] = $metadata;

            // While devving, just work on small subset of all rows
            if ($rows_with_timemarkers_handled >= 100000) {
                throw new TimeLogParsingException("Time log exceeds maximum allowed size");
                break;
            }
            //if ($unsorted_rows_handled >= 10) break; // While devving

        }

        if ($this->collectDebugInfo) {
            $this->debugAddTimeMarkers["original_unsorted_rows"] = $original_unsorted_rows;
        }

    }

    protected function processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
        &$line,
        &$metadata,
        &$rows_with_timemarkers,
        &$rows_with_timemarkers_handled,
        &$not_parsed,
        &$isNewRowWithTimeMarker
    )
    {

        $startsWithPauseToken = $this->startsWithOptionallySuffixedToken($line, "pause");
        $isTheFirstRowWithTimeMarker = empty($rows_with_timemarkers[$rows_with_timemarkers_handled - 1]);

        // Assume true
        $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;

        // Check if it's a pause with written duration
        $pauseWithWrittenDuration = $startsWithPauseToken && strpos($line, "min") !== false;
        if ($pauseWithWrittenDuration) {

            $this->processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
                $metadata,
                $rows_with_timemarkers,
                $rows_with_timemarkers_handled,
                $not_parsed,
                $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp
            );

        } else {

            $this->processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
                $line,
                $startsWithPauseToken,
                $metadata,
                $rows_with_timemarkers,
                $rows_with_timemarkers_handled,
                $not_parsed,
                $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
                $isNewRowWithTimeMarker
            );

        }

        if (!$probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp) {

            // If last valid row is not enabled - throw a large exception, is this log contents?
            if ($isTheFirstRowWithTimeMarker) {
                throw new TimeLogParsingException("No valid start of log file");
            }

            // If not successful, use last rows ts
            $metadata["ts"] = $rows_with_timemarkers[$rows_with_timemarkers_handled - 1]["ts"];
            $metadata["ts_is_faked"] = true;
            $timezone = new DateTimeZone('UTC');
            $datetime = new DateTime();
            $datetime->setTimezone($timezone);
            $datetime->setTimestamp($metadata["ts"]);
            $metadata["formatted_date"] = $datetime->format("Y-m-d H:i:s");
            $metadata["highlight_with_newlines"] = true;
            $metadata["line"] = $metadata["line"];

        } else {

            // We keep track of sessions starts for double-checking that time has registered on each of those dates
            $startsWithStartTokenFollowedByASpace = $this->startsWithOptionallySuffixedToken(
                $line,
                "start",
                " "
            );
            if ($startsWithStartTokenFollowedByASpace) {
                $this->sessionStarts[] = $metadata;
            }

        }

    }

    protected function processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
        &$metadata,
        &$rows_with_timemarkers,
        &$rows_with_timemarkers_handled,
        &$not_parsed,
        &$probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp
    )
    {

        $methodName = "processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration";

        $metadata["log"][] = "found a pause with written duration";
        $metadata["ts"] = $rows_with_timemarkers[$rows_with_timemarkers_handled - 1]["ts"];
        $metadata["ts_is_faked"] = true;
        $timezone = new DateTimeZone('UTC');
        $_datetime = new DateTime();
        $_datetime->setTimezone($timezone);
        $_datetime->setTimestamp($metadata["ts"]);
        $metadata["formatted_date"] = $_datetime->format("Y-m-d H:i:s");
        $metadata["highlight_with_newlines"] = true;

        $parts = explode("->", $metadata["line"]);
        $linefordurationcheck = $parts[0];
        preg_match_all('/(([0-9])*h)?([0-9]*)min/', $linefordurationcheck, $m);
        //preg_match('/([^-]-[^-]-2009) ([^:]*):([^c ]*)/', $linefordatecheck, $m);
        //$metadata["duration_search_preg_debug"] = compact("linefordurationcheck","m");

        if (!empty($m) && !empty($m[0])) {

            $metadata["log"][] = "found pause duration, adding to accumulated pause duration (if any)";
            //var_dump($line, $m, $rows_with_timemarkers_handled, $rows_with_timemarkers);
            if (!empty($rows_with_timemarkers[$rows_with_timemarkers_handled - 1]["pause_duration"])) {
                $metadata["pause_duration"] = intval(
                    $rows_with_timemarkers[$rows_with_timemarkers_handled - 1]["pause_duration"]
                );
            } else {
                $metadata["pause_duration"] = 0;
            }
            $metadata["pause_duration"] += 60 * (intval($m[2][0]) * 60 + intval($m[3][0]));
            $metadata["ts_is_faked"] = false;
            $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;

        } else {

            $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
            // To easily see patterns amongst these lines
            $metadata["log"][] = "sent to not_parsed in " . $methodName;
            $not_parsed[] = $metadata;

        }

    }

    protected function processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
        $line,
        $startsWithPauseToken,
        &$metadata,
        &$rows_with_timemarkers,
        &$rows_with_timemarkers_handled,
        &$not_parsed,
        &$probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
        &$isNewRowWithTimeMarker
    )
    {

        $methodName = "processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration";


        // Try to find a valid timestamp


        // Remove the pause specification before attempting to find a timestamp
        $linefordatecheck = $line;
        if ($startsWithPauseToken) {
            $linefordatecheck = $this->removeSuffixedToken($linefordatecheck, "pause", "->");
            $linefordatecheck = $this->removeSuffixedToken($linefordatecheck, "pause", " ");
            $linefordatecheck = $this->removeSuffixedToken($linefordatecheck, "pause", "");
        }

        // Try to find a timestamp
        $this->detectTimeStamp($linefordatecheck, $metadata);

        /** @var DateTime $datetime */
        $datetime = null;
        $ts = null;
        $date = null;

        $this->set_ts_and_date($metadata["date_raw"], $ts, $date, null, $datetime);
        //var_dump($ts, $date, $datetime);
        $validTimestampFound = !empty($date);

        // Check if the timestamp is later or same as previous row with time marker (if not, something is wrong)

        $thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker = null;
        $duration_since_last = null;
        if ($validTimestampFound === true) {

            // Get duration from last count
            $duration_since_last = $this->durationFromLast(
                $ts,
                $rows_with_timemarkers_handled,
                $rows_with_timemarkers
            );

            if ($duration_since_last < 0) {
                $thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker = false;
            } else {
                $thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker = true;
            }

        }


        // Fill the debug log with contextual information so that we can get more information about
        // why the probable start-stop line ended up here even though it was not valid

        if ($validTimestampFound !== true) {
            $metadata["log"][] = "Did NOT find a valid timestamp in a probable start/pause-row. Not treating this row as a time-marked row";
            $metadata["log"][] = "Line: $line";

            // Treat as AdditionalLogCommentRowUntilNextLogComment if not a pause line
            if (!$startsWithPauseToken) {

                $metadata["log"][] = "Sent to processAdditionalLogCommentRowUntilNextLogComment in " . $methodName;
                $this->processAdditionalLogCommentRowUntilNextLogComment(
                    $line,
                    $rows_with_timemarkers,
                    $rows_with_timemarkers_handled
                );
                $isNewRowWithTimeMarker = false;

            } else {

                // To easily see patterns amongst these lines
                $metadata["log"][] = "Sent to not_parsed in " . $methodName;
                $not_parsed[] = $metadata;

            }

        }
        if ($thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker === false) {

            $metadata["log"][] = "Timestamp found in probable start/pause-row, but was earlier than last found";
            $metadata["log"][] = "Line: $line";
            $last = clone $datetime;
            $last->add(new DateInterval('PT' . abs($duration_since_last) . 'S'));
            $metadata["log"][] = "Timestamp found: {$datetime->format('Y-m-d H:i:s')} vs last found (based on duration since last which is $duration_since_last): {$last->format('Y-m-d H:i:s')}";

            // To easily see patterns amongst these lines
            $metadata["log"][] = "Sent to not_parsed in " . $methodName;
            $not_parsed[] = $metadata;

        }


        if ($validTimestampFound && $thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker) {

            $metadata["log"][] = "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...";
            $metadata["ts"] = $ts;
            $metadata["date"] = $date;
            $timezone = new DateTimeZone('UTC');
            $datetime = new DateTime();
            $datetime->setTimezone($timezone);
            $datetime->setTimestamp($ts);
            $metadata["formatted_date"] = $datetime->format("Y-m-d H:i:s");
            $metadata["ts_is_faked"] = false;
            $metadata["highlight_with_newlines"] = true;
            $metadata["line"] = $metadata["line"];

            $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;

        } else {

            $probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;

        }

    }

    protected function processAdditionalLogCommentRowUntilNextLogComment(
        &$line,
        &$rows_with_timemarkers,
        &$rows_with_timemarkers_handled
    )
    {

        if (!isset($rows_with_timemarkers[$rows_with_timemarkers_handled - 1])) {
            throw new TimeLogParsingException("Incorrect parsing state: For some reason we are attempting to collect additional log comment rows until new log comment but we have no previous log comments");
        }

        // Until next date, we just add the lines up to the previous line
        $rows_with_timemarkers[$rows_with_timemarkers_handled - 1]["line"] .= " | " . $line;

    }

    protected function processTheFirstRowOfALogComment(
        &$ts,
        &$isNewRowWithTimeMarker,
        &$metadata,
        &$rows_with_timemarkers,
        &$rows_with_timemarkers_handled,
        &$not_parsed
    )
    {

        // Get duration from last count
        $duration_since_last = $this->durationFromLast(
            $ts,
            $rows_with_timemarkers_handled,
            $rows_with_timemarkers
        );

        if ($duration_since_last < 0) {

            $metadata["log"][] = "negative duration since last";
            $isNewRowWithTimeMarker = false;

            // Debug log info
            $timezone = new DateTimeZone('UTC');
            $datetime = new DateTime();
            $datetime->setTimezone($timezone);
            $datetime->setTimestamp($ts);
            $last = clone $datetime;
            $last->add(new DateInterval('PT' . abs($duration_since_last) . 'S'));
            $metadata["log"][] = "Timestamp found: {$datetime->format('Y-m-d H:i:s')} vs last found (based on duration since last which is $duration_since_last): {$last->format('Y-m-d H:i:s')}";
            $previousRowWithTimeMarker = $rows_with_timemarkers[$rows_with_timemarkers_handled - 1];
            $metadata["log"][] = "\$previousRowWithTimeMarker line: {$previousRowWithTimeMarker['line']}";

            $metadata["log"][] = "sent to not_parsed in processTheFirstRowOfALogComment";
            $not_parsed[] = $metadata;

        } elseif ($duration_since_last > 24 * 60 * 60) {

            // Warn on unlikely large entries (> 24h) - likely typos
            // TODO: Make limit configurable

            $metadata["log"][] = "excessive duration since last: " . $this->secondsToDuration(
                    $duration_since_last
                );
            $not_parsed[] = $metadata;
            $isNewRowWithTimeMarker = true;

        } else {

            $metadata["duration_since_last"] = $duration_since_last;
            $isNewRowWithTimeMarker = true;

        }
    }

    protected function generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
        $rows_with_timemarkers,
        $not_parsed
    )
    {

        if (empty($rows_with_timemarkers)) {
            throw new TimeLogParsingException("No rows parsed...");
        }

        // Handle some special cases for the last log row
        $last = array_pop($rows_with_timemarkers);
        if (false) {

            // The last pause was started some time after the last log message

        } else {
            array_push($rows_with_timemarkers, $last);
        }

        // Generate structured log output
        return $this->generateStructuredTimeMarkedOutput($rows_with_timemarkers, $not_parsed);

    }

    public function generateStructuredTimeMarkedOutput($rows_with_timemarkers, &$not_parsed)
    {

        $contentsWithTimeMarkers = "";

        $contentsWithTimeMarkers .= ".:: Uncategorized\n";

        foreach ($rows_with_timemarkers as $k => $metadata) {

            if (isset($metadata["highlight_with_newlines"]) && $metadata["highlight_with_newlines"]) {
                $contentsWithTimeMarkers .= static::NL_NIX;
            }

            $contentsWithTimeMarkers .= "\t";

            if (isset($metadata["duration_since_last"]) && !is_null($metadata["duration_since_last"])) {

                // Remove any known pause durations
                if (!empty($rows_with_timemarkers[$k - 1]["pause_duration"])) {
                    $metadata["duration_since_last"] -= $rows_with_timemarkers[$k - 1]["pause_duration"];
                }

                if ($metadata["duration_since_last"] < 0) {
                    $metadata["log"][] = "negative duration since last";
                    $metadata["log"][] = "sent to not_parsed in generateStructuredTimeMarkedOutput";
                    $not_parsed[] = $metadata;
                }

                $parts = explode(",", $metadata["line"]);
                array_shift($parts);
                $contentsWithTimeMarkers .= $metadata["formatted_date"];
                $contentsWithTimeMarkers .= ", " . $this->secondsToDuration($metadata["duration_since_last"]);
                if (!empty($rows_with_timemarkers[$k - 1]) && !empty($rows_with_timemarkers[$k - 1]["ts_is_faked"])) {
                    $contentsWithTimeMarkers .= " {!} ";

                    // Treat this situation as invalid
                    $previousRow = $rows_with_timemarkers[$k - 1];
                    $metadata["log"][] = "duration since last is based on fake/interpolated timestamp";
                    $metadata["log"][] = "\$previousRow line: " . $previousRow['line'];
                    $metadata["log"][] = "sent to not_parsed in generateStructuredTimeMarkedOutput";
                    $not_parsed[] = $metadata;

                }
                $contentsWithTimeMarkers .= implode(",", $parts);
            } else {
                $contentsWithTimeMarkers .= $metadata["line"] . " {" . $metadata["formatted_date"] . "}";
            }

            $contentsWithTimeMarkers .= static::NL_NIX;

            if (isset($metadata["highlight_with_newlines"]) && $metadata["highlight_with_newlines"]) {
                $contentsWithTimeMarkers .= static::NL_NIX;
            }

        }

        // Remove "paus->" from not_parsed array
        if (!empty($not_parsed)) {
            foreach ($not_parsed as $k => $metadata) {
                $token = $this->startsWithOptionallySuffixedToken($metadata["line"] . "|$", "pause", "->|$");
                if ($token) {
                    unset($not_parsed[$k]);
                }
            }
        }

        $this->notParsedAddTimeMarkers = $not_parsed;

        return $contentsWithTimeMarkers;

    }

    function notParsedAddTimeMarkersErrorSummary($not_parsed)
    {
        if (empty($not_parsed)) {
            throw new TimeLogParsingException("Can not summarize not-parsed errors without any unparsed contents");
        }
        $summary = [];
        foreach ($not_parsed as $v) {
            if (is_array($v) && !empty($v["source_line"])) {
                $summary[$v["source_line"]] = $v;
            } else {
                throw new TimeLogParsingException(
                    "The unparsed contents did not contain information about the source line: " . print_r($v, true)
                );
            }
        }
        return $summary;
    }

    function notParsedTimeReportErrorSummary($not_parsed)
    {
        if (empty($not_parsed)) {
            throw new TimeLogParsingException("Can not summarize not-parsed errors without any unparsed contents");
        }
        $summary = [];
        foreach ($not_parsed as $v) {
            $summary[] = $v;
        }
        return $summary;
    }

    function detectCategories()
    {

        $this->categories = array();

        $lines = static::textIntoLinesArray($this->contentsWithTimeMarkers);

        foreach ($lines as $line) {

            $trimmedLine = trim($line);

            // skip empty rows
            if ($trimmedLine == "") {
                continue;
            }

            // Detect and switch category
            if (strpos($line, ".::") === 0) {
                $catneedle = trim(str_replace(".::", "", $trimmedLine));
                $this->categories[] = $catneedle;
            }

        }

    }

    function generateTimeReport()
    {

        $this->lastKnownTimeZone = $this->tz_first;

        $contentsOfTimeReport = "";

        $times = array();
        $not_parsed = array();

        if (empty($this->categories)) {
            $this->detectCategories($this->contentsWithTimeMarkers);
        }

        $lines = static::textIntoLinesArray($this->contentsWithTimeMarkers);

        $category = "Unspecified";

        foreach ($lines as $lineno => $line) {

            $trimmedLine = trim($line);

            // skip empty rows
            if ($trimmedLine == "") {
                continue;
            }

            // Detect and switch category
            if (strpos($line, ".::") === 0) {
                $catneedle = trim(str_replace(".::", "", $trimmedLine));
                if (in_array($catneedle, $this->categories)) {
                    $category = $catneedle;
                    continue;
                }
            }

            // skip all in the "Ignored" category
            if ($category == "Ignored") {
                continue;
            }

            // Detect and switch timezone change
            if (strpos($trimmedLine, "|tz:") === 0) {
                $this->lastKnownTimeZone = str_replace("|tz:", "", $trimmedLine);
                continue;
            }

            // DATETIME

            $parts = explode(",", $line);
            $date_raw = array_shift($parts);
            $linewithoutdate = implode(",", $parts);
            $datetime = null;

            // Special care is necessary here - ts is already in UTC, so we parse it as such, but we keep lastKnownTimeZone since we want to know the source row's timezone
            $_ = $this->lastKnownTimeZone;
            $this->lastKnownTimeZone = "UTC";
            $this->set_ts_and_date($date_raw, $ts, $date, $linewithoutdate, $datetime);
            $this->lastKnownTimeZone = $_;

            // Check for startstopline - they are not invalid, only ignored
            // Only check until first |
            $parts = explode(" | ", $line);
            $beforeVertLine = $parts[0];
            if ($this->isProbableStartStopLine($beforeVertLine)) {
                continue;
            }

            // invalidate
            $invalid = empty($date) || strpos(
                    $linewithoutdate,
                    "min"
                ) === false || /* Make sure the date is reasonably correct */
                $ts < time() - 24 * 3600 * 365 * 10;

            if ($invalid) {
                $not_parsed[] = $line;
                continue;
            }

            // DURATION

            $parts = explode("min", $linewithoutdate);
            $tokens = $this->tokens();
            $duration = trim(str_replace($tokens["approx"], "", $parts[0])) . "min";
            $time = $this->durationToMinutes($duration);

            // invalidate
            $invalid = empty($time) && $time !== 0;
            if ($invalid) {
                $not_parsed[] = $line;
                continue;
            }

            // convert into hours
            $hours_rounded = round($time / 60, 2);
            $hours = $time / 60;

            // TEXT
            $first = array_shift($parts);
            $text = implode("min", $parts);

            $invalid = empty($text);
            if ($invalid) {
                $text = "<empty log item>";
                //var_dump($first, $parts, $line); die();
                //$not_parsed[] = $line; continue;
            }

            if (empty($times[$date])) {
                $times[$date] = [];
            }
            if (empty($times[$date]["text"])) {
                $times[$date]["text"] = [];
            }
            $times[$date]["text"][] = trim($text, " ,\t\r\n");
            if (empty($times[$date][$category])) {
                $times[$date][$category] = $hours;
            } else {
                $times[$date][$category] += $hours;
            }

            // Save a useful form of the time-marked rows that build up the hours-sum:
            $sourceComment = compact(
                "category",
                "timemarker",
                "linewithoutdate",
                "ts",
                "date_raw",
                "date",
                "hours_rounded",
                "hours",
                "text"
            );
            $sourceComment["tz"] = $this->lastKnownTimeZone;

            $this->timeReportSourceComments[] = $sourceComment;

        }

        // Fill out and sort the times-array

        $this->timeReportData = $times = $this->addZeroFilledDates($times);

        // print in a csv-format:

        $contentsOfTimeReport .= "Date;" . implode(" (rounded);", $this->categories) . " (rounded);" . implode(
                ";",
                $this->categories
            ) . ";Log_Items\n";

        foreach ($times as $date => $hours) {

            $activities = implode(" | ", (array) $hours["text"]);
            $activities = static::newline_convert($activities, "");
            $activities = str_replace(array(";", "\t"), array(",", "   "), $activities);

            // Gotta limit the amount of data
            $activities = trim(mb_substr($activities, 0, 1024, 'UTF-8'));

            //
            $hours_by_category_rounded = "";
            foreach ($this->categories as $c) {
                $hours_exact = isset($hours[$c]) ? $hours[$c] : 0;
                $hours_rounded = round($hours_exact, 2);
                $hours_by_category_rounded .= $hours_rounded . ";";
            }

            // replace point by comma
            //$hours_by_category_rounded = str_replace(".", ",", $hours_by_category_rounded);

            $hours_by_category = "";
            foreach ($this->categories as $c) {
                $hours_exact = isset($hours[$c]) ? $hours[$c] : 0;
                $hours_by_category .= $hours_exact . ";";
            }

            // replace point by comma
            //$hours_by_category = str_replace(".", ",", $hours_by_category);

            $contentsOfTimeReport .= $date . ";" . $hours_by_category_rounded . $hours_by_category . $activities . static::NL_NIX;

        }
        //var_dump($times);

        $this->notParsedTimeReport = $not_parsed;

        foreach ($not_parsed as $line) {
            // maybe attempt to add some debugging metadata here?
        }

        $this->contentsOfTimeReport = $contentsOfTimeReport;

    }

    function addZeroFilledDates($times)
    {

        // Find time span:
        $firstdatefound = null;
        $lastdatefound = null;

        $times_ = $times;
        $times = array();
        $timezone = new DateTimeZone('UTC');
        foreach ($times_ as $date => $hours) {

            $datetime = DateTime::createFromFormat("Y-m-d H:i:s", $date . " 00:00:00", $timezone);

            if (!empty($datetime)) {
                if (empty($firstdatefound)) {
                    $firstdatefound = clone $datetime;
                }
                if (empty($lastdatefound)) {
                    $lastdatefound = clone $datetime;
                }
                if ($datetime < $firstdatefound) {
                    $firstdatefound = clone $datetime;
                }
                if ($datetime > $lastdatefound) {
                    $lastdatefound = clone $datetime;
                }
                $times[$datetime->format("Y-m-d")] = $hours;
            }

        }

        if ($this->collectDebugInfo) {
            $this->debugGenerateTimeReport = compact("firstdatefound", "lastdatefound", "times");
        }

        // Check if no times were found...
        if (empty($firstdatefound)) {
            return [];
        }

        $interval = DateInterval::createFromDateString('1 day');
        $lastdatefound = $lastdatefound->add($interval);
        $period = new DatePeriod($firstdatefound, $interval, $lastdatefound);

        $times_ = $times;
        $times = array();
        foreach ($period as $dt) {
            $xday = $dt->format("Y-m-d");
            $times[$xday] = isset($times_[$xday]) ? $times_[$xday] : 0;
        }
        //codecept_debug(compact("period", "firstdatefound", "lastdatefound", "interval"));

        return $times;

    }

    function getTimeLogMetadata()
    {

        if (empty($this->contentsWithTimeMarkers)) {
            return array();
        }

        if (empty($this->debugAddTimeMarkers["rows_with_timemarkers"])) {
            return array();
        }

        $rows_with_timemarkers = $this->debugAddTimeMarkers["rows_with_timemarkers"];

        $start = array_shift($rows_with_timemarkers);
        $startts = $start["ts"];
        $name = $start["date_raw"];
        //do {
        $last = array_pop($rows_with_timemarkers);
        //} while (!$last["ts_is_faked"]);
        $lastts = $last["ts"];
        $leadtime = $lastts - $startts;

        $times = $this->debugGenerateTimeReport["times"];
        $hours_total = 0;
        foreach ($times as $time) {
            foreach ($this->categories as $category) {
                $hours_total += $time[$category];
            }
        }

        $hours_leadtime = round($leadtime / 60 / 60, 2);
        $nonhours = round($hours_leadtime - $hours_total, 2);

        return compact("name", "startts", "lastts", "hours_total", "hours_leadtime", "nonhours");

    }

    /**
     * Requires that the ->sessions array is populated
     */
    public function generateIcal()
    {

        /**
         * Google calendar export
         *
         * BEGIN:VEVENT
         * DTSTART:20101217T130000Z
         * DTEND:20101217T153000Z
         * DTSTAMP:20101217T155736Z
         * UID:7746kmpuslj1n5ck0agbjspeoo@google.com
         * CREATED:20101217T155621Z
         * DESCRIPTION:DESCRIPTIONHHH
         * LAST-MODIFIED:20101217T155621Z
         * LOCATION:wheeeererer
         * SEQUENCE:0
         * STATUS:CONFIRMED
         * SUMMARY:TitleHERE
         * TRANSP:OPAQUE
         * END:VEVENT
         */

        Yii::import("vcalendar");

        $v = new vcalendar(); // initiate new CALENDAR

        //$v->setProperty( 'X-WR-CALNAME'
        //               , 'Sample calendar' );
        //$v->setProperty( 'X-WR-CALDESC'
        //               , 'Description of the calendar' );
        $v->setProperty(
            'X-WR-TIMEZONE'
            ,
            'Europe/Stockholm'
        ); //Helsinki - TODO - FIX THIS...? Does it matter? Seems not to matter...?

        foreach ($this->sessions as $k => $session) {

            // Only sessions with work hours
            if (empty($session["metadata"]["hours_total"])) {
                continue;
            }

            $vevents = array();

            //var_dump($session["metadata"]);

            $start = gmdate("H:i", $session["metadata"]["startts"]);
            $last = gmdate("H:i", $session["metadata"]["lastts"]);

            $startdate = gmdate("Y-m-d", $session["metadata"]["startts"]);
            $lastdate = gmdate("Y-m-d", $session["metadata"]["lastts"]);

            $startts = $session["metadata"]["startts"];
            $lastts = $session["metadata"]["lastts"];

            // Inactivating until have a solution for timezone split issues
            if (false && $startdate != $lastdate) {
                $days = (strtotime($lastdate) - strtotime($startdate)) / (24 * 3600);

                $start = gmdate("Y-m-d H:i", $session["metadata"]["startts"]);
                $last = gmdate("Y-m-d H:i", $session["metadata"]["lastts"]);

                for ($i = 0; $i <= $days; $i++) {

                    $idate = gmdate("Y-m-d", $startts + (24 * 3600) * $i);
                    if ($idate == $startdate) {
                        $startts = $startts;
                        $lastts = strtotime($idate . " 23:59");
                    } elseif ($idate == $lastdate) {
                        $startts = strtotime($idate . " 00:00");
                        $lastts = $lastts;
                    } else {
                        $startts = strtotime($idate . " 00:00");
                        $lastts = strtotime($idate . " 23:59");
                    }

                    $vevents[] = compact("startts", "lastts");
                }


            } else {
                $vevents[] = compact("startts", "lastts");
            }

            $summary = $session["metadata"]["hours_total"] . " project hours (" . $start . "->" . $last;
            if (!empty($session["metadata"]["nonhours"])) {
                $summary .= ", " . $session["metadata"]["nonhours"] . " hours non-work";
            }
            $summary .= ") ";
            $description = "Start datetime: " . $start . static::NL_NIX;
            $description .= "End datetime: " . $last . static::NL_NIX;
            $description .= "Work hours: " . ($session["metadata"]["hours_total"]) . static::NL_NIX;
            $description .= "Non-work hours: " . ($session["metadata"]["nonhours"]) . static::NL_NIX;

            $description .= $this->someMeaningInItAll($session["model"]->TimeLogParser->preProcessedContents);

            if (true || mb_strlen($session["model"]->TimeLogParser->contentsWithTimeMarkers, "UTF-8") < 1024) {
                $description .= "\n\nFull time-marked log:\n";
                $description .= $session["model"]->TimeLogParser->contentsWithTimeMarkers;
            } else {
                $description .= "\n\nCharacters in full time-marked log:\n";
                $description .= mb_strlen($session["model"]->TimeLogParser->contentsWithTimeMarkers, "UTF-8");
            }

            $description = utf8_decode($description);
            $summary = utf8_decode($summary);

            foreach ($vevents as $vevent) {

                $e = new vevent();

                $this->setVcalendarDt($e, "dtstart", $vevent["startts"]);
                $this->setVcalendarDt($e, "dtend", $vevent["lastts"]);

                $e->setProperty('description', $description);
                $e->setProperty('summary', $summary);

                //$e->setProperty( 'categories'
                //               , 'WORK' );                   // catagorize
                //$e->setProperty( 'duration'
                //               , 0, 0, 3 );                    // 3 hours
                //$e->setProperty( 'location'
                //               , 'Home' );                     // locate the event

                $v->addComponent($e); // add component to calendar

            }

        }

        /* alt. production */
        // $v->returnCalendar();                       // generate and redirect output to user browser
        /* alt. dev. and test */
        $str = $v->createCalendar(); // generate and get output in string, for testing?

        $str = utf8_encode($str);

        return $str;

    }

    function setVcalendarDt(&$e, $field, $ts)
    {
        $e->setProperty(
            $field,
            gmdate("Y", $ts),
            gmdate("m", $ts),
            gmdate("d", $ts),
            gmdate("H", $ts),
            gmdate("i", $ts),
            gmdate("s", $ts)
        );
    }

    private $reserved_words = array(
        // mysql etc
        'accessible',
        'add',
        'all',
        'alter',
        'analyze',
        'and',
        'as',
        'asc',
        'asensitive',
        'before',
        'between',
        'bigint',
        'binary',
        'blob',
        'both',
        'by',
        'call',
        'cascade',
        'case',
        'change',
        'char',
        'character',
        'check',
        'collate',
        'column',
        'condition',
        'connection',
        'constraint',
        'continue',
        'convert',
        'create',
        'cross',
        'current_date',
        'current_time',
        'current_timestamp',
        'current_user',
        'cursor',
        'database',
        'databases',
        'day_hour',
        'day_microsecond',
        'day_minute',
        'day_second',
        'dec',
        'decimal',
        'declare',
        'default',
        'delayed',
        'delete',
        'desc',
        'describe',
        'deterministic',
        'distinct',
        'distinctrow',
        'div',
        'double',
        'drop',
        'dual',
        'each',
        'else',
        'elseif',
        'enclosed',
        'escaped',
        'exists',
        'exit',
        'explain',
        'false',
        'fetch',
        'float',
        'float4',
        'float8',
        'for',
        'force',
        'foreign',
        'from',
        'fulltext',
        'goto',
        'grant',
        'group',
        'having',
        'high_priority',
        'hour_microsecond',
        'hour_minute',
        'hour_second',
        'if',
        'ignore',
        'in',
        'index',
        'infile',
        'inner',
        'inout',
        'insensitive',
        'insert',
        'int',
        'int1',
        'int2',
        'int3',
        'int4',
        'int8',
        'integer',
        'interval',
        'into',
        'is',
        'iterate',
        'join',
        'key',
        'keys',
        'kill',
        'label',
        'leading',
        'leave',
        'left',
        'like',
        'limit',
        'linear',
        'lines',
        'load',
        'localtime',
        'localtimestamp',
        'lock',
        'long',
        'longblob',
        'longtext',
        'loop',
        'low_priority',
        'master_ssl_verify_server_cert',
        'match',
        'mediumblob',
        'mediumint',
        'mediumtext',
        'middleint',
        'minute_microsecond',
        'minute_second',
        'mod',
        'modifies',
        'natural',
        'no_write_to_binlog',
        'not',
        'null',
        'numeric',
        'on',
        'optimize',
        'option',
        'optionally',
        'or',
        'order',
        'out',
        'outer',
        'outfile',
        'precision',
        'primary',
        'procedure',
        'purge',
        'range',
        'read',
        'read_only',
        'read_write',
        'reads',
        'real',
        'references',
        'regexp',
        'release',
        'rename',
        'repeat',
        'replace',
        'require',
        'reserved',
        'restrict',
        'return',
        'revoke',
        'right',
        'rlike',
        'schema',
        'schemas',
        'second_microsecond',
        'select',
        'sensitive',
        'separator',
        'set',
        'show',
        'smallint',
        'spatial',
        'specific',
        'sql',
        'sql_big_result',
        'sql_calc_found_rows',
        'sql_small_result',
        'sqlexception',
        'sqlstate',
        'sqlwarning',
        'ssl',
        'starting',
        'straight_join',
        'table',
        'terminated',
        'then',
        'tinyblob',
        'tinyint',
        'tinytext',
        'to',
        'trailing',
        'trigger',
        'true',
        'undo',
        'union',
        'unique',
        'unlock',
        'unsigned',
        'update',
        'upgrade',
        'usage',
        'use',
        'using',
        'utc_date',
        'utc_time',
        'utc_timestamp',
        'values',
        'varbinary',
        'varchar',
        'varcharacter',
        'varying',
        'when',
        'where',
        'while',
        'with',
        'write',
        'xor',
        'year_month',
        'zerofill',
        '__class__',
        '__compiler_halt_offset__',
        '__dir__',
        '__file__',
        '__function__',
        '__method__',
        '__namespace__',
        'abday_1',
        'abday_2',
        'abday_3',
        'abday_4',
        'abday_5',
        'abday_6',
        'abday_7',
        'abmon_1',
        'abmon_10',
        'abmon_11',
        'abmon_12',
        'abmon_2',
        'abmon_3',
        'abmon_4',
        'abmon_5',
        'abmon_6',
        'abmon_7',
        'abmon_8',
        'abmon_9',
        'abstract',
        'alt_digits',
        'am_str',
        'array',
        'assert_active',
        'assert_bail',
        'assert_callback',
        'assert_quiet_eval',
        'assert_warning',
        'break',
        'case_lower',
        'case_upper',
        'catch',
        'cfunction',
        'char_max',
        'class',
        'clone',
        'codeset',
        'connection_aborted',
        'connection_normal',
        'connection_timeout',
        'const',
        'count_normal',
        'count_recursive',
        'credits_all',
        'credits_docs',
        'credits_fullpage',
        'credits_general',
        'credits_group',
        'credits_modules',
        'credits_qa',
        'credits_sapi',
        'crncystr',
        'crypt_blowfish',
        'crypt_ext_des',
        'crypt_md5',
        'crypt_salt_length',
        'crypt_std_des',
        'currency_symbol',
        'd_fmt',
        'd_t_fmt',
        'day_1',
        'day_2',
        'day_3',
        'day_4',
        'day_5',
        'day_6',
        'day_7',
        'decimal_point',
        'default_include_path',
        'die',
        'directory_separator',
        'do',
        'e_all',
        'e_compile_error',
        'e_compile_warning',
        'e_core_error',
        'e_core_warning',
        'e_deprecated',
        'e_error',
        'e_notice',
        'e_parse',
        'e_strict',
        'e_user_deprecated',
        'e_user_error',
        'e_user_notice',
        'e_user_warning',
        'e_warning',
        'echo',
        'empty',
        'enddeclare',
        'endfor',
        'endforeach',
        'endif',
        'endswitch',
        'endwhile',
        'ent_compat',
        'ent_noquotes',
        'ent_quotes',
        'era',
        'era_d_fmt',
        'era_d_t_fmt',
        'era_t_fmt',
        'era_year',
        'eval',
        'extends',
        'extr_if_exists',
        'extr_overwrite',
        'extr_prefix_all',
        'extr_prefix_if_exists',
        'extr_prefix_invalid',
        'extr_prefix_same',
        'extr_skip',
        'final',
        'foreach',
        'frac_digits',
        'function',
        'global',
        'grouping',
        'html_entities',
        'html_specialchars',
        'implements',
        'include',
        'include_once',
        'info_all',
        'info_configuration',
        'info_credits',
        'info_environment',
        'info_general',
        'info_license',
        'info_modules',
        'info_variables',
        'ini_all',
        'ini_perdir',
        'ini_system',
        'ini_user',
        'instanceof',
        'int_curr_symbol',
        'int_frac_digits',
        'interface',
        'isset',
        'lc_all',
        'lc_collate',
        'lc_ctype',
        'lc_messages',
        'lc_monetary',
        'lc_numeric',
        'lc_time',
        'list',
        'lock_ex',
        'lock_nb',
        'lock_sh',
        'lock_un',
        'log_alert',
        'log_auth',
        'log_authpriv',
        'log_cons',
        'log_crit',
        'log_cron',
        'log_daemon',
        'log_debug',
        'log_emerg',
        'log_err',
        'log_info',
        'log_kern',
        'log_local0',
        'log_local1',
        'log_local2',
        'log_local3',
        'log_local4',
        'log_local5',
        'log_local6',
        'log_local7',
        'log_lpr',
        'log_mail',
        'log_ndelay',
        'log_news',
        'log_notice',
        'log_nowait',
        'log_odelay',
        'log_perror',
        'log_pid',
        'log_syslog',
        'log_user',
        'log_uucp',
        'log_warning',
        'm_1_pi',
        'm_2_pi',
        'm_2_sqrtpi',
        'm_e',
        'm_ln10',
        'm_ln2',
        'm_log10e',
        'm_log2e',
        'm_pi',
        'm_pi_2',
        'm_pi_4',
        'm_sqrt1_2',
        'm_sqrt2',
        'mon_1',
        'mon_10',
        'mon_11',
        'mon_12',
        'mon_2',
        'mon_3',
        'mon_4',
        'mon_5',
        'mon_6',
        'mon_7',
        'mon_8',
        'mon_9',
        'mon_decimal_point',
        'mon_grouping',
        'mon_thousands_sep',
        'n_cs_precedes',
        'n_sep_by_space',
        'n_sign_posn',
        'namespace',
        'negative_sign',
        'new',
        'noexpr',
        'nostr',
        'old_function',
        'p_cs_precedes',
        'p_sep_by_space',
        'p_sign_posn',
        'path_separator',
        'pathinfo_basename',
        'pathinfo_dirname',
        'pathinfo_extension',
        'pear_extension_dir',
        'pear_install_dir',
        'php_bindir',
        'php_config_file_path',
        'php_config_file_scan_dir',
        'php_datadir',
        'php_debug',
        'php_eol',
        'php_extension_dir',
        'php_extra_version',
        'php_int_max',
        'php_int_size',
        'php_libdir',
        'php_localstatedir',
        'php_major_version',
        'php_maxpathlen',
        'php_minor_version',
        'php_os',
        'php_output_handler_cont',
        'php_output_handler_end',
        'php_output_handler_start',
        'php_prefix',
        'php_release_version',
        'php_sapi',
        'php_shlib_suffix',
        'php_sysconfdir',
        'php_version',
        'php_version_id',
        'php_windows_nt_domain_controller',
        'php_windows_nt_server',
        'php_windows_nt_workstation',
        'php_windows_version_build',
        'php_windows_version_major',
        'php_windows_version_minor',
        'php_windows_version_platform',
        'php_windows_version_producttype',
        'php_windows_version_sp_major',
        'php_windows_version_sp_minor',
        'php_windows_version_suitemask',
        'php_zts',
        'pm_str',
        'positive_sign',
        'print',
        'private',
        'protected',
        'public',
        'radixchar',
        'require_once',
        'seek_cur',
        'seek_end',
        'seek_set',
        'sort_asc',
        'sort_desc',
        'sort_numeric',
        'sort_regular',
        'sort_string',
        'static',
        'str_pad_both',
        'str_pad_left',
        'str_pad_right',
        'switch',
        't_fmt',
        't_fmt_ampm',
        'thousands_sep',
        'thousep',
        'throw',
        'try',
        'unset',
        'var',
        'yesexpr',
        'yesstr',
        // log routines
        'commit',
        'start',
    );

    function someMeaningInItAll($str)
    {

        if (empty($str)) {
            return "";
        }

        $return = "\nSubversion commit messages:\n";

        $lines = static::textIntoLinesArray($str);
        $commitLogLines = array();
        foreach ($lines as $line) {
            if ($this->isProbableCommitLogLine($line)) {
                $commitLogLines[] = $line;
            }
        }

        $return .= static::linesArrayIntoText($commitLogLines);

        $lower = strtolower($str);
        $words = str_word_count_utf8($lower, 1);
        $numWords = count($words);

        // array_count_values() returns an array using the values of the input array as keys and their frequency in input as values.
        $word_count = (array_count_values($words));
        arsort($word_count);

        $return .= "\n\nCommon words:\n";
        $k = 1;
        foreach ($word_count as $key => $val) {
            $pausetoken = $this->startsWithOptionallySuffixedToken($key, "pause");
            if (
                mb_strlen($key, "UTF-8") > 2 &&
                !in_array($key, $this->reserved_words) &&
                strpos($key, "-") === false &&
                empty($pausetoken)
            ) {
                //utf8_encode
                $return .= "" . ($key) . ", "; //($val)//number_format(($val/$numWords)*100)
                $k++;
            }
            if ($k > 50) {
                break;
            }
        }
        return $return;

    }

}

class TimeLogParsingException extends Exception
{

}
