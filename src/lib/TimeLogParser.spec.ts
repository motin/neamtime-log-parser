import test, { ExecutionContext, Macro } from "ava";
import { array_merge } from "locutus/php/array";
// import { clone, DateTime, DateTimeZone } from "./php-wrappers";
import { TimeLogParser } from "./TimeLogParser";

const testStartsWithOptionallySuffixedTokenMethod: Macro = (
  t: ExecutionContext,
  haystack: string,
  keyword: string,
  suffix: string,
  expectedReturnValue: string,
) => {
  const tlp = new TimeLogParser();
  const result = tlp.startsWithOptionallySuffixedToken(
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
  const tlp = new TimeLogParser();
  const tokens = tlp.tokens();
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

const testSecondsToDuration: Macro = (
  t: ExecutionContext,
  seconds: string,
  expectedReturnValue: string,
) => {
  const tlp = new TimeLogParser();
  const result = tlp.secondsToDuration(seconds);
  t.is(
    result,
    expectedReturnValue,
    "TimeLogParser->secondsToDuration() behaves as expected",
  );
};

const testSecondsToDurationData = () => {
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
    [13, "0min"],
  ];
};

testSecondsToDurationData().forEach((testData, index) => {
  test(
    "testSecondsToDurationData - " + index,
    testSecondsToDuration,
    testData[0],
    testData[1],
  );
});

const testDurationToMinutes: Macro = (
  t: ExecutionContext,
  duration: string,
  expectedReturnValue: number,
) => {
  const tlp = new TimeLogParser();
  const result = tlp.durationToMinutes(duration);
  t.is(
    result,
    expectedReturnValue,
    "TimeLogParser->durationToMinutes() behaves as expected",
  );
};

const testDurationToMinutesData = () => {
  return [
    ["4min", 4],
    ["99min", 99],
    ["200min", 200],
    ["3h4min", 184],
    ["1h10min", 70],
    ["3d1h17min", 4397],
    ["5w3d1h17min", 4397 + (3600 * 24 * 7 * 5) / 60],
    ["13s", 13 / 60],
  ];
};

testDurationToMinutesData().forEach((testData, index) => {
  test(
    "testDurationToMinutes - " + index,
    testDurationToMinutes,
    testData[0],
    testData[1],
  );
});

/*
const testParseGmtTimestampFromDateSpecifiedInSpecificTimezone = (
  str,
  timezone,
  expectedGmtTimestamp,
  expectedGmtTimestampFormattedAsNewDefaultDatetime,
  expectedDateTimeTimeZone,
  expectedTimestampInTimeZone,
  transposeTimeZone,
  expectedTransposedFormatted, // @var DateTime $datetime
) => {
  const tlp = new TimeLogParser();
  const {
    gmtTimestamp,
    datetime,
  } = tlp.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(str, timezone);
  this.assertEquals(expectedGmtTimestamp, gmtTimestamp);
  const gmtTimestampFormattedAsNewDefaultDatetime = new DateTime().setTimestamp(
    gmtTimestamp,
  );
  this.assertEquals(
    expectedGmtTimestampFormattedAsNewDefaultDatetime,
    gmtTimestampFormattedAsNewDefaultDatetime.format("Y-m-d H:i"),
  );
  this.assertEquals(expectedDateTimeTimeZone, datetime.getTimezone().getName());
  this.assertEquals(expectedGmtTimestamp, datetime.getTimestamp());
  const timezoneDatetime = clone(datetime);
  timezoneDatetime.setTimezone(new DateTimeZone(timezone));
  this.assertEquals(
    expectedTimestampInTimeZone,
    timezoneDatetime.getTimestamp(),
  );
  const transposed = clone(datetime);
  transposed.setTimezone(new DateTimeZone(transposeTimeZone));
  this.assertEquals(
    expectedTransposedFormatted,
    transposed.format("Y-m-d H:i"),
  );
};

const testParseGmtTimestampFromDateSpecifiedInSpecificTimezoneData = () => {
  return [
    [
      "1970-01-01 12:00",
      "UTC",
      12 * 3600,
      "1970-01-01 12:00",
      "UTC",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "UTC",
      6 * 3600,
      "1970-01-01 06:00",
      "UTC",
      6 * 3600,
      "Europe/Berlin",
      "1970-01-01 07:00",
    ],
    [
      "1970-01-01 06:00",
      "Europe/Berlin",
      5 * 3600,
      "1970-01-01 05:00",
      "Europe/Berlin",
      5 * 3600,
      "Europe/Berlin",
      "1970-01-01 06:00",
    ],
    [
      "1970-01-01 06:00",
      "Europe/Berlin",
      5 * 3600,
      "1970-01-01 05:00",
      "Europe/Berlin",
      5 * 3600,
      "UTC",
      "1970-01-01 05:00",
    ],
    [
      "1970-01-01 13:00",
      "Europe/Berlin",
      12 * 3600,
      "1970-01-01 12:00",
      "Europe/Berlin",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "America/Chicago",
      12 * 3600,
      "1970-01-01 12:00",
      "America/Chicago",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "GMT-6",
      12 * 3600,
      "1970-01-01 12:00",
      "-06:00",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "-06:00",
      12 * 3600,
      "1970-01-01 12:00",
      "-06:00",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "Etc/GMT-6",
      0 * 3600,
      "1970-01-01 00:00",
      "Etc/GMT-6",
      0 * 3600,
      "Europe/Berlin",
      "1970-01-01 01:00",
    ],
    [
      "1970-01-01 06:00",
      "Etc/GMT+6",
      12 * 3600,
      "1970-01-01 12:00",
      "Etc/GMT+6",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
  ];
};

const testAddZeroFilledDates = (times, expectedReturnValue) => {
  const tlp = new TimeLogParser();
  const result = tlp.addZeroFilledDates(times);
  this.assertEquals(
    expectedReturnValue,
    result,
    "TimeLogParser->addZeroFilledDates() behaves as expected",
  );
};

const testAddZeroFilledDatesData = () => {
  return [
    [
      {
        "2013-03-28": "foo",
        "2013-04-02": "foo",
      },
      {
        "2013-03-28": "foo",
        "2013-03-29": 0,
        "2013-03-30": 0,
        "2013-03-31": 0,
        "2013-04-01": 0,
        "2013-04-02": "foo",
      },
    ],
  ];
};

const testDurationFromLast = (
  ts,
  rowsWithTimemarkersHandled,
  rowsWithTimemarkers,
  expectedDurationFromLast,
) => {
  const tlp = new TimeLogParser();
  const result = tlp.durationFromLast(
    ts,
    rowsWithTimemarkersHandled,
    rowsWithTimemarkers,
  );
  this.assertEquals(
    expectedDurationFromLast,
    result,
    "TimeLogParser->testDurationFromLast() behaves as expected",
  );
};

const testDurationFromLastData = () => {
  /* tslint:disable:object-literal-sort-keys * /
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
  /* tslint:enable:object-literal-sort-keys * /
};

// TODO: Test detection of start/stop-lines
// Do not treat "stop paying the bills" as a stop-line...

const testDetectStartStopLinesCorrectlyData = () => {
  return [
    [
      "stop paying the bills",
      false,
      false,
      false,
      "Europe/Stockholm",
      "2016-05-01",
      false,
      false,
    ],
    [
      "start going through the items",
      false,
      false,
      false,
      "Europe/Stockholm",
      "2016-05-01",
      false,
      false,
    ],
  ];
};

/**
 * TODO: Test detection of start/stop-lines
 * TODO: Do not treat "stop paying the bills" as a stop-line...
 * @param lineForDateCheck
 * @param expectedMetadataDateRaw
 * @param expectedMetadataTimeRaw
 * @param expectedMetadataDateRawFormat
 * @param lastKnownTimeZone
 * @param lastKnownDate
 * @param expectedToBeValid
 * @param expectedUtcDateString
 * /
const testDetectTimeStampAndSetTsAndDate = (
  t,
  lineForDateCheck,
  expectedMetadataDateRaw,
  expectedMetadataTimeRaw,
  expectedMetadataDateRawFormat,
  lastKnownTimeZone,
  lastKnownDate,
  expectedToBeValid,
  expectedUtcDateString, // @var DateTime $datetime
) => {
  const tlp = new TimeLogParser();
  tlp.lastKnownDate = lastKnownDate;
  tlp.lastKnownTimeZone = lastKnownTimeZone;
  const { metadata } = tlp.detectTimeStamp(lineForDateCheck);
  t.log({ metadata });
  this.assertEquals(
    expectedMetadataDateRaw,
    metadata.dateRaw,
    "TimeLogParser->detectTimeStamp() detects dateRaw as expected",
  );
  this.assertEquals(
    expectedMetadataTimeRaw,
    metadata.timeRaw,
    "TimeLogParser->detectTimeStamp() detects timeRaw as expected",
  );
  this.assertEquals(
    expectedMetadataDateRawFormat,
    metadata.dateRawFormat,
    "TimeLogParser->detectTimeStamp() detects the datetime with the expected format",
  );
  const { ts, date, datetime } = tlp.set_ts_and_date(metadata.dateRaw);
  const setTsAndDateError = tlp.lastSetTsAndDateErrorMessage;
  t.log({ ts, date, datetime, setTsAndDateError });
  const valid = !!date;
  this.assertEquals(
    expectedToBeValid,
    valid,
    "TimeLogParser->set_ts_and_date() detects valid datetimes as expected",
  );
  this.assertEquals(
    lastKnownTimeZone,
    tlp.lastKnownTimeZone,
    "TimeLogParser->set_ts_and_date() does not change the last known timezone by parsing a timestamp string",
  );

  if (expectedToBeValid) {
    this.assertEmpty(
      setTsAndDateError,
      "TimeLogParser->set_ts_and_date() does not set an error message where valid datetimes are expected",
    );
  } else {
    this.assertNotEmpty(
      setTsAndDateError,
      "TimeLogParser->set_ts_and_date() sets an error message where valid datetimes are expected",
    );
  }

  if (expectedToBeValid) {
    datetime.setTimezone(new DateTimeZone("UTC"));
    this.assertEquals(
      expectedUtcDateString,
      datetime.format("Y-m-d H:i:s"),
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
      DateTime.ISO8601,
      "Europe/Stockholm",
      "2016-05-01",
      true,
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
      "2016-05-25 11:50:00",
    ],
    [
      "foo 2016-05-25T14:50:00+UTC bar",
      "2016-05-25T14:50:00+UTC",
      "14:50:00",
      DateTime.ISO8601,
      "Europe/Stockholm",
      "2016-05-01",
      true,
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
      "2016-05-25 12:50:00",
    ],
    [
      "foo 2016-05-25 14:50 bar",
      "2016-05-25 14:50",
      "14:50",
      "Y-m-d H:i",
      "Europe/Helsinki",
      "2016-05-01",
      true,
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
      "2014-11-21 16:49:00",
    ],
    [
      " 2014-11-21T15:51:00+UTC, <just before paus>",
      "2014-11-21T15:51:00+UTC",
      "15:51:00",
      DateTime.ISO8601,
      "Europe/Stockholm",
      "2014-11-21",
      true,
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
      "2017-03-01 07:15:00",
    ],
  ];
};

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
 * /
const testParseLogComment = (
  t,
  line,
  expectedLinewithoutdate,
  lastKnownTimeZone,
  lastKnownDate,
  expectedToBeValidTimestampedLogComment,
  expectedUtcDateString, // @var DateTime $datetime
) => {
  const tlp = new TimeLogParser();
  tlp.lastKnownDate = lastKnownDate;
  tlp.lastKnownTimeZone = lastKnownTimeZone;
  const { ts, date, lineWithoutDate, invalid, datetime } = tlp.parseLogComment(
    line,
  );
  t.log({ line, ts, date, datetime });
  const valid = !invalid;
  this.assertEquals(
    expectedLinewithoutdate,
    lineWithoutDate,
    "TimeLogParser->parseLogComment() detects lines without datetime as expected",
  );
  t.log({ expectedToBeValidTimestampedLogComment, valid });
  this.assertEquals(
    expectedToBeValidTimestampedLogComment,
    valid,
    "TimeLogParser->parseLogComment() detects valid timestamped log content as expected",
  );
  this.assertEquals(
    lastKnownTimeZone,
    tlp.lastKnownTimeZone,
    "TimeLogParser->set_ts_and_date() does not change the last known timezone by parsing a timestamp string",
  );

  if (expectedToBeValidTimestampedLogComment) {
    datetime.setTimezone(new DateTimeZone("UTC"));
    this.assertEquals(
      expectedUtcDateString,
      datetime.format("Y-m-d H:i:s"),
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
      "2016-05-01 12:35:00",
    ],
    [
      "14.35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "14.35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    ["foo bar", "", "Europe/Stockholm", "2016-05-01", false, false],
    [
      "18:15",
      "",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 16:15:00",
    ],
    ["18.15", "", "Europe/Stockholm", "2016-05-01", false, false],
    ["18,15", "", "Europe/Stockholm", "2016-05-01", false, false],
    ["foo:bar", "", "Europe/Stockholm", "2016-05-01", false, false],
    [":zoo", "", "Europe/Stockholm", "2016-05-01", false, false],
    [
      "2016-05-01 14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14:35 - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35 - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14:35ca - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01 14.35ca - bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14:35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14.35, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14:35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    [
      "2016-05-01, 14.35ca, bar",
      " bar",
      "Europe/Stockholm",
      "2016-05-01",
      true,
      "2016-05-01 12:35:00",
    ],
    ["2016-05-01, bar", "", "Europe/Stockholm", "2016-05-01", false, false],
    ["2016-05-01, bar", "", "Europe/Stockholm", "2016-05-01", false, false],
  ];
};
*/
