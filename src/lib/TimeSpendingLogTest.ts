//
//@group coverage:full
//@dataProvider testStartsWithOptionallySuffixedTokenMethodDataProvider
//
//
//@group coverage:full
//@dataProvider testSecondsToDurationProvider
//
//
//@group coverage:full
//@dataProvider testDurationToMinutesProvider
//
//
//@group coverage:full
//@dataProvider testParseGmtTimestampFromDateSpecifiedInSpecificTimezoneProvider
//
//
//@group coverage:full
//@dataProvider testAddZeroFilledDatesProvider
//
//
//@group coverage:full
//@dataProvider testDurationFromLastProvider
//
//TODO: Test detection of start/stop-lines
//Do not treat "stop paying the bills" as a stop-line...
//
//@group coverage:full
//@dataProvider testDetectTimeStampAndSetTsAndDateDataProvider
//
//
//Note: "linewithoutdate" here refers to the part without the date-time-stamp, ie the actual log message
//TODO: Refactor code to reflect this more clearly
//
//@group coverage:full
//@dataProvider testParseLogCommentDataProvider
//
//
//@group coverage:full
//@dataProvider correctTimeSpendingLogContentsProvider
//
//
//@group coverage:full
//@dataProvider correctTimeSpendingLogContentsProvider
//
//
//@group coverage:full
//@dataProvider incorrectTimeSpendingLogContentsProvider
//
class TimeSpendingLogTest extends global.PHPUnit_Framework_TestCase {
    setUp() {}

    tearDown() {}

    static testStartsWithOptionallySuffixedTokenMethodDataProvider() {
        var testDataMatrix = Array();
        var tlp = new TimeLogParser();
        var tokens = tlp.tokens();
        var keyword = "pause";

        for (var token of Object.values(tokens[keyword])) {
            var tokenSpecific = [[token + "->2010-04-03 7:58", keyword, "->", token], [token + "->2010-04-03 7:58", keyword, undefined, token], [token + " 2016-05-16 09:55->", keyword, "->", false], [token + " 2016-05-16 09:55->", keyword, " ", token], [token + " 2016-05-16 09:55->", keyword, undefined, token], [token + "->|$", keyword, "->|$", token]];
            testDataMatrix = array_merge(testDataMatrix, tokenSpecific);
        }

        return testDataMatrix;
    }

    testStartsWithOptionallySuffixedTokenMethod(haystack, keyword, suffix, expectedReturnValue) {
        var tlp = new TimeLogParser();
        var return = tlp.startsWithOptionallySuffixedToken(haystack, keyword, suffix);
        this.assertEquals(expectedReturnValue, return, "TimeLogParser->startsWithOptionallySuffixedToken() behaves as expected");
    }

    static testSecondsToDurationProvider() {
        return [[60, "1min"], [65, "1min"], [120, "2min"], [99 * 60, "1h39min"], [200 * 60, "3h20min"], [184 * 60, "3h4min"], [70 * 60, "1h10min"], [4397 * 60, "3d1h17min"], [4397 * 60 + 3600 * 24 * 7 * 5, "5w3d1h17min"], [13, "0min"]];
    }

    testSecondsToDuration(seconds, expectedReturnValue) {
        var tlp = new TimeLogParser();
        var return = tlp.secondsToDuration(seconds);
        this.assertEquals(expectedReturnValue, return, "TimeLogParser->secondsToDuration() behaves as expected");
    }

    static testDurationToMinutesProvider() {
        return [["4min", "4"], ["99min", "99"], ["200min", "200"], ["3h4min", 184], ["1h10min", 70], ["3d1h17min", 4397], ["5w3d1h17min", 4397 + 3600 * 24 * 7 * 5 / 60], ["13s", 13 / 60]];
    }

    testDurationToMinutes(duration, expectedReturnValue) {
        var tlp = new TimeLogParser();
        var return = tlp.durationToMinutes(duration);
        this.assertEquals(expectedReturnValue, return, "TimeLogParser->durationToMinutes() behaves as expected");
    }

    static testParseGmtTimestampFromDateSpecifiedInSpecificTimezoneProvider() {
        return [["1970-01-01 12:00", "UTC", 12 * 3600, "1970-01-01 12:00", "UTC", 12 * 3600, "Europe/Berlin", "1970-01-01 13:00"], ["1970-01-01 06:00", "UTC", 6 * 3600, "1970-01-01 06:00", "UTC", 6 * 3600, "Europe/Berlin", "1970-01-01 07:00"], ["1970-01-01 06:00", "Europe/Berlin", 5 * 3600, "1970-01-01 05:00", "Europe/Berlin", 5 * 3600, "Europe/Berlin", "1970-01-01 06:00"], ["1970-01-01 06:00", "Europe/Berlin", 5 * 3600, "1970-01-01 05:00", "Europe/Berlin", 5 * 3600, "UTC", "1970-01-01 05:00"], ["1970-01-01 13:00", "Europe/Berlin", 12 * 3600, "1970-01-01 12:00", "Europe/Berlin", 12 * 3600, "Europe/Berlin", "1970-01-01 13:00"], ["1970-01-01 06:00", "America/Chicago", 12 * 3600, "1970-01-01 12:00", "America/Chicago", 12 * 3600, "Europe/Berlin", "1970-01-01 13:00"], ["1970-01-01 06:00", "GMT-6", 12 * 3600, "1970-01-01 12:00", "-06:00", 12 * 3600, "Europe/Berlin", "1970-01-01 13:00"], ["1970-01-01 06:00", "-06:00", 12 * 3600, "1970-01-01 12:00", "-06:00", 12 * 3600, "Europe/Berlin", "1970-01-01 13:00"], ["1970-01-01 06:00", "Etc/GMT-6", 0 * 3600, "1970-01-01 00:00", "Etc/GMT-6", 0 * 3600, "Europe/Berlin", "1970-01-01 01:00"], ["1970-01-01 06:00", "Etc/GMT+6", 12 * 3600, "1970-01-01 12:00", "Etc/GMT+6", 12 * 3600, "Europe/Berlin", "1970-01-01 13:00"]];
    }

    testParseGmtTimestampFromDateSpecifiedInSpecificTimezone(str, timezone, expectedGmtTimestamp, expectedGmtTimestampFormattedAsNewDefaultDatetime, expectedDateTimeTimeZone, expectedTimestampInTimeZone, transposeTimeZone, expectedTransposedFormatted) //@var DateTime $datetime
    {
        var tlp = new TimeLogParser();
        var datetime = undefined;
        var gmtTimestamp = tlp.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(str, timezone, datetime);
        this.assertEquals(expectedGmtTimestamp, gmtTimestamp);
        var gmtTimestampFormattedAsNewDefaultDatetime = new DateTime().setTimestamp(gmtTimestamp);
        this.assertEquals(expectedGmtTimestampFormattedAsNewDefaultDatetime, gmtTimestampFormattedAsNewDefaultDatetime.format("Y-m-d H:i"));
        this.assertEquals(expectedDateTimeTimeZone, datetime.getTimezone().getName());
        this.assertEquals(expectedGmtTimestamp, datetime.getTimestamp());
        var timezoneDatetime = clone(datetime);
        timezoneDatetime.setTimezone(new DateTimeZone(timezone));
        this.assertEquals(expectedTimestampInTimeZone, timezoneDatetime.getTimestamp());
        var transposed = clone(datetime);
        transposed.setTimezone(new DateTimeZone(transposeTimeZone));
        this.assertEquals(expectedTransposedFormatted, transposed.format("Y-m-d H:i"));
    }

    static testAddZeroFilledDatesProvider() {
        return [[{
            "2013-03-28": "foo",
            "2013-04-02": "foo"
        }, {
            "2013-03-28": "foo",
            "2013-03-29": 0,
            "2013-03-30": 0,
            "2013-03-31": 0,
            "2013-04-01": 0,
            "2013-04-02": "foo"
        }]];
    }

    testAddZeroFilledDates(times, expectedReturnValue) {
        var tlp = new TimeLogParser();
        var return = tlp.addZeroFilledDates(times);
        this.assertEquals(expectedReturnValue, return, "TimeLogParser->addZeroFilledDates() behaves as expected");
    }

    static testDurationFromLastProvider() {
        return [[1513096800, 3, {
            0: {
                rows_with_timemarkers_handled: 0,
                line: "start 2017-12-12, 18:24ca",
                line_with_comment: "start 2017-12-12, 18:24ca",
                formatted_date: "2017-12-12 16:24:00",
                date: "2017-12-12",
                date_raw: "2017-12-12, 18:24ca",
                ts: 1513095840,
                log: {
                    0: "Found a supported timestamp ('Y-m-d, H:i')",
                    1: "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row..."
                },
                source_line: 3,
                preprocessed_contents_source_line_index: 2,
                lastKnownTimeZone: "Europe/Helsinki",
                lastUsedTimeZone: "Europe/Helsinki",
                lastSetTsAndDateErrorMessage: "Timestamp not found",
                lastKnownDate: "2017-12-12",
                date_raw_was_nonempty_before_detectTimeStamp: "start 2017-12-12, 18:24ca",
                date_raw_format: "Y-m-d, H:i",
                time_raw: "18:24ca",
                ts_is_faked: false,
                highlight_with_newlines: true
            },
            1: {
                rows_with_timemarkers_handled: 1,
                line: "2017-12-12, 18:28, bar",
                line_with_comment: "2017-12-12, 18:28, bar",
                formatted_date: "2017-12-12 16:28",
                date: "2017-12-12",
                date_raw: "2017-12-12, 18:28",
                ts: 1513096080,
                log: Array(),
                source_line: 5,
                preprocessed_contents_source_line_index: 4,
                lastKnownTimeZone: "Europe/Helsinki",
                lastUsedTimeZone: "Europe/Helsinki",
                lastSetTsAndDateErrorMessage: "",
                duration_since_last: 240
            },
            2: {
                rows_with_timemarkers_handled: 2,
                line: "2017-12-12, 18:32ca, zoo",
                line_with_comment: "2017-12-12, 18:32ca, zoo",
                formatted_date: "2017-12-12 16:32",
                date: "2017-12-12",
                date_raw: "2017-12-12, 18:32ca",
                ts: 1513096320,
                log: Array(),
                source_line: 7,
                preprocessed_contents_source_line_index: 6,
                lastKnownTimeZone: "Europe/Helsinki",
                lastUsedTimeZone: "Europe/Helsinki",
                lastSetTsAndDateErrorMessage: "",
                duration_since_last: 240
            }
        }, 480]];
    }

    testDurationFromLast(ts, rows_with_timemarkers_handled, rows_with_timemarkers, expectedDurationFromLast) {
        var tlp = new TimeLogParser();
        var return = tlp.durationFromLast(ts, rows_with_timemarkers_handled, rows_with_timemarkers);
        this.assertEquals(expectedDurationFromLast, return, "TimeLogParser->testDurationFromLast() behaves as expected");
    }

    static testDetectStartStopLinesCorrectlyProvider() {
        return [["stop paying the bills", false, false, false, "Europe/Stockholm", "2016-05-01", false, false], ["start going through the items", false, false, false, "Europe/Stockholm", "2016-05-01", false, false]];
    }

    static testDetectTimeStampAndSetTsAndDateDataProvider() {
        return [["foo 2016-05-25T14:50:00Z bar", "2016-05-25T14:50:00Z", "14:50:00", DateTime.ISO8601, "Europe/Stockholm", "2016-05-01", true, "2016-05-25 14:50:00"], ["foo 2016-05-25T14:50:00+03:00 bar", "2016-05-25T14:50:00+03:00", "14:50:00", DateTime.ISO8601, "Europe/Stockholm", "2016-05-01", true, "2016-05-25 11:50:00"], ["foo 2016-05-25T14:50:00+UTC bar", "2016-05-25T14:50:00+UTC", "14:50:00", DateTime.ISO8601, "Europe/Stockholm", "2016-05-01", true, "2016-05-25 14:50:00"], ["foo 2016-05-25 14:50 bar", "2016-05-25 14:50", "14:50", "Y-m-d H:i", "UTC", "2016-05-01", true, "2016-05-25 14:50:00"], ["foo 2016-05-25 14:50 bar", "2016-05-25 14:50", "14:50", "Y-m-d H:i", "Europe/Stockholm", "2016-05-01", true, "2016-05-25 12:50:00"], ["foo 2016-05-25 14:50 bar", "2016-05-25 14:50", "14:50", "Y-m-d H:i", "Europe/Helsinki", "2016-05-01", true, "2016-05-25 11:50:00"], ["foo 2014-09-01 14:50 bar", "2014-09-01 14:50", "14:50", "Y-m-d H:i", "UTC", "2016-05-01", true, "2014-09-01 14:50:00"], ["foo 2014-09-01 14:50 bar", "2014-09-01 14:50", "14:50", "Y-m-d H:i", "Europe/Stockholm", "2016-05-01", true, "2014-09-01 12:50:00"], ["foo 2014-09-01 14:50 bar", "2014-09-01 14:50", "14:50", "Y-m-d H:i", "Europe/Helsinki", "2016-05-01", true, "2014-09-01 11:50:00"], ["foo 2014-11-21 14:50 bar", "2014-11-21 14:50", "14:50", "Y-m-d H:i", "UTC", "2016-05-01", true, "2014-11-21 14:50:00"], ["foo 2014-11-21 14:50 bar", "2014-11-21 14:50", "14:50", "Y-m-d H:i", "Europe/Stockholm", "2016-05-01", true, "2014-11-21 13:50:00"], ["foo 2014-11-21 14:50 bar", "2014-11-21 14:50", "14:50", "Y-m-d H:i", "Europe/Helsinki", "2016-05-01", true, "2014-11-21 12:50:00"], ["foo 2016-05-25, 14:50 bar", "2016-05-25, 14:50", "14:50", "Y-m-d, H:i", "UTC", "2016-05-01", true, "2016-05-25 14:50:00"], ["foo 2016-05-25, 14:50 bar", "2016-05-25, 14:50", "14:50", "Y-m-d, H:i", "Europe/Stockholm", "2016-05-01", true, "2016-05-25 12:50:00"], ["foo 2016-05-25, 14:50 bar", "2016-05-25, 14:50", "14:50", "Y-m-d, H:i", "Europe/Helsinki", "2016-05-01", true, "2016-05-25 11:50:00"], ["foo 2014-09-01, 14:50 bar", "2014-09-01, 14:50", "14:50", "Y-m-d, H:i", "UTC", "2016-05-01", true, "2014-09-01 14:50:00"], ["foo 2014-09-01, 14:50 bar", "2014-09-01, 14:50", "14:50", "Y-m-d, H:i", "Europe/Stockholm", "2016-05-01", true, "2014-09-01 12:50:00"], ["foo 2014-09-01, 14:50 bar", "2014-09-01, 14:50", "14:50", "Y-m-d, H:i", "Europe/Helsinki", "2016-05-01", true, "2014-09-01 11:50:00"], ["foo 2014-11-21, 14:50 bar", "2014-11-21, 14:50", "14:50", "Y-m-d, H:i", "UTC", "2016-05-01", true, "2014-11-21 14:50:00"], ["foo 2014-11-21, 14:50 bar", "2014-11-21, 14:50", "14:50", "Y-m-d, H:i", "Europe/Stockholm", "2016-05-01", true, "2014-11-21 13:50:00"], ["foo 2014-11-21, 14:50 bar", "2014-11-21, 14:50", "14:50", "Y-m-d, H:i", "Europe/Helsinki", "2016-05-01", true, "2014-11-21 12:50:00"], ["foo 2016-05-25, 14.50 bar", "2016-05-25, 14.50", "14.50", "Y-m-d, H.i", "UTC", "2016-05-01", true, "2016-05-25 14:50:00"], ["foo 2016-05-25, 14.50 bar", "2016-05-25, 14.50", "14.50", "Y-m-d, H.i", "Europe/Stockholm", "2016-05-01", true, "2016-05-25 12:50:00"], ["foo 2016-05-25, 14.50 bar", "2016-05-25, 14.50", "14.50", "Y-m-d, H.i", "Europe/Helsinki", "2016-05-01", true, "2016-05-25 11:50:00"], ["foo 2014-09-01, 14.50 bar", "2014-09-01, 14.50", "14.50", "Y-m-d, H.i", "UTC", "2016-05-01", true, "2014-09-01 14:50:00"], ["foo 2014-09-01, 14.50 bar", "2014-09-01, 14.50", "14.50", "Y-m-d, H.i", "Europe/Stockholm", "2016-05-01", true, "2014-09-01 12:50:00"], ["foo 2014-09-01, 14.50 bar", "2014-09-01, 14.50", "14.50", "Y-m-d, H.i", "Europe/Helsinki", "2016-05-01", true, "2014-09-01 11:50:00"], ["foo 2014-11-21, 14.50 bar", "2014-11-21, 14.50", "14.50", "Y-m-d, H.i", "UTC", "2016-05-01", true, "2014-11-21 14:50:00"], ["foo 2014-11-21, 14.50 bar", "2014-11-21, 14.50", "14.50", "Y-m-d, H.i", "Europe/Stockholm", "2016-05-01", true, "2014-11-21 13:50:00"], ["foo 2014-11-21, 14.50 bar", "2014-11-21, 14.50", "14.50", "Y-m-d, H.i", "Europe/Helsinki", "2016-05-01", true, "2014-11-21 12:50:00"], ["foo 2014-09-01T12:42:21+02:00 bar", "2014-09-01T12:42:21+02:00", "12:42:21", DateTime.ISO8601, "Europe/Stockholm", "2016-05-01", true, "2014-09-01 10:42:21"], ["foo 2014-09-01 12:42 bar", "2014-09-01 12:42", "12:42", "Y-m-d H:i", "Europe/Stockholm", "2016-05-01", true, "2014-09-01 10:42:00"], ["foo 2014-09-01, 12:42 bar", "2014-09-01, 12:42", "12:42", "Y-m-d, H:i", "Europe/Stockholm", "2016-05-01", true, "2014-09-01 10:42:00"], ["foo 14:35 bar", "14:35", "14:35", "H:i", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["foo 14.35 bar", "14.35", "14.35", "H.i", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["foo bar", false, false, false, "Europe/Stockholm", "2016-05-01", false, false], ["paus 18:45ca->", "18:45ca", "18:45ca", "H:i", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 16:45:00"], ["paus 2016-05-25 18:45ca->", "2016-05-25 18:45ca", "18:45ca", "Y-m-d H:i", "Europe/Stockholm", "2016-05-01", true, "2016-05-25 16:45:00"], ["paus 2016-05-25, 18:45ca->", "2016-05-25, 18:45ca", "18:45ca", "Y-m-d, H:i", "Europe/Stockholm", "2016-05-01", true, "2016-05-25 16:45:00"], ["paus ??->", false, false, false, "Europe/Stockholm", "2016-05-01", false, false], ["foo bar :zoo:", false, false, false, "Europe/Stockholm", "2016-05-01", false, false], ["start 2014-11-21 17:49", "2014-11-21 17:49", "17:49", "Y-m-d H:i", "Europe/Stockholm", "2014-11-21", true, "2014-11-21 16:49:00"], ["start 2014-11-21, 17:49", "2014-11-21, 17:49", "17:49", "Y-m-d, H:i", "Europe/Stockholm", "2014-11-21", true, "2014-11-21 16:49:00"], [" 2014-11-21T15:51:00+UTC, <just before paus>", "2014-11-21T15:51:00+UTC", "15:51:00", DateTime.ISO8601, "Europe/Stockholm", "2014-11-21", true, "2014-11-21 15:51:00"], ["2017-01-26, 17:26, init", "2017-01-26, 17:26", "17:26", "Y-m-d, H:i", "Europe/Helsinki", "2017-01-26", true, "2017-01-26 15:26:00"], ["start 2017-03-01, 09:15", "2017-03-01, 09:15", "09:15", "Y-m-d, H:i", "Europe/Helsinki", "2017-03-01", true, "2017-03-01 07:15:00"]];
    }

    testDetectTimeStampAndSetTsAndDate(linefordatecheck, expectedMetadataDateRaw, expectedMetadataTimeRaw, expectedMetadataDateRawFormat, lastKnownTimeZone, lastKnownDate, expectedToBeValid, expectedUtcDateString) //@var DateTime $datetime
    {
        var tlp = new TimeLogParser();
        var metadata = Array();
        tlp.lastKnownDate = lastKnownDate;
        tlp.lastKnownTimeZone = lastKnownTimeZone;
        tlp.detectTimeStamp(linefordatecheck, metadata);
        codecept_debug(compact("metadata"));
        this.assertEquals(expectedMetadataDateRaw, metadata.date_raw, "TimeLogParser->detectTimeStamp() detects date_raw as expected");
        this.assertEquals(expectedMetadataTimeRaw, metadata.time_raw, "TimeLogParser->detectTimeStamp() detects time_raw as expected");
        this.assertEquals(expectedMetadataDateRawFormat, metadata.date_raw_format, "TimeLogParser->detectTimeStamp() detects the datetime with the expected format");
        var ts = undefined;
        var date = undefined;
        var datetime = undefined;
        tlp.set_ts_and_date(metadata.date_raw, ts, date, undefined, datetime);
        var set_ts_and_date_error = tlp.lastSetTsAndDateErrorMessage;
        codecept_debug(compact("ts", "date", "datetime", "set_ts_and_date_error"));
        var valid = !!date;
        this.assertEquals(expectedToBeValid, valid, "TimeLogParser->set_ts_and_date() detects valid datetimes as expected");
        this.assertEquals(lastKnownTimeZone, tlp.lastKnownTimeZone, "TimeLogParser->set_ts_and_date() does not change the last known timezone by parsing a timestamp string");

        if (expectedToBeValid) {
            this.assertEmpty(set_ts_and_date_error, "TimeLogParser->set_ts_and_date() does not set an error message where valid datetimes are expected");
        } else {
            this.assertNotEmpty(set_ts_and_date_error, "TimeLogParser->set_ts_and_date() sets an error message where valid datetimes are expected");
        }

        if (expectedToBeValid) {
            datetime.setTimezone(new DateTimeZone("UTC"));
            this.assertEquals(expectedUtcDateString, datetime.format("Y-m-d H:i:s"), "TimeLogParser->set_ts_and_date() behaves as expected");
        }
    }

    static testParseLogCommentDataProvider() {
        return [["14:35, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["14.35, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["14:35ca, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["14.35ca, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["foo bar", "", "Europe/Stockholm", "2016-05-01", false, false], ["18:15", "", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 16:15:00"], ["18.15", "", "Europe/Stockholm", "2016-05-01", false, false], ["18,15", "", "Europe/Stockholm", "2016-05-01", false, false], ["foo:bar", "", "Europe/Stockholm", "2016-05-01", false, false], [":zoo", "", "Europe/Stockholm", "2016-05-01", false, false], ["2016-05-01 14:35, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14.35, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14:35ca, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14.35ca, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14:35 - bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14.35 - bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14:35ca - bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01 14.35ca - bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01, 14:35, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01, 14.35, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01, 14:35ca, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01, 14.35ca, bar", " bar", "Europe/Stockholm", "2016-05-01", true, "2016-05-01 12:35:00"], ["2016-05-01, bar", "", "Europe/Stockholm", "2016-05-01", false, false], ["2016-05-01, bar", "", "Europe/Stockholm", "2016-05-01", false, false]];
    }

    testParseLogComment(line, expectedLinewithoutdate, lastKnownTimeZone, lastKnownDate, expectedToBeValidTimestampedLogComment, expectedUtcDateString) //@var DateTime $datetime
    {
        var tlp = new TimeLogParser();
        tlp.lastKnownDate = lastKnownDate;
        tlp.lastKnownTimeZone = lastKnownTimeZone;
        var date_raw = undefined;
        var ts = undefined;
        var date = undefined;
        var linewithoutdate = undefined;
        var invalid = undefined;
        var datetime = undefined;
        tlp.parseLogComment(line, date_raw, ts, date, linewithoutdate, invalid, datetime);
        codecept_debug(compact("line", "ts", "date", "datetime"));
        var valid = !invalid;
        this.assertEquals(expectedLinewithoutdate, linewithoutdate, "TimeLogParser->parseLogComment() detects lines without datetime as expected");
        codecept_debug(compact("expectedToBeValidTimestampedLogComment", "valid"));
        this.assertEquals(expectedToBeValidTimestampedLogComment, valid, "TimeLogParser->parseLogComment() detects valid timestamped log content as expected");
        this.assertEquals(lastKnownTimeZone, tlp.lastKnownTimeZone, "TimeLogParser->set_ts_and_date() does not change the last known timezone by parsing a timestamp string");

        if (expectedToBeValidTimestampedLogComment) {
            datetime.setTimezone(new DateTimeZone("UTC"));
            this.assertEquals(expectedUtcDateString, datetime.format("Y-m-d H:i:s"), "TimeLogParser->parseLogComment() behaves as expected");
        }
    }

    static correctTimeSpendingLogContentsProvider() {
        var pathToFolderWhereTsLogsReside = codecept_data_dir("neamtime/time-spending-logs/correct");
        var timeSpendingLogPaths = this.timeSpendingLogPathsInFolder(pathToFolderWhereTsLogsReside);
        var providerData = Array();

        for (var timeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
            providerData.push([timeSpendingLogPath]);
        }

        return providerData;
    }

    testprocessAndAssertCorrectTimeSpendingLog(timeSpendingLogPath) {
        this.processAndAssertCorrectTimeSpendingLog(timeSpendingLogPath);
    }

    testCorrectTimeSpendingLogsCorrectness(timeSpendingLogPath) {
        var correspondingCsvDataFilePath = this.correspondingCsvDataFilePath(timeSpendingLogPath);
        var correspondingCsvDataFileContents = file_get_contents(correspondingCsvDataFilePath);
        var processedTimeSpendingLog = this.processedTimeSpendingLog(timeSpendingLogPath);
        this.assertEquals(correspondingCsvDataFileContents, processedTimeSpendingLog.timeReportCsv, `CSV contents for '${timeSpendingLogPath}' matches expected`);
    }

    static incorrectTimeSpendingLogContentsProvider() {
        var pathToFolderWhereTsLogsReside = codecept_data_dir("neamtime/time-spending-logs/incorrect");
        var timeSpendingLogPaths = this.timeSpendingLogPathsInFolder(pathToFolderWhereTsLogsReside);
        var providerData = Array();

        for (var timeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
            var processingErrorsJsonFilePath = str_replace(".tslog", ".processing-errors.json", timeSpendingLogPath);
            providerData.push([timeSpendingLogPath, processingErrorsJsonFilePath]);
        }

        return providerData;
    }

    testCorrectlyReportedProcessingErrors(timeSpendingLogPath, processingErrorsJsonFilePath) //Save preProcessedContents in order to make debugging easier
    //Save processedLogContentsWithTimeMarkers in order to make debugging easier
    {
        codecept_debug(timeSpendingLogPath);
        var thrownException = undefined;
        var processedTimeSpendingLog = undefined;

        try {
            processedTimeSpendingLog = this.processedTimeSpendingLog(timeSpendingLogPath);
        } catch (e) {
            if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) //codecept_debug($e->processedTimeSpendingLog->getTimeLogParser()->preProcessedContentsSourceLineContentsSourceLineMap);
                //To update all existing (when having changed the error log format for instance)
                //file_put_contents(
                //                $processingErrorsJsonFilePath,
                //                $errorsJson
                //            );
                //To make it easier to update with correct contents for the first time
                {
                    thrownException = e;
                    processedTimeSpendingLog = e.processedTimeSpendingLog;
                    codecept_debug(e.processedTimeSpendingLog.getTroubleshootingInfo());
                    var errorsJson = AppJson.encode(e.processedTimeSpendingLog.getProcessingErrors(), JSON_PRETTY_PRINT);
                    file_put_contents(timeSpendingLogPath + ".latest-run.processing-errors.json", errorsJson);
                }
        }

        file_put_contents(timeSpendingLogPath + ".latest-run.timeReportCsv.csv", processedTimeSpendingLog.timeReportCsv);
        file_put_contents(timeSpendingLogPath + ".latest-run.preProcessedContents", processedTimeSpendingLog.preProcessedContents);
        file_put_contents(timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers", processedTimeSpendingLog.processedLogContentsWithTimeMarkers);

        if (!!thrownException) {
            var processingErrorsJsonFileContents = file_get_contents(processingErrorsJsonFilePath);
            this.assertEquals(processingErrorsJsonFileContents, errorsJson, "Expected error json matches actual error json for " + timeSpendingLogPath);
        }

        this.assertInstanceOf("TimeSpendingLogProcessingErrorsEncounteredException", thrownException, "We should have encountered log processing error(s), but we did not");
    }

    processAndAssertCorrectTimeSpendingLog(timeSpendingLogPath) {
        var processedTimeSpendingLog = this.processTimeSpendingLog(timeSpendingLogPath, thrownException);
        this.assertNotInstanceOf("TimeSpendingLogProcessingErrorsEncounteredException", thrownException, "We should not have encountered any log processing error, but we did. Check .latest-run.processing-errors.json for more info.");
        codecept_debug(650 + " - Memory usage: " + Math.round(memory_get_usage(true) / 1024 / 1024, 2) + " MiB");
        return processedTimeSpendingLog.calculateTotalReportedTime();
    }

    processTimeSpendingLog(timeSpendingLogPath, thrownException = undefined) //Save processedLogContentsWithTimeMarkers in order to make debugging easier
    //Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
    {
        codecept_debug(timeSpendingLogPath);
        codecept_debug(660 + " - Memory usage: " + Math.round(memory_get_usage(true) / 1024 / 1024, 2) + " MiB");
        var correspondingCsvDataFilePath = this.correspondingCsvDataFilePath(timeSpendingLogPath);
        thrownException = undefined;
        var processedTimeSpendingLog = undefined;

        try //codecept_debug($processedTimeSpendingLog->timeReportCsv);
        //To update the expected contents based on the current output (use only when certain that everything
        //is correct and only the format of the output file has been changed)
        //file_put_contents(
        //                $correspondingCsvDataFilePath,
        //                $processedTimeSpendingLog->timeReportCsv
        //            );
        //To make it easier to update with correct contents for the first time
        //codecept_debug($timeLogEntriesWithMetadata);
        //All tested time logs should include at least 1 time log entry
        //Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
        {
            codecept_debug(667 + " - Memory usage: " + Math.round(memory_get_usage(true) / 1024 / 1024, 2) + " MiB");
            processedTimeSpendingLog = this.processedTimeSpendingLog(timeSpendingLogPath);
            codecept_debug(671 + " - Memory usage: " + Math.round(memory_get_usage(true) / 1024 / 1024, 2) + " MiB");
            file_put_contents(correspondingCsvDataFilePath + ".latest-run.csv", processedTimeSpendingLog.timeReportCsv);
            var timeLogEntriesWithMetadata = processedTimeSpendingLog.getTimeLogEntriesWithMetadata();
            codecept_debug(692 + " - Memory usage: " + Math.round(memory_get_usage(true) / 1024 / 1024, 2) + " MiB");
            codecept_debug(timeLogEntriesWithMetadata.length + " time log entries");
            this.assertGreaterThan(0, timeLogEntriesWithMetadata.length);
            file_put_contents(timeSpendingLogPath + ".latest-run.timeLogEntriesWithMetadata.json", AppJson.encode(timeLogEntriesWithMetadata, JSON_PRETTY_PRINT));
        } catch (e) {
            if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) //To make it easier to update with correct contents for the first time
                {
                    thrownException = e;
                    processedTimeSpendingLog = e.processedTimeSpendingLog;
                    var errorsJson = AppJson.encode(e.processedTimeSpendingLog.getProcessingErrors(), JSON_PRETTY_PRINT);
                    file_put_contents(timeSpendingLogPath + ".latest-run.processing-errors.json", errorsJson);
                }
        }

        file_put_contents(timeSpendingLogPath + ".latest-run.preProcessedContents", processedTimeSpendingLog.preProcessedContents);
        file_put_contents(timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers", processedTimeSpendingLog.processedLogContentsWithTimeMarkers);
        file_put_contents(timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers_debug.json", processedTimeSpendingLog.processedLogContentsWithTimeMarkers_debug);
        return processedTimeSpendingLog;
    }

    processedTimeSpendingLog(timeSpendingLogPath) {
        var timeSpendingLogContents = file_get_contents(timeSpendingLogPath);

        if (is_file(timeSpendingLogPath + ".tzFirst")) {
            var tzFirst = file_get_contents(timeSpendingLogPath + ".tzFirst").trim();
        } else {
            tzFirst = "UTC";
        }

        var timeSpendingLog = new TimeSpendingLog();
        timeSpendingLog.rawLogContents = timeSpendingLogContents;
        timeSpendingLog.tzFirst = tzFirst;
        var processedTimeSpendingLog = new ProcessedTimeSpendingLog(timeSpendingLog);
        return processedTimeSpendingLog;
    }

    correspondingCsvDataFilePath(timeSpendingLogPath) {
        return str_replace(".tslog", ".csv", timeSpendingLogPath);
    }

    static timeSpendingLogPathsInFolder(pathToFolderWhereTsLogsReside) //handle bear-exported txt-files
    //pick up properly named files for parsing
    {
        var timeSpendingLogPaths = glob(pathToFolderWhereTsLogsReside + "/*.txt");

        for (var rawTimeSpendingLogPath of Object.values(timeSpendingLogPaths)) //first rename the file to make it shorter, and end with .tslog
        {
            var dirname = pathinfo(rawTimeSpendingLogPath, PATHINFO_DIRNAME);
            var filename = pathinfo(rawTimeSpendingLogPath, PATHINFO_FILENAME);

            var _ = filename.split(" - ");

            var newFilename = _[0].trim();

            var timeSpendingLogPath = dirname + "/" + newFilename + ".tslog";
            rename(rawTimeSpendingLogPath, timeSpendingLogPath);
        }

        timeSpendingLogPaths = glob(pathToFolderWhereTsLogsReside + "/*.tslog");
        return timeSpendingLogPaths;
    }

};
