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
          preprocessed_contents_source_line_index: 2,
          lastKnownTimeZone: "Europe/Helsinki",
          lastUsedTimeZone: "Europe/Helsinki",
          lastSetTsAndDateErrorMessage: "Timestamp not found",
          lastKnownDate: "2017-12-12",
          dateRawWasNonemptyBeforeDetectTimestamp: "start 2017-12-12, 18:24ca",
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
          preprocessed_contents_source_line_index: 4,
          lastKnownTimeZone: "Europe/Helsinki",
          lastUsedTimeZone: "Europe/Helsinki",
          lastSetTsAndDateErrorMessage: "",
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
          preprocessed_contents_source_line_index: 6,
          lastKnownTimeZone: "Europe/Helsinki",
          lastUsedTimeZone: "Europe/Helsinki",
          lastSetTsAndDateErrorMessage: "",
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

const testStartsWithOptionallySuffixedTokenMethod: Macro = (
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
testStartsWithOptionallySuffixedTokenMethod.title = (
  providedTitle: string,
  haystack: string,
  keyword: string,
  suffix: string,
  expectedReturnValue: string,
) =>
  `: ${providedTitle} ${keyword} with suffix "${suffix}" in "${haystack}" = ${expectedReturnValue}`.trim();

const testStartsWithOptionallySuffixedTokenMethodData = () => {
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

testStartsWithOptionallySuffixedTokenMethodData().forEach((testData, index) => {
  test(
    "testStartsWithOptionallySuffixedTokenMethod - " + index,
    testStartsWithOptionallySuffixedTokenMethod,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
  );
});

// TODO: testRemoveSuffixedToken

const testDetectTimeStampAndSetTsAndDate: Macro = (
  t: ExecutionContext,
  lineForDateCheck,
  expectedMetadataDateRaw,
  expectedMetadataTimeRaw,
  expectedMetadataDateRawFormat,
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
  t.log({ lineForDateCheck, metadata });
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
    expectedMetadataDateRawFormat,
    metadata.dateRawFormat,
    "TimeLogParser->detectTimeStamp() detects the datetime with the expected format",
  );
  const { ts, date, datetime } = timeLogParser.set_ts_and_date(
    metadata.dateRaw,
  );
  const setTsAndDateError = timeLogParser.lastSetTsAndDateErrorMessage;
  t.log({ ts, date, datetime, setTsAndDateError });
  const valid = !!date;
  t.is(
    expectedToBeValid,
    valid,
    "TimeLogParser->set_ts_and_date() detects valid datetimes as expected",
  );
  t.is(
    expectedLastKnownTimeZone,
    timeLogParser.lastKnownTimeZone,
    "TimeLogParser->set_ts_and_date() sometimes changes the last known timezone by parsing a timestamp string",
  );

  if (expectedToBeValid) {
    t.true(
      setTsAndDateError === "",
      "TimeLogParser->set_ts_and_date() does not set an error message where valid datetimes are expected",
    );
  } else {
    t.true(
      typeof setTsAndDateError !== "undefined" &&
        setTsAndDateError !== null &&
        setTsAndDateError !== "",
      "TimeLogParser->set_ts_and_date() sets an error message where invalid datetimes are expected",
    );
  }

  if (expectedToBeValid) {
    const utcDatetime = datetime.cloneWithAnotherTimezone(
      new DateTimeZone("UTC"),
    );
    t.is(
      utcDatetime.format("Y-m-d H:i:s"),
      expectedUtcDateString,
      "TimeLogParser->set_ts_and_date() behaves as expected",
    );
  }
};

const testDetectTimeStampAndSetTsAndDateData = () => {
  return [
    [
      "foo 2016-05-25T14:50:00Z bar",
      "2016-05-25T14:50:00Z",
      "14:50:00",
      DateTime.ISO8601Z,
      "Europe/Stockholm", // TODO: This should be able to be undefined or anything since we have time zone info
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25T14:50:00+03:00 bar",
      "2016-05-25T14:50:00+03:00",
      "14:50:00",
      DateTime.ISO8601,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "UTC", // TODO: Revisit this - this should be +03:00 instead of UTC
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2016-05-25T14:50:00+UTC bar",
      "2016-05-25T14:50:00+UTC",
      "14:50:00",
      DateTime.ISO8601Z,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "2016-05-25 14:50",
      "14:50",
      "Y-m-d H:i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "2016-05-25 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 12:50:00", // verified via https://www.timeanddate.com/worldclock/converter.html?iso=20160625T125000&p1=1440&p2=37&p3=239
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "2016-05-25 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2014-09-01 14:50 bar",
      "2014-09-01 14:50",
      "14:50",
      "Y-m-d H:i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-09-01 14:50:00",
    ],
    [
      "foo 2014-09-01 14:50 bar",
      "2014-09-01 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 12:50:00",
    ],
    [
      "foo 2014-09-01 14:50 bar",
      "2014-09-01 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-09-01 11:50:00",
    ],
    [
      "foo 2014-11-21 14:50 bar",
      "2014-11-21 14:50",
      "14:50",
      "Y-m-d H:i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-11-21 14:50:00",
    ],
    [
      "foo 2014-11-21 14:50 bar",
      "2014-11-21 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-11-21 13:50:00",
    ],
    [
      "foo 2014-11-21 14:50 bar",
      "2014-11-21 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-11-21 12:50:00",
    ],
    [
      "foo 2016-05-25, 14:50 bar",
      "2016-05-25, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25, 14:50 bar",
      "2016-05-25, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 12:50:00",
    ],
    [
      "foo 2016-05-25, 14:50 bar",
      "2016-05-25, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2014-09-01, 14:50 bar",
      "2014-09-01, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-09-01 14:50:00",
    ],
    [
      "foo 2014-09-01, 14:50 bar",
      "2014-09-01, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 12:50:00",
    ],
    [
      "foo 2014-09-01, 14:50 bar",
      "2014-09-01, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-09-01 11:50:00",
    ],
    [
      "foo 2014-11-21, 14:50 bar",
      "2014-11-21, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-11-21 14:50:00",
    ],
    [
      "foo 2014-11-21, 14:50 bar",
      "2014-11-21, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-11-21 13:50:00",
    ],
    [
      "foo 2014-11-21, 14:50 bar",
      "2014-11-21, 14:50",
      "14:50",
      "Y-m-d, H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-11-21 12:50:00",
    ],
    [
      "foo 2016-05-25, 14.50 bar",
      "2016-05-25, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2016-05-25 14:50:00",
    ],
    [
      "foo 2016-05-25, 14.50 bar",
      "2016-05-25, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 12:50:00",
    ],
    [
      "foo 2016-05-25, 14.50 bar",
      "2016-05-25, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2014-09-01, 14.50 bar",
      "2014-09-01, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-09-01 14:50:00",
    ],
    [
      "foo 2014-09-01, 14.50 bar",
      "2014-09-01, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 12:50:00",
    ],
    [
      "foo 2014-09-01, 14.50 bar",
      "2014-09-01, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-09-01 11:50:00",
    ],
    [
      "foo 2014-11-21, 14.50 bar",
      "2014-11-21, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "UTC",
      "2016-05-01",
      true,
      "UTC",
      "2014-11-21 14:50:00",
    ],
    [
      "foo 2014-11-21, 14.50 bar",
      "2014-11-21, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-11-21 13:50:00",
    ],
    [
      "foo 2014-11-21, 14.50 bar",
      "2014-11-21, 14.50",
      "14.50",
      "Y-m-d, H.i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
      "Europe/Helsinki",
      "2014-11-21 12:50:00",
    ],
    [
      "foo 2014-09-01T12:42:21+02:00 bar",
      "2014-09-01T12:42:21+02:00",
      "12:42:21",
      DateTime.ISO8601,
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "UTC", // TODO: Revisit this - this should be +02:00 instead of UTC
      "2014-09-01 10:42:21",
    ],
    [
      "foo 2014-09-01 12:42 bar",
      "2014-09-01 12:42",
      "12:42",
      "Y-m-d H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 10:42:00",
    ],
    [
      "foo 2014-09-01, 12:42 bar",
      "2014-09-01, 12:42",
      "12:42",
      "Y-m-d, H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2014-09-01 10:42:00",
    ],
    [
      "foo 14:35 bar",
      "14:35",
      "14:35",
      "H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 12:35:00",
    ],
    [
      "foo 14.35 bar",
      "14.35",
      "14.35",
      "H.i",
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
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "paus 18:45ca->",
      "18:45ca",
      "18:45ca",
      "H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-01 16:45:00",
    ],
    [
      "paus 2016-05-25 18:45ca->",
      "2016-05-25 18:45ca",
      "18:45ca",
      "Y-m-d H:i",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "Europe/Stockholm",
      "2016-05-25 16:45:00",
    ],
    [
      "paus 2016-05-25, 18:45ca->",
      "2016-05-25, 18:45ca",
      "18:45ca",
      "Y-m-d, H:i",
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
      "Europe/Stockholm",
      "2016-05-01",
      false,
      "Europe/Stockholm",
      false,
    ],
    [
      "start 2014-11-21 17:49",
      "2014-11-21 17:49",
      "17:49",
      "Y-m-d H:i",
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "Europe/Stockholm",
      "2014-11-21 16:49:00",
    ],
    [
      "start 2014-11-21, 17:49",
      "2014-11-21, 17:49",
      "17:49",
      "Y-m-d, H:i",
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "Europe/Stockholm",
      "2014-11-21 16:49:00",
    ],
    [
      " 2014-11-21T15:51:00+UTC, <just before paus>",
      "2014-11-21T15:51:00+UTC",
      "15:51:00",
      DateTime.ISO8601Z,
      "Europe/Stockholm",
      "2014-11-21",
      true,
      "UTC",
      "2014-11-21 15:51:00",
    ],
    [
      "2017-01-26, 17:26, init",
      "2017-01-26, 17:26",
      "17:26",
      "Y-m-d, H:i",
      "Europe/Helsinki",
      "2017-01-26",
      true,
      "Europe/Helsinki",
      "2017-01-26 15:26:00",
    ],
    [
      "start 2017-03-01, 09:15",
      "2017-03-01, 09:15",
      "09:15",
      "Y-m-d, H:i",
      "Europe/Helsinki",
      "2017-03-01",
      true,
      "Europe/Helsinki",
      "2017-03-01 07:15:00",
    ],
  ];
};

testDetectTimeStampAndSetTsAndDateData().forEach((testData, index) => {
  test(
    "testDetectTimeStampAndSetTsAndDate - " + index,
    testDetectTimeStampAndSetTsAndDate,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
    testData[4],
    testData[5],
    testData[6],
    testData[7],
    testData[8],
  );
});

/**
 * Note: "lineWithoutDate" here refers to the part without the date-time-stamp, ie the actual log message
 * TODO: Refactor code to reflect this more clearly
 *
 * @param line
 * @param expectedLinewithoutdate
 * @param lastKnownTimeZone
 * @param lastKnownDate
 * @param expectedToBeValidTimestampedLogComment
 * @param expectedUtcDateString
 */
const testParseLogComment: Macro = (
  t: ExecutionContext,
  line,
  expectedLinewithoutdate,
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
    ts,
    date,
    lineWithoutDate,
    notTheFirstRowOfALogComment,
    datetime,
  } = timeLogParser.parseLogComment(line);
  const invalid = notTheFirstRowOfALogComment;
  t.log({ line, ts, date, datetime });
  const valid = !invalid;
  t.is(
    expectedLinewithoutdate,
    lineWithoutDate,
    "TimeLogParser->parseLogComment() detects lines without datetime as expected",
  );
  t.log({ expectedToBeValidTimestampedLogComment, valid });
  t.is(
    expectedToBeValidTimestampedLogComment,
    valid,
    "TimeLogParser->parseLogComment() detects valid timestamped log content as expected",
  );
  t.is(
    expectedLastKnownTimeZone,
    timeLogParser.lastKnownTimeZone,
    "TimeLogParser->set_ts_and_date() sometimes changes the last known timezone by parsing a timestamp string",
  );

  if (expectedToBeValidTimestampedLogComment) {
    const utcDatetime = datetime.cloneWithAnotherTimezone(
      new DateTimeZone("UTC"),
    );
    t.is(
      expectedUtcDateString,
      utcDatetime.format("Y-m-d H:i:s"),
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
    /*
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
    */
  ];
};

testParseLogCommentData().forEach((testData, index) => {
  test(
    "testParseLogComment - " + index,
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
