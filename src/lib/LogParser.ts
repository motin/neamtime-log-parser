import { str_replace, strpos } from "locutus/php/strings";
import { is_null } from "locutus/php/var";
import { DateTime, DateTimeZone } from "./php-function-wrappers";

// http://snippets.dzone.com/posts/show/2039

function str_hex(string) {
  let hex = "";

  for (let i = 0; i < string.length; i++) {
    hex += dechex(string.charCodeAt(i));
  }

  return hex;
}

const WORD_COUNT_MASK = "/\\p{L}[\\p{L}\\p{Mn}\\p{Pd}'\\x{2019}]*/u";

function str_word_count_utf8(string, format = 0) {
  switch (format) {
    case 1:
      preg_match_all(WORD_COUNT_MASK, string, matches);
      return matches[0];

    case 2:
      preg_match_all(WORD_COUNT_MASK, string, matches, PREG_OFFSET_CAPTURE);
      const result = Array();

      for (const match of Object.values(matches[0])) {
        result[match[1]] = match[0];
      }

      return result;
  }

  return preg_match_all(WORD_COUNT_MASK, string, matches);
}

// Main contents holders
// Metadata arrays
// Helper variables
// Handle various types of newlines
// Since strtotime is way to generous, leading to detected "timestamps" which are not actual timestamps
//
// @param $date_raw
// @param $ts
// @param $date
// @param null $linewithoutdate
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
class LogParser {
  public static NL_NIX = "\n";
  public static NL_WIN = "\r\n";
  public static NL_MAC = "\r";

  public static newline_type(string) {
    if (strpos(string, LogParser.NL_WIN) !== false) {
      return LogParser.NL_WIN;
    } else if (strpos(string, LogParser.NL_MAC) !== false) {
      return LogParser.NL_MAC;
    } else if (strpos(string, LogParser.NL_NIX) !== false) {
      return LogParser.NL_NIX;
    }
  }

  public static newline_convert(string, newline) {
    return str_replace(
      [LogParser.NL_WIN, LogParser.NL_MAC, LogParser.NL_NIX],
      newline,
      string,
    );
  }

  public static textIntoLinesArray(
    text, // Remove weird skype-produced spaces (hex c2a0 as opposed to hex 20 for ordinary spaces) // Normalize line-endings
  ) {
    text = str_replace("\xA0", " ", text);
    text = this.newline_convert(text, this.NL_NIX);
    const lines = text.split(this.NL_NIX);
    return lines;
  }

  public static linesArrayIntoText(lines) {
    return lines.join(this.NL_NIX);
  }

  public static readFirstNonEmptyLineOfText(text) {
    const lines = this.textIntoLinesArray(text);

    for (const line of Object.values(lines)) {
      const trimmedLine = line.trim();

      if (!!trimmedLine) {
        return trimmedLine;
      }
    }

    return undefined;
  }
  public contents;
  public notParsedAddTimeMarkers;
  public lastKnownDate;
  public lastKnownTimeZone;
  public lastUsedTimeZone;
  public lastSetTsAndDateErrorMessage;
  public tz_first;
  public debugAddTimeMarkers;
  constructor() {
    this.contents = "";
    this.notParsedAddTimeMarkers = Array();
    this.lastKnownDate = "";
    this.lastKnownTimeZone = "";
    this.lastUsedTimeZone = "";
    this.lastSetTsAndDateErrorMessage = "";
    this.tz_first = undefined;
    this.debugAddTimeMarkers = Array();
  }

  public supportedTimestampFormats() // the minute-part may be omitted and instead an approx token will be found, which will be replaced before reaching createFromFormat
  // todo: dyn load appr-tokens
  {
    const Ymd_detect_regex =
      "(1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020)-\\d+-\\d+";
    const dmY_detect_regex =
      "[^\\s\\>>]*-.*-(1999|2000|2001|2002|2003|2004|2005|2006|2007|2008|2009|2010|2011|2012|2013|2014|2015|2016|2017|2018|2019|2020)";
    const His_detect_regex = "(\\d+:\\d+:\\d+)";
    const Hcoloni_detect_regex_accept_approx_token =
      "(\\d+:([^\\s\\-,:]*|ca|appr))";
    const Hdoti_detect_regex_accept_approx_token =
      "(\\d+\\.([^\\s\\-,:]*|ca|appr))";
    const Hcoloni_detect_regex = "(\\d+:[^\\s\\-,:]+)";
    const Hdoti_detect_regex = "(\\d+\\.[^\\s\\-,:]+)";
    const iso_timezone_detect_regex = "(Z|\\+\\d\\d:\\d\\d)";
    const utc_timezone_detect_regex = "(\\+UTC)";
    return [
      {
        format: DateTime.ISO8601,
        accept_approx_token_instead_of_minutes: false,
        detect_regex:
          "/" +
          Ymd_detect_regex +
          "T" +
          His_detect_regex +
          iso_timezone_detect_regex +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
      },
      {
        format: DateTime.ISO8601,
        accept_approx_token_instead_of_minutes: false,
        detect_regex:
          "/" +
          Ymd_detect_regex +
          "T" +
          His_detect_regex +
          utc_timezone_detect_regex +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
        pre_datetime_parsing_callback: str => {
          return str_replace("+UTC", "Z", str);
        },
      },
      {
        format: "Y-m-d H:i",
        accept_approx_token_instead_of_minutes: true,
        detect_regex:
          "/" +
          Ymd_detect_regex +
          "\\s" +
          Hcoloni_detect_regex_accept_approx_token +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
      },
      {
        format: "Y-m-d, H:i",
        accept_approx_token_instead_of_minutes: true,
        detect_regex:
          "/" +
          Ymd_detect_regex +
          ",\\s" +
          Hcoloni_detect_regex_accept_approx_token +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
      },
      {
        format: "Y-m-d H.i",
        accept_approx_token_instead_of_minutes: true,
        detect_regex:
          "/" +
          Ymd_detect_regex +
          "\\s" +
          Hdoti_detect_regex_accept_approx_token +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
      },
      {
        format: "Y-m-d, H.i",
        accept_approx_token_instead_of_minutes: true,
        detect_regex:
          "/" +
          Ymd_detect_regex +
          ",\\s" +
          Hdoti_detect_regex_accept_approx_token +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
      },
      {
        format: "d-m-Y H:i",
        accept_approx_token_instead_of_minutes: true,
        detect_regex:
          "/" +
          dmY_detect_regex +
          "\\s" +
          Hcoloni_detect_regex_accept_approx_token +
          "/",
        detect_regex_date_raw_match_index: 0,
        detect_regex_time_raw_match_index: 2,
      },
      {
        format: "H:i",
        accept_approx_token_instead_of_minutes: false,
        detect_regex: "/" + Hcoloni_detect_regex + "/",
        detect_regex_date_raw_match_index: undefined,
        detect_regex_time_raw_match_index: 0,
      },
      {
        format: "H.i",
        accept_approx_token_instead_of_minutes: false,
        detect_regex: "/" + Hdoti_detect_regex + "/",
        detect_regex_date_raw_match_index: undefined,
        detect_regex_time_raw_match_index: 0,
      },
    ];
  }

  public secondsToDuration(seconds, hoursPerDay = 24, daysPerWeek = 7) {
    const vals = {
      w: +(seconds / (3600 * hoursPerDay) / daysPerWeek),
      d: (seconds / (3600 * hoursPerDay)) % daysPerWeek,
      h: (seconds / 3600) % hoursPerDay,
      min: (seconds / 60) % 60,
    };
    const ret = Array();
    let added = false;

    for (const k in vals) {
      const v = vals[k];

      if (v > 0 || added || k == "min") {
        added = true;
        ret.push(Math.round(v) + k);
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

    if (strpos(duration, "w") !== false) {
      const p = duration.split("w");
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
      duration = p[1];
    }

    return total;
  }

  public durationToMinutes(duration, hoursPerDay = 24, daysPerWeek = 7) {
    const seconds = this.durationToSeconds(duration, hoursPerDay, daysPerWeek);
    return seconds / 60;
  }

  public durationFromLast(
    ts,
    rows_with_timemarkers_handled,
    rows_with_timemarkers,
  ) {
    let previousRowWithTimeMarker;

    if (rows_with_timemarkers_handled == 0) {
      previousRowWithTimeMarker = undefined;
      const duration_since_last = 0;
    } else {
      previousRowWithTimeMarker =
        rows_with_timemarkers[rows_with_timemarkers_handled - 1];
      duration_since_last = ts - previousRowWithTimeMarker.ts;
    }

    if (!!previousRowWithTimeMarker && !previousRowWithTimeMarker.ts) {
      duration_since_last = 0;
    }

    return duration_since_last;
  }

  public detectTimeStamp(
    linefordatecheck,
    metadata, // For debug // codecept_debug([__LINE__, compact("metadata")]);
  ) {
    metadata.lastKnownDate = this.lastKnownDate;

    if (!!metadata.date_raw) {
      metadata.date_raw_was_nonempty_before_detectTimeStamp = metadata.date_raw;
    }

    // codecept_debug([__LINE__, compact("detect_regex", "linefordatecheck", "m")]);
    for (const supportedTimestampFormat of Object.values(
      this.supportedTimestampFormats(),
    )) {
      // The most straight-forward date format
      const format = supportedTimestampFormat.format;
      const detect_regex = supportedTimestampFormat.detect_regex;
      const accept_approx_token_instead_of_minutes =
        supportedTimestampFormat.accept_approx_token_instead_of_minutes;
      const detect_regex_date_raw_match_index =
        supportedTimestampFormat.detect_regex_date_raw_match_index;
      const detect_regex_time_raw_match_index =
        supportedTimestampFormat.detect_regex_time_raw_match_index;
      preg_match_all(detect_regex, linefordatecheck, m);

      if (!!m && !!m[0]) {
        // var_dump($line, $m);
        if (this.collectDebugInfo) {
          metadata["date_search_preg_debug:" + format] = {
            linefordatecheck,
            m,
          };
        }

        metadata.date_raw_format = format;
        metadata.log.push(`Found a supported timestamp ('${format}')`);

        if (!is_null(detect_regex_date_raw_match_index)) {
          metadata.date_raw = m[detect_regex_date_raw_match_index][0];
        }

        if (!is_null(detect_regex_time_raw_match_index)) {
          // If this is a format with only time detection, we use the raw time as the raw date
          metadata.time_raw = m[detect_regex_time_raw_match_index][0];

          if (is_null(detect_regex_date_raw_match_index)) {
            metadata.date_raw = metadata.time_raw;
          }

          if (accept_approx_token_instead_of_minutes) {
            // In case we entered "approx" instead of minutes, shotgun to the exact hour change:
            if (
              this.startsWithOptionallySuffixedToken(
                metadata.time_raw,
                "approx",
              )
            ) {
              metadata.date_raw_with_approx_token_instead_of_minutes =
                metadata.date_raw;
              const tokens = this.tokens();
              metadata.date_raw = str_replace(
                tokens.approx,
                "00",
                metadata.date_raw,
              );
            }
          }
        } else {
          metadata.time_raw = false;
        }

        return;
      } else {
        if (this.collectDebugInfo) {
          metadata["date_search_preg_debug:" + format] = compact(
            "linefordatecheck",
            "m",
          );
        }
      }
    }

    metadata.log.push("Did not find a supported timestamp");
    metadata.date_raw = false;
    metadata.time_raw = false;
    metadata.date_raw_format = false;
  }

  public set_ts_and_date(date_raw, ts, date, linewithoutdate, datetime) {
    this.lastSetTsAndDateErrorMessage = "";
    date_raw = str_replace(["maj", "okt"], ["may", "oct"], date_raw).trim();

    try {
      const timeZone = this.interpretLastKnownTimeZone();
      ts = this.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
        date_raw,
        timeZone,
        datetime,
      );
      this.lastUsedTimeZone = timeZone;
    } catch (e) {
      if (e instanceof InvalidDateTimeZoneException) {
        // If invalid timezone is encountered, use UTC and at least detect the timestamp correctly, but make a note about that the wrong timezone was used
        ts = this.parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
          date_raw,
          "UTC",
          datetime,
        );
        this.lastSetTsAndDateErrorMessage = e.getMessage();
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
    // TODO: Possibly restore this, but then based on date_raw lacking time-information instead of the parsed date object having time at midnight
    // if (date("H:i:s", $ts) == "00:00:00") $midnightoffset = 0; // do not offset when we didn't specify a specific time (yes this takes 00:00-reported times as well - but I can live with that!)
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
  }

  public interpretLastKnownTimeZone() {
    const interpretationMap = {
      "GMT-6": "-06:00",
      "UTC-6": "-06:00",
      "UTC-06": "-06:00",
      Orlando: "America/New_York",
      "Las Vegas/GMT-8": "-08:00",
      "Austin/GMT-6": "-06:00",
      "US/San Francisco": "America/Los_Angeles",
    };

    if (undefined !== interpretationMap[this.lastKnownTimeZone]) {
      return interpretationMap[this.lastKnownTimeZone];
    }

    return this.lastKnownTimeZone;
  }

  public parseGmtTimestampFromDateSpecifiedInSpecificTimezone(
    str,
    timezone,
    datetime = undefined, // TODO: Remove expectation of string
  ) {
    let gmt_timestamp;

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
      // var_dump(compact("str","gmt_timestamp"), strtotime($str));
      // die();
      gmt_timestamp = 0;
    } else {
      const gmt_datetime = clone(datetime);
      gmt_datetime.setTimezone(new DateTimeZone("UTC"));
      gmt_timestamp = gmt_datetime.getTimestamp();
    }

    return String(gmt_timestamp);
  }
}

class InvalidDateTimeZoneException extends Error {}
