import { join, str_replace, strpos } from "locutus/php/strings";
import { InvalidDateTimeZoneException } from "./exceptions/InvalidDateTimeZoneException";
import { DateTime, DateTimeZone } from "./php-wrappers";
/*
import { is_null } from "locutus/php/var";
*/

export interface Metadata {
  timeRaw?: string | false;
  lastKnownDate?: string;
  dateRaw?: string | false;
  dateRawFormat?: string | false;
  dateRawWasNonemptyBeforeDetectTimestamp?: string;
  dateRaw_with_approx_token_instead_of_minutes?: string | false;
  log?: string[];
}

export function newlineConvert(str, newline) {
  return str_replace(
    [LogParser.NL_WIN, LogParser.NL_MAC, LogParser.NL_NIX],
    newline,
    str,
  );
}

export function textIntoLinesArray(
  text, // Remove weird skype-produced spaces (hex c2a0 as opposed to hex 20 for ordinary spaces) // Normalize line-endings
) {
  text = str_replace("\xA0", " ", text);
  text = this.newlineConvert(text, this.NL_NIX);
  const lines = text.split(this.NL_NIX);
  return lines;
}

export function linesArrayIntoText(lines) {
  return lines.join(this.NL_NIX);
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

  // Main contents holders
  public contents;
  // Metadata arrays
  public notParsedAddTimeMarkers;
  // Helper variables
  public lastKnownDate;
  public lastKnownTimeZone;
  public lastUsedTimeZone;
  public lastSetTsAndDateErrorMessage;
  public tzFirst;
  public debugAddTimeMarkers;
  public collectDebugInfo;

  constructor() {
    this.contents = "";
    this.notParsedAddTimeMarkers = Array();
    this.lastKnownDate = "";
    this.lastKnownTimeZone = "";
    this.lastUsedTimeZone = "";
    this.lastSetTsAndDateErrorMessage = "";
    this.tzFirst = undefined;
    this.debugAddTimeMarkers = Array();
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
    const regexDetectIsoTimezone = "(Z|\\+\\d\\d:\\d\\d)";
    const regexDetectUtcTimezone = "(\\+UTC)";
    return [
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex:
          "/" +
          regexDetectYmd +
          "T" +
          regexDetectHis +
          regexDetectIsoTimezone +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: DateTime.ISO8601,
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex:
          "/" +
          regexDetectYmd +
          "T" +
          regexDetectHis +
          regexDetectUtcTimezone +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: DateTime.ISO8601,
        pre_datetime_parsing_callback: str => {
          return str_replace("+UTC", "Z", str);
        },
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          "/" +
          regexDetectYmd +
          "\\s" +
          regexDetectHcoloniAcceptingApproxToken +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: "Y-m-d H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          "/" +
          regexDetectYmd +
          ",\\s" +
          regexDetectHcoloniAcceptingApproxToken +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: "Y-m-d, H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          "/" +
          regexDetectYmd +
          "\\s" +
          regexDetectHdotiAcceptingApproxToken +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: "Y-m-d H.i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          "/" +
          regexDetectYmd +
          ",\\s" +
          regexDetectHdotiAcceptingApproxToken +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: "Y-m-d, H.i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: true,
        detectRegex:
          "/" +
          regexDetectdmY +
          "\\s" +
          regexDetectHcoloniAcceptingApproxToken +
          "/",
        detectRegexDateRawMatchIndex: 0,
        detectRegexTimeRawMatchIndex: 2,
        format: "d-m-Y H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex: "/" + regexDetectHcoloni + "/",
        detectRegexDateRawMatchIndex: undefined,
        detectRegexTimeRawMatchIndex: 0,
        format: "H:i",
      },
      {
        acceptApproxTokenInsteadOfMinutes: false,
        detectRegex: "/" + regexDetectHdoti + "/",
        detectRegexDateRawMatchIndex: undefined,
        detectRegexTimeRawMatchIndex: 0,
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

  /*

  public set_ts_and_date(dateRaw) {
    this.lastSetTsAndDateErrorMessage = "";
    dateRaw = str_replace(["maj", "okt"], ["may", "oct"], dateRaw).trim();

    let ts;
    let datetime;
    let date;

    try {
      const timeZone = this.interpretLastKnownTimeZone();

      const {
        gmtTimestamp,
        datetime: datetimeReturned,
      } = this.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
        dateRaw,
        timeZone,
      );
      ts = gmtTimestamp;
      datetime = datetimeReturned;
      this.lastUsedTimeZone = timeZone;
    } catch (e) {
      if (e instanceof InvalidDateTimeZoneException) {
        // If invalid timezone is encountered, use UTC and at least detect the timestamp correctly, but make a note about that the wrong timezone was used
        const {
          gmtTimestamp,
          datetime: datetimeReturned,
        } = this.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
          dateRaw,
          "UTC",
        );
        ts = gmtTimestamp;
        datetime = datetimeReturned;
        this.lastSetTsAndDateErrorMessage = e.message();
        this.lastUsedTimeZone = "UTC";
      }
    }

    if (!ts) {
      ts = 0;
      date = false;
      this.lastSetTsAndDateErrorMessage = "Timestamp not found";
    } else if (ts > 0 && ts < UTC.gmtime() - 24 * 3600 * 365 * 10) {
      ts = 0;
      date = false;
      this.lastSetTsAndDateErrorMessage =
        "Timestamp found was more than 10 years old, not reasonably correct";
    } // new day starts at 06.00 in the morning - schablon
    // TODO: Possibly restore this, but then based on dateRaw lacking time-information instead of the parsed date object having time at midnight
    // if (date("H:i:s", $ts) === "00:00:00") $midnightoffset = 0; // do not offset when we didn't specify a specific time (yes this takes 00:00-reported times as well - but I can live with that!)
    else {
      this.lastKnownDate = datetime.format("Y-m-d");
      const midnightoffset = 6 * 60;
      const interval = DateInterval.createFromDateString(
        midnightoffset + " minutes",
      );
      let semanticDateTime = clone(datetime);
      semanticDateTime = semanticDateTime.sub(interval);
      date = semanticDateTime.format("Y-m-d");
    }

    return { ts, date, datetime };
  }
  */

  /*
  public interpretLastKnownTimeZone() {
    return this.interpretTimezoneString(this.lastKnownTimeZone);
  }
  */

  public parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
    str: string,
    timezoneString: string,
  ) {
    let gmtTimestamp: number;
    let datetime;
    let timezone;

    try {
      timezone = new DateTimeZone(timezoneString);
    } catch (e) {
      if (strpos(e.message, "Unknown time zone") !== false) {
        throw new InvalidDateTimeZoneException(e.message, undefined, e);
      }

      throw e;
    }

    for (const supportedTimestampFormat of Object.values(
      this.supportedTimestampFormats(),
    )) {
      const format = supportedTimestampFormat.format;

      if (
        undefined !== supportedTimestampFormat.pre_datetime_parsing_callback
      ) {
        str = supportedTimestampFormat.pre_datetime_parsing_callback(str);
      }

      try {
        datetime = DateTime.createFromFormat(format, str, timezone);
        if (datetime.isValid()) {
          break;
        }
      } catch (e) {
        if (e.message === "DateTime parse error") {
          // ignore
        } else {
          throw e;
        }
      }
    }

    if (!datetime) {
      // TODO: Remove expectation of string and this setting of 0 on error
      // var_dump({str","gmtTimestamp"), strtotime($str));
      // die();
      gmtTimestamp = 0;
    } else {
      const gmtDatetime = datetime.setTimezone(new DateTimeZone("UTC"));
      gmtTimestamp = gmtDatetime.getTimestamp();
    }

    return { gmtTimestamp, datetime };
  }
}
