import test, { ExecutionContext, Macro } from "ava";
import { parse } from "date-fns";
import { DateTime } from "./DateTime";
import { DateTimeZone } from "./DateTimeZone";

const testFormat: Macro = (
  t: ExecutionContext,
  unixTimestamp,
  expectedDateTimeZoneString,
  expectedDateTimeFormatted,
  cloneInTimeZoneString,
  expectedClonedDateTimeFormatted,
) => {
  const dateTime = DateTime.createFromUnixTimestamp(unixTimestamp);
  t.truthy(dateTime);
  const clonedDateTime = dateTime.cloneWithAnotherTimezone(
    new DateTimeZone(cloneInTimeZoneString),
  );
  // t.log("{dateTime, clonedDateTime}", { dateTime, clonedDateTime });
  t.truthy(dateTime.getTimezone());
  t.is(dateTime.getTimezone().toString(), expectedDateTimeZoneString);
  t.is(expectedDateTimeFormatted, dateTime.format("Y-m-d H:i"));
  t.truthy(clonedDateTime.getTimezone());
  t.is(expectedClonedDateTimeFormatted, clonedDateTime.format("Y-m-d H:i"));
};

const testFormatData = () => {
  return [
    [0, "UTC", "1970-01-01 00:00", "Europe/Stockholm", "1970-01-01 01:00"],
    [0, "UTC", "1970-01-01 00:00", "+01:00", "1970-01-01 01:00"],
    [0, "UTC", "1970-01-01 00:00", "+05:00", "1970-01-01 05:00"],
    [0, "UTC", "1970-01-01 00:00", "-05:00", "1969-12-31 19:00"],
  ];
};

testFormatData().forEach((testData, index) => {
  test(
    "testFormat - " + index,
    testFormat,
    testData[0],
    testData[1],
    testData[2],
    testData[3],
    testData[4],
  );
});

const testDateFnsParse: Macro = (
  t: ExecutionContext,
  dateString,
  formatString,
  expectedParsedIsoString,
) => {
  const result = parse(dateString, formatString, new Date());
  // t.log("{dateString, formatString, result}", {dateString, formatString, result,});
  t.truthy(result);
  t.true(DateTime.isValidDate(result));
  const resultIso = result.toISOString();
  // t.log("{resultIso}", { resultIso });
  t.is(expectedParsedIsoString, resultIso);
};

const testDateFnsParseData = () => {
  return [
    [
      "2016-11-25T16:38:38.123Z",
      "yyyy-MM-dd'T'HH:mm:ss.SSSX",
      "2016-11-25T16:38:38.123Z",
    ],
    [
      "2016-05-25T14:50:00.000Z",
      "yyyy-MM-dd'T'HH:mm:ss.SSSX",
      "2016-05-25T14:50:00.000Z",
    ],
    [
      "2016-05-25T14:50:00Z",
      "yyyy-MM-dd'T'HH:mm:ssX",
      "2016-05-25T14:50:00.000Z",
    ],
    /*
    // Supersilly: Can't assert against UTC ISO dates since date-fns/parse assumes local times
    // thus the resulting UTC time is dependent on the timezone of the system that runs the tests
    ["07/02/2016", "MM/dd/yyyy", "2016-07-02T00:00:00.000Z"], // Yields 2016-07-01T21:00:00.000Z or other local time
    ["02/11/2014", "MM/dd/yyyy", "2014-02-11T00:00:00.000Z"],
    */
  ];
};

testDateFnsParseData().forEach((testData, index) => {
  test(
    "testDateFnsParse - " + index,
    testDateFnsParse,
    testData[0],
    testData[1],
    testData[2],
  );
});

const testCreateFromFormat: Macro = (
  t: ExecutionContext,
  phpFormatString,
  dateString,
  expectedDateTimeFormatted,
) => {
  const dateTime = DateTime.createFromFormat(phpFormatString, dateString);
  t.truthy(dateTime);
  t.is(expectedDateTimeFormatted, dateTime.format("Y-m-d H:i"));
};

const testCreateFromFormatData = () => {
  return [
    [DateTime.YMDHI, "2016-05-25 14:50", "2016-05-25 14:50"],
    [DateTime.ISO8601Z, "2016-05-25T14:50:00Z", "2016-05-25 14:50"],
    [DateTime.ISO8601, "2016-05-25T14:50:00+01:00", "2016-05-25 14:50"],
  ];
};

testCreateFromFormatData().forEach((testData, index) => {
  test(
    "testCreateFromFormat - " + index,
    testCreateFromFormat,
    testData[0],
    testData[1],
    testData[2],
  );
});

const testCreateFromFormatWhenTimeZonesAreInvolved: Macro = (
  t: ExecutionContext,
  phpFormatString,
  dateString,
  timezoneStringToUseInCaseDateStringHasNoTimezoneInfo,
  expectedDateTimeFormatted,
  expectedDateTimeZoneString,
) => {
  const timezoneToUseInCaseDateStringHasNoTimezoneInfo = new DateTimeZone(
    timezoneStringToUseInCaseDateStringHasNoTimezoneInfo,
  );
  const dateTime = DateTime.createFromFormat(
    phpFormatString,
    dateString,
    timezoneToUseInCaseDateStringHasNoTimezoneInfo,
  );
  t.truthy(dateTime);
  // t.log("{dateString, dateTime, phpFormatString}", {dateString, dateTime, phpFormatString,});
  t.is(expectedDateTimeFormatted, dateTime.format("Y-m-d H:i"));
  t.is(dateTime.getTimezone().toString(), expectedDateTimeZoneString);
};

const testCreateFromFormatWhenTimeZonesAreInvolvedData = () => {
  return [
    [DateTime.YMDHI, "2016-05-25 14:50", "UTC", "2016-05-25 14:50", "UTC"],
    [
      DateTime.YMDHI,
      "2016-05-25 14:50",
      "Europe/Stockholm",
      "2016-05-25 14:50",
      "Europe/Stockholm",
    ],
    [
      DateTime.ISO8601Z,
      "2016-05-25T14:50:00Z",
      "UTC",
      "2016-05-25 14:50",
      "UTC",
    ],
    [
      DateTime.ISO8601,
      "2016-05-25T14:50:00+01:00",
      "UTC",
      "2016-05-25 14:50",
      "+01:00",
    ],
    [
      DateTime.YMDHI_TZWITHIN,
      "2016-05-25 (+0100) 14:50",
      "UTC",
      "2016-05-25 14:50",
      "+01:00",
    ],
  ];
};

testCreateFromFormatWhenTimeZonesAreInvolvedData().forEach(
  (testData, index) => {
    test(
      "testCreateFromFormatWhenTimeZonesAreInvolved - " + index,
      testCreateFromFormatWhenTimeZonesAreInvolved,
      testData[0],
      testData[1],
      testData[2],
      testData[3],
      testData[4],
    );
  },
);
