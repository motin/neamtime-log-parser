<?php

class TimeSpendingLogTest extends \PHPUnit_Framework_TestCase
{

    protected function setUp()
    {
    }

    protected function tearDown()
    {
    }

    public static function testStartsWithOptionallySuffixedTokenMethodDataProvider()
    {
        $testDataMatrix = [];
        $tlp = new TimeLogParser();
        $tokens = $tlp->tokens();
        $keyword = "pause";
        foreach ($tokens[$keyword] as $token) {
            $tokenSpecific = [
                [$token . '->2010-04-03 7:58', $keyword, '->', $token],
                [$token . '->2010-04-03 7:58', $keyword, null, $token],
                [$token . ' 2016-05-16 09:55->', $keyword, '->', false],
                [$token . ' 2016-05-16 09:55->', $keyword, ' ', $token],
                [$token . ' 2016-05-16 09:55->', $keyword, null, $token],
                [$token . '->|$', $keyword, '->|$', $token],
            ];
            $testDataMatrix = array_merge($testDataMatrix, $tokenSpecific);
        }
        return $testDataMatrix;
    }

    /**
     * @group coverage:full
     * @dataProvider testStartsWithOptionallySuffixedTokenMethodDataProvider
     */
    public function testStartsWithOptionallySuffixedTokenMethod($haystack, $keyword, $suffix, $expectedReturnValue)
    {
        $tlp = new TimeLogParser();
        $return = $tlp->startsWithOptionallySuffixedToken($haystack, $keyword, $suffix);
        $this->assertEquals(
            $expectedReturnValue,
            $return,
            'TimeLogParser->startsWithOptionallySuffixedToken() behaves as expected'
        );
    }

    public static function testSecondsToDurationProvider()
    {
        return [
            [60, "1min"],
            [65, "1min"],
            [120, "2min"],
            [99 * 60, "1h39min"],
            [200 * 60, "3h20min"],
            [184 * 60, "3h4min"],
            [70 * 60, "1h10min"],
            [4397 * 60, "3d1h17min"],
            [4397 * 60 + 3600 * 24 * 7 * 5, "5w3d1h17min"],
            //[13, "13s"],
            [13, "0min"],
        ];
    }

    /**
     * @group coverage:full
     * @dataProvider testSecondsToDurationProvider
     */
    public function testSecondsToDuration($seconds, $expectedReturnValue)
    {
        $tlp = new TimeLogParser();
        $return = $tlp->secondsToDuration($seconds);
        $this->assertEquals(
            $expectedReturnValue,
            $return,
            'TimeLogParser->secondsToDuration() behaves as expected'
        );
    }

    public static function testDurationToMinutesProvider()
    {
        return [
            ["4min", "4"],
            ["99min", "99"],
            ["200min", "200"],
            ["3h4min", 184],
            ["1h10min", 70],
            ["3d1h17min", 4397],
            ["5w3d1h17min", 4397 + 3600 * 24 * 7 * 5 / 60],
            ["13s", 13 / 60],
        ];
    }

    /**
     * @group coverage:full
     * @dataProvider testDurationToMinutesProvider
     */
    public function testDurationToMinutes($duration, $expectedReturnValue)
    {
        $tlp = new TimeLogParser();
        $return = $tlp->durationToMinutes($duration);
        $this->assertEquals(
            $expectedReturnValue,
            $return,
            'TimeLogParser->durationToMinutes() behaves as expected'
        );
    }

    public static function testParseGmtTimestampFromDateSpecifiedInSpecificTimezoneProvider()
    {
        return [
            ["1970-01-01 12:00", "UTC", 12*3600 /* 43200 */, "1970-01-01 12:00", "UTC", 12*3600, "Europe/Berlin", "1970-01-01 13:00"],
            ["1970-01-01 06:00", "UTC", 6*3600 /* 21600 */, "1970-01-01 06:00", "UTC", 6*3600, "Europe/Berlin", "1970-01-01 07:00"],
            ["1970-01-01 06:00", "Europe/Berlin", 5*3600 /* 18000 */, "1970-01-01 05:00", "Europe/Berlin", 5*3600, "Europe/Berlin", "1970-01-01 06:00"],
            ["1970-01-01 06:00", "Europe/Berlin", 5*3600 /* 18000 */, "1970-01-01 05:00", "Europe/Berlin", 5*3600, "UTC", "1970-01-01 05:00"],
            ["1970-01-01 13:00", "Europe/Berlin", 12*3600 /* Same as 12:00 UTC */, "1970-01-01 12:00", "Europe/Berlin", 12*3600, "Europe/Berlin", "1970-01-01 13:00"],
            // Confirm that America/Chicago (UTC-6) and GMT-6 are behaving the same
            ["1970-01-01 06:00", "America/Chicago", 12*3600 /* Same as 12:00 UTC */, "1970-01-01 12:00", "America/Chicago", 12*3600, "Europe/Berlin", "1970-01-01 13:00"],
            ["1970-01-01 06:00", "GMT-6", 12*3600 /* NOT Same as 12:00 UTC */, "1970-01-01 12:00", "-06:00", 12*3600, "Europe/Berlin", "1970-01-01 13:00"],
            ["1970-01-01 06:00", "-06:00", 12*3600 /* NOT Same as 12:00 UTC */, "1970-01-01 12:00", "-06:00", 12*3600, "Europe/Berlin", "1970-01-01 13:00"],
            // Etc/GMT+-6 are weird - the signs are inverted - https://stackoverflow.com/questions/23307342/php-timezone-etc-gmt5-becomes-0500
            ["1970-01-01 06:00", "Etc/GMT-6", 0*3600 /* NOT Same as 12:00 UTC */, "1970-01-01 00:00", "Etc/GMT-6", 0*3600, "Europe/Berlin", "1970-01-01 01:00"],
            ["1970-01-01 06:00", "Etc/GMT+6", 12*3600 /* NOT Same as 12:00 UTC */, "1970-01-01 12:00", "Etc/GMT+6", 12*3600, "Europe/Berlin", "1970-01-01 13:00"],
        ];
    }

    /**
     * @group coverage:full
     * @dataProvider testParseGmtTimestampFromDateSpecifiedInSpecificTimezoneProvider
     */
    public function testParseGmtTimestampFromDateSpecifiedInSpecificTimezone($str, $timezone, $expectedGmtTimestamp, $expectedGmtTimestampFormattedAsNewDefaultDatetime, $expectedDateTimeTimeZone, $expectedTimestampInTimeZone, $transposeTimeZone, $expectedTransposedFormatted)
    {
        $tlp = new TimeLogParser();
        /** @var DateTime $datetime */
        $datetime = null;
        $gmtTimestamp = $tlp->parseGmtTimestampFromDateSpecifiedInSpecificTimezone($str, $timezone, $datetime);
        $this->assertEquals(
            $expectedGmtTimestamp,
            $gmtTimestamp
        );
        $gmtTimestampFormattedAsNewDefaultDatetime = (new DateTime())->setTimestamp($gmtTimestamp);
        $this->assertEquals(
            $expectedGmtTimestampFormattedAsNewDefaultDatetime,
            $gmtTimestampFormattedAsNewDefaultDatetime->format("Y-m-d H:i")
        );
        $this->assertEquals(
            $expectedDateTimeTimeZone,
            $datetime->getTimezone()->getName()
        );
        $this->assertEquals(
            $expectedGmtTimestamp,
            $datetime->getTimestamp()
        );
        $timezoneDatetime = clone $datetime;
        $timezoneDatetime->setTimezone(new DateTimeZone($timezone));
        $this->assertEquals(
            $expectedTimestampInTimeZone,
            $timezoneDatetime->getTimestamp()
        );
        $transposed = clone $datetime;
        $transposed->setTimezone(new DateTimeZone($transposeTimeZone));
        $this->assertEquals(
            $expectedTransposedFormatted,
            $transposed->format("Y-m-d H:i")
        );

    }

    public static function testAddZeroFilledDatesProvider()
    {
        return [
            [
                [
                    "2013-03-28" => "foo",
                    "2013-04-02" => "foo",
                ],
                [
                    "2013-03-28" => "foo",
                    "2013-03-29" => 0,
                    "2013-03-30" => 0,
                    "2013-03-31" => 0,
                    "2013-04-01" => 0,
                    "2013-04-02" => "foo",
                ]
            ],
        ];
    }

    /**
     * @group coverage:full
     * @dataProvider testAddZeroFilledDatesProvider
     */
    public function testAddZeroFilledDates($times, $expectedReturnValue)
    {
        $tlp = new TimeLogParser();
        $return = $tlp->addZeroFilledDates($times);
        $this->assertEquals(
            $expectedReturnValue,
            $return,
            'TimeLogParser->addZeroFilledDates() behaves as expected'
        );
    }

    public static function testDurationFromLastProvider()
    {
        return [
            [
                1513096800,
                3,
                array (
                    0 =>
                        array (
                            'rows_with_timemarkers_handled' => 0,
                            'line' => 'start 2017-12-12, 18:24ca',
                            'line_with_comment' => 'start 2017-12-12, 18:24ca',
                            'formatted_date' => '2017-12-12 16:24:00',
                            'date' => '2017-12-12',
                            'date_raw' => '2017-12-12, 18:24ca',
                            'ts' => 1513095840,
                            'log' =>
                                array (
                                    0 => 'Found a supported timestamp (\'Y-m-d, H:i\')',
                                    1 => 'Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...',
                                ),
                            'source_line' => 3,
                            'preprocessed_contents_source_line_index' => 2,
                            'lastKnownTimeZone' => 'Europe/Helsinki',
                            'lastUsedTimeZone' => 'Europe/Helsinki',
                            'lastSetTsAndDateErrorMessage' => 'Timestamp not found',
                            'lastKnownDate' => '2017-12-12',
                            'date_raw_was_nonempty_before_detectTimeStamp' => 'start 2017-12-12, 18:24ca',
                            'date_raw_format' => 'Y-m-d, H:i',
                            'time_raw' => '18:24ca',
                            'ts_is_faked' => false,
                            'highlight_with_newlines' => true,
                        ),
                    1 =>
                        array (
                            'rows_with_timemarkers_handled' => 1,
                            'line' => '2017-12-12, 18:28, bar',
                            'line_with_comment' => '2017-12-12, 18:28, bar',
                            'formatted_date' => '2017-12-12 16:28',
                            'date' => '2017-12-12',
                            'date_raw' => '2017-12-12, 18:28',
                            'ts' => 1513096080,
                            'log' =>
                                array (
                                ),
                            'source_line' => 5,
                            'preprocessed_contents_source_line_index' => 4,
                            'lastKnownTimeZone' => 'Europe/Helsinki',
                            'lastUsedTimeZone' => 'Europe/Helsinki',
                            'lastSetTsAndDateErrorMessage' => '',
                            'duration_since_last' => 240,
                        ),
                    2 =>
                        array (
                            'rows_with_timemarkers_handled' => 2,
                            'line' => '2017-12-12, 18:32ca, zoo',
                            'line_with_comment' => '2017-12-12, 18:32ca, zoo',
                            'formatted_date' => '2017-12-12 16:32',
                            'date' => '2017-12-12',
                            'date_raw' => '2017-12-12, 18:32ca',
                            'ts' => 1513096320,
                            'log' =>
                                array (
                                ),
                            'source_line' => 7,
                            'preprocessed_contents_source_line_index' => 6,
                            'lastKnownTimeZone' => 'Europe/Helsinki',
                            'lastUsedTimeZone' => 'Europe/Helsinki',
                            'lastSetTsAndDateErrorMessage' => '',
                            'duration_since_last' => 240,
                        ),
                ),
                480
            ],
        ];
    }

    /**
     * @group coverage:full
     * @dataProvider testDurationFromLastProvider
     */
    public function testDurationFromLast($ts, $rows_with_timemarkers_handled, $rows_with_timemarkers, $expectedDurationFromLast)
    {
        $tlp = new TimeLogParser();

        $return = $tlp->durationFromLast($ts,
            $rows_with_timemarkers_handled,
            $rows_with_timemarkers
        );
        $this->assertEquals(
            $expectedDurationFromLast,
            $return,
            'TimeLogParser->testDurationFromLast() behaves as expected'
        );
    }

    // TODO: Test detection of start/stop-lines
    // Do not treat "stop paying the bills" as a stop-line...

    public static function testDetectStartStopLinesCorrectlyProvider()
    {
        return [
            ['stop paying the bills', false, false, false, 'Europe/Stockholm', '2016-05-01', false, false],
            ['start going through the items', false, false, false, 'Europe/Stockholm', '2016-05-01', false, false],
        ];
    }

    public static function testDetectTimeStampAndSetTsAndDateDataProvider()
    {
        return [
            ['foo 2016-05-25T14:50:00Z bar', '2016-05-25T14:50:00Z', '14:50:00', DateTime::ISO8601, 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 14:50:00'],
            ['foo 2016-05-25T14:50:00+03:00 bar', '2016-05-25T14:50:00+03:00', '14:50:00', DateTime::ISO8601, 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 11:50:00'],
            ['foo 2016-05-25T14:50:00+UTC bar', '2016-05-25T14:50:00+UTC', '14:50:00', DateTime::ISO8601, 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 14:50:00'],
            ['foo 2016-05-25 14:50 bar', '2016-05-25 14:50', '14:50', 'Y-m-d H:i', 'UTC', '2016-05-01', true, '2016-05-25 14:50:00'],
            ['foo 2016-05-25 14:50 bar', '2016-05-25 14:50', '14:50', 'Y-m-d H:i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 12:50:00'],
            ['foo 2016-05-25 14:50 bar', '2016-05-25 14:50', '14:50', 'Y-m-d H:i', 'Europe/Helsinki', '2016-05-01', true, '2016-05-25 11:50:00'],
            ['foo 2014-09-01 14:50 bar', '2014-09-01 14:50', '14:50', 'Y-m-d H:i', 'UTC', '2016-05-01', true, '2014-09-01 14:50:00'],
            ['foo 2014-09-01 14:50 bar', '2014-09-01 14:50', '14:50', 'Y-m-d H:i', 'Europe/Stockholm', '2016-05-01', true, '2014-09-01 12:50:00'],
            ['foo 2014-09-01 14:50 bar', '2014-09-01 14:50', '14:50', 'Y-m-d H:i', 'Europe/Helsinki', '2016-05-01', true, '2014-09-01 11:50:00'],
            ['foo 2014-11-21 14:50 bar', '2014-11-21 14:50', '14:50', 'Y-m-d H:i', 'UTC', '2016-05-01', true, '2014-11-21 14:50:00'],
            ['foo 2014-11-21 14:50 bar', '2014-11-21 14:50', '14:50', 'Y-m-d H:i', 'Europe/Stockholm', '2016-05-01', true, '2014-11-21 13:50:00'],
            ['foo 2014-11-21 14:50 bar', '2014-11-21 14:50', '14:50', 'Y-m-d H:i', 'Europe/Helsinki', '2016-05-01', true, '2014-11-21 12:50:00'],
            ['foo 2016-05-25, 14:50 bar', '2016-05-25, 14:50', '14:50', 'Y-m-d, H:i', 'UTC', '2016-05-01', true, '2016-05-25 14:50:00'],
            ['foo 2016-05-25, 14:50 bar', '2016-05-25, 14:50', '14:50', 'Y-m-d, H:i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 12:50:00'],
            ['foo 2016-05-25, 14:50 bar', '2016-05-25, 14:50', '14:50', 'Y-m-d, H:i', 'Europe/Helsinki', '2016-05-01', true, '2016-05-25 11:50:00'],
            ['foo 2014-09-01, 14:50 bar', '2014-09-01, 14:50', '14:50', 'Y-m-d, H:i', 'UTC', '2016-05-01', true, '2014-09-01 14:50:00'],
            ['foo 2014-09-01, 14:50 bar', '2014-09-01, 14:50', '14:50', 'Y-m-d, H:i', 'Europe/Stockholm', '2016-05-01', true, '2014-09-01 12:50:00'],
            ['foo 2014-09-01, 14:50 bar', '2014-09-01, 14:50', '14:50', 'Y-m-d, H:i', 'Europe/Helsinki', '2016-05-01', true, '2014-09-01 11:50:00'],
            ['foo 2014-11-21, 14:50 bar', '2014-11-21, 14:50', '14:50', 'Y-m-d, H:i', 'UTC', '2016-05-01', true, '2014-11-21 14:50:00'],
            ['foo 2014-11-21, 14:50 bar', '2014-11-21, 14:50', '14:50', 'Y-m-d, H:i', 'Europe/Stockholm', '2016-05-01', true, '2014-11-21 13:50:00'],
            ['foo 2014-11-21, 14:50 bar', '2014-11-21, 14:50', '14:50', 'Y-m-d, H:i', 'Europe/Helsinki', '2016-05-01', true, '2014-11-21 12:50:00'],
            ['foo 2016-05-25, 14.50 bar', '2016-05-25, 14.50', '14.50', 'Y-m-d, H.i', 'UTC', '2016-05-01', true, '2016-05-25 14:50:00'],
            ['foo 2016-05-25, 14.50 bar', '2016-05-25, 14.50', '14.50', 'Y-m-d, H.i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 12:50:00'],
            ['foo 2016-05-25, 14.50 bar', '2016-05-25, 14.50', '14.50', 'Y-m-d, H.i', 'Europe/Helsinki', '2016-05-01', true, '2016-05-25 11:50:00'],
            ['foo 2014-09-01, 14.50 bar', '2014-09-01, 14.50', '14.50', 'Y-m-d, H.i', 'UTC', '2016-05-01', true, '2014-09-01 14:50:00'],
            ['foo 2014-09-01, 14.50 bar', '2014-09-01, 14.50', '14.50', 'Y-m-d, H.i', 'Europe/Stockholm', '2016-05-01', true, '2014-09-01 12:50:00'],
            ['foo 2014-09-01, 14.50 bar', '2014-09-01, 14.50', '14.50', 'Y-m-d, H.i', 'Europe/Helsinki', '2016-05-01', true, '2014-09-01 11:50:00'],
            ['foo 2014-11-21, 14.50 bar', '2014-11-21, 14.50', '14.50', 'Y-m-d, H.i', 'UTC', '2016-05-01', true, '2014-11-21 14:50:00'],
            ['foo 2014-11-21, 14.50 bar', '2014-11-21, 14.50', '14.50', 'Y-m-d, H.i', 'Europe/Stockholm', '2016-05-01', true, '2014-11-21 13:50:00'],
            ['foo 2014-11-21, 14.50 bar', '2014-11-21, 14.50', '14.50', 'Y-m-d, H.i', 'Europe/Helsinki', '2016-05-01', true, '2014-11-21 12:50:00'],
            ['foo 2014-09-01T12:42:21+02:00 bar', '2014-09-01T12:42:21+02:00', '12:42:21', DateTime::ISO8601, 'Europe/Stockholm', '2016-05-01', true, '2014-09-01 10:42:21'],
            ['foo 2014-09-01 12:42 bar', '2014-09-01 12:42', '12:42', 'Y-m-d H:i', 'Europe/Stockholm', '2016-05-01', true, '2014-09-01 10:42:00'],
            ['foo 2014-09-01, 12:42 bar', '2014-09-01, 12:42', '12:42', 'Y-m-d, H:i', 'Europe/Stockholm', '2016-05-01', true, '2014-09-01 10:42:00'],
            ['foo 14:35 bar', '14:35', '14:35', 'H:i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['foo 14.35 bar', '14.35', '14.35', 'H.i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['foo bar', false, false, false, 'Europe/Stockholm', '2016-05-01', false, false],
            ['paus 18:45ca->', '18:45ca', '18:45ca', 'H:i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 16:45:00'],
            ['paus 2016-05-25 18:45ca->', '2016-05-25 18:45ca', '18:45ca', 'Y-m-d H:i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 16:45:00'],
            ['paus 2016-05-25, 18:45ca->', '2016-05-25, 18:45ca', '18:45ca', 'Y-m-d, H:i', 'Europe/Stockholm', '2016-05-01', true, '2016-05-25 16:45:00'],
            ['paus ??->', false, false, false, 'Europe/Stockholm', '2016-05-01', false, false],
            ['foo bar :zoo:', false, false, false, 'Europe/Stockholm', '2016-05-01', false, false],
            ['start 2014-11-21 17:49', '2014-11-21 17:49', '17:49', 'Y-m-d H:i', 'Europe/Stockholm', '2014-11-21', true, '2014-11-21 16:49:00'],
            ['start 2014-11-21, 17:49', '2014-11-21, 17:49', '17:49', 'Y-m-d, H:i', 'Europe/Stockholm', '2014-11-21', true, '2014-11-21 16:49:00'],
            [' 2014-11-21T15:51:00+UTC, <just before paus>', '2014-11-21T15:51:00+UTC', '15:51:00', DateTime::ISO8601, 'Europe/Stockholm', '2014-11-21', true, '2014-11-21 15:51:00'],
            ['2017-01-26, 17:26, init', '2017-01-26, 17:26', '17:26', 'Y-m-d, H:i', 'Europe/Helsinki', '2017-01-26', true, '2017-01-26 15:26:00'],
            ['start 2017-03-01, 09:15', '2017-03-01, 09:15', '09:15', 'Y-m-d, H:i', 'Europe/Helsinki', '2017-03-01', true, '2017-03-01 07:15:00'],
        ];
    }

    /**
     * @group coverage:full
     * @dataProvider testDetectTimeStampAndSetTsAndDateDataProvider
     */
    public function testDetectTimeStampAndSetTsAndDate(
        $linefordatecheck,
        $expectedMetadataDateRaw,
        $expectedMetadataTimeRaw,
        $expectedMetadataDateRawFormat,
        $lastKnownTimeZone,
        $lastKnownDate,
        $expectedToBeValid,
        $expectedUtcDateString
    )
    {
        $tlp = new TimeLogParser();
        $metadata = [];
        $tlp->lastKnownDate = $lastKnownDate;
        $tlp->lastKnownTimeZone = $lastKnownTimeZone;
        $tlp->detectTimeStamp($linefordatecheck, $metadata);
        codecept_debug(compact("metadata"));
        $this->assertEquals(
            $expectedMetadataDateRaw,
            $metadata['date_raw'],
            'TimeLogParser->detectTimeStamp() detects date_raw as expected'
        );
        $this->assertEquals(
            $expectedMetadataTimeRaw,
            $metadata['time_raw'],
            'TimeLogParser->detectTimeStamp() detects time_raw as expected'
        );
        $this->assertEquals(
            $expectedMetadataDateRawFormat,
            $metadata['date_raw_format'],
            'TimeLogParser->detectTimeStamp() detects the datetime with the expected format'
        );

        $ts = null;
        $date = null;
        /** @var DateTime $datetime */
        $datetime = null;
        $tlp->set_ts_and_date($metadata["date_raw"], $ts, $date, null, $datetime);
        $set_ts_and_date_error = $tlp->lastSetTsAndDateErrorMessage;
        codecept_debug(compact("ts", "date", "datetime", "set_ts_and_date_error"));
        $valid = !empty($date);

        $this->assertEquals(
            $expectedToBeValid,
            $valid,
            'TimeLogParser->set_ts_and_date() detects valid datetimes as expected'
        );
        $this->assertEquals(
            $lastKnownTimeZone,
            $tlp->lastKnownTimeZone,
            'TimeLogParser->set_ts_and_date() does not change the last known timezone by parsing a timestamp string'
        );
        if ($expectedToBeValid) {
            $this->assertEmpty($set_ts_and_date_error, 'TimeLogParser->set_ts_and_date() does not set an error message where valid datetimes are expected');
        } else {
            $this->assertNotEmpty($set_ts_and_date_error, 'TimeLogParser->set_ts_and_date() sets an error message where valid datetimes are expected');
        }

        if ($expectedToBeValid) {

            $datetime->setTimezone(new DateTimeZone('UTC'));
            $this->assertEquals(
                $expectedUtcDateString,
                $datetime->format('Y-m-d H:i:s'),
                'TimeLogParser->set_ts_and_date() behaves as expected'
            );

        }

    }

    public static function testParseLogCommentDataProvider()
    {
        return [
            ['14:35, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['14.35, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['14:35ca, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['14.35ca, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['foo bar', '', 'Europe/Stockholm', '2016-05-01', false, false],
            ['18:15', '', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 16:15:00'],
            ['18.15', '', 'Europe/Stockholm', '2016-05-01', false, false],
            ['18,15', '', 'Europe/Stockholm', '2016-05-01', false, false],
            ['foo:bar', '', 'Europe/Stockholm', '2016-05-01', false, false],
            [':zoo', '', 'Europe/Stockholm', '2016-05-01', false, false],
            ['2016-05-01 14:35, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14.35, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14:35ca, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14.35ca, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14:35 - bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14.35 - bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14:35ca - bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01 14.35ca - bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01, 14:35, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01, 14.35, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01, 14:35ca, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01, 14.35ca, bar', ' bar', 'Europe/Stockholm', '2016-05-01', true, '2016-05-01 12:35:00'],
            ['2016-05-01, bar', '', 'Europe/Stockholm', '2016-05-01', false, false],
            ['2016-05-01, bar', '', 'Europe/Stockholm', '2016-05-01', false, false],
        ];
    }

    /**
     * Note: "linewithoutdate" here refers to the part without the date-time-stamp, ie the actual log message
     * TODO: Refactor code to reflect this more clearly
     *
     * @group coverage:full
     * @dataProvider testParseLogCommentDataProvider
     */
    public function testParseLogComment(
        $line,
        $expectedLinewithoutdate,
        $lastKnownTimeZone,
        $lastKnownDate,
        $expectedToBeValidTimestampedLogComment,
        $expectedUtcDateString
    )
    {
        $tlp = new TimeLogParser();
        $tlp->lastKnownDate = $lastKnownDate;
        $tlp->lastKnownTimeZone = $lastKnownTimeZone;

        $date_raw = null;
        $ts = null;
        $date = null;
        $linewithoutdate = null;
        $invalid = null;
        /** @var DateTime $datetime */
        $datetime = null;
        $tlp->parseLogComment($line, $date_raw, $ts, $date, $linewithoutdate, $invalid, $datetime);
        codecept_debug(compact("line", "ts", "date", "datetime"));
        $valid = !$invalid;

        $this->assertEquals(
            $expectedLinewithoutdate,
            $linewithoutdate,
            'TimeLogParser->parseLogComment() detects lines without datetime as expected'
        );
        codecept_debug(compact("expectedToBeValidTimestampedLogComment", "valid"));
        $this->assertEquals(
            $expectedToBeValidTimestampedLogComment,
            $valid,
            'TimeLogParser->parseLogComment() detects valid timestamped log content as expected'
        );
        $this->assertEquals(
            $lastKnownTimeZone,
            $tlp->lastKnownTimeZone,
            'TimeLogParser->set_ts_and_date() does not change the last known timezone by parsing a timestamp string'
        );

        if ($expectedToBeValidTimestampedLogComment) {

            $datetime->setTimezone(new DateTimeZone('UTC'));
            $this->assertEquals(
                $expectedUtcDateString,
                $datetime->format('Y-m-d H:i:s'),
                'TimeLogParser->parseLogComment() behaves as expected'
            );

        }

    }

    public static function correctTimeSpendingLogContentsProvider()
    {
        $pathToFolderWhereTsLogsReside = codecept_data_dir('neamtime/time-spending-logs/correct');
        $timeSpendingLogPaths = static::timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside);
        $providerData = [];
        foreach ($timeSpendingLogPaths as $timeSpendingLogPath) {
            $providerData[] = [$timeSpendingLogPath];
        }
        return $providerData;
    }

    /**
     * @group coverage:full
     * @dataProvider correctTimeSpendingLogContentsProvider
     */
    public function testprocessAndAssertCorrectTimeSpendingLog($timeSpendingLogPath)
    {
        $this->processAndAssertCorrectTimeSpendingLog($timeSpendingLogPath);
    }

    /**
     * @group coverage:full
     * @dataProvider correctTimeSpendingLogContentsProvider
     */
    public function testCorrectTimeSpendingLogsCorrectness($timeSpendingLogPath)
    {

        $correspondingCsvDataFilePath = $this->correspondingCsvDataFilePath($timeSpendingLogPath);
        $correspondingCsvDataFileContents = file_get_contents($correspondingCsvDataFilePath);
        $processedTimeSpendingLog = $this->processedTimeSpendingLog($timeSpendingLogPath);
        $this->assertEquals($correspondingCsvDataFileContents, $processedTimeSpendingLog->timeReportCsv, "CSV contents for '$timeSpendingLogPath' matches expected");

    }

    public static function incorrectTimeSpendingLogContentsProvider()
    {
        $pathToFolderWhereTsLogsReside = codecept_data_dir('neamtime/time-spending-logs/incorrect');
        $timeSpendingLogPaths = static::timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside);
        $providerData = [];
        foreach ($timeSpendingLogPaths as $timeSpendingLogPath) {
            $processingErrorsJsonFilePath = str_replace(".tslog", ".processing-errors.json", $timeSpendingLogPath);
            $providerData[] = [$timeSpendingLogPath, $processingErrorsJsonFilePath];
        }
        return $providerData;
    }

    /**
     * @group coverage:full
     * @dataProvider incorrectTimeSpendingLogContentsProvider
     */
    public function testCorrectlyReportedProcessingErrors($timeSpendingLogPath, $processingErrorsJsonFilePath)
    {

        codecept_debug($timeSpendingLogPath);

        $thrownException = null;
        $processedTimeSpendingLog = null;
        try {
            $processedTimeSpendingLog = $this->processedTimeSpendingLog($timeSpendingLogPath);
        } catch (TimeSpendingLogProcessingErrorsEncounteredException $e) {

            $thrownException = $e;
            $processedTimeSpendingLog = $e->processedTimeSpendingLog;

            codecept_debug($e->processedTimeSpendingLog->getTroubleshootingInfo());
            //codecept_debug($e->processedTimeSpendingLog->getTimeLogParser()->preProcessedContentsSourceLineContentsSourceLineMap);

            $errorsJson = AppJson::encode($e->processedTimeSpendingLog->getProcessingErrors(), JSON_PRETTY_PRINT);

            // To update all existing (when having changed the error log format for instance)
            /*
            file_put_contents(
                $processingErrorsJsonFilePath,
                $errorsJson
            );
            */

            // To make it easier to update with correct contents for the first time
            file_put_contents(
                $timeSpendingLogPath . ".latest-run.processing-errors.json",
                $errorsJson
            );

        }

        // Save timeReportCsv in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.timeReportCsv.csv",
            $processedTimeSpendingLog->timeReportCsv
        );

        // Save preProcessedContents in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.preProcessedContents",
            $processedTimeSpendingLog->preProcessedContents
        );

        // Save processedLogContentsWithTimeMarkers in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.processedLogContentsWithTimeMarkers",
            $processedTimeSpendingLog->processedLogContentsWithTimeMarkers
        );

        if (!empty($thrownException)) {
            $processingErrorsJsonFileContents = file_get_contents($processingErrorsJsonFilePath);
            $this->assertEquals($processingErrorsJsonFileContents, $errorsJson, 'Expected error json matches actual error json for ' . $timeSpendingLogPath);
        }

        $this->assertInstanceOf("TimeSpendingLogProcessingErrorsEncounteredException", $thrownException, "We should have encountered log processing error(s), but we did not");

    }


    public function processAndAssertCorrectTimeSpendingLog($timeSpendingLogPath)
    {

        $processedTimeSpendingLog = $this->processTimeSpendingLog($timeSpendingLogPath, $thrownException);

        $this->assertNotInstanceOf("TimeSpendingLogProcessingErrorsEncounteredException", $thrownException, "We should not have encountered any log processing error, but we did. Check .latest-run.processing-errors.json for more info.");

        codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

        return $processedTimeSpendingLog->calculateTotalReportedTime();

    }

    public function processTimeSpendingLog($timeSpendingLogPath, &$thrownException = null)
    {

        codecept_debug($timeSpendingLogPath);
        codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

        $correspondingCsvDataFilePath = $this->correspondingCsvDataFilePath($timeSpendingLogPath);

        $thrownException = null;
        $processedTimeSpendingLog = null;
        try {
            codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

            $processedTimeSpendingLog = $this->processedTimeSpendingLog($timeSpendingLogPath);

            codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

            //codecept_debug($processedTimeSpendingLog->timeReportCsv);

            // To update the expected contents based on the current output (use only when certain that everything
            // is correct and only the format of the output file has been changed)
            /*
            file_put_contents(
                $correspondingCsvDataFilePath,
                $processedTimeSpendingLog->timeReportCsv
            );
            */

            // To make it easier to update with correct contents for the first time
            file_put_contents(
                $correspondingCsvDataFilePath . ".latest-run.csv",
                $processedTimeSpendingLog->timeReportCsv
            );

            $timeLogEntriesWithMetadata = $processedTimeSpendingLog->getTimeLogEntriesWithMetadata();

            codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

            //codecept_debug($timeLogEntriesWithMetadata);
            codecept_debug(count($timeLogEntriesWithMetadata) . " time log entries");

            // All tested time logs should include at least 1 time log entry
            $this->assertGreaterThan(0, count($timeLogEntriesWithMetadata));

            // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
            file_put_contents(
                $timeSpendingLogPath . ".latest-run.timeLogEntriesWithMetadata.json",
                AppJson::encode($timeLogEntriesWithMetadata, JSON_PRETTY_PRINT)
            );

        } catch (TimeSpendingLogProcessingErrorsEncounteredException $e) {

            $thrownException = $e;
            $processedTimeSpendingLog = $e->processedTimeSpendingLog;

            $errorsJson = AppJson::encode($e->processedTimeSpendingLog->getProcessingErrors(), JSON_PRETTY_PRINT);

            // To make it easier to update with correct contents for the first time
            file_put_contents(
                $timeSpendingLogPath . ".latest-run.processing-errors.json",
                $errorsJson
            );

        }

        // Save preProcessedContents in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.preProcessedContents",
            $processedTimeSpendingLog->preProcessedContents
        );

        // Save processedLogContentsWithTimeMarkers in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.processedLogContentsWithTimeMarkers",
            $processedTimeSpendingLog->processedLogContentsWithTimeMarkers
        );

        // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.processedLogContentsWithTimeMarkers_debug.json",
            $processedTimeSpendingLog->processedLogContentsWithTimeMarkers_debug
        );

        return $processedTimeSpendingLog;

    }

    protected function processedTimeSpendingLog($timeSpendingLogPath)
    {

        $timeSpendingLogContents = file_get_contents($timeSpendingLogPath);
        if (is_file($timeSpendingLogPath . ".tzFirst")) {
            $tzFirst = trim(file_get_contents($timeSpendingLogPath . ".tzFirst"));
        } else {
            $tzFirst = 'UTC';
        }

        $timeSpendingLog = new TimeSpendingLog();
        $timeSpendingLog->rawLogContents = $timeSpendingLogContents;
        $timeSpendingLog->tzFirst = $tzFirst;
        $processedTimeSpendingLog = new ProcessedTimeSpendingLog($timeSpendingLog);

        return $processedTimeSpendingLog;

    }

    protected function correspondingCsvDataFilePath($timeSpendingLogPath)
    {
        return str_replace(".tslog", ".csv", $timeSpendingLogPath);
    }

    protected static function timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside)
    {
        // handle bear-exported txt-files
        $timeSpendingLogPaths = glob($pathToFolderWhereTsLogsReside . '/*.txt');
        foreach ($timeSpendingLogPaths as $rawTimeSpendingLogPath) {
            // first rename the file to make it shorter, and end with .tslog
            $dirname = pathinfo($rawTimeSpendingLogPath, PATHINFO_DIRNAME);
            $filename = pathinfo($rawTimeSpendingLogPath, PATHINFO_FILENAME);
            $_ = explode(" - ", $filename);
            $newFilename = trim($_[0]);
            $timeSpendingLogPath = $dirname . "/" . $newFilename . ".tslog";
            rename($rawTimeSpendingLogPath, $timeSpendingLogPath);
        }

        // pick up properly named files for parsing
        $timeSpendingLogPaths = glob($pathToFolderWhereTsLogsReside . '/*.tslog');
        return $timeSpendingLogPaths;
    }

}