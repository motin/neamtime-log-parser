import test, { ExecutionContext, Macro } from "ava";
import { array_merge } from "locutus/php/array";
import { DateTime, DateTimeZone } from "./php-wrappers";
import { TimeLogParser } from "./TimeLogParser";

const testDurationFromLast: Macro = (
  t: ExecutionContext,
  ts,
  rowsWithTimemarkersHandled,
  rowsWithTimemarkers,
  expectedDurationFromLast,
) => {
  const timeLogParser = new TimeLogParser();
  const result = timeLogParser.durationFromLast(
    ts,
    rowsWithTimemarkersHandled,
    rowsWithTimemarkers,
  );
  t.is(
    expectedDurationFromLast,
    result,
    "LogParser->testDurationFromLast() behaves as expected",
  );
};

const testDurationFromLastData = () => {
  /* tslint:disable:object-literal-sort-keys */
  return [
    [
      1513096800,
      3,
      {
        0: {
          rowsWithTimemarkersHandled: 0,
          line: "start 2017-12-12, 18:24ca",
          lineWithComment: "start 2017-12-12, 18:24ca",
          formatted_date: "2017-12-12 16:24:00",
          date: "2017-12-12",
          dateRaw: "2017-12-12, 18:24ca",
          ts: 1513095840,
          log: {
            0: "Found a supported timestamp ('Y-m-d, H:i')",
            1: "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
          },
          source_line: 3,
          preprocessedContentsSourceLineIndex: 2,
          lastKnownTimeZone: "Europe/Helsinki",
          lastUsedTimeZone: "Europe/Helsinki",
          lastSetTsAndDateErrorMessage: "Timestamp not found",
          lastKnownDate: "2017-12-12",
          lastInterpretTsAndDateErrorMessage: "",
          dateRawWasNonEmptyBeforeDetectTimestamp: "start 2017-12-12, 18:24ca",
          dateRawFormat: "Y-m-d, H:i",
          timeRaw: "18:24ca",
          ts_is_faked: false,
          highlight_with_newlines: true,
        },
        1: {
          rowsWithTimemarkersHandled: 1,
          line: "2017-12-12, 18:28, bar",
          lineWithComment: "2017-12-12, 18:28, bar",
          formatted_date: "2017-12-12 16:28",
          date: "2017-12-12",
          dateRaw: "2017-12-12, 18:28",
          ts: 1513096080,
          log: Array(),
          source_line: 5,
          preprocessedContentsSourceLineIndex: 4,
          lastKnownTimeZone: "Europe/Helsinki",
          lastUsedTimeZone: "Europe/Helsinki",
          lastSetTsAndDateErrorMessage: "",
          lastInterpretTsAndDateErrorMessage: "",
          durationSinceLast: 240,
        },
        2: {
          rowsWithTimemarkersHandled: 2,
          line: "2017-12-12, 18:32ca, zoo",
          lineWithComment: "2017-12-12, 18:32ca, zoo",
          formatted_date: "2017-12-12 16:32",
          date: "2017-12-12",
          dateRaw: "2017-12-12, 18:32ca",
          ts: 1513096320,
          log: Array(),
          source_line: 7,
          preprocessedContentsSourceLineIndex: 6,
          lastKnownTimeZone: "Europe/Helsinki",
          lastUsedTimeZone: "Europe/Helsinki",
          lastSetTsAndDateErrorMessage: "",
          lastInterpretTsAndDateErrorMessage: "",
          durationSinceLast: 240,
        },
      },
      480,
    ],
  ];
  /* tslint:enable:object-literal-sort-keys */
};

testDurationFromLastData().forEach((testData, index) => {
  test(
    "testDurationFromLast - " + index,
    testDurationFromLast,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
  );
});

const testStartsWithOptionallySuffixedToken: Macro = (
  t: ExecutionContext,
  haystack: string,
  keyword: string,
  suffix: string,
  expectedReturnValue: string,
) => {
  const timeLogParser = new TimeLogParser();
  const result = timeLogParser.startsWithOptionallySuffixedToken(
    haystack,
    keyword,
    suffix,
  );
  t.is(
    result,
    expectedReturnValue,
    "TimeLogParser->startsWithOptionallySuffixedToken() behaves as expected",
  );
};
testStartsWithOptionallySuffixedToken.title = (
  providedTitle: string,
  haystack: string,
  keyword: string,
  suffix: string,
  expectedReturnValue: string,
) =>
  `: ${providedTitle} ${keyword} with suffix "${suffix}" in "${haystack}" = ${expectedReturnValue}`.trim();

const testStartsWithOptionallySuffixedTokenData = () => {
  let testDataMatrix = Array();
  const timeLogParser = new TimeLogParser();
  const tokens = timeLogParser.tokens();
  const keyword = "pause";

  for (const token of Object.values(tokens[keyword])) {
    const tokenSpecific = [
      [token + "->2010-04-03 7:58", keyword, "->", token],
      [token + "->2010-04-03 7:58", keyword, undefined, token],
      [token + " 2016-05-16 09:55->", keyword, "->", false],
      [token + " 2016-05-16 09:55->", keyword, " ", token],
      [token + " 2016-05-16 09:55->", keyword, undefined, token],
      [token + "->|$", keyword, "->|$", token],
    ];
    testDataMatrix = array_merge(testDataMatrix, tokenSpecific);
  }

  return testDataMatrix;
};

testStartsWithOptionallySuffixedTokenData().forEach((testData, index) => {
  test(
    "testStartsWithOptionallySuffixedToken - " + index,
    testStartsWithOptionallySuffixedToken,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
  );
});

// TODO: testRemoveSuffixedToken

const testDetectTimeStampAndInterpretTsAndDate: Macro = (
  t: ExecutionContext,
  lineForDateCheck,
  expectedMetadataDateRawFormat,
  expectedMetadataDateRaw,
  expectedMetadataTimeRaw,
  expectedMetadataTimeZoneRaw,
  lastKnownTimeZone,
  lastKnownDate,
  expectedToBeValid,
  expectedLastKnownTimeZone,
  expectedUtcDateString,
) => {
  const timeLogParser = new TimeLogParser();
  timeLogParser.lastKnownDate = lastKnownDate;
  timeLogParser.lastKnownTimeZone = lastKnownTimeZone;
  const { metadata } = timeLogParser.detectTimeStamp(lineForDateCheck);
  // t.log({ lineForDateCheck, metadata });
  t.is(
    expectedMetadataDateRawFormat,
    metadata.dateRawFormat,
    "TimeLogParser->detectTimeStamp() detects the datetime with the expected format",
  );
  t.is(
    expectedMetadataDateRaw,
    metadata.dateRaw,
    "TimeLogParser->detectTimeStamp() detects dateRaw as expected",
  );
  t.is(
    expectedMetadataTimeRaw,
    metadata.timeRaw,
    "TimeLogParser->detectTimeStamp() detects timeRaw as expected",
  );
  t.is(
    expectedMetadataTimeZoneRaw,
    metadata.timeZoneRaw,
    "TimeLogParser->detectTimeStamp() detects timeZoneRaw as expected",
  );
  const {
    // ts,
    date,
    datetime,
  } = timeLogParser.interpretTsAndDate(
    metadata.dateRaw,
    metadata.dateRawFormat,
  );
  const setTsAndDateErrorMessage = timeLogParser.lastSetTsAndDateErrorMessage;
  const setTsAndDateErrorClass = timeLogParser.lastSetTsAndDateErrorClass;

  const interpretTsAndDateErrorMessage =
    timeLogParser.lastInterpretTsAndDateErrorMessage;
  const valid = !!date;
  if (valid !== expectedToBeValid) {
    t.log({
      date,
      datetime,
      interpretTsAndDateErrorMessage,
      setTsAndDateErrorClass,
      setTsAndDateErrorMessage,
    });
  }
  t.is(
    valid,
    expectedToBeValid,
    "TimeLogParser->interpretTsAndDate() detects valid datetimes as expected",
  );
  t.is(
    timeLogParser.lastKnownTimeZone,
    expectedLastKnownTimeZone,
    "TimeLogParser->interpretTsAndDate() sometimes changes the last known timezone by parsing a timestamp string",
  );

  if (expectedToBeValid) {
    t.true(
      interpretTsAndDateErrorMessage === "" &&
        setTsAndDateErrorMessage === "" &&
        setTsAndDateErrorClass === "",
      "TimeLogParser->interpretTsAndDate() does not set an error message where valid datetimes are expected",
    );
  } else {
    const interpretErrorMessage =
      typeof interpretTsAndDateErrorMessage !== "undefined" &&
      interpretTsAndDateErrorMessage !== null &&
      interpretTsAndDateErrorMessage !== "";
    const setErrorMessage =
      typeof setTsAndDateErrorMessage !== "undefined" &&
      setTsAndDateErrorMessage !== null &&
      setTsAndDateErrorMessage !== "";
    const setErrorClass =
      typeof setTsAndDateErrorClass !== "undefined" &&
      setTsAndDateErrorClass !== null &&
      setTsAndDateErrorClass !== "";
    t.true(
      interpretErrorMessage || setErrorMessage || setErrorClass,
      "TimeLogParser->interpretTsAndDate() sets an error message where invalid datetimes are expected",
    );
  }

  if (expectedToBeValid) {
    const utcDatetime = datetime.cloneWithAnotherTimezone(
      new DateTimeZone("UTC"),
    );
    t.is(
      utcDatetime.format("Y-m-d H:i:s"),
      expectedUtcDateString,
      "TimeLogParser->interpretTsAndDate() behaves as expected",
    );
  }
};

const testDetectTimeStampAndInterpretTsAndDateData = () => {
  return [
    [
      "foo 2016-05-25T14:50:00Z bar",
      DateTime.ISO8601Z,
      "2016-05-25T14:50:00Z",
      "14:50:00",
      "Z",
      "Europe/Stockholm", // TODO: This should be able to be undefined or anything since we have time zone info
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25T14:50:00+03:00 bar",
      DateTime.ISO8601,
      "2016-05-25T14:50:00+03:00",
      "14:50:00",
      "+03:00",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "+03:00",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2016-05-25T14:50:00+UTC bar",
      DateTime.ISO8601Z,
      "2016-05-25T14:50:00+UTC",
      "14:50:00",
      "+UTC",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "Y-m-d H:i",
      "2016-05-25 14:50",
      "14:50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "Y-m-d H:i",
      "2016-05-25 14:50",
      "14:50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 12:50:00", // verified via https://www.timeanddate.com/worldclock/converter.html?iso=20160625T125000&p1=1440&p2=37&p3=239
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "Y-m-d H:i",
      "2016-05-25 14:50",
      "14:50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2014-09-01 14:50 bar",
      "Y-m-d H:i",
      "2014-09-01 14:50",
      "14:50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-09-01 14:50:00",
    ],
    [
      "foo 2014-09-01 14:50 bar",
      "Y-m-d H:i",
      "2014-09-01 14:50",
      "14:50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 12:50:00",
    ],
    [
      "foo 2014-09-01 14:50 bar",
      "Y-m-d H:i",
      "2014-09-01 14:50",
      "14:50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-09-01 11:50:00",
    ],
    [
      "foo 2014-11-21 14:50 bar",
      "Y-m-d H:i",
      "2014-11-21 14:50",
      "14:50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-11-21 14:50:00",
    ],
    [
      "foo 2014-11-21 14:50 bar",
      "Y-m-d H:i",
      "2014-11-21 14:50",
      "14:50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-11-21 13:50:00",
    ],
    [
      "foo 2014-11-21 14:50 bar",
      "Y-m-d H:i",
      "2014-11-21 14:50",
      "14:50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-11-21 12:50:00",
    ],
    [
      "foo 2016-05-25, 14:50 bar",
      "Y-m-d, H:i",
      "2016-05-25, 14:50",
      "14:50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25, 14:50 bar",
      "Y-m-d, H:i",
      "2016-05-25, 14:50",
      "14:50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 12:50:00",
    ],
    [
      "foo 2016-05-25, 14:50 bar",
      "Y-m-d, H:i",
      "2016-05-25, 14:50",
      "14:50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2014-09-01, 14:50 bar",
      "Y-m-d, H:i",
      "2014-09-01, 14:50",
      "14:50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-09-01 14:50:00",
    ],
    [
      "foo 2014-09-01, 14:50 bar",
      "Y-m-d, H:i",
      "2014-09-01, 14:50",
      "14:50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 12:50:00",
    ],
    [
      "foo 2014-09-01, 14:50 bar",
      "Y-m-d, H:i",
      "2014-09-01, 14:50",
      "14:50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-09-01 11:50:00",
    ],
    [
      "foo 2014-11-21, 14:50 bar",
      "Y-m-d, H:i",
      "2014-11-21, 14:50",
      "14:50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-11-21 14:50:00",
    ],
    [
      "foo 2014-11-21, 14:50 bar",
      "Y-m-d, H:i",
      "2014-11-21, 14:50",
      "14:50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-11-21 13:50:00",
    ],
    [
      "foo 2014-11-21, 14:50 bar",
      "Y-m-d, H:i",
      "2014-11-21, 14:50",
      "14:50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-11-21 12:50:00",
    ],
    [
      "foo 2016-05-25, 14.50 bar",
      "Y-m-d, H.i",
      "2016-05-25, 14.50",
      "14.50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25, 14.50 bar",
      "Y-m-d, H.i",
      "2016-05-25, 14.50",
      "14.50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 12:50:00",
    ],
    [
      "foo 2016-05-25, 14.50 bar",
      "Y-m-d, H.i",
      "2016-05-25, 14.50",
      "14.50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2014-09-01, 14.50 bar",
      "Y-m-d, H.i",
      "2014-09-01, 14.50",
      "14.50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-09-01 14:50:00",
    ],
    [
      "foo 2014-09-01, 14.50 bar",
      "Y-m-d, H.i",
      "2014-09-01, 14.50",
      "14.50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 12:50:00",
    ],
    [
      "foo 2014-09-01, 14.50 bar",
      "Y-m-d, H.i",
      "2014-09-01, 14.50",
      "14.50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-09-01 11:50:00",
    ],
    [
      "foo 2014-11-21, 14.50 bar",
      "Y-m-d, H.i",
      "2014-11-21, 14.50",
      "14.50",
      false,
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-11-21 14:50:00",
    ],
    [
      "foo 2014-11-21, 14.50 bar",
      "Y-m-d, H.i",
      "2014-11-21, 14.50",
      "14.50",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-11-21 13:50:00",
    ],
    [
      "foo 2014-11-21, 14.50 bar",
      "Y-m-d, H.i",
      "2014-11-21, 14.50",
      "14.50",
      false,
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-11-21 12:50:00",
    ],
    [
      "foo 2014-09-01T12:42:21+02:00 bar",
      DateTime.ISO8601,
      "2014-09-01T12:42:21+02:00",
      "12:42:21",
      "+02:00",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "+02:00",
      "2014-09-01 10:42:21",
    ],
    [
      "foo 2014-09-01 12:42 bar",
      "Y-m-d H:i",
      "2014-09-01 12:42",
      "12:42",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 10:42:00",
    ],
    [
      "foo 2014-09-01, 12:42 bar",
      "Y-m-d, H:i",
      "2014-09-01, 12:42",
      "12:42",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 10:42:00",
    ],
    [
      "foo 14:35 bar",
      "H:i",
      "14:35",
      "14:35",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "foo 14.35 bar",
      "H.i",
      "14.35",
      "14.35",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "foo bar",
      false,
      false,
      false,
      false,
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "paus 18:45ca->",
      "H:i",
      "18:45ca",
      "18:45ca",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 16:45:00",
    ],
    [
      "paus 2016-05-25 18:45ca->",
      "Y-m-d H:i",
      "2016-05-25 18:45ca",
      "18:45ca",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 16:45:00",
    ],
    [
      "paus 2016-05-25, 18:45ca->",
      "Y-m-d, H:i",
      "2016-05-25, 18:45ca",
      "18:45ca",
      false,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 16:45:00",
    ],
    [
      "paus ??->",
      false,
      false,
      false,
      false,
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "foo bar :zoo:",
      false,
      false,
      false,
      false,
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "start 2014-11-21 17:49",
      "Y-m-d H:i",
      "2014-11-21 17:49",
      "17:49",
      false,
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "Europe/Stockholm",
      "2014-11-21 16:49:00",
    ],
    [
      "start 2014-11-21 7:49",
      "Y-m-d H:i",
      "2014-11-21 7:49",
      "7:49",
      false,
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "Europe/Stockholm",
      "2014-11-21 06:49:00",
    ],
    [
      "start 2014-11-21, 17:49",
      "Y-m-d, H:i",
      "2014-11-21, 17:49",
      "17:49",
      false,
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "Europe/Stockholm",
      "2014-11-21 16:49:00",
    ],
    [
      " 2014-11-21T15:51:00+UTC, <just before paus>",
      DateTime.ISO8601Z,
      "2014-11-21T15:51:00+UTC",
      "15:51:00",
      "+UTC",
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "UTC",
      "2014-11-21 15:51:00",
    ],
    [
      "2017-01-26, 17:26, init",
      "Y-m-d, H:i",
      "2017-01-26, 17:26",
      "17:26",
      false,
      "Europe/Helsinki",
      "2017-01-26",
      true,
      "Europe/Helsinki",
      "2017-01-26 15:26:00",
    ],
    [
      "start 2017-03-01, 09:15",
      "Y-m-d, H:i",
      "2017-03-01, 09:15",
      "09:15",
      false,
      "Europe/Helsinki",
      "2017-03-01",
      true,
      "Europe/Helsinki",
      "2017-03-01 07:15:00",
    ],
    [
      "start 2019-01-05 (+0200) 08:00",
      DateTime.YMDHI_TZWITHIN,
      "2019-01-05 (+0200) 08:00",
      "08:00",
      "+0200",
      "Antarctica/Macquarie",
      "2019-01-02",
      true,
      "+02:00",
      "2019-01-05 06:00:00",
    ],
    [
      "start 2019-01-05 (-0500) 08:00",
      DateTime.YMDHI_TZWITHIN,
      "2019-01-05 (-0500) 08:00",
      "08:00",
      "-0500",
      "Antarctica/Macquarie",
      "2019-01-02",
      true,
      "-05:00",
      "2019-01-05 13:00:00",
    ],

    /*
    // TODO
    // Add ability to test this case: The result is neither valid nor invalid but semi-valid since
    // fallback timezone UTC was used instead of the invalid timezone. Thus, it is invalid log contents
    // but a semi-valid date parsing and should be treated and tested/validated as such
    [
      "start 2018-02-11, 09:05",
      "Y-m-d, H:i",
      "2018-02-11, 09:05",
      "09:05",
      false,
      "Unknown/Timezone",
      "2018-02-11",
      semiValid...,
      false,
      false,
    ],
    */
  ];
};

testDetectTimeStampAndInterpretTsAndDateData().forEach((testData, index) => {
  test(
    `testDetectTimeStampAndInterpretTsAndDate - ${index} ("${testData[0]}")`,
    testDetectTimeStampAndInterpretTsAndDate,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
    testData[4],
    testData[5],
    testData[6],
    testData[7],
    testData[8],
    testData[9],
  );
});

/**
 * Note: "lineWithoutDate" here refers to the part without the date-time-stamp, ie the actual log message
 * TODO: Refactor code to reflect this more clearly
 *
 * @param t
 * @param line
 * @param expectedLineWithoutDate
 * @param lastKnownTimeZone
 * @param lastKnownDate
 * @param expectedToBeValidTimestampedLogComment
 * @param expectedLastKnownTimeZone
 * @param expectedUtcDateString
 */
const testParseLogComment: Macro = (
  t: ExecutionContext,
  line,
  expectedLineWithoutDate,
  lastKnownTimeZone,
  lastKnownDate,
  expectedToBeValidTimestampedLogComment,
  expectedLastKnownTimeZone,
  expectedUtcDateString, // @var DateTime $datetime
) => {
  const timeLogParser = new TimeLogParser();
  timeLogParser.lastKnownDate = lastKnownDate;
  timeLogParser.lastKnownTimeZone = lastKnownTimeZone;
  const {
    // ts,
    // date,
    lineWithoutDate,
    notTheFirstRowOfALogComment,
    datetime,
  } = timeLogParser.parseLogComment(line);
  // t.log({ line, /*ts, date,*/ datetime });
  const parseLogCommentErrorMessage =
    timeLogParser.lastParseLogCommentErrorMessage;
  const setTsAndDateErrorMessage = timeLogParser.lastSetTsAndDateErrorMessage;
  const interpretTsAndDateErrorMessage =
    timeLogParser.lastInterpretTsAndDateErrorMessage;
  // t.log({ setTsAndDateErrorMessage, interpretTsAndDateErrorMessage, parseLogCommentError });
  const invalid = notTheFirstRowOfALogComment;
  const valid = !invalid;
  // t.log({ expectedToBeValidTimestampedLogComment, valid });
  t.is(
    valid,
    expectedToBeValidTimestampedLogComment,
    "TimeLogParser->parseLogComment() detects valid timestamped log content as expected",
  );
  if (expectedToBeValidTimestampedLogComment) {
    t.true(
      parseLogCommentErrorMessage === "" &&
        interpretTsAndDateErrorMessage === "" &&
        setTsAndDateErrorMessage === "",
      "TimeLogParser->parseLogComment() does not set an error message where valid datetimes are expected",
    );
  } else {
    const parseError =
      typeof parseLogCommentErrorMessage !== "undefined" &&
      parseLogCommentErrorMessage !== null &&
      parseLogCommentErrorMessage !== "";
    const interpretError =
      typeof interpretTsAndDateErrorMessage !== "undefined" &&
      interpretTsAndDateErrorMessage !== null &&
      interpretTsAndDateErrorMessage !== "";
    const setError =
      typeof setTsAndDateErrorMessage !== "undefined" &&
      setTsAndDateErrorMessage !== null &&
      setTsAndDateErrorMessage !== "";
    t.true(
      parseError || interpretError || setError,
      "TimeLogParser->parseLogComment() sets an error message where invalid datetimes are expected",
    );
  }
  if (expectedToBeValidTimestampedLogComment) {
    t.is(
      lineWithoutDate,
      expectedLineWithoutDate,
      "TimeLogParser->parseLogComment() detects lines without datetime as expected",
    );
    t.is(
      timeLogParser.lastKnownTimeZone,
      expectedLastKnownTimeZone,
      "TimeLogParser->parseLogComment() sometimes changes the last known timezone by parsing a timestamp string",
    );
    const utcDatetime = datetime.cloneWithAnotherTimezone(
      new DateTimeZone("UTC"),
    );
    t.is(
      utcDatetime.format("Y-m-d H:i:s"),
      expectedUtcDateString,
      "TimeLogParser->parseLogComment() behaves as expected",
    );
  }
};

const testParseLogCommentData = () => {
  return [
    [
      "14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "14.35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "14.35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "foo bar",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "18:15",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 16:15:00",
    ],
    [
      "18.15",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "18,15",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "foo:bar",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      ":zoo",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "2016-05-01 14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14:35 - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35 - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14:35ca - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35ca - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14.35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14.35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 (+0200) 14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "+02:00",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 (+0200) 14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "+02:00",
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 (-0500) 14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "-05:00",
      "2016-05-01 19:35:00",
    ],
    [
      "2016-05-01 (-0500) 14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "-05:00",
      "2016-05-01 19:35:00",
    ],
    [
      "2016-05-01, bar",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "2016-05-01, bar",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
  ];
};

testParseLogCommentData().forEach((testData, index) => {
  test(
    `testParseLogComment - ${index} ("${testData[0]}")`,
    testParseLogComment,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
    testData[4],
    testData[5],
    testData[6],
  );
});
