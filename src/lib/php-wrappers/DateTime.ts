import {} from "date-fns";
import { format, toDate, zonedTimeToUtc } from "date-fns-tz";
import { DateTimeZone } from "./DateTimeZone";

export class DateTime {
  public static ISO8601 = "foo";
  public static createFromFormat(
    formatRecipe: string,
    str: string = null,
    timeZone: DateTimeZone = null,
  ): DateTime {
    console.log(
      "toMoment, format",
      toMoment(formatRecipe),
      formatRecipe,
      str,
      timeZone,
      toDate,
      format,
      zonedTimeToUtc,
    );

    /*
    // Since toDate simply clones a Date instance timeZone option is effectively ignored in this case
const date = new Date('2014-10-25T13:46:20Z')
const clonedDate = toDate(date, { timeZone: 'Europe/Paris' })
assert(date.valueOf() === clonedDate.valueOf())

    const utcDate = zonedTimeToUtc(str, timeZone)  // In June 10am in Los Angeles is 5pm UTC
    const dateTime = new DateTime(date);
    return dateTime;

    // const timeZone = getTimeZoneValue()   // e.g. America/Los_Angeles

    //

postToServer(utcDate.toISOString(), timeZone) // post 2014-06-25T17:00:00.000Z, America/Los_Angeles
*/

    return new DateTime(new Date());
  }
  public static createFromUnixTimestamp(unixTimestamp: number): DateTime {
    console.log("createFromUnixTimestamp", unixTimestamp);
    return new DateTime(new Date(unixTimestamp * 1000));
  }
  private date: Date;
  private timeZone;
  constructor(date: Date) {
    this.date = date;
  }
  public setTimestamp(unixTimestamp) {
    this.date.setTime(unixTimestamp * 1000);
  }
  public getTimestamp() {
    return this.date.getTime() / 1000;
  }
  public setTimezone(timeZone) {
    this.timeZone = timeZone;
  }
  public getTimezone() {
    return this.timeZone;
  }
  public format(formatRecipe, timeZone = null) {
    console.log("TODO format", formatRecipe, timeZone);
    /* {
      timeZone: "Europe/Berlin",
    }*/

    return format(this.date, formatRecipe, timeZone);
  }
}

const phpToMomentConversions = {
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

/*
const toMoment2 = function (phpFormat) {
  return phpFormat.replace(/[A-Za-z]+/g, function (match) {
    return phpToMomentConversions[match] || match;
  });
};
*/

const toMoment = phpFormat => {
  const items = phpFormat.split("");
  let returnItem = "";

  for (const item in items) {
    if (phpToMomentConversions[items[item]] !== undefined) {
      returnItem += phpToMomentConversions[items[item]];
    } else {
      returnItem += items[item];
    }
  }
  return returnItem;
};
