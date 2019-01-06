import { subMinutes } from "date-fns";
import { join, str_replace, strpos } from "locutus/php/strings";
import { InvalidDateTimeZoneException } from "./exceptions/InvalidDateTimeZoneException";
import { DateTime, DateTimeZone } from "./php-wrappers";
/*
import { is_null } from "locutus/php/var";
*/

export function newlineConvert(str, newline) {
  return str_replace(
    [LogParser.NL_WIN, LogParser.NL_MAC, LogParser.NL_NIX],
    newline,
    str,
  );
}

export function textIntoLinesArray(text): string[] {
  // Remove weird skype-produced spaces (hex c2a0 as opposed to hex 20 for ordinary spaces)
  text = str_replace("\xA0", " ", text);
  // Normalize line-endings
  text = this.newlineConvert(text, LogParser.NL_NIX);
  return text.split(LogParser.NL_NIX);
}

export function linesArrayIntoText(lines) {
  return lines.join(LogParser.NL_NIX);
}

export function readFirstNonEmptyLineOfText(text) {
  const lines = this.textIntoLinesArray(text);

  for (const i of Object.keys(lines)) {
    const line: string = lines[i];
    const trimmedLine = line.trim();

    if (!!trimmedLine) {
      return trimmedLine;
    }
  }

  return undefined;
}

// Since strtotime is way to generous, leading to detected "timestamps" which are not actual timestamps
//
// @param $dateRaw
// @param $ts
// @param $date
// @param $datetime Return by reference the DateTime object that contains the master timestamp information
// @throws Exception
// @throws InvalidDateTimeZoneException
//
//
// @param $str
// @param $timezone
// @param null $datetime
// @return false|int|string
// @throws Exception
// @throws InvalidDateTimeZoneException
//
export class LogParser {
  // Handle various types of newlines
  public static NL_NIX = "\n";
  public static NL_WIN = "\r\n";
  public static NL_MAC = "\r";

  /*
  public static newlineType(str) {
    if (strpos(str, LogParser.NL_WIN) !== false) {
      return LogParser.NL_WIN;
    } else if (strpos(str, LogParser.NL_MAC) !== false) {
      return LogParser.NL_MAC;
    } else if (strpos(str, LogParser.NL_NIX) !== false) {
      return LogParser.NL_NIX;
    }
  }
  */

  // Helper variables
  public lastKnownDate;
  public lastKnownTimeZone;
  public lastUsedTimeZone;
  public lastSetTsAndDateErrorMessage;

  constructor() {
    this.lastKnownDate = "";
    this.lastKnownTimeZone = "";
    this.lastUsedTimeZone = "";
    this.lastSetTsAndDateErrorMessage = "";
  }

  public supportedTimestampFormats() // the minute-part may be omitted and instead an approx token will be found, which will be replaced before reaching createFromFormat
  // todo: dyn load appr-tokens
  {
    const regexDetectYmd =
      "(1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020)-\\d+-\\d+";
    const regexDetectdmY =
      "[^\\s\\>>]*-.*-(1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020)";
    const regexDetectHis = "(\\d+:\\d+:\\d+)";
    const regexDetectHcoloniAcceptingApproxToken =
      "(\\d+:([^\\s\\-,:]*|ca|appr))";
    const regexDetectHdotiAcceptingApproxToken =
      "(\\d+\\.([^\\s\\-,:]*|ca|appr))";
    const regexDetectHcoloni = "(\\d+:[^\\s\\-,:]+)";
    const regexDetectHdoti = "(\\d+\\.[^\\s\\-,:]+)";
    const regexDetectLiteralZAsTimezone = "(Z)";
    const regexDetectIsoTimezone = "(\\+\\d\\d:\\d\\d)";
    const regexDetectUtcTimezone = "(\\+UTC)";
    return [
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex:
          regexDetectYmd + "T" + regexDetectHis + regexDetectLiteralZAsTimezone,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: 3,
        format: DateTime.ISO8601Z,
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex:
          regexDetectYmd + "T" + regexDetectHis + regexDetectIsoTimezone,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: 3,
        format: DateTime.ISO8601,
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex:
          regexDetectYmd + "T" + regexDetectHis + regexDetectUtcTimezone,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: 3,
        format: DateTime.ISO8601Z,
        preDatetimeParsingCallback: str => {
          // Convert to ISO8601Z
          return str_replace("+UTC", "Z", str);
        },
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          regexDetectYmd +
          " (" +
          regexDetectIsoTimezone +
          ") " +
          regexDetectHcoloniAcceptingApproxToken,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 3,
        detectRegexTimeZoneRawMatchIndex: 2,
        format: DateTime.YMD_TZWITHIN,
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          regexDetectYmd + "\\s" + regexDetectHcoloniAcceptingApproxToken,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "Y-m-d H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          regexDetectYmd + ",\\s" + regexDetectHcoloniAcceptingApproxToken,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "Y-m-d, H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          regexDetectYmd + "\\s" + regexDetectHdotiAcceptingApproxToken,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "Y-m-d H.i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          regexDetectYmd + ",\\s" + regexDetectHdotiAcceptingApproxToken,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "Y-m-d, H.i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          regexDetectdmY + "\\s" + regexDetectHcoloniAcceptingApproxToken,
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "d-m-Y H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex: regexDetectHcoloni,
        detectRegexDateRawMatchIndex: null,
        detectRegexTimeRawMatchIndex: 0,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex: regexDetectHdoti,
        detectRegexDateRawMatchIndex: null,
        detectRegexTimeRawMatchIndex: 0,
        detectRegexTimeZoneRawMatchIndex: null,
        format: "H.i",
      },
    ];
  }

  public secondsToDuration(seconds, hoursPerDay = 24, daysPerWeek = 7) {
    /* tslint:disable:object-literal-sort-keys */
    const vals = {
      w: seconds / (3600 * hoursPerDay) / daysPerWeek,
      d: (seconds / (3600 * hoursPerDay)) % daysPerWeek,
      h: (seconds / 3600) % hoursPerDay,
      min: (seconds / 60) % 60,
    };
    /* tslint:enable:object-literal-sort-keys */
    const ret = Array();
    let added = false;

    for (const k of Object.keys(vals)) {
      const v = vals[k];

      if (v > 1 || added || k === "min") {
        added = true;
        ret.push(Math.floor(v) + k);
      }
    }

    return join("", ret);
  }

  public durationToSeconds(
    duration,
    hoursPerDay = 24,
    daysPerWeek = 7, // read and remove weeks
  ) {
    let total = 0;

    let p;
    if (strpos(duration, "w") !== false) {
      p = duration.split("w");
      const weeks = p[0];
      total += weeks * (3600 * hoursPerDay) * daysPerWeek;
      duration = p[1];
    }

    if (strpos(duration, "d") !== false) {
      p = duration.split("d");
      const days = p[0];
      total += days * (3600 * hoursPerDay);
      duration = p[1];
    }

    if (strpos(duration, "h") !== false) {
      p = duration.split("h");
      const hours = p[0];
      total += hours * 3600;
      duration = p[1];
    }

    if (strpos(duration, "m") !== false) {
      p = duration.split("m");
      const minutes = p[0];
      total += minutes * 60;
      duration = p[1];
      duration = str_replace("in", "", duration);
    }

    if (strpos(duration, "s") !== false) {
      p = duration.split("s");
      const seconds = p[0];
      total += seconds;
      // duration = p[1];
    }

    return total;
  }

  public durationToMinutes(duration, hoursPerDay = 24, daysPerWeek = 7) {
    const seconds = this.durationToSeconds(duration, hoursPerDay, daysPerWeek);
    return seconds / 60;
  }

  public setTsAndDate(
    dateRaw: string,
    formatToUse: string,
  ): { ts: number; date?: string; datetime?: DateTime } {
    // console.debug("LogParser.setTsAndDate - { dateRaw }", { dateRaw });
    this.lastSetTsAndDateErrorMessage = "";
    dateRaw = str_replace(["maj", "okt"], ["may", "oct"], dateRaw).trim();

    let ts: number;
    let datetime: DateTime;
    let datetimeParseResult: DateTime | false;
    let date: string;

    const timezoneStringToUseInCaseDateStringHasNoTimezoneInfo = this.interpretLastKnownTimeZone();

    try {
      const {
        gmtTimestamp,
        datetime: datetimeReturned,
      } = this.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
        dateRaw,
        timezoneStringToUseInCaseDateStringHasNoTimezoneInfo,
        formatToUse,
      );
      ts = gmtTimestamp;
      datetimeParseResult = datetimeReturned;
      // TODO: Should use timezoneRaw instead...
      this.lastUsedTimeZone = datetimeParseResult.getTimezone().getName();
    } catch (e) {
      if (e instanceof InvalidDateTimeZoneException) {
        // If invalid timezone is encountered, use UTC and at least detect the timestamp correctly, but make a note about that the wrong timezone was used
        const {
          gmtTimestamp,
          datetime: datetimeReturned,
        } = this.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
          dateRaw,
          "UTC",
          formatToUse,
        );
        ts = gmtTimestamp;
        datetimeParseResult = datetimeReturned;
        this.lastSetTsAndDateErrorMessage = e.message;
        this.lastUsedTimeZone = "UTC";
      }
    }

    // console.debug("setTsAndDate - midway - {datetimeParseResult, timezoneStringToUseInCaseDateStringHasNoTimezoneInfo, ts}, this.lastKnownDate, this.lastKnownTimeZone, this.lastSetTsAndDateErrorMessage, this.lastUsedTimeZone",{datetimeParseResult, timezoneStringToUseInCaseDateStringHasNoTimezoneInfo, ts}, this.lastKnownDate, this.lastKnownTimeZone, this.lastSetTsAndDateErrorMessage, this.lastUsedTimeZone);

    if (!ts) {
      ts = 0;
      this.lastSetTsAndDateErrorMessage = "Timestamp not found";
    } else if (
      ts > 0 &&
      ts < new Date().getTime() / 1000 - 24 * 3600 * 365 * 10
    ) {
      ts = 0;
      this.lastSetTsAndDateErrorMessage =
        "Timestamp found was more than 10 years old, not reasonably correct";
    } else {
      if (datetimeParseResult instanceof DateTime) {
        datetime = datetimeParseResult;
        this.lastKnownDate = datetime.format("Y-m-d");
        // trust that the last used time zone is the one that should be used for upcoming unzoned timestamps (allows for a zoned timestamp to function as a |tz: marker)
        // TODO: This should only be set if the last used timezone was set from a zoned timestamp
        this.lastKnownTimeZone = datetime.getTimezone().getName();
        // new day starts at 06.00 in the morning - arbitrarily decided as such TODO: Make configurable
        const midnightOffset = 6 * 60;
        // TODO: Possibly restore this, but then based on dateRaw lacking time-information instead of the parsed date object having time at midnight
        // if (date("H:i:s", $ts) === "00:00:00") $midnightoffset = 0; // do not offset when we didn't specify a specific time (yes this takes 00:00-reported times as well - but I can live with that!)
        const semanticDate = subMinutes(datetime.getDate(), midnightOffset);
        const semanticDateTime = new DateTime(semanticDate);
        date = semanticDateTime.format("Y-m-d");
      }
    }

    return { ts, date, datetime };
  }

  public interpretLastKnownTimeZone() {
    return DateTimeZone.interpretTimezoneString(this.lastKnownTimeZone);
  }

  /**
   * @param str
   * @param timezoneStringToUseInCaseDateStringHasNoTimezoneInfo
   * @param formatToUse
   */
  public parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
    str: string,
    timezoneStringToUseInCaseDateStringHasNoTimezoneInfo: string,
    formatToUse: string = null,
  ): { gmtTimestamp: number; datetime: DateTime } {
    let gmtTimestamp: number;
    let datetimeParseResult: DateTime | false;
    let datetime: DateTime;
    const timezoneToUseInCaseDateStringHasNoTimezoneInfo: DateTimeZone = new DateTimeZone(
      timezoneStringToUseInCaseDateStringHasNoTimezoneInfo,
    );

    for (const supportedTimestampFormat of Object.values(
      this.supportedTimestampFormats(),
    )) {
      const format = supportedTimestampFormat.format;

      // Force a specific supporting timestamp format, so that the same format
      // as was detected can be ensured to have been used. This ensures parity
      // between detection and parsing + avoids running unnecessary checks
      // which affects performance and stability
      if (formatToUse && format !== formatToUse) {
        continue;
      }

      if (supportedTimestampFormat.preDatetimeParsingCallback) {
        str = supportedTimestampFormat.preDatetimeParsingCallback(str);
      }

      try {
        datetimeParseResult = DateTime.createFromFormat(
          format,
          str,
          timezoneToUseInCaseDateStringHasNoTimezoneInfo,
        );
        if (datetimeParseResult.isValid()) {
          if (datetimeParseResult instanceof DateTime) {
            datetime = datetimeParseResult;
          }
          break;
        }
      } catch (e) {
        if (e.message.indexOf("DateTime parse error") > -1) {
          // ignore, since we will try another supported format until something works
          // unless debugging during dev:
          // console.debug("DateTime parse error - {format, str, timezoneToUseInCaseDateStringHasNoTimezoneInfo}", { format, str, timezoneToUseInCaseDateStringHasNoTimezoneInfo },);
        } else {
          throw e;
        }
      }
    }

    // TODO: Remove expectation of number and this setting of 0 on error
    gmtTimestamp = !datetime ? 0 : datetime.getTimestamp();

    return { gmtTimestamp, datetime };
  }
}
