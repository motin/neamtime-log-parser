import { format, parse } from "date-fns";
import { getUnixTime, getZonedTime } from "timezone-support";
import { DateTimeZone } from "./DateTimeZone";

export class DateTime {
  public static ISO8601 = "Y-m-d\\TH:i:sO";
  public static YMDHI = "Y-m-d H:i";

  public static isValidDate(d) {
    return d instanceof Date && !isNaN(Number(d));
  }

  public static createFromFormat(
    phpFormatString: string,
    dateString: string = null,
    timeZone: DateTimeZone = null,
  ): DateTime {
    if (!timeZone) {
      timeZone = new DateTimeZone("UTC");
    }

    let parsedDate;
    // TODO: Either fully support IANA timezones or strip the corresponding wip code away
    /*
    const formatContainsIanaTimezone = false;
    if (formatContainsIanaTimezone) {
      const formatString = phpToTimeZoneSupportFormatString(phpFormatString);
      console.log("formatString", formatString);
      try {
        parsedDate = DateTimeZone.parseZonedString(dateString, formatString);
        // TODO: Throw exception if the zoned timezone differs from the supplied timezone argument??
      } catch (e) {
        // console.error("Zoned time parse error: ", e);
        parsedDate = false;
      }
    } else { ... }
    */

    // Timezone handling in javascript is silly requiring this dance

    const {
      formatString,
      formatStringIncludesTimezone,
    } = phpToDateFnsFormatString(phpFormatString);
    const initiallyParsedDate = parse(dateString, formatString, new Date(), {
      awareOfUnicodeTokens: false,
    });
    // console.debug("{phpFormatString, formatString, dateString, initiallyParsedDate}", {phpFormatString, formatString, dateString, initiallyParsedDate},);

    if (!DateTime.isValidDate(initiallyParsedDate)) {
      throw new Error("DateTime parse error");
    }

    if (formatStringIncludesTimezone) {
      return new DateTime(initiallyParsedDate, timeZone);
    }

    // When we parse a date without timezone information using date-fns, it will
    // be assumed that we are parsing in the local timezone, which means that we need to
    // adjust the parsed time here

    const zonedParsedDate = getZonedTime(
      initiallyParsedDate,
      timeZone.getTimeZoneInfo(),
    );

    // Adjust the incorrectly parsed local time
    const timezoneOffset = initiallyParsedDate.getTimezoneOffset();
    parsedDate = new Date(
      getUnixTime(zonedParsedDate) -
        timezoneOffset * 1000 * 60 +
        zonedParsedDate.zone.offset * 1000 * 60,
    );

    // console.debug("{timezoneOffset, zonedParsedDate, parsedDate}", {timezoneOffset, zonedParsedDate, parsedDate});

    return new DateTime(parsedDate, timeZone);
  }

  public static createFromUnixTimestamp(unixTimestamp: number): DateTime {
    const createdDate = new Date(unixTimestamp * 1000);
    return new DateTime(createdDate);
  }

  private readonly date: Date;
  private readonly timeZone;

  constructor(date: Date, timeZone = null) {
    this.date = date;
    this.timeZone = timeZone;
  }

  public isValid() {
    return DateTime.isValidDate(this.date);
  }

  public setTimestamp(unixTimestamp): DateTime {
    return new DateTime(new Date(unixTimestamp * 1000));
  }

  public getTimestamp() {
    return this.date.getTime() / 1000;
  }

  public getDate() {
    return this.date;
  }

  public setTimezone(timeZone): DateTime {
    return new DateTime(this.date, timeZone);
  }

  public getTimezone() {
    if (!this.timeZone) {
      return new DateTimeZone("UTC");
    }
    return this.timeZone;
  }

  public format(phpFormatString) {
    const { formatString } = phpToDateFnsFormatString(phpFormatString);
    const zonedParsedDate = getZonedTime(
      this.date.getTime(),
      this.getTimezone().getTimeZoneInfo(),
    );
    const dateForFormatting = new Date(
      this.date.getTime() +
        this.date.getTimezoneOffset() * 1000 * 60 -
        zonedParsedDate.zone.offset * 1000 * 60,
    );
    const formatted = format(dateForFormatting, formatString);
    return formatted;
  }
}

/*
const phpToTimezoneSupportFormatStringConversions = {
  /* tslint:disable:object-literal-sort-keys * /
  d: "DD",
  D: "ddd",
  j: "D",
  l: "dddd",
  N: "E",
  S: "o",
  w: "e",
  z: "DDD",
  W: "W",
  F: "MMMM",
  m: "MM",
  M: "MMM",
  n: "M",
  t: "",
  L: "",
  o: "YYYY",
  Y: "YYYY",
  y: "YY",
  a: "a",
  A: "A",
  B: "",
  g: "h",
  G: "H",
  h: "hh",
  H: "HH",
  i: "mm",
  s: "ss",
  u: "SSS",
  e: "zz",
  I: "",
  O: "zz",
  P: "zz",
  T: "zz",
  Z: "",
  c: "",
  r: "",
  U: "X",
  /* tslint:enable:object-literal-sort-keys * /
};

const phpToTimeZoneSupportFormatString = phpFormat => {
  const items = phpFormat.split("");
  let returnItem = "";

  let ignoreNext;
  for (const item of items) {
    if (
      !ignoreNext &&
      phpToTimezoneSupportFormatStringConversions[item] !== undefined
    ) {
      returnItem += phpToTimezoneSupportFormatStringConversions[item];
    } else {
      returnItem += item;
    }
    if (ignoreNext) {
      ignoreNext = false;
    }
    if (item === "\\") {
      ignoreNext = true;
    }
  }
  return returnItem;
};
*/

const phpToDateFnsFormatStringConversions = {
  /* tslint:disable:object-literal-sort-keys */
  d: "dd",
  m: "MM",
  Y: "yyyy",
  y: "yy",
  H: "HH",
  i: "mm",
  s: "ss",
  u: "SSS",
  e: "xxx",
  O: "X",
  P: "xxx",
  T: "xxx",
  /* tslint:enable:object-literal-sort-keys */
};

const phpToDateFnsFormatString = (
  phpFormat,
): { formatString: string; formatStringIncludesTimezone: boolean } => {
  const items = phpFormat.split("");
  let formatString = "";
  let formatStringIncludesTimezone = false;

  const timezoneTokens = ["e", "O", "P", "T"];

  let literalNext;
  for (const item of items) {
    if (literalNext) {
      formatString += "'" + item + "'";
      literalNext = false;
    } else {
      if (phpToDateFnsFormatStringConversions[item] !== undefined) {
        formatString += phpToDateFnsFormatStringConversions[item];
        if (timezoneTokens.indexOf(item) > -1) {
          formatStringIncludesTimezone = true;
        }
      } else {
        if (item === "\\") {
          literalNext = true;
        } else {
          formatString += item;
        }
      }
    }
  }
  return { formatString, formatStringIncludesTimezone };
};
