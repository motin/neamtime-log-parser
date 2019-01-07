import test, { ExecutionContext, Macro } from "ava";
// import * as util from "util";
import { LogParser } from "./LogParser";
// import { DateTime, DateTimeZone } from "./php-wrappers";
import { TimeLogProcessor } from "./TimeLogProcessor";

// TODO: Test detection of start/stop-lines
// TODO: testIsProbableStartStopLine
// TODO: Do not treat "stop paying the bills" as a stop-line...
/*
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
*/

const testAddNullFilledDates: Macro = (
  t: ExecutionContext,
  times,
  expectedReturnValue,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  const result = timeLogProcessor.addNullFilledDates(times);
  t.deepEqual(
    expectedReturnValue,
    result,
    "TimeLogProcessor->addNullFilledDates() behaves as expected",
  );
};

const testAddNullFilledDatesData = () => {
  return [
    [
      {
        "2013-03-28": "foo",
        "2013-04-02": ["foo", "bar"],
      },
      {
        "2013-03-28": "foo",
        "2013-03-29": null,
        "2013-03-30": null,
        "2013-03-31": null,
        "2013-04-01": null,
        "2013-04-02": ["foo", "bar"],
      },
    ],
  ];
};

testAddNullFilledDatesData().forEach((testData, index) => {
  test(
    "testAddNullFilledDates - " + index,
    testAddNullFilledDates,
    testData[0],
    testData[1],
  );
});

const testPreProcessContents: Macro = (
  t: ExecutionContext,
  contents,
  expectedPreProcessedContents,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  timeLogProcessor.contents = contents;
  timeLogProcessor.preProcessContents();
  /*
  t.log("timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap", timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap)
  t.log("timeLogProcessor.preProcessedContents", timeLogProcessor.preProcessedContents)
  */
  t.deepEqual(
    timeLogProcessor.preProcessedContents,
    expectedPreProcessedContents,
    "TimeLogProcessor->preProcessContents() behaves as expected",
  );
};

const testPreProcessContentsData = () => {
  return [
    [
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, foo" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, foo" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
    ],
    [
      "2019-01-05 (+0200) 08:50, 50min, foo" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
      "start 2019-01-05 08:00" + // TODO: Also include timezone in the generated start-line (based on the first time marked line's last used timezone)
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, 50min, foo" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
    ],
    [
      "start 2018-01-23, 12:10ca\n" +
        "\n" +
        "paus 2018-01-23, 16:58->18:37\n" +
        "\n" +
        "paus 2018-01-23, 19:36->2018-01-23, 19:45\n" +
        "\n" +
        "2018-01-23, 19:52, foo\n" +
        "paus->2018-01-23, 19:53\n" +
        "\n" +
        "paus 2018-01-23, 19:55ca->2018-01-23, 19:59\n" +
        "\n" +
        "paus 1minca->2018-01-23, 20:03\n" +
        "\n" +
        "2018-01-23, 20:38, commit:\n" +
        "foo\n" +
        "\n" +
        "paus->\n" +
        "\n" +
        "\n" +
        "start 2018-01-26, 22:36\n" +
        "\n" +
        "paus 2minca\n" +
        "\n" +
        "2018-01-26, 22:49, foo\n" +
        "\n" +
        "paus->\n" +
        "\n" +
        "\n" +
        "start 2018-01-27, 01:18ca\n" +
        "\n" +
        "2018-01-27, 01:20, foo\n" +
        "paus->\n",
      "start 2018-01-23, 12:10ca\n" +
        "\n" +
        "2018-01-23, 16:58, <just before paus>\n" +
        "paus->18:37\n" +
        "\n" +
        "2018-01-23, 19:36, <just before paus>\n" +
        "paus->2018-01-23, 19:45\n" +
        "\n" +
        "2018-01-23, 19:52, foo\n" +
        "paus->2018-01-23, 19:53\n" +
        "\n" +
        "2018-01-23, 19:55, <just before paus>\n" +
        "paus->2018-01-23, 19:59\n" +
        "\n" +
        "paus 1minca->2018-01-23, 20:03\n" +
        "\n" +
        "2018-01-23, 20:38, commit:\n" +
        "foo\n" +
        "\n" +
        "paus->\n" +
        "\n" +
        "\n" +
        "start 2018-01-26, 22:36\n" +
        "\n" +
        "paus 2minca\n" +
        "\n" +
        "2018-01-26, 22:49, foo\n" +
        "\n" +
        "paus->\n" +
        "\n" +
        "\n" +
        "start 2018-01-27, 01:18ca\n" +
        "\n" +
        "2018-01-27, 01:20, foo\n" +
        "paus->\n",
    ],
  ];
};

testPreProcessContentsData().forEach((testData, index) => {
  test(
    "testPreProcessContents - " + index,
    testPreProcessContents,
    testData[0],
    testData[1],
  );
});

const testParsePreProcessedContents: Macro = (
  t: ExecutionContext,
  preProcessedContents,
  expectedNotParsedAddTimeMarkersParsePreProcessedContents,
  expectedRowsWithTimeMarkers,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  timeLogProcessor.parsePreProcessedContents(preProcessedContents);
  /*
  t.log(
    "timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap",
    timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap,
  );
  t.log(
    "timeLogProcessor.debugOriginalUnsortedRows",
    timeLogProcessor.debugOriginalUnsortedRows,
  );
  t.log(
    "timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents",
    util.inspect(
      timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
      { depth: 5 },
    ),
  );
  t.log(
    "timeLogProcessor.rowsWithTimeMarkers",
    util.inspect(timeLogProcessor.rowsWithTimeMarkers, { depth: 5 }),
  );
  */
  t.deepEqual(
    timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
    expectedNotParsedAddTimeMarkersParsePreProcessedContents,
    "TimeLogProcessor->parsePreProcessedContents() behaves as expected in regards to non-parsed contents",
  );
  t.deepEqual(
    timeLogProcessor.rowsWithTimeMarkers,
    expectedRowsWithTimeMarkers,
    "TimeLogProcessor->parsePreProcessedContents() behaves as expected in regards to parsed contents",
  );
};

const testParsePreProcessedContentsData = () => {
  /* tslint:disable:object-literal-sort-keys */
  return [
    [
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, foo" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 12:15, bar" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
      [],
      [
        {
          date: "2019-01-05",
          dateRaw: "start 2019-01-05 (+0200) 08:00",
          formattedUtcDate: "2019-01-05 06:00:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "+02:00",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "+02:00",
          line: "start 2019-01-05 (+0200) 08:00",
          lineWithComment: "start 2019-01-05 (+0200) 08:00",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d \\(O\\) H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "",
              lastKnownTimeZone: "",
              lastUsedTimeZone: "",
            },
            dateRawFormat: "Y-m-d \\(O\\) H:i",
            dateRaw: "2019-01-05 (+0200) 08:00",
            timeZoneRaw: "+0200",
            timeRaw: "08:00",
          },
          preprocessedContentsSourceLineIndex: 0,
          rowsWithTimeMarkersHandled: 0,
          ts: 1546668000,
          tsIsFaked: false,
          highlightWithNewlines: true,
        },
        {
          date: "2019-01-05",
          dateRaw: "2019-01-05 (+0200) 08:50",
          formattedUtcDate: "2019-01-05 06:50",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "+02:00",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "+02:00",
          line: "2019-01-05 (+0200) 08:50, foo",
          lineWithComment: "2019-01-05 (+0200) 08:50, foo",
          log: [],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d \\(O\\) H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2019-01-05",
              lastKnownTimeZone: "+02:00",
              lastUsedTimeZone: "+02:00",
            },
            dateRawFormat: "Y-m-d \\(O\\) H:i",
            dateRaw: "2019-01-05 (+0200) 08:50",
            timeZoneRaw: "+0200",
            timeRaw: "08:50",
          },
          preprocessedContentsSourceLineIndex: 2,
          rowsWithTimeMarkersHandled: 1,
          ts: 1546671000,
          durationSinceLast: 3000,
        },
        {
          date: "2019-01-05",
          dateRaw: "2019-01-05 (+0200) 12:15",
          formattedUtcDate: "2019-01-05 10:15",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "+02:00",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "+02:00",
          line: "2019-01-05 (+0200) 12:15, bar",
          lineWithComment: "2019-01-05 (+0200) 12:15, bar",
          log: [],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d \\(O\\) H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2019-01-05",
              lastKnownTimeZone: "+02:00",
              lastUsedTimeZone: "+02:00",
            },
            dateRawFormat: "Y-m-d \\(O\\) H:i",
            dateRaw: "2019-01-05 (+0200) 12:15",
            timeZoneRaw: "+0200",
            timeRaw: "12:15",
          },
          preprocessedContentsSourceLineIndex: 4,
          rowsWithTimeMarkersHandled: 2,
          ts: 1546683300,
          durationSinceLast: 12300,
        },
        {
          date: null,
          dateRaw: "pause->",
          formattedUtcDate: "2019-01-05 10:15:00",
          lastInterpretTsAndDateErrorMessage: "Found no timestamp to parse",
          lastKnownTimeZone: "+02:00",
          lastParseLogCommentErrorMessage:
            "Invalidate lines without any number or comma or period at all",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "+02:00",
          line: "pause->",
          lineWithComment: "pause->",
          log: [
            "Did NOT find a valid timestamp in a probable start/pause-row. Not treating this row as a time-marked row",
            "Line: pause->",
            "Sent to notParsed in processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration",
          ],
          parseLogCommentDetectTimeStampMetadata: null,
          preprocessedContentsSourceLineIndex: 6,
          rowsWithTimeMarkersHandled: 3,
          ts: 1546683300,
          tsIsFaked: true,
          highlightWithNewlines: true,
        },
      ],
    ],
    [
      "|tz:UTC-6\n" +
        "\n" +
        "start 2017-12-16, 12:00\n" +
        "\n" +
        "paus 2017-12-16, 13:00->\n" +
        "\n" +
        "|tz:Unknown/Timezone\n" +
        "\n" +
        "start 2018-02-11, 09:05\n" +
        "\n" +
        "2018-02-11, 09:55, okok\n" +
        "paus->\n",
      [
        {
          date: "2018-02-11",
          dateRaw: "start 2018-02-11, 09:05",
          formattedUtcDate: "2018-02-11 09:05:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "Unknown/Timezone",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "InvalidDateTimeZoneException",
          lastSetTsAndDateErrorMessage: 'Unknown time zone "Unknown/Timezone".',
          lastUsedTimeZone: "UTC",
          line: "start 2018-02-11, 09:05",
          lineWithComment: "start 2018-02-11, 09:05",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
            "Invalid timezone ('Unknown/Timezone') encountered when parsing a row (source line: undefined). Not treating this row as valid time-marked row",
            'lastSetTsAndDateErrorMessage: Unknown time zone "Unknown/Timezone".',
            "Sent to notParsed in parsePreProcessedContents",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d, H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2017-12-16",
              lastKnownTimeZone: "Unknown/Timezone",
              lastUsedTimeZone: "Etc/GMT+6",
            },
            dateRawFormat: "Y-m-d, H:i",
            dateRaw: "2018-02-11, 09:05",
            timeZoneRaw: false,
            timeRaw: "09:05",
          },
          preprocessedContentsSourceLineIndex: 8,
          rowsWithTimeMarkersHandled: 2,
          sourceLine: undefined,
          ts: 1518339900,
          tsIsFaked: false,
          highlightWithNewlines: true,
        },
        {
          date: "2018-02-11",
          dateRaw: "2018-02-11, 09:55",
          formattedUtcDate: "2018-02-11 09:55",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "Unknown/Timezone",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "InvalidDateTimeZoneException",
          lastSetTsAndDateErrorMessage: 'Unknown time zone "Unknown/Timezone".',
          lastUsedTimeZone: "UTC",
          line: "2018-02-11, 09:55, okok",
          lineWithComment: "2018-02-11, 09:55, okok",
          log: [
            "Invalid timezone ('Unknown/Timezone') encountered when parsing a row (source line: undefined). Not treating this row as valid time-marked row",
            'lastSetTsAndDateErrorMessage: Unknown time zone "Unknown/Timezone".',
            "Sent to notParsed in parsePreProcessedContents",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d, H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2018-02-11",
              lastKnownTimeZone: "Unknown/Timezone",
              lastUsedTimeZone: "UTC",
            },
            dateRawFormat: "Y-m-d, H:i",
            dateRaw: "2018-02-11, 09:55",
            timeZoneRaw: false,
            timeRaw: "09:55",
          },
          preprocessedContentsSourceLineIndex: 10,
          rowsWithTimeMarkersHandled: 3,
          sourceLine: undefined,
          ts: 1518342900,
          durationSinceLast: 3000,
        },
      ],
      [
        {
          date: "2017-12-16",
          dateRaw: "start 2017-12-16, 12:00",
          formattedUtcDate: "2017-12-16 18:00:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "UTC-6",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "Etc/GMT+6",
          line: "start 2017-12-16, 12:00",
          lineWithComment: "start 2017-12-16, 12:00",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d, H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "",
              lastKnownTimeZone: "UTC-6",
              lastUsedTimeZone: "",
            },
            dateRawFormat: "Y-m-d, H:i",
            dateRaw: "2017-12-16, 12:00",
            timeZoneRaw: false,
            timeRaw: "12:00",
          },
          preprocessedContentsSourceLineIndex: 2,
          rowsWithTimeMarkersHandled: 0,
          ts: 1513447200,
          tsIsFaked: false,
          highlightWithNewlines: true,
        },
        {
          date: "2017-12-16",
          dateRaw: "paus 2017-12-16, 13:00->",
          formattedUtcDate: "2017-12-16 19:00:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "UTC-6",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "Etc/GMT+6",
          line: "paus 2017-12-16, 13:00->",
          lineWithComment: "paus 2017-12-16, 13:00->",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d, H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2017-12-16",
              lastKnownTimeZone: "UTC-6",
              lastUsedTimeZone: "Etc/GMT+6",
            },
            dateRawFormat: "Y-m-d, H:i",
            dateRaw: "2017-12-16, 13:00",
            timeZoneRaw: false,
            timeRaw: "13:00",
          },
          preprocessedContentsSourceLineIndex: 4,
          rowsWithTimeMarkersHandled: 1,
          ts: 1513450800,
          tsIsFaked: false,
          highlightWithNewlines: true,
        },
        {
          date: "2018-02-11",
          dateRaw: "start 2018-02-11, 09:05",
          formattedUtcDate: "2018-02-11 09:05:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "Unknown/Timezone",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "InvalidDateTimeZoneException",
          lastSetTsAndDateErrorMessage: 'Unknown time zone "Unknown/Timezone".',
          lastUsedTimeZone: "UTC",
          line: "start 2018-02-11, 09:05",
          lineWithComment: "start 2018-02-11, 09:05",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
            "Invalid timezone ('Unknown/Timezone') encountered when parsing a row (source line: undefined). Not treating this row as valid time-marked row",
            'lastSetTsAndDateErrorMessage: Unknown time zone "Unknown/Timezone".',
            "Sent to notParsed in parsePreProcessedContents",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d, H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2017-12-16",
              lastKnownTimeZone: "Unknown/Timezone",
              lastUsedTimeZone: "Etc/GMT+6",
            },
            dateRawFormat: "Y-m-d, H:i",
            dateRaw: "2018-02-11, 09:05",
            timeZoneRaw: false,
            timeRaw: "09:05",
          },
          preprocessedContentsSourceLineIndex: 8,
          rowsWithTimeMarkersHandled: 2,
          ts: 1518339900,
          tsIsFaked: false,
          highlightWithNewlines: true,
        },
        {
          date: "2018-02-11",
          dateRaw: "2018-02-11, 09:55",
          formattedUtcDate: "2018-02-11 09:55",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "Unknown/Timezone",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "InvalidDateTimeZoneException",
          lastSetTsAndDateErrorMessage: 'Unknown time zone "Unknown/Timezone".',
          lastUsedTimeZone: "UTC",
          line: "2018-02-11, 09:55, okok",
          lineWithComment: "2018-02-11, 09:55, okok",
          log: [
            "Invalid timezone ('Unknown/Timezone') encountered when parsing a row (source line: undefined). Not treating this row as valid time-marked row",
            'lastSetTsAndDateErrorMessage: Unknown time zone "Unknown/Timezone".',
            "Sent to notParsed in parsePreProcessedContents",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d, H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2018-02-11",
              lastKnownTimeZone: "Unknown/Timezone",
              lastUsedTimeZone: "UTC",
            },
            dateRawFormat: "Y-m-d, H:i",
            dateRaw: "2018-02-11, 09:55",
            timeZoneRaw: false,
            timeRaw: "09:55",
          },
          preprocessedContentsSourceLineIndex: 10,
          rowsWithTimeMarkersHandled: 3,
          ts: 1518342900,
          durationSinceLast: 3000,
        },
        {
          date: null,
          dateRaw: "paus->",
          formattedUtcDate: "2018-02-11 09:55:00",
          lastInterpretTsAndDateErrorMessage: "Found no timestamp to parse",
          lastKnownTimeZone: "Unknown/Timezone",
          lastParseLogCommentErrorMessage:
            "Invalidate lines without any number or comma or period at all",
          lastSetTsAndDateErrorClass: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "UTC",
          line: "paus->",
          lineWithComment: "paus->",
          log: [
            "Did NOT find a valid timestamp in a probable start/pause-row. Not treating this row as a time-marked row",
            "Line: paus->",
            "Sent to notParsed in processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration",
          ],
          parseLogCommentDetectTimeStampMetadata: null,
          preprocessedContentsSourceLineIndex: 11,
          rowsWithTimeMarkersHandled: 4,
          ts: 1518342900,
          tsIsFaked: true,
          highlightWithNewlines: true,
        },
      ],
    ],
  ];
  /* tslint:enable:object-literal-sort-keys */
};

testParsePreProcessedContentsData().forEach((testData, index) => {
  test(
    "testParsePreProcessedContents - " + index,
    testParsePreProcessedContents,
    testData[0],
    testData[1],
    testData[2],
  );
});

const testAddTimeMarkers: Macro = (
  t: ExecutionContext,
  contents,
  expectedNotParsedAddTimeMarkersParsePreProcessedContents,
  expectedContentsWithTimeMarkers,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  timeLogProcessor.contents = contents;
  timeLogProcessor.addTimeMarkers();
  /*
  t.log(
    "timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap",
    timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap,
  );
  t.log(
    "timeLogProcessor.debugOriginalUnsortedRows",
    timeLogProcessor.debugOriginalUnsortedRows,
  );
  t.log(
    "timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents",
    util.inspect(
      timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
      { depth: 5 },
    ),
  );
  t.log(
    "timeLogProcessor.rowsWithTimeMarkers",
    util.inspect(timeLogProcessor.rowsWithTimeMarkers, { depth: 5 }),
  );
  t.log(
    "timeLogProcessor.contentsWithTimeMarkers",
    timeLogProcessor.contentsWithTimeMarkers,
  );
  */
  t.deepEqual(
    timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
    expectedNotParsedAddTimeMarkersParsePreProcessedContents,
    "TimeLogProcessor->parsePreProcessedContents() behaves as expected in regards to non-parsed contents",
  );
  t.deepEqual(
    timeLogProcessor.contentsWithTimeMarkers,
    expectedContentsWithTimeMarkers,
    "TimeLogProcessor->addTimeMarkers() behaves as expected",
  );
};

const testAddTimeMarkersData = () => {
  /* tslint:disable:object-literal-sort-keys */
  return [
    [
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, foo" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 12:15, bar" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
      [],
      ".:: Uncategorized" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\tstart 2019-01-05 (+0200) 08:00 {2019-01-05 06:00:00}" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\t2019-01-05 06:50, 50min foo" +
        LogParser.NL_NIX +
        "\t2019-01-05 10:15, 3h25min bar" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\tpause-> {2019-01-05 10:15:00}" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX,
    ],
    [
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:01, foo" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "pause 2min" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:06, bar" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "pause->" +
        LogParser.NL_NIX,
      [],
      ".:: Uncategorized" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\tstart 2019-01-05 (+0200) 08:00 {2019-01-05 06:00:00}" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\t2019-01-05 06:01, 1min foo" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\tpause 2min {2019-01-05 06:01:00}" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\t2019-01-05 06:06, 3min bar" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\tpause-> {2019-01-05 06:06:00}" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX,
    ],
    [
      "start 2018-04-14 14:00ca\n" + "\n" + "15:00ca, foo\n" + "paus->",
      [
        {
          date: "2018-04-14",
          dateRaw: "start 2018-04-14 14:00ca",
          formattedUtcDate: "2018-04-14 14:00:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: undefined,
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "InvalidDateTimeZoneException",
          lastSetTsAndDateErrorMessage: "Time zone not set",
          lastUsedTimeZone: "UTC",
          line: "start 2018-04-14 14:00ca",
          lineWithComment: "start 2018-04-14 14:00ca",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
            "Invalid timezone ('undefined') encountered when parsing a row (source line: 1). Not treating this row as valid time-marked row",
            "lastSetTsAndDateErrorMessage: Time zone not set",
            "Sent to notParsed in parsePreProcessedContents",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('Y-m-d H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "",
              lastKnownTimeZone: undefined,
              lastUsedTimeZone: "",
            },
            dateRawFormat: "Y-m-d H:i",
            dateRaw: "2018-04-14 14:00ca",
            timeZoneRaw: false,
            timeRaw: "14:00ca",
          },
          preprocessedContentsSourceLineIndex: 0,
          rowsWithTimeMarkersHandled: 0,
          sourceLine: 1,
          ts: 1523714400,
          tsIsFaked: false,
          highlightWithNewlines: true,
        },
        {
          date: "2018-04-14",
          dateRaw: "15:00ca",
          formattedUtcDate: "2018-04-14 15:00",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: undefined,
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorClass: "InvalidDateTimeZoneException",
          lastSetTsAndDateErrorMessage: "Time zone not set",
          lastUsedTimeZone: "UTC",
          line: "15:00ca, foo",
          lineWithComment: "15:00ca, foo",
          log: [
            "Invalid timezone ('undefined') encountered when parsing a row (source line: 3). Not treating this row as valid time-marked row",
            "lastSetTsAndDateErrorMessage: Time zone not set",
            "Sent to notParsed in parsePreProcessedContents",
          ],
          parseLogCommentDetectTimeStampMetadata: {
            log: ["Found a supported timestamp ('H:i')"],
            lastKnownsBeforeDetectTimeStamp: {
              lastKnownDate: "2018-04-14",
              lastKnownTimeZone: undefined,
              lastUsedTimeZone: "UTC",
            },
            dateRawFormat: "H:i",
            timeZoneRaw: false,
            timeRaw: "15:00ca",
            dateRaw: "15:00ca",
          },
          preprocessedContentsSourceLineIndex: 2,
          rowsWithTimeMarkersHandled: 1,
          sourceLine: 3,
          ts: 1523718000,
          durationSinceLast: 3600,
        },
      ],
      ".:: Uncategorized\n" +
        "\n" +
        "\tstart 2018-04-14 14:00ca {2018-04-14 14:00:00}\n" +
        "\n" +
        "\t2018-04-14 15:00, 1h0min foo\n" +
        "\n" +
        "\tpaus-> {2018-04-14 15:00:00}\n" +
        "\n",
    ],
  ];
  /* tslint:enable:object-literal-sort-keys */
};

testAddTimeMarkersData().forEach((testData, index) => {
  test(
    "testAddTimeMarkers - " + index,
    testAddTimeMarkers,
    testData[0],
    testData[1],
    testData[2],
  );
});

const testGenerateTimeReport: Macro = (
  t: ExecutionContext,
  contentsWithTimeMarkers,
  expectedCategories,
  expectedTimeReportData,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  timeLogProcessor.generateTimeReport(contentsWithTimeMarkers);
  /*
  t.log("timeLogProcessor.categories", timeLogProcessor.categories);
  t.log("timeLogProcessor.timeReportData", timeLogProcessor.timeReportData);
  t.log(
    "timeLogProcessor.metadataGenerateTimeReport",
    timeLogProcessor.metadataGenerateTimeReport,
  );
  t.log("timeLogProcessor.timeReportCsv", timeLogProcessor.timeReportCsv);
  t.log(
    "timeLogProcessor.timeReportSourceComments",
    timeLogProcessor.timeReportSourceComments,
  );
  */
  t.deepEqual(
    timeLogProcessor.categories,
    expectedCategories,
    "TimeLogProcessor->generateTimeReport() behaves as expected",
  );
  t.deepEqual(
    timeLogProcessor.timeReportData,
    expectedTimeReportData,
    "TimeLogProcessor->generateTimeReport() behaves as expected",
  );
};

const testGenerateTimeReportData = () => {
  return [
    [
      ".:: Uncategorized" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\tstart 2019-01-05 (+0200) 08:00 {2019-01-05 06:00:00}" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "\t2019-01-05 06:50, 50min foo" +
        LogParser.NL_NIX +
        "\t2019-01-05 10:15, 3h25min bar" +
        LogParser.NL_NIX,
      ["Uncategorized"],
      {
        "2019-01-05": {
          Uncategorized: 4.25,
          text: ["foo", "bar"],
        },
      },
    ],
  ];
};

testGenerateTimeReportData().forEach((testData, index) => {
  test(
    "testGenerateTimeReport - " + index,
    testGenerateTimeReport,
    testData[0],
    testData[1],
    testData[2],
  );
});
