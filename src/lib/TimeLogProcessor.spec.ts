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
  expectedRowsWithTimeMarkers,
) => {
  const timeLogProcessor = new TimeLogProcessor();
  timeLogProcessor.parsePreProcessedContents(preProcessedContents);
  // t.log("timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap", timeLogProcessor.preProcessedContentsSourceLineContentsSourceLineMap)
  t.deepEqual(
    timeLogProcessor.rowsWithTimeMarkers,
    expectedRowsWithTimeMarkers,
    "TimeLogProcessor->parsePreProcessedContents() behaves as expected",
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
        "paus->" +
        LogParser.NL_NIX,
      ["foo"],
    ],
  ];
};

testParsePreProcessedContentsData().forEach((testData, index) => {
  test(
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
