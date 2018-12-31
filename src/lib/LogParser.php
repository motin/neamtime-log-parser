<?php

//http://snippets.dzone.com/posts/show/2039
function str_hex($string)
{
    $hex = '';
    for ($i = 0; $i < strlen($string); $i++) {
        $hex .= dechex(ord($string[$i]));
    }
    return $hex;
}

define("WORD_COUNT_MASK", "/\p{L}[\p{L}\p{Mn}\p{Pd}'\x{2019}]*/u");

function str_word_count_utf8($string, $format = 0)
{
    switch ($format) {
        case 1:
            preg_match_all(WORD_COUNT_MASK, $string, $matches);
            return $matches[0];
        case 2:
            preg_match_all(WORD_COUNT_MASK, $string, $matches, PREG_OFFSET_CAPTURE);
            $result = array();
            foreach ($matches[0] as $match) {
                $result[$match[1]] = $match[0];
            }
            return $result;
    }
    return preg_match_all(WORD_COUNT_MASK, $string, $matches);
}

class LogParser
{

    // Main contents holders
    var $contents = "";

    // Metadata arrays
    var $notParsedAddTimeMarkers = array();

    // Helper variables
    var $lastKnownDate = "";
    var $lastKnownTimeZone = "";
    var $lastUsedTimeZone = "";
    var $lastSetTsAndDateErrorMessage = "";
    var $tz_first = null;
    var $debugAddTimeMarkers = array();

    // Handle various types of newlines
    const NL_NIX = "\n";
    const NL_WIN = "\r\n";
    const NL_MAC = "\r";

    static public function newline_type($string)
    {
        if (strpos($string, self::NL_WIN) !== false) {
            return self::NL_WIN;
        } elseif (strpos($string, self::NL_MAC) !== false) {
            return self::NL_MAC;
        } elseif (strpos($string, self::NL_NIX) !== false) {
            return self::NL_NIX;
        }
    }

    static public function newline_convert($string, $newline)
    {
        return str_replace(array(self::NL_WIN, self::NL_MAC, self::NL_NIX), $newline, $string);
    }

    static public function textIntoLinesArray($text)
    {

        // Remove weird skype-produced spaces (hex c2a0 as opposed to hex 20 for ordinary spaces)
        $text = str_replace(" ", " ", $text);

        // Normalize line-endings
        $text = static::newline_convert($text, static::NL_NIX);

        $lines = explode(static::NL_NIX, $text);

        return $lines;

    }

    static public function linesArrayIntoText($lines)
    {
        return implode(static::NL_NIX, $lines);
    }

    static public function readFirstNonEmptyLineOfText($text)
    {

        $lines = static::textIntoLinesArray($text);
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            if (!empty($trimmedLine)) {
                return $trimmedLine;
            }
        }
        return null;

    }

    // Since strtotime is way to generous, leading to detected "timestamps" which are not actual timestamps
    public function supportedTimestampFormats()
    {
        $Ymd_detect_regex = '(1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020)-\d+-\d+';
        $dmY_detect_regex = '[^\s\>>]*-.*-(1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020)';
        // the minute-part may be omitted and instead an approx token will be found, which will be replaced before reaching createFromFormat
        // todo: dyn load appr-tokens
        $His_detect_regex = '(\d+:\d+:\d+)';
        $Hcoloni_detect_regex_accept_approx_token = '(\d+:([^\s\-,:]*|ca|appr))';
        $Hdoti_detect_regex_accept_approx_token = '(\d+\.([^\s\-,:]*|ca|appr))';
        $Hcoloni_detect_regex = '(\d+:[^\s\-,:]+)';
        $Hdoti_detect_regex = '(\d+\.[^\s\-,:]+)';
        $iso_timezone_detect_regex = '(Z|\+\d\d:\d\d)';
        $utc_timezone_detect_regex = '(\+UTC)';

        return
            [
                [
                    'format' => DateTime::ISO8601,
                    'accept_approx_token_instead_of_minutes' => false,
                    'detect_regex' => '/' . $Ymd_detect_regex . 'T' . $His_detect_regex . $iso_timezone_detect_regex . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                ],
                [
                    'format' => DateTime::ISO8601,
                    'accept_approx_token_instead_of_minutes' => false,
                    'detect_regex' => '/' . $Ymd_detect_regex . 'T' . $His_detect_regex . $utc_timezone_detect_regex . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                    'pre_datetime_parsing_callback' => function ($str) {
                        return str_replace('+UTC', 'Z', $str);
                    },
                ],
                /*
                [
                    'format' => 'Y-m-d H:i:s',
                    'accept_approx_token_instead_of_minutes' => false,
                    'detect_regex' => '',
                ],
                */
                [
                    'format' => 'Y-m-d H:i',
                    'accept_approx_token_instead_of_minutes' => true,
                    'detect_regex' => '/' . $Ymd_detect_regex . '\s' . $Hcoloni_detect_regex_accept_approx_token . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                ],
                [
                    'format' => 'Y-m-d, H:i',
                    'accept_approx_token_instead_of_minutes' => true,
                    'detect_regex' => '/' . $Ymd_detect_regex . ',\s' . $Hcoloni_detect_regex_accept_approx_token . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                ],
                [
                    'format' => 'Y-m-d H.i',
                    'accept_approx_token_instead_of_minutes' => true,
                    'detect_regex' => '/' . $Ymd_detect_regex . '\s' . $Hdoti_detect_regex_accept_approx_token . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                ],
                [
                    'format' => 'Y-m-d, H.i',
                    'accept_approx_token_instead_of_minutes' => true,
                    'detect_regex' => '/' . $Ymd_detect_regex . ',\s' . $Hdoti_detect_regex_accept_approx_token . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                ],
                [
                    'format' => 'd-m-Y H:i',
                    'accept_approx_token_instead_of_minutes' => true,
                    'detect_regex' => '/' . $dmY_detect_regex . '\s' . $Hcoloni_detect_regex_accept_approx_token . '/',
                    'detect_regex_date_raw_match_index' => 0,
                    'detect_regex_time_raw_match_index' => 2,
                ],
                [
                    'format' => 'H:i',
                    'accept_approx_token_instead_of_minutes' => false,
                    'detect_regex' => '/' . $Hcoloni_detect_regex . '/',
                    'detect_regex_date_raw_match_index' => null,
                    'detect_regex_time_raw_match_index' => 0,
                ],
                [
                    'format' => 'H.i',
                    'accept_approx_token_instead_of_minutes' => false,
                    'detect_regex' => '/' . $Hdoti_detect_regex . '/',
                    'detect_regex_date_raw_match_index' => null,
                    'detect_regex_time_raw_match_index' => 0,
                ],
            ];
    }

    function secondsToDuration($seconds, $hoursPerDay = 24, $daysPerWeek = 7)
    {
        $vals = array(
            'w' => (int) ($seconds / (3600 * $hoursPerDay) / $daysPerWeek),
            'd' => $seconds / (3600 * $hoursPerDay) % $daysPerWeek,
            'h' => $seconds / 3600 % $hoursPerDay,
            'min' => $seconds / 60 % 60,
            //'s' => $seconds % 60
        );
        $ret = array();

        $added = false;
        foreach ($vals as $k => $v) {
            if ($v > 0 || $added || $k == "min") {
                $added = true;
                $ret[] = intval($v) . $k;
            }
        }

        return join('', $ret);

    }

    function durationToSeconds($duration, $hoursPerDay = 24, $daysPerWeek = 7)
    {

        $total = 0;

        // read and remove weeks
        if (strpos($duration, "w") !== false) {
            $p = explode("w", $duration);
            $weeks = $p[0];
            $total += $weeks * (3600 * $hoursPerDay) * $daysPerWeek;
            $duration = $p[1];
        }

        // read and remove days
        if (strpos($duration, "d") !== false) {
            $p = explode("d", $duration);
            $days = $p[0];
            $total += $days * (3600 * $hoursPerDay);
            $duration = $p[1];
        }

        // read and remove hours
        if (strpos($duration, "h") !== false) {
            $p = explode("h", $duration);
            $hours = $p[0];
            $total += $hours * (3600);
            $duration = $p[1];
        }

        // read and remove minutes
        if (strpos($duration, "m") !== false) {
            $p = explode("m", $duration);
            $minutes = $p[0];
            $total += $minutes * (60);
            $duration = $p[1];
            $duration = str_replace("in", "", $duration);
        }

        // read and remove seconds
        if (strpos($duration, "s") !== false) {
            $p = explode("s", $duration);
            $seconds = $p[0];
            $total += $seconds;
            $duration = $p[1];
        }

        return $total;
    }

    function durationToMinutes($duration, $hoursPerDay = 24, $daysPerWeek = 7)
    {
        $seconds = $this->durationToSeconds($duration, $hoursPerDay, $daysPerWeek);
        return $seconds / 60;
    }

    function durationFromLast($ts, $rows_with_timemarkers_handled, $rows_with_timemarkers)
    {
        $previousRowWithTimeMarker = null;
        if ($rows_with_timemarkers_handled == 0) {
            $previousRowWithTimeMarker = null;
            $duration_since_last = 0;
        } else {
            $previousRowWithTimeMarker = $rows_with_timemarkers[$rows_with_timemarkers_handled - 1];
            $duration_since_last = $ts - $previousRowWithTimeMarker["ts"];
        }
        if (!empty($previousRowWithTimeMarker) && empty($previousRowWithTimeMarker["ts"])) {
            $duration_since_last = 0;
        }
        return $duration_since_last;
    }

    function detectTimeStamp($linefordatecheck, &$metadata)
    {

        // For debug
        $metadata['lastKnownDate'] = $this->lastKnownDate;
        if (!empty($metadata["date_raw"])) {
            $metadata['date_raw_was_nonempty_before_detectTimeStamp'] = $metadata["date_raw"];
        }

        // Do not consider if there are no numbers at all...
        // TODO:
        //preg_match_all('/[0-9]/', $linefordatecheck, $m);
        //$metadata['sdfsdf'] = $m;

        foreach ($this->supportedTimestampFormats() as $supportedTimestampFormat) {
            $format = $supportedTimestampFormat['format'];
            $detect_regex = $supportedTimestampFormat['detect_regex'];
            $accept_approx_token_instead_of_minutes = $supportedTimestampFormat['accept_approx_token_instead_of_minutes'];
            $detect_regex_date_raw_match_index = $supportedTimestampFormat['detect_regex_date_raw_match_index'];
            $detect_regex_time_raw_match_index = $supportedTimestampFormat['detect_regex_time_raw_match_index'];

            // The most straight-forward date format
            preg_match_all($detect_regex, $linefordatecheck, $m);
            //codecept_debug([__LINE__, compact("detect_regex", "linefordatecheck", "m")]);

            if (!empty($m) && !empty($m[0])) {

                if ($this->collectDebugInfo) {
                    $metadata["date_search_preg_debug:" . $format] = compact("linefordatecheck", "m");
                }

                $metadata["date_raw_format"] = $format;

                $metadata["log"][] = "Found a supported timestamp ('$format')";
                //var_dump($line, $m);
                if (!is_null($detect_regex_date_raw_match_index)) {
                    $metadata["date_raw"] = $m[$detect_regex_date_raw_match_index][0];
                }
                if (!is_null($detect_regex_time_raw_match_index)) {
                    $metadata["time_raw"] = $m[$detect_regex_time_raw_match_index][0];
                    // If this is a format with only time detection, we use the raw time as the raw date
                    if (is_null($detect_regex_date_raw_match_index)) {
                        $metadata["date_raw"] = $metadata["time_raw"];
                    }

                    if ($accept_approx_token_instead_of_minutes) {

                        // In case we entered "approx" instead of minutes, shotgun to the exact hour change:
                        if ($this->startsWithOptionallySuffixedToken(
                            $metadata["time_raw"],
                            "approx"
                        )
                        ) {
                            $metadata["date_raw_with_approx_token_instead_of_minutes"] = $metadata["date_raw"];
                            $tokens = $this->tokens();
                            $metadata["date_raw"] = str_replace($tokens["approx"], "00", $metadata["date_raw"]);
                        }

                    }

                } else {
                    $metadata["time_raw"] = false;
                }

                return;

            } else {

                if ($this->collectDebugInfo) {
                    $metadata["date_search_preg_debug:" . $format] = compact("linefordatecheck", "m");
                }

            }

        }

        $metadata["log"][] = "Did not find a supported timestamp";
        $metadata["date_raw"] = false;
        $metadata["time_raw"] = false;
        $metadata["date_raw_format"] = false;

        //codecept_debug([__LINE__, compact("metadata")]);

    }

    /**
     * @param $date_raw
     * @param $ts
     * @param $date
     * @param null $linewithoutdate
     * @param $datetime Return by reference the DateTime object that contains the master timestamp information
     * @throws Exception
     * @throws InvalidDateTimeZoneException
     */
    public function set_ts_and_date($date_raw, &$ts, &$date, $linewithoutdate = null, &$datetime)
    {

        $this->lastSetTsAndDateErrorMessage = "";
        $date_raw = trim(str_replace(array("maj", "okt"), array("may", "oct"), $date_raw));

        try {
            $timezone = $this->interpretLastKnownTimeZone();
            $ts = $this->parseGmtTimestampFromDateSpecifiedInSpecificTimezone($date_raw, $timezone, $datetime);
            $this->lastUsedTimeZone = $timezone;
        } catch (InvalidDateTimeZoneException $e) {
            // If invalid timezone is encountered, use UTC and at least detect the timestamp correctly, but make a note about that the wrong timezone was used
            $ts = $this->parseGmtTimestampFromDateSpecifiedInSpecificTimezone($date_raw, "UTC", $datetime);
            $this->lastSetTsAndDateErrorMessage = $e->getMessage();
            $this->lastUsedTimeZone = "UTC";
        }

        if (empty($ts)) {
            $ts = 0;
            $date = false;
            $this->lastSetTsAndDateErrorMessage = "Timestamp not found";
        } elseif ( /* Make sure the date is reasonably correct */
            $ts > 0 && $ts < UTC::gmtime() - 24 * 3600 * 365 * 10
        ) {
            $ts = 0;
            $date = false;
            $this->lastSetTsAndDateErrorMessage = "Timestamp found was more than 10 years old, not reasonably correct";
        } else {
            $this->lastKnownDate = $datetime->format("Y-m-d");
            $midnightoffset = 6 * 60; // new day starts at 06.00 in the morning - schablon
            $interval = DateInterval::createFromDateString($midnightoffset . ' minutes');

            // TODO: Possibly restore this, but then based on date_raw lacking time-information instead of the parsed date object having time at midnight
            //if (date("H:i:s", $ts) == "00:00:00") $midnightoffset = 0; // do not offset when we didn't specify a specific time (yes this takes 00:00-reported times as well - but I can live with that!)

            $semanticDateTime = clone $datetime;
            $semanticDateTime = $semanticDateTime->sub($interval);
            $date = $semanticDateTime->format("Y-m-d");
        }

    }

    public function interpretLastKnownTimeZone()
    {
        $interpretationMap = [
            "GMT-6" => "-06:00",
            "UTC-6" => "-06:00",
            "UTC-06" => "-06:00",
            "Orlando" => "America/New_York",
            "Las Vegas/GMT-8" => "-08:00",
            "Austin/GMT-6" => "-06:00",
            "US/San Francisco" => "America/Los_Angeles",
        ];
        if (isset($interpretationMap[$this->lastKnownTimeZone])) {
            return $interpretationMap[$this->lastKnownTimeZone];
        }
        return $this->lastKnownTimeZone;
    }

    /**
     * @param $str
     * @param $timezone
     * @param null $datetime
     * @return false|int|string
     * @throws Exception
     * @throws InvalidDateTimeZoneException
     */
    function parseGmtTimestampFromDateSpecifiedInSpecificTimezone($str, $timezone, &$datetime = null)
    {

        $gmt_timestamp = null;

        try {
            $timezone = new DateTimeZone($timezone);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), "Unknown or bad timezone") !== false) {
                throw new InvalidDateTimeZoneException($e->getMessage(), null, $e);
            }
            throw $e;
        }

        foreach ($this->supportedTimestampFormats() as $supportedTimestampFormat) {
            $format = $supportedTimestampFormat['format'];
            if (isset($supportedTimestampFormat['pre_datetime_parsing_callback'])) {
                $str = $supportedTimestampFormat['pre_datetime_parsing_callback']($str);
            }
            //codecept_debug([__LINE__, compact("format", "str", "timezone")]);
            $datetime = DateTime::createFromFormat($format, $str, $timezone);
            if ($datetime) {
                break;
            }
        }

        if (!$datetime) {
            // TODO: Remove expectation of string and this setting of 0 on error
            $gmt_timestamp = 0;
            //var_dump(compact("str","gmt_timestamp"), strtotime($str));
            //die();
        } else {
            $gmt_datetime = clone $datetime;
            $gmt_datetime->setTimezone(new DateTimeZone("UTC"));
            $gmt_timestamp = $gmt_datetime->getTimestamp();
        }

        // TODO: Remove expectation of string
        return (string) $gmt_timestamp;
    }

}

class InvalidDateTimeZoneException extends Exception
{

}
