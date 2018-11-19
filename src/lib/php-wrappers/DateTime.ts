import { parse } from "date-fns";
import { format, toDate /*, zonedTimeToUtc*/ } from "date-fns-tz";
import { DateTimeZone } from "./DateTimeZone";

export class DateTime {
  public static ISO8601 = "Y-m-dTH:i:sO";

  public static isValidDate(d) {
    return d instanceof Date && !isNaN(Number(d));
  }

  public static createFromFormat(
    phpFormatString: string,
    dateString: string = null,
    timeZone: DateTimeZone = null,
  ): DateTime {
    const formatString = phpToJsFormatString(phpFormatString);
    console.log("createFromFormat", phpFormatString, formatString, dateString);

    if (!timeZone) {
      timeZone = new DateTimeZone("UTC");
    }

    let parsedDate;
    const formatContainsTimezone = formatString.indexOf("ZZ") > -1;
    if (formatContainsTimezone) {
      parsedDate = DateTimeZone.parseZonedString(dateString, formatString);
      // TODO: Throw exception if the zoned timezone differs from the supplied timezone argument??
    } else {
      const parsedDateWithoutTimezoneInformation = parse(
        dateString,
        formatString,
        new Date(),
        { awareOfUnicodeTokens: true },
      );
      // Set time zone to timeZone
      parsedDate = toDate(parsedDateWithoutTimezoneInformation, {
        timeZone: timeZone.toString(),
      });
    }

    console.log("parsedDate", parsedDate);

    /*
    // Since toDate simply clones a Date instance timeZone option is effectively ignored in this case
    const date = new Date('2014-10-25T13:46:20Z')
    const clonedDate = toDate(date, { timeZone: 'Europe/Paris' })
    assert(date.valueOf() === clonedDate.valueOf())
    const utcDate = zonedTimeToUtc(dateString, timeZone)  // In June 10am in Los Angeles is 5pm UTC
    const dateTime = new DateTime(date);
    return dateTime;
    // const timeZone = getTimeZoneValue()   // e.g. America/Los_Angeles
    */
    // toDate();
    return new DateTime(parsedDate);
  }

  public static createFromUnixTimestamp(unixTimestamp: number): DateTime {
    // console.log("createFromUnixTimestamp", unixTimestamp);
    return new DateTime(new Date(unixTimestamp * 1000));
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

  public setTimezone(timeZone): DateTime {
    return new DateTime(this.date, timeZone);
  }

  public getTimezone() {
    return this.timeZone;
  }

  public format(phpFormatString) {
    const formatString = phpToJsFormatString(phpFormatString);
    console.log("TODO format", this.date, phpFormatString, formatString);
    return format(this.date, formatString, {
      timeZone: this.timeZone.toString(),
    });
  }
}

const phpToFormatStringConversions = {
  /* tslint:disable:object-literal-sort-keys */
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
  O: "",
  P: "",
  T: "",
  Z: "",
  c: "",
  r: "",
  U: "X",
  /* tslint:enable:object-literal-sort-keys */
};

const phpToJsFormatString = phpFormat => {
  const items = phpFormat.split("");
  let returnItem = "";

  for (const item in items) {
    if (phpToFormatStringConversions[items[item]] !== undefined) {
      returnItem += phpToFormatStringConversions[items[item]];
    } else {
      returnItem += items[item];
    }
  }
  return returnItem;
};
