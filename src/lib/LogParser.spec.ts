import test, { ExecutionContext, Macro } from "ava";
import { linesArrayIntoText, LogParser } from "./LogParser";
import { DateTime, DateTimeZone } from "./php-wrappers";

const testLinesArrayIntoText: Macro = (
  t: ExecutionContext,
  lines,
  expectedText,
) => {
  const text = linesArrayIntoText(lines);
  // t.log("{lines, expectedText}", {lines, expectedText});
  t.deepEqual(
    text,
    expectedText,
    "LogParser's linesArrayIntoText() behaves as expected",
  );
};

const testLinesArrayIntoTextData = () => {
  return [
    [
      ["foo", "bar", "zoo"],
      "foo" + LogParser.NL_NIX + "bar" + LogParser.NL_NIX + "zoo",
    ],
  ];
};

testLinesArrayIntoTextData().forEach((testData, index) => {
  test(
    "testLinesArrayIntoText - " + index,
    testLinesArrayIntoText,
    testData[0],
    testData[1],
  );
});

const testSecondsToDuration: Macro = (
  t: ExecutionContext,
  seconds: string,
  expectedReturnValue: string,
) => {
  const tlp = new LogParser();
  const result = tlp.secondsToDuration(seconds);
  t.is(
    result,
    expectedReturnValue,
    "LogParser->secondsToDuration() behaves as expected",
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
    [60 * 60, "1h0min"],
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
  const tlp = new LogParser();
  const result = tlp.durationToMinutes(duration);
  t.is(
    result,
    expectedReturnValue,
    "LogParser->durationToMinutes() behaves as expected",
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

const testParseGmtTimestampFromDateSpecifiedInSpecificTimezone: Macro = (
  t: ExecutionContext,
  str,
  timezone,
  expectedGmtTimestamp,
  expectedGmtTimestampFormattedAsNewDefaultDatetime,
  expectedDateTimeTimeZone,
  expectedTimestampInTimeZone,
  transposeTimeZone,
  expectedTransposedFormatted,
) => {
  const logParser = new LogParser();
  const {
    gmtTimestamp,
    datetime,
  } = logParser.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
    str,
    timezone,
  );
  // t.log("{datetime, gmtTimestamp, str, timezone}", {datetime, gmtTimestamp, str, timezone,});
  t.true(typeof datetime !== "undefined");
  t.is(gmtTimestamp, expectedGmtTimestamp);
  const gmtTimestampFormattedAsNewDefaultDatetime = DateTime.createFromUnixTimestamp(
    gmtTimestamp,
  );
  t.is(
    gmtTimestampFormattedAsNewDefaultDatetime.format("Y-m-d H:i"),
    expectedGmtTimestampFormattedAsNewDefaultDatetime,
  );
  t.is(datetime.getTimezone().getName(), expectedDateTimeTimeZone);
  t.is(datetime.getTimestamp(), expectedGmtTimestamp);
  const timezoneDatetime = datetime.cloneWithAnotherTimezone(
    new DateTimeZone(timezone),
  );
  t.is(timezoneDatetime.getTimestamp(), expectedTimestampInTimeZone);
  const transposed = datetime.cloneWithAnotherTimezone(
    new DateTimeZone(transposeTimeZone),
  );
  t.is(transposed.format("Y-m-d H:i"), expectedTransposedFormatted);
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
      "Etc/GMT+6",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "-06:00",
      12 * 3600,
      "1970-01-01 12:00",
      "Etc/GMT+6",
      12 * 3600,
      "Europe/Berlin",
      "1970-01-01 13:00",
    ],
    [
      "1970-01-01 06:00",
      "Etc/GMT-6",
      0,
      "1970-01-01 00:00",
      "Etc/GMT-6",
      0,
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
    [
      "2016-05-25T14:50:00Z",
      "UTC",
      1464187800,
      "2016-05-25 14:50",
      "UTC",
      1464187800,
      "UTC",
      "2016-05-25 14:50",
    ],
    [
      "2016-05-25T14:50:00Z",
      "UTC",
      1464187800,
      "2016-05-25 14:50",
      "UTC",
      1464187800,
      "Europe/Berlin",
      "2016-05-25 16:50", // verified using https://www.timeanddate.com/worldclock/converter.html?iso=20160625T145000&p1=1440&p2=37
    ],
    [
      "2016-05-25 14:50",
      "Europe/Stockholm",
      1464180600,
      "2016-05-25 12:50",
      "Europe/Stockholm",
      1464180600,
      "UTC",
      "2016-05-25 12:50", // verified using https://www.timeanddate.com/worldclock/converter.html?iso=20160625T145000&p1=1440&p2=37
    ],
    [
      "2019-01-05 (+0200) 08:00",
      "Europe/Stockholm",
      1546668000,
      "2019-01-05 06:00",
      "+02:00",
      1546668000,
      "UTC",
      "2019-01-05 06:00",
    ],
  ];
};

testParseGmtTimestampFromDateSpecifiedInSpecificTimezoneData().forEach(
  (testData, index) => {
    test(
      "testParseGmtTimestampFromDateSpecifiedInSpecificTimezone - " + index,
      testParseGmtTimestampFromDateSpecifiedInSpecificTimezone,
      testData[0],
      testData[1],
      testData[2],
      testData[3],
      testData[4],
      testData[5],
      testData[6],
      testData[7],
    );
  },
);
