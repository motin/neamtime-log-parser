import { format, parse } from "date-fns";
import { getUnixTime, getZonedTime } from "timezone-support";
import { DateTimeZone } from "./DateTimeZone";

export class DateTime {
  public static ISO8601 = "Y-m-d\\TH:i:s\\Z"; // Literal "Z" to strictly only accept 0000-00-00T00:00:00Z
  public static YMDHI = "Y-m-d H:i";
  public static TTBWSD = "Y-m-d \\(O\\) H:i:s";

  public static isValidDate(d) {
    return d instanceof Date && !isNaN(Number(d));
  }

  /**
   * Timezone handling in javascript is silly. PHP's DateTime::createFromFormat is more deterministic
   * so we model its interface and implementation here.
   *
   * Note: Differs from PHP's DateTime::createFromFormat in the following aspect:
   *  - If timezone is omitted and time contains no timezone, the UTC timezone will be used instead of the current timezone.
   * This reflects how servers are usually configured in UTC timezone and not in the client's timezone.
   *
   * @param phpFormatString
   * @param dateString
   * @param timeZoneToUseInCaseDateStringHasNoTimezoneInfo
   */
  public static createFromFormat(
    phpFormatString: string,
    dateString: string = null,
    timeZoneToUseInCaseDateStringHasNoTimezoneInfo: DateTimeZone = null,
  ): DateTime {
    let parsedDate;
    let timeZone;

    const {
      formatString,
      formatStringIncludesTimezone,
    } = phpToDateFnsFormatString(phpFormatString);

    if (formatStringIncludesTimezone) {
      const parsedZonedDate = DateTimeZone.createFromZonedFormat(
        phpFormatString,
        dateString,
      );
      parsedDate = parsedZonedDate.getDate();
      timeZone = parsedZonedDate.getTimezone();
      // TODO: Emit warning/notice if the zoned timezone differs from the supplied timezone argument??

      if (!DateTime.isValidDate(parsedDate)) {
        throw new Error(
          "DateTime parse error (toZonedDate, required to detect the timezone, failed)",
        );
      }
      console.debug("parsedDate", parsedDate);

      return new DateTime(parsedDate, timeZone);
    } else {
      timeZone = timeZoneToUseInCaseDateStringHasNoTimezoneInfo;
    }

    if (!timeZone) {
      timeZone = new DateTimeZone("UTC");
    }

    // When we parse a date without timezone information using date-fns, it will
    // be assumed that we are parsing in the local timezone, which means that we need to
    // adjust the parsed time here to match our timeZone parameter

    const initiallyParsedDate = parse(dateString, formatString, new Date(), {
      awareOfUnicodeTokens: false,
    });
    // console.debug("{phpFormatString, formatString, dateString, initiallyParsedDate}", {phpFormatString, formatString, dateString, initiallyParsedDate},);

    if (!DateTime.isValidDate(initiallyParsedDate)) {
      throw new Error("DateTime parse error");
    }

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

/**
 * From: http://php.net/manual/en/datetime.createfromformat.php
 * To: https://date-fns.org/v2.0.0-alpha.26/docs/parse
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
  e: "XXX", // Timezone identifier (UTC, GMT, Atlantic/Azores) Note: Not supported by date-fns, but using XXX in order to catch the supported special case "Z"
  O: "XX", // Difference to UTC in hours (+0200)
  P: "XXX", // Difference to UTC with colon between hours and minutes (+02:00)
  T: "XXX", // Timezone abbreviation (EST, MDT) Note: Not supported by date-fns, but using XXX in order to catch the supported special case "Z"
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
