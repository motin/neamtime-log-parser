import test, { ExecutionContext, Macro } from "ava";
import { parse } from "date-fns";
import { DateTime } from "./DateTime";

const testDateFnsParse: Macro = (
  t: ExecutionContext,
  dateString,
  formatString,
  expectedParsedIsoString,
) => {
  const result = parse(dateString, formatString, new Date());
  t.log("{dateString, formatString, result}", {
    dateString,
    formatString,
    result,
  });
  t.truthy(result);
  t.true(DateTime.isValidDate(result));
  const resultIso = result.toISOString();
  t.log("{resultIso}", { resultIso });
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
  const dt = DateTime.createFromFormat(phpFormatString, dateString);
  t.truthy(dt);
  t.is(expectedDateTimeFormatted, dt.format("Y-m-d H:i"));
};

const testCreateFromFormatData = () => {
  return [
    [DateTime.YMDHI, "2016-05-25 14:50", "2016-05-25 14:50"],
    [DateTime.ISO8601Z, "2016-05-25T14:50:00Z", "2016-05-25 14:50"],
    [DateTime.ISO8601, "2016-05-25T14:50:00+01:00", "2016-05-25 13:50"],
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
