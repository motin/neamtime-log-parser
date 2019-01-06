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
    timeLogProcessor.notParsedAddTimeMarkersParsePreProcessedContents,
  );
  t.log(
    "timeLogProcessor.rowsWithTimeMarkers",
    timeLogProcessor.rowsWithTimeMarkers,
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
          durationSinceLast: 3000,
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
          rowsWithTimeMarkersHandled: 1,
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
          rowsWithTimeMarkersHandled: 2,
          sourceLine: undefined,
          ts: 1546683300,
        },
      ],
    ],
  ];
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
        "" +
        LogParser.NL_NIX +
        "2019-01-05 (+0200) 12:15, bar" +
        LogParser.NL_NIX +
        "" +
        LogParser.NL_NIX +
        "paus->" +
        LogParser.NL_NIX,
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
