import test, { ExecutionContext, Macro } from "ava";
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
