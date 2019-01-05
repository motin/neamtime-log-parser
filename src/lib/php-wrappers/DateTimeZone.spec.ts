import test, { ExecutionContext, Macro } from "ava";
import { parseZonedTime } from "timezone-support/dist/parse-format";
import { DateTime } from "./DateTime";
import { DateTimeZone } from "./DateTimeZone";

const testTimeZoneSupportParseZonedTime: Macro = (
  t: ExecutionContext,
  dateString,
  formatString,
  expectedParsedTime,
) => {
  // t.log("{dateString, formatString}", {dateString, formatString,});
  const result = parseZonedTime(dateString, formatString);
  // t.log("{result}", {result,});
  t.truthy(result);
  t.deepEqual(result, expectedParsedTime);
};

const testTimeZoneSupportParseZonedTimeData = () => {
  return [
    [
      "AM 03 08 07 01 05 01 07 +0100",
      "A SS ss mm hh DD MM YY ZZ",
      {
        day: 5,
        hours: 1,
        milliseconds: 30,
        minutes: 7,
        month: 1,
        seconds: 8,
        year: 2007,
        zone: {
          offset: -60,
        },
      },
    ],
    [
      "2016-05-25 (+0100) 14:50:00",
      "YYYY-MM-DD [(]ZZ[)] HH:mm:ss",
      {
        day: 25,
        hours: 14,
        minutes: 50,
        month: 5,
        seconds: 0,
        year: 2016,
        zone: {
          offset: -60,
        },
      },
    ],
    [
      "2016-05-25 14:50:00 +0100",
      "YYYY-MM-DD HH:mm:ss ZZ",
      {
        day: 25,
        hours: 14,
        minutes: 50,
        month: 5,
        seconds: 0,
        year: 2016,
        zone: {
          offset: -60,
        },
      },
    ],
    [
      "2016-05-25 14:50:00 +01:00",
      "YYYY-MM-DD HH:mm:ss Z",
      {
        day: 25,
        hours: 14,
        minutes: 50,
        month: 5,
        seconds: 0,
        year: 2016,
        zone: {
          offset: -60,
        },
      },
    ],
    [
      "2016-05-25 14:50:00 UTC",
      "YYYY-MM-DD HH:mm:ss z",
      {
        day: 25,
        hours: 14,
        minutes: 50,
        month: 5,
        seconds: 0,
        year: 2016,
        zone: {
          abbreviation: "UTC",
        },
      },
    ],
    [
      "2016-05-25 14:50:00 CET",
      "YYYY-MM-DD HH:mm:ss z",
      {
        day: 25,
        hours: 14,
        minutes: 50,
        month: 5,
        seconds: 0,
        year: 2016,
        zone: {
          abbreviation: "CET",
        },
      },
    ],
  ];
};

testTimeZoneSupportParseZonedTimeData().forEach((testData, index) => {
  test(
    "testTimeZoneSupportParseZonedTime - " + index,
    testTimeZoneSupportParseZonedTime,
    testData[0],
    testData[1],
    testData[2],
  );
});

const testDateTimeCreateFromZonedFormat: Macro = (
  t: ExecutionContext,
  phpFormatString,
  dateString,
  expectedUtcDateTimeFormatted,
) => {
  // t.log("{dateString, phpFormatString}", {dateString, phpFormatString,});
  const dt = DateTimeZone.createFromZonedFormat(phpFormatString, dateString);
  // t.log("{dt}", {dt,});
  t.truthy(dt);
  t.is(expectedUtcDateTimeFormatted, dt.format("Y-m-d H:i"));
};

const testDateTimeCreateFromZonedFormatData = () => {
  return [
    // [DateTime.YMDHI, "2016-05-25 14:50", "2016-05-25 14:50"], // Throws error on unzoned date formats
    [DateTime.ISO8601, "2016-05-25T14:50:00+0100", "2016-05-25 13:50"],
    // [DateTime.ISO8601Z, "2016-05-25T14:50:00Z", "2016-05-25 14:50"], // Throws error on unzoned date formats
    [DateTime.TTBWSD, "2016-05-25 (+0100) 14:50:00", "2016-05-25 13:50"],
    ["Y-m-d H:i:s O", "2016-05-25 14:50:00 +0100", "2016-05-25 13:50"],
    ["Y-m-d H:i:s P", "2016-05-25 14:50:00 +01:00", "2016-05-25 13:50"],
    ["Y-m-d H:i:s e", "2016-05-25 14:50:00 UTC", "2016-05-25 11:50"],
    ["Y-m-d H:i:s T", "2016-05-25 14:50:00 CET", "2016-05-25 11:50"],
  ];
};

testDateTimeCreateFromZonedFormatData().forEach((testData, index) => {
  test(
    "testDateTimeCreateFromZonedFormat - " + index,
    testDateTimeCreateFromZonedFormat,
    testData[0],
    testData[1],
    testData[2],
  );
});
