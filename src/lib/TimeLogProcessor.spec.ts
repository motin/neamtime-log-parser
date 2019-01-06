import test, { ExecutionContext, Macro } from "ava";
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

const testAddZeroFilledDates: Macro = (
  t: ExecutionContext,
  times,
  expectedReturnValue,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  const result = timeLogProcessor.addZeroFilledDates(times);
  t.deepEqual(
    expectedReturnValue,
    result,
    "TimeLogProcessor->addZeroFilledDates() behaves as expected",
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

testAddZeroFilledDatesData().forEach((testData, index) => {
  test(
    "testAddZeroFilledDates - " + index,
    testAddZeroFilledDates,
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
  // t.log("timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap", timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap)
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
        "paus->" +
        LogParser.NL_NIX,
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, foo" +
        LogParser.NL_NIX +
        "paus->" +
        LogParser.NL_NIX,
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
    timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
  );
  t.log(
    "timeLogProcessor.rowsWithTimeMarkers",
    timeLogProcessor.rowsWithTimeMarkers,
  );
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
        "paus->" +
        LogParser.NL_NIX,
      [],
      [
        {
          date: "2019-01-05",
          dateRaw: "start 2019-01-05 (+0200) 08:00",
          formattedUtcDate: "2019-01-05 06:00:00",
          highlightWithNewlines: true,
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorMessage: "Timestamp not found",
          lastUsedTimeZone: "",
          line: "start 2019-01-05 (+0200) 08:00",
          lineWithComment: "start 2019-01-05 (+0200) 08:00",
          log: [
            "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
          ],
          preprocessedContentsSourceLineIndex: 0,
          rowsWithTimeMarkersHandled: 0,
          sourceLine: undefined,
          ts: 1546668000,
          tsIsFaked: false,
        },
        {
          date: "2019-01-05",
          dateRaw: "2019-01-05 (+0200) 08:50",
          durationSinceLast: 0,
          formattedUtcDate: "2019-01-05 06:50",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "+02:00",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "+02:00",
          line: "2019-01-05 (+0200) 08:50, foo",
          lineWithComment: "2019-01-05 (+0200) 08:50, foo",
          log: [],
          preprocessedContentsSourceLineIndex: 2,
          rowsWithTimeMarkersHandled: 0,
          sourceLine: undefined,
          ts: 1546671000,
        },
        {
          date: "2019-01-05",
          dateRaw: "2019-01-05 (+0200) 12:15",
          durationSinceLast: 12300,
          formattedUtcDate: "2019-01-05 10:15",
          lastInterpretTsAndDateErrorMessage: "",
          lastKnownTimeZone: "+02:00",
          lastParseLogCommentErrorMessage: "",
          lastSetTsAndDateErrorMessage: "",
          lastUsedTimeZone: "+02:00",
          line: "2019-01-05 (+0200) 12:15, bar",
          lineWithComment: "2019-01-05 (+0200) 12:15, bar",
          log: [],
          preprocessedContentsSourceLineIndex: 4,
          rowsWithTimeMarkersHandled: 1,
          sourceLine: undefined,
          ts: 1546683300,
        },
      ],
    ],
  ];
};

testParsePreProcessedContentsData().forEach((testData, index) => {
  test.only(
    "testParsePreProcessedContents - " + index,
    testParsePreProcessedContents,
    testData[0],
    testData[1],
  );
});

const testAddTimeMarkers: Macro = (
  t: ExecutionContext,
  contents,
  expectedContentsWithTimeMarkers,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  timeLogProcessor.contents = contents;
  timeLogProcessor.addTimeMarkers();
  // t.log("timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap", timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap)
  t.deepEqual(
    timeLogProcessor.contentsWithTimeMarkers,
    expectedContentsWithTimeMarkers,
    "TimeLogProcessor->addTimeMarkers() behaves as expected",
  );
};

const testAddTimeMarkersData = () => {
  return [
    [
      "start 2019-01-05 (+0200) 08:00" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 08:50, foo" +
        LogParser.NL_NIX +
        "paus->" +
        LogParser.NL_NIX,
      "sdfsdfsfsdfsdfsd",
    ],
  ];
};

testAddTimeMarkersData().forEach((testData, index) => {
  test(
    "testAddTimeMarkers - " + index,
    testAddTimeMarkers,
    testData[0],
    testData[1],
  );
});
