import { findTimeZone } from "timezone-support";
import { convertTimeToDate } from "timezone-support/dist/lookup-convert";
import { parseZonedTime } from "timezone-support/dist/parse-format";
import { InvalidDateTimeZoneException } from "../exceptions/InvalidDateTimeZoneException";
import { DateTime } from "./DateTime";

// Duplicated from node_modules/timezone-support since the interface is not exported
export interface TimeZoneOffset {
  abbreviation?: string;
  offset: number;
}
export interface Time {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds?: number;
  milliseconds?: number;
  dayOfWeek?: number;
  epoch?: number;
  zone?: TimeZoneOffset;
}

export class DateTimeZone {
  // https://github.com/prantlf/date-fns-timezone/blob/master/src/parseFromString.js
  public static interpretTimezoneString(timezoneString) {
    const interpretationMap = {
      /* tslint:disable:object-literal-sort-keys */
      "GMT-6": "-06:00",
      "UTC-6": "-06:00",
      "UTC-06": "-06:00",
      Orlando: "America/New_York",
      "Las Vegas/GMT-8": "-08:00",
      "Austin/GMT-6": "-06:00",
      "US/San Francisco": "America/Los_Angeles",
      /* tslint:enable:object-literal-sort-keys */
    };
    if (undefined !== interpretationMap[timezoneString]) {
      return interpretationMap[timezoneString];
    }
    return timezoneString;
  }

  /**
   * Necessary in order to not only parse a zoned date string but also detect the original time zone
   * Supports the following timezone definitions:
   *
   * Timezone abbreviation  z  CET, CEST, EST, EDT, ...
   * Timezone offset to UTC  Z  -01:00, +00:00, ... +12:00
   *                        ZZ  -0100, +0000, ..., +1200
   *
   * @param phpFormatString
   * @param dateString
   */
  public static createDateTimeFromZonedFormat(
    phpFormatString,
    dateString,
  ): DateTime {
    let parsedZonedDate;
    let detectedTimeZone;

    const {
      formatString,
      formatStringIncludesTimezone,
    } = phpToTimeZoneSupportFormatString(phpFormatString);

    if (!formatStringIncludesTimezone) {
      throw new Error(
        "Only zoned format strings should be attempted to be parsed by this function",
      );
    }

    // console.debug("createFromZonedFormat - {dateString, formatString, phpFormatString}", { dateString, formatString, phpFormatString },);

    try {
      const time = parseZonedTime(dateString, formatString);
      // console.debug("{time}", { time });
      parsedZonedDate = convertTimeToDate(time);
      detectedTimeZone = DateTimeZone.createFromTimeZoneOffset(time.zone);
    } catch (e) {
      // console.error("Zoned time parse error: ", e);
      parsedZonedDate = false;
    }

    return new DateTime(parsedZonedDate, detectedTimeZone);
  }

  public static createFromTimeZoneOffset(
    timeZoneOffset: TimeZoneOffset,
  ): DateTimeZone {
    if (timeZoneOffset.abbreviation) {
      return new DateTimeZone(timeZoneOffset.abbreviation);
    }
    if (typeof timeZoneOffset.offset === "number") {
      const hours = (timeZoneOffset.offset / 60) % 60;
      const minutes = timeZoneOffset.offset % 60;
      const absFloorAndPad = num => {
        return String(Math.floor(Math.abs(num))).padStart(2, "0");
      };
      // Set ISO-style "timezone", representing the known offset
      const timeZoneString =
        (timeZoneOffset.offset <= 0 ? "+" : "-") +
        `${absFloorAndPad(hours)}:${absFloorAndPad(minutes)}`;
      return new DateTimeZone(timeZoneString);
    }
    throw new Error(
      "Could not determine a timezone string from the following timeZoneOffset: " +
        JSON.stringify(timeZoneOffset),
    );
  }

  private readonly timezone: string;
  private timezoneInfo: any;

  constructor(timezoneString) {
    this.timezone = DateTimeZone.interpretTimezoneString(timezoneString);
    // This is weird - can't use offsets directly, instead must translate
    // Even weirder is that GMT timezones count backwards
    switch (this.timezone) {
      case "-06:00":
        this.timezone = "Etc/GMT+6";
        break;
    }
  }

  public toString() {
    return this.timezone;
  }

  public getName() {
    return this.timezone;
  }

  public getTimeZoneInfo() {
    if (!this.timezoneInfo) {
      // Support ISO-style "timezones", representing known offsets
      const m = this.timezone.match(/^(\+|\-)?(\d\d):?(\d\d)?$/);
      if (m) {
        const [timeZoneName, sign, hoursString, minutesString] = m;
        const hours = parseInt(hoursString, 10);
        const minutes = parseInt(minutesString, 10);
        const timeZoneOffset = (sign === "-" ? 1 : -1) * hours * 60 + minutes;
        this.timezoneInfo = {
          abbreviations: [timeZoneName],
          name: timeZoneName,
          offsets: [timeZoneOffset],
          population: 0,
          untils: [Infinity],
        };
      } else {
        try {
          this.timezoneInfo = findTimeZone(this.timezone);
        } catch (e) {
          if (e.message.indexOf("Unknown time zone") > -1) {
            throw new InvalidDateTimeZoneException(e.message, undefined, e);
          }
          throw e;
        }
      }
    }
    return this.timezoneInfo;
  }
}

/**
 * From: http://php.net/manual/en/datetime.createfromformat.php
 * To: https://github.com/prantlf/timezone-support/blob/master/docs/API.md#parsezonedtime
 */
const phpToTimezoneSupportFormatStringConversions = {
  /* tslint:disable:object-literal-sort-keys */
  d: "DD",
  D: "",
  j: "D",
  l: "",
  N: "",
  S: "",
  w: "",
  z: "",
  W: "",
  F: "",
  m: "MM",
  M: "",
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
  I: "",
  e: "z", // Timezone identifier (UTC, GMT, Atlantic/Azores) Note: Only 3-4 character abbreviations are supported by timezone-support
  O: "ZZ", // Difference to UTC in hours (+0200)
  P: "Z", // Difference to UTC with colon between hours and minutes (+02:00)
  T: "z", // Timezone abbreviation (EST, MDT)
  Z: "",
  c: "",
  r: "",
  U: "",
  /* tslint:enable:object-literal-sort-keys */
};

const phpToTimeZoneSupportFormatString = phpFormat => {
  const items = phpFormat.split("");
  let formatString = "";
  let formatStringIncludesTimezone = false;

  const timezoneTokens = ["e", "O", "P", "T"];

  let literalNext;
  for (const item of items) {
    if (literalNext) {
      formatString += "[" + item + "]";
      literalNext = false;
    } else {
      if (phpToTimezoneSupportFormatStringConversions[item] !== undefined) {
        formatString += phpToTimezoneSupportFormatStringConversions[item];
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
