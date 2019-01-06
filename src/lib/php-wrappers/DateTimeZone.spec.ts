import test, { ExecutionContext, Macro } from "ava";
import { findTimeZone } from "timezone-support";
import { parseZonedTime } from "timezone-support/dist/parse-format";
import { DateTime } from "./DateTime";
import { DateTimeZone, TimeZoneOffset } from "./DateTimeZone";

const testTimeZoneSupportFindTimeZone: Macro = (
  t: ExecutionContext,
  timeZoneName,
  expectedFoundTimeZoneName,
) => {
  // t.log("{timeZoneName}", { timeZoneName });
  const result = findTimeZone(timeZoneName);
  // t.log("{result}", { result });
  t.truthy(result);
  t.deepEqual(result.name, expectedFoundTimeZoneName);
};

const testTimeZoneSupportFindTimeZoneData = () => {
  return [
    ["UTC", "Etc/UTC"],
    ["CET", "CET"],
    ["Etc/UTC", "Etc/UTC"],
    // ["Etc/UTC+1", "foo"], // Does not exist
    // ["UTC+05:30", "foo"], // Does not exist
    // ["GMT-1", "foo"], // Does not exist
  ];
};

testTimeZoneSupportFindTimeZoneData().forEach((testData, index) => {
  test(
    "testTimeZoneSupportFindTimeZone - " + index,
    testTimeZoneSupportFindTimeZone,
    testData[0],
    testData[1],
  );
});

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
      "2016-05-25 (+0100) 14:50",
      "YYYY-MM-DD [(]ZZ[)] HH:mm",
      {
        day: 25,
        hours: 14,
        minutes: 50,
        month: 5,
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

const testCreateFromTimeZoneOffset: Macro = (
  t: ExecutionContext,
  timeZoneOffset: TimeZoneOffset,
  expectedDateTimeZoneString,
) => {
  // t.log("{timeZoneOffset}", { timeZoneOffset });
  const dateTimeZone = DateTimeZone.createFromTimeZoneOffset(timeZoneOffset);
  // t.log("{dateTimeZone}", { dateTimeZone });
  t.truthy(dateTimeZone);
  t.is(dateTimeZone.toString(), expectedDateTimeZoneString);
  // t.log("dateTimeZone.getTimeZoneInfo()", dateTimeZone.getTimeZoneInfo());
  t.truthy(dateTimeZone.getTimeZoneInfo());
};

const testCreateFromTimeZoneOffsetData = () => {
  return [
    [{ abbreviation: "UTC" }, "UTC"],
    [{ abbreviation: "CET" }, "CET"],
    [{ offset: -60 }, "+01:00"],
    [{ offset: -120 }, "+02:00"],
    [{ offset: 600 }, "-10:00"],
    [{ offset: 601 }, "-10:01"],
  ];
};

testCreateFromTimeZoneOffsetData().forEach((testData, index) => {
  test(
    "testCreateFromTimeZoneOffset - " + index,
    testCreateFromTimeZoneOffset,
    testData[0],
    testData[1],
  );
});

const testCreateDateTimeFromZonedFormat: Macro = (
  t: ExecutionContext,
  phpFormatString,
  dateString,
  expectedDateTimeZoneString,
  expectedDateTimeFormatted,
  expectedUtcDateTimeFormatted,
) => {
  // t.log("{dateString, phpFormatString}", { dateString, phpFormatString });
  const dateTime: DateTime = DateTimeZone.createDateTimeFromZonedFormat(
    phpFormatString,
    dateString,
  );
  const utcDateTime = dateTime.cloneWithAnotherTimezone(
    new DateTimeZone("UTC"),
  );
  // t.log("{dateTime, utcDateTime}", { dateTime, utcDateTime });
  t.truthy(dateTime);
  t.is(expectedDateTimeZoneString, dateTime.getTimezone().toString());
  t.is(expectedDateTimeFormatted, dateTime.format("Y-m-d H:i"));
  t.is(expectedUtcDateTimeFormatted, utcDateTime.format("Y-m-d H:i"));
};

const testCreateDateTimeFromZonedFormatData = () => {
  return [
    // [DateTime.YMDHI, "2016-05-25 14:50", "n/a", "2016-05-25 14:50", "n/a"], // Throws error on unzoned date formats
    [
      DateTime.ISO8601,
      "2016-05-25T14:50:00+0100",
      "+01:00",
      "2016-05-25 14:50",
      "2016-05-25 13:50",
    ],
    // [DateTime.ISO8601Z, "2016-05-25T14:50:00Z", "n/a", "2016-05-25 14:50", "2016-05-25 14:50"], // Throws error on unzoned date formats
    [
      DateTime.TTBWSD,
      "2016-05-25 (+0100) 14:50",
      "+01:00",
      "2016-05-25 14:50",
      "2016-05-25 13:50",
    ],
    [
      "Y-m-d H:i:s O",
      "2016-05-25 14:50:00 +0100",
      "+01:00",
      "2016-05-25 14:50",
      "2016-05-25 13:50",
    ],
    [
      "Y-m-d H:i:s P",
      "2016-05-25 14:50:00 +01:00",
      "+01:00",
      "2016-05-25 14:50",
      "2016-05-25 13:50",
    ],
    /*
    TODO: Support timezone abbreviations without a fixed offset (depends on DST and historic rule changes)
    [
      "Y-m-d H:i:s e",
      "2016-05-25 14:50:00 UTC",
      "UTC",
      "2016-05-25 14:50",
      "2016-05-25 14:50",
    ],
    [
      "Y-m-d H:i:s T",
      "2016-05-25 14:50:00 CET",
      "CET",
      "2016-05-25 14:50",
      "2016-05-25 13:50",
    ],
    */
  ];
};

testCreateDateTimeFromZonedFormatData().forEach((testData, index) => {
  test(
    "testCreateDateTimeFromZonedFormat - " + index,
    testCreateDateTimeFromZonedFormat,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
    testData[4],
  );
});
