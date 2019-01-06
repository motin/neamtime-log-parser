import { str_replace, strpos } from "locutus/php/strings";
import { is_null } from "locutus/php/var";
import { LogParser } from "./LogParser";
import { DateTime } from "./php-wrappers";

export interface DetectTimeStampMetadata {
  timeRaw?: string | false;
  lastKnownDate?: string;
  dateRaw?: string | false;
  dateRawFormat?: string | false;
  dateRawWasNonemptyBeforeDetectTimestamp?: string;
  dateRawWithApproxTokenInsteadOfMinutes?: string | false;
  log?: string[];
  timeZoneRaw?: string | false;
}

export interface ParsedLogComment {
  dateRaw: string;
  ts: number;
  date: string;
  lineWithoutDate: string;
  notTheFirstRowOfALogComment: boolean;
  datetime: DateTime;
}

export class TimeLogParser extends LogParser {
  public lastParseLogCommentErrorMessage;
  public lastInterpretTsAndDateErrorMessage;
  private collectDebugInfo;

  constructor() {
    super();
    this.lastParseLogCommentErrorMessage = "";
    this.lastInterpretTsAndDateErrorMessage = "";
  }

  public tokens() {
    return {
      approx: ["ca", "appr"],
      pause: ["pause", "paus"],
      start: ["start"],
      "start-stop": ["start", "stop"],
    };
  }

  public startsWithOptionallySuffixedToken(haystack, keyword, suffix = "") {
    const tokens = this.tokens();

    for (const token of Object.values(tokens[keyword])) {
      if (strpos(haystack.trim(), token + suffix) === 0) {
        return token;
      }
    }

    return false;
  }

  public removeSuffixedToken(str, keyword, suffix) {
    let forReturn = str;
    const tokens = this.tokens();

    for (const token of Object.values(tokens[keyword])) {
      forReturn = str_replace(token + suffix, "", forReturn);
    }

    return forReturn;
  }

  public isProbableStartStopLine(line) {
    const trimmedLine = line.trim();
    const startsWithPauseTokenFollowedByASpace = this.startsWithOptionallySuffixedToken(
      trimmedLine,
      "pause",
      " ",
    );
    const startsWithStartStopTokenFollowedByASpace = this.startsWithOptionallySuffixedToken(
      trimmedLine,
      "start-stop",
      " ",
    );
    const startsWithPauseTokenFollowedByAnArrow = this.startsWithOptionallySuffixedToken(
      trimmedLine,
      "pause",
      "->",
    );
    const startsWithStartStopTokenFollowedByAnArrow = this.startsWithOptionallySuffixedToken(
      trimmedLine,
      "start-stop",
      "->",
    );
    const forReturn =
      (startsWithPauseTokenFollowedByASpace ||
        startsWithStartStopTokenFollowedByASpace ||
        startsWithPauseTokenFollowedByAnArrow ||
        startsWithStartStopTokenFollowedByAnArrow ||
        false) &&
      strpos(trimmedLine, "[") !== 0 &&
      strpos(trimmedLine, "_start") === false &&
      strpos(trimmedLine, "_pause") === false &&
      strpos(trimmedLine, " | ") === false &&
      !this.isProbableCommitLogLine(trimmedLine) &&
      strpos(trimmedLine, "#") !== 0 &&
      true;

    // console.debug("{trimmedLine}", {trimmedLine}, /*str_hex(trimmedLine),*/ forReturn);

    return forReturn;
  }

  public isProbableCommitLogLine(line) {
    const trimmedLine = line.trim();
    return (
      strpos(trimmedLine, "+ ") === 0 ||
      strpos(trimmedLine, "* ") === 0 ||
      strpos(trimmedLine, "^ ") === 0 ||
      strpos(trimmedLine, "! ") === 0
    );
  }

  public detectTimeStamp(lineForDateCheck) {
    const metadata: DetectTimeStampMetadata = {
      log: [],
    };
    metadata.lastKnownDate = this.lastKnownDate;

    if (metadata.dateRaw) {
      metadata.dateRawWasNonemptyBeforeDetectTimestamp = metadata.dateRaw;
    }

    for (const supportedTimestampFormat of Object.values(
      this.supportedTimestampFormats(),
    )) {
      // The most straight-forward date format
      const {
        acceptApproxTokenInsteadOfMinutes,
        detectRegex,
        detectRegexDateRawMatchIndex,
        detectRegexTimeRawMatchIndex,
        detectRegexTimeZoneRawMatchIndex,
        format,
      } = supportedTimestampFormat;

      // TODO: Try case-insensitive flag as well: g -> ig

      const regexp = new RegExp(detectRegex, "g");

      const m: RegExpExecArray = regexp.exec(lineForDateCheck);
      /*
      TODO: If multiple matches is necessary to detect - use below instead
      const m = [];
      let currentMatchArray: RegExpExecArray;
      while ((currentMatchArray = regexp.exec(lineForDateCheck)) !== null) {
        m.push(currentMatchArray);
      }
      */

      // console.debug("{detectRegex, lineForDateCheck, m, regexp}", {detectRegex, lineForDateCheck, m, regexp});

      if (m) {
        // console.debug("MATCHED: {lineForDateCheck, m}", {lineForDateCheck, m});
        if (this.collectDebugInfo) {
          metadata["date_search_preg_debug:" + format] = {
            lineForDateCheck,
            m,
          };
        }

        metadata.dateRawFormat = format;
        metadata.log.push(`Found a supported timestamp ('${format}')`);

        if (!is_null(detectRegexDateRawMatchIndex)) {
          metadata.dateRaw = m[detectRegexDateRawMatchIndex];
        }

        metadata.timeZoneRaw = !is_null(detectRegexTimeZoneRawMatchIndex)
          ? m[detectRegexTimeZoneRawMatchIndex]
          : false;

        if (!is_null(detectRegexTimeRawMatchIndex)) {
          metadata.timeRaw = m[detectRegexTimeRawMatchIndex];

          // If this is a format with only time detection, we use the raw time as the raw date
          if (is_null(detectRegexDateRawMatchIndex)) {
            metadata.dateRaw = metadata.timeRaw;
          }

          if (acceptApproxTokenInsteadOfMinutes) {
            // In case we entered "approx" instead of minutes, shotgun to the exact hour change:
            if (
              this.startsWithOptionallySuffixedToken(metadata.timeRaw, "approx")
            ) {
              metadata.dateRawWithApproxTokenInsteadOfMinutes =
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

        return { metadata };
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
    metadata.dateRawFormat = false;
    metadata.dateRaw = false;
    metadata.timeRaw = false;
    metadata.timeZoneRaw = false;
    return { metadata };
  }

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

  public interpretTsAndDate(
    dateRaw,
    formatToUse,
  ): { ts: number; date?: string; datetime?: DateTime } {
    // console.debug("TimeLogParser.interpretTsAndDate - { dateRaw }", {dateRaw});
    this.lastInterpretTsAndDateErrorMessage = "";

    const errorReturn = {
      ts: 0,
    };

    if (dateRaw === false) {
      this.lastInterpretTsAndDateErrorMessage = "Found no timestamp to parse";
      return errorReturn;
    }

    // Invalidate strings that are clearly too large to be a timestamp
    if (dateRaw.length > 50) {
      this.lastInterpretTsAndDateErrorMessage =
        "Invalidate strings that are clearly too large to be a timestamp";
      return errorReturn;
    }

    const m = dateRaw.match(/[0-9]+/g);

    if (!m) {
      this.lastInterpretTsAndDateErrorMessage =
        "Invalidate strings that do not contain numbers, since they can not be a timestamp";
      return errorReturn;
    }

    if (dateRaw.length < 8) {
      dateRaw = this.lastKnownDate + ` ${dateRaw}`;
      if (formatToUse) {
        formatToUse = "Y-m-d " + formatToUse;
      }
    }

    const tokens = this.tokens();
    dateRaw = str_replace(tokens.approx, "", dateRaw).trim();
    const { date, datetime, ts } = this.setTsAndDate(dateRaw, formatToUse);

    return {
      date,
      datetime,
      ts,
    };
  }

  public parseLogComment(line): ParsedLogComment {
    let parsedLogComment: ParsedLogComment;

    // "," is the main separator between date and any written comment...
    parsedLogComment = this.parseLogCommentWithSeparator(",", line);

    if (!parsedLogComment.notTheFirstRowOfALogComment) {
      return parsedLogComment;
    }

    parsedLogComment = this.parseLogCommentWithSeparator(" -", line);

    if (!parsedLogComment.notTheFirstRowOfALogComment) {
      return parsedLogComment;
    }

    parsedLogComment = this.parseLogCommentWithSeparator(": ", line);

    return parsedLogComment;
  }

  public parseLogCommentWithSeparator(separator, line): ParsedLogComment {
    // Check if we have a valid date already
    const parts = line.split(separator);
    let dateRaw = parts.shift();
    let lineWithoutDate = parts.join(separator);
    let parsedLogComment: ParsedLogComment = this.parseLogCommentDateRawCandidate(
      dateRaw,
      lineWithoutDate,
    );

    // If not, allow one more separated chunk into the dateRaw and try again
    // since some timestamp formats may include the seperator (at most once)
    if (parsedLogComment.notTheFirstRowOfALogComment && parts.length > 1) {
      dateRaw += separator + parts.shift();
      lineWithoutDate = parts.join(separator);
      parsedLogComment = this.parseLogCommentDateRawCandidate(
        dateRaw,
        lineWithoutDate,
      );
    }

    return parsedLogComment;
  }

  public parseLogCommentDateRawCandidate(
    dateRaw,
    lineWithoutDate,
  ): ParsedLogComment {
    let notTheFirstRowOfALogComment;

    const m = dateRaw.match(/[0-9\.\,]+/);

    // Invalidate lines without any number or comma or period at all
    if (!m) {
      notTheFirstRowOfALogComment = true;
      this.lastParseLogCommentErrorMessage =
        "Invalidate lines without any number or comma or period at all";
      return {
        date: null,
        dateRaw,
        datetime: null,
        lineWithoutDate,
        notTheFirstRowOfALogComment,
        ts: 0,
      };
    }

    // Invalidate pure numbers (including those with fractional parts) if there is no comment on the other side - probably not a real log comment
    if (m[0]) {
      const firstMatch = m[0];
      const trimmedDateRaw = dateRaw.trim();

      if (
        str_replace([".", ","], "", firstMatch) ===
          str_replace([".", ","], "", trimmedDateRaw) &&
        !lineWithoutDate.trim()
      ) {
        // Due to some odd logic in some other file, we also can't set ts and date for this row
        notTheFirstRowOfALogComment = true;
        this.lastParseLogCommentErrorMessage =
          "Invalidate pure numbers (including those with fractional parts) if there is no comment on the other side - probably not a real log comment";
        return {
          date: null,
          dateRaw,
          datetime: null,
          lineWithoutDate,
          notTheFirstRowOfALogComment,
          ts: 0,
        };
      }
    }

    // Detect and set any timestamp found in this dateRaw candidate
    const { metadata } = this.detectTimeStamp(dateRaw);
    const { date, datetime, ts } = this.interpretTsAndDate(
      dateRaw,
      metadata.dateRawFormat,
    );

    // invalidate lines without a valid date
    notTheFirstRowOfALogComment = !date;

    return {
      date,
      dateRaw,
      datetime,
      lineWithoutDate,
      notTheFirstRowOfALogComment,
      ts,
    };
  }
}
