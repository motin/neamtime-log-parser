import { join, str_replace, strpos } from "locutus/php/strings";
/*
import { is_null } from "locutus/php/var";
import { DateTime, DateTimeZone } from "./php-wrappers";
*/

export interface Metadata {
  timeRaw?: string;
  lastKnownDate?: string;
  dateRaw?: string;
  dateRawFormat?: string;
  dateRawWasNonemptyBeforeDetectTimestamp?: string;
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

  /*
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
  */
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
  public durationFromLast(ts, rowsWithTimemarkersHandled, rowsWithTimemarkers) {
    let previousRowWithTimeMarker;
    let durationSinceLast;

    if (rowsWithTimemarkersHandled === 0) {
      previousRowWithTimeMarker = undefined;
      durationSinceLast = 0;
    } else {
      previousRowWithTimeMarker =
        rowsWithTimemarkers[rowsWithTimemarkersHandled - 1];
      durationSinceLast = ts - previousRowWithTimeMarker.ts;
    }

    if (!!previousRowWithTimeMarker && !previousRowWithTimeMarker.ts) {
      durationSinceLast = 0;
    }

    return durationSinceLast;
  }

  public detectTimeStamp(lineForDateCheck) {
    const metadata: Metadata = {};
    metadata.lastKnownDate = this.lastKnownDate;

    if (!!metadata.dateRaw) {
      metadata.dateRawWasNonemptyBeforeDetectTimestamp = metadata.dateRaw;
    }

    // codecept_debug([__LINE__, {detectRegex", "lineForDateCheck", "m")]);
    for (const supportedTimestampFormat of Object.values(
      this.supportedTimestampFormats(),
    )) {
      // The most straight-forward date format
      const format = supportedTimestampFormat.format;
      const detectRegex = supportedTimestampFormat.detectRegex;
      const acceptApproxTokenInsteadOfMinutes =
        supportedTimestampFormat.acceptApproxTokenInsteadOfMinutes;
      const detectRegexDateRawMatchIndex =
        supportedTimestampFormat.detectRegexDateRawMatchIndex;
      const detectRegexTimeRawMatchIndex =
        supportedTimestampFormat.detectRegexTimeRawMatchIndex;
      const m = lineForDateCheck.match(detectRegex + "g");

      if (!!m && !!m[0]) {
        // var_dump($line, $m);
        if (this.collectDebugInfo) {
          metadata["date_search_preg_debug:" + format] = {
            lineForDateCheck,
            m,
          };
        }

        metadata.dateRawFormat = format;
        metadata.log.push(`Found a supported timestamp ('${format}')`);

        if (!is_null(detectRegexDateRawMatchIndex)) {
          metadata.dateRaw = m[detectRegexDateRawMatchIndex][0];
        }

        if (!is_null(detectRegexTimeRawMatchIndex)) {
          // If this is a format with only time detection, we use the raw time as the raw date
          metadata.timeRaw = m[detectRegexTimeRawMatchIndex][0];

          if (is_null(detectRegexDateRawMatchIndex)) {
            metadata.dateRaw = metadata.timeRaw;
          }

          if (acceptApproxTokenInsteadOfMinutes) {
            // In case we entered "approx" instead of minutes, shotgun to the exact hour change:
            if (
              this.startsWithOptionallySuffixedToken(metadata.timeRaw, "approx")
            ) {
              metadata.dateRaw_with_approx_token_instead_of_minutes =
                metadata.dateRaw;
              const tokens = this.tokens();
              metadata.dateRaw = str_replace(
                tokens.approx,
                "00",
                metadata.dateRaw,
              );
            }
          }
        } else {
          metadata.timeRaw = false;
        }

        return;
      } else {
        if (this.collectDebugInfo) {
          metadata["date_search_preg_debug:" + format] = {
            lineForDateCheck,
            m,
          };
        }
      }
    }

    metadata.log.push("Did not find a supported timestamp");
    metadata.dateRaw = false;
    metadata.timeRaw = false;
    metadata.dateRawFormat = false;
    return { metadata };
  }

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

  public interpretLastKnownTimeZone() {
    /* tslint:disable:object-literal-sort-keys * /
    const interpretationMap = {
      "GMT-6": "-06:00",
      "UTC-6": "-06:00",
      "UTC-06": "-06:00",
      Orlando: "America/New_York",
      "Las Vegas/GMT-8": "-08:00",
      "Austin/GMT-6": "-06:00",
      "US/San Francisco": "America/Los_Angeles",
    };
    /* tslint:enable:object-literal-sort-keys * /

    if (undefined !== interpretationMap[this.lastKnownTimeZone]) {
      return interpretationMap[this.lastKnownTimeZone];
    }

    return this.lastKnownTimeZone;
  }

  public parseGmtTimestampFromDateSpecifiedInSpecificTimezone(str, timezone) {
    let gmtTimestamp;
    let datetime;

    try {
      timezone = new DateTimeZone(timezone);
    } catch (e) {
      if (strpos(e.getMessage(), "Unknown or bad timezone") !== false) {
        throw new InvalidDateTimeZoneException(e.getMessage(), undefined, e);
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

      datetime = DateTime.createFromFormat(format, str, timezone);

      if (datetime) {
        break;
      }
    }

    if (!datetime) {
      // TODO: Remove expectation of string and this setting of 0 on error
      // var_dump({str","gmtTimestamp"), strtotime($str));
      // die();
      gmtTimestamp = 0;
    } else {
      const gmtDatetime = clone(datetime);
      gmtDatetime.setTimezone(new DateTimeZone("UTC"));
      gmtTimestamp = gmtDatetime.getTimestamp();
    }

    return { gmtTimestamp: String(gmtTimestamp), datetime };
  }
  */
}
