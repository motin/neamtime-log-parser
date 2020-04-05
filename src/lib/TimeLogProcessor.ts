import { addSeconds, eachDayOfInterval, subMinutes } from "date-fns";
import {
  str_replace,
  strpos,
  trim /*, array_count_values, arsort */,
} from "locutus/php/strings";
import { TimeLogParsingException } from "./exceptions/TimeLogParsingException";
import {
  linesArrayIntoText,
  LogParser,
  newlineConvert,
  textIntoLinesArray,
  tsIsTooOld,
} from "./LogParser";
import {
  cloneVariable,
  DateTime,
  DateTimeZone,
  // mb_strlen,
  mb_substr,
} from "./php-wrappers";
// import { str_hex, str_word_count_utf8, utf8_decode } from "./string-utils";
import { DetectTimeStampMetadata, TimeLogParser } from "./TimeLogParser";

export interface TimeLogSession {
  timeReportSourceComments: TimeReportSourceComment[];
  tzFirst: string;
  metadata: TimeLogMetadata;
  k: any;
  start: any;
}

export interface RowMetadata {
  date: any;
  dateRaw: any;
  formattedUtcDate: string;
  lastInterpretTsAndDateErrorMessage: string;
  lastKnownTimeZone: string;
  lastParseLogCommentErrorMessage: string;
  lastSetTsAndDateErrorClass: string;
  lastSetTsAndDateErrorMessage: string;
  lastUsedTimeZone: string;
  line: string;
  lineWithComment: string;
  log: string[];
  parseLogCommentDetectTimeStampMetadata: DetectTimeStampMetadata;
  preprocessedContentsSourceLineIndex: number;
  rowsWithTimeMarkersHandled: number;
  sourceLine: number;
  ts: number;
  // TODO: Possibly split into separate child interface
  tsIsFaked?: boolean;
  highlightWithNewlines?: boolean;
  pauseDuration?: number;
  durationSinceLast?: number;
}

export interface TimeReportSourceComment {
  category: string;
  date: string;
  dateRaw: string;
  hours: any;
  hoursRounded: any;
  lineWithoutDate: string;
  text: string;
  ts: number;
  tz: string;
}

export interface TimeLogEntryWithMetadata extends TimeReportSourceComment {
  gmtTimestamp: string; // Not a unix timestamp, but a UTC-based datetime string timestamp
  sessionMeta: {
    session_ref: string;
    tzFirst: string;
  };
}

export interface TimeLogMetadata {
  error?: string;
  hoursLeadTime?: number;
  hoursTotal?: number;
  lastTs?: number;
  name?: string;
  nonHours?: number;
  startTs?: number;
}

export interface TimeReportExportEntry {
  activities: string;
  date: string;
  hoursByCategory: { [k: string]: string };
  hoursByCategoryRounded: { [k: string]: number };
}

// Since date-fns can not handle UTC dates
function eachDayOfIntervalUTC(dirtyInterval, dirtyOptions = null) {
  const borkyDates = eachDayOfInterval(dirtyInterval, dirtyOptions);
  const dates = borkyDates.map(date => {
    return subMinutes(date, date.getTimezoneOffset());
  });
  // console.debug({ borkyDates, dates });
  return dates;
}

export class TimeLogProcessor {
  // Main contents holders
  public tzFirst: string;
  public contents: string = "";
  public preProcessedContents: string = "";
  public contentsWithTimeMarkers: string = "";
  public timeReportExportData: TimeReportExportEntry[];
  public timeReportCsv: string = "";
  public timeReportData: { [k: string]: any } = {};
  public timeReportDataWithNullFilledIntermediateDates: {
    [k: string]: any;
  } = {};
  public sessionStarts: RowMetadata[] = [];
  public sessions: TimeLogSession[] = [];
  public categories: string[] = [];
  public timeReportSourceComments: TimeReportSourceComment[] = [];
  public metadataGenerateTimeReport: {
    firstDateFound: any;
    lastDateFound: any;
  };

  // Metadata arrays
  public notParsedAddTimeMarkersParsePreProcessedContents: RowMetadata[] = [];
  public notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput: RowMetadata[] = [];
  public notParsedTimeReport: string[] = [];
  public rowsWithTimeMarkers: RowMetadata[] = [];
  public readonly preProcessedContentsSourceLineContentsSourceLineMap: any = {};
  public debugOriginalUnsortedRows?: RowMetadata[] = [];

  // State / tmp
  private rowsWithTimeMarkersHandled;

  // The time log parser does a lot of the heavy lifting
  private timeLogParser: TimeLogParser;

  // Misc
  private readonly collectDebugInfo: boolean = true; // Enable temporarily during development only

  // Probably unused / abandoned already in PHP era:
  // private reservedWords;
  // var $notParsedAndNotStartStopLinesTimeReport = array();

  constructor() {
    this.timeLogParser = new TimeLogParser();
    // this.reservedWords = [      "accessible",      "add",      "all",      "alter",      "analyze",      "and",      "as",      "asc",      "asensitive",      "before",      "between",      "bigint",      "binary",      "blob",      "both",      "by",      "call",      "cascade",      "case",      "change",      "char",      "character",      "check",      "collate",      "column",      "condition",      "connection",      "constraint",      "continue",      "convert",      "create",      "cross",      "current_date",      "current_time",      "current_timestamp",      "current_user",      "cursor",      "database",      "databases",      "day_hour",      "day_microsecond",      "day_minute",      "day_second",      "dec",      "decimal",      "declare",      "default",      "delayed",      "delete",      "desc",      "describe",      "deterministic",      "distinct",      "distinctrow",      "div",      "double",      "drop",      "dual",      "each",      "else",      "elseif",      "enclosed",      "escaped",      "exists",      "exit",      "explain",      "false",      "fetch",      "float",      "float4",      "float8",      "for",      "force",      "foreign",      "from",      "fulltext",      "goto",      "grant",      "group",      "having",      "high_priority",      "hour_microsecond",      "hour_minute",      "hour_second",      "if",      "ignore",      "in",      "index",      "infile",      "inner",      "inout",      "insensitive",      "insert",      "int",      "int1",      "int2",      "int3",      "int4",      "int8",      "integer",      "interval",      "into",      "is",      "iterate",      "join",      "key",      "keys",      "kill",      "label",      "leading",      "leave",      "left",      "like",      "limit",      "linear",      "lines",      "load",      "localtime",      "localtimestamp",      "lock",      "long",      "longblob",      "longtext",      "loop",      "low_priority",      "master_ssl_verify_server_cert",      "match",      "mediumblob",      "mediumint",      "mediumtext",      "middleint",      "minute_microsecond",      "minute_second",      "mod",      "modifies",      "natural",      "no_write_to_binlog",      "not",      "null",      "numeric",      "on",      "optimize",      "option",      "optionally",      "or",      "order",      "out",      "outer",      "outfile",      "precision",      "primary",      "procedure",      "purge",      "range",      "read",      "read_only",      "read_write",      "reads",      "real",      "references",      "regexp",      "release",      "rename",      "repeat",      "replace",      "require",      "reserved",      "restrict",      "return",      "revoke",      "right",      "rlike",      "schema",      "schemas",      "second_microsecond",      "select",      "sensitive",      "separator",      "set",      "show",      "smallint",      "spatial",      "specific",      "sql",      "sql_big_result",      "sql_calc_found_rows",      "sql_small_result",      "sqlexception",      "sqlstate",      "sqlwarning",      "ssl",      "starting",      "straight_join",      "table",      "terminated",      "then",      "tinyblob",      "tinyint",      "tinytext",      "to",      "trailing",      "trigger",      "true",      "undo",      "union",      "unique",      "unlock",      "unsigned",      "update",      "upgrade",      "usage",      "use",      "using",      "utc_date",      "utc_time",      "utc_timestamp",      "values",      "varbinary",      "varchar",      "varcharacter",      "varying",      "when",      "where",      "while",      "with",      "write",      "xor",      "year_month",      "zerofill",      "__class__",      "__compiler_halt_offset__",      "__dir__",      "__file__",      "__function__",      "__method__",      "__namespace__",      "abday_1",      "abday_2",      "abday_3",      "abday_4",      "abday_5",      "abday_6",      "abday_7",      "abmon_1",      "abmon_10",      "abmon_11",      "abmon_12",      "abmon_2",      "abmon_3",      "abmon_4",      "abmon_5",      "abmon_6",      "abmon_7",      "abmon_8",      "abmon_9",      "abstract",      "alt_digits",      "am_str",      "array",      "assert_active",      "assert_bail",      "assert_callback",      "assert_quiet_eval",      "assert_warning",      "break",      "case_lower",      "case_upper",      "catch",      "cfunction",      "char_max",      "class",      "clone",      "codeset",      "connection_aborted",      "connection_normal",      "connection_timeout",      "const",      "count_normal",      "count_recursive",      "credits_all",      "credits_docs",      "credits_fullpage",      "credits_general",      "credits_group",      "credits_modules",      "credits_qa",      "credits_sapi",      "crncystr",      "crypt_blowfish",      "crypt_ext_des",      "crypt_md5",      "crypt_salt_length",      "crypt_std_des",      "currency_symbol",      "d_fmt",      "d_t_fmt",      "day_1",      "day_2",      "day_3",      "day_4",      "day_5",      "day_6",      "day_7",      "decimal_point",      "default_include_path",      "die",      "directory_separator",      "do",      "e_all",      "e_compile_error",      "e_compile_warning",      "e_core_error",      "e_core_warning",      "e_deprecated",      "e_error",      "e_notice",      "e_parse",      "e_strict",      "e_user_deprecated",      "e_user_error",      "e_user_notice",      "e_user_warning",      "e_warning",      "echo",      "empty",      "enddeclare",      "endfor",      "endforeach",      "endif",      "endswitch",      "endwhile",      "ent_compat",      "ent_noquotes",      "ent_quotes",      "era",      "era_d_fmt",      "era_d_t_fmt",      "era_t_fmt",      "era_year",      "eval",      "extends",      "extr_if_exists",      "extr_overwrite",      "extr_prefix_all",      "extr_prefix_if_exists",      "extr_prefix_invalid",      "extr_prefix_same",      "extr_skip",      "final",      "foreach",      "frac_digits",      "function",      "global",      "grouping",      "html_entities",      "html_specialchars",      "implements",      "include",      "include_once",      "info_all",      "info_configuration",      "info_credits",      "info_environment",      "info_general",      "info_license",      "info_modules",      "info_variables",      "ini_all",      "ini_perdir",      "ini_system",      "ini_user",      "instanceof",      "int_curr_symbol",      "int_frac_digits",      "interface",      "isset",      "lc_all",      "lc_collate",      "lc_ctype",      "lc_messages",      "lc_monetary",      "lc_numeric",      "lc_time",      "list",      "lock_ex",      "lock_nb",      "lock_sh",      "lock_un",      "log_alert",      "log_auth",      "log_authpriv",      "log_cons",      "log_crit",      "log_cron",      "log_daemon",      "log_debug",      "log_emerg",      "log_err",      "log_info",      "log_kern",      "log_local0",      "log_local1",      "log_local2",      "log_local3",      "log_local4",      "log_local5",      "log_local6",      "log_local7",      "log_lpr",      "log_mail",      "log_ndelay",      "log_news",      "log_notice",      "log_nowait",      "log_odelay",      "log_perror",      "log_pid",      "log_syslog",      "log_user",      "log_uucp",      "log_warning",      "m_1_pi",      "m_2_pi",      "m_2_sqrtpi",      "m_e",      "m_ln10",      "m_ln2",      "m_log10e",      "m_log2e",      "m_pi",      "m_pi_2",      "m_pi_4",      "m_sqrt1_2",      "m_sqrt2",      "mon_1",      "mon_10",      "mon_11",      "mon_12",      "mon_2",      "mon_3",      "mon_4",      "mon_5",      "mon_6",      "mon_7",      "mon_8",      "mon_9",      "mon_decimal_point",      "mon_grouping",      "mon_thousands_sep",      "n_cs_precedes",      "n_sep_by_space",      "n_sign_posn",      "namespace",      "negative_sign",      "new",      "noexpr",      "nostr",      "old_function",      "p_cs_precedes",      "p_sep_by_space",      "p_sign_posn",      "path_separator",      "pathinfo_basename",      "pathinfo_dirname",      "pathinfo_extension",      "pear_extension_dir",      "pear_install_dir",      "php_bindir",      "php_config_file_path",      "php_config_file_scan_dir",      "php_datadir",      "php_debug",      "php_eol",      "php_extension_dir",      "php_extra_version",      "php_int_max",      "php_int_size",      "php_libdir",      "php_localstatedir",      "php_major_version",      "php_maxpathlen",      "php_minor_version",      "php_os",      "php_output_handler_cont",      "php_output_handler_end",      "php_output_handler_start",      "php_prefix",      "php_release_version",      "php_sapi",      "php_shlib_suffix",      "php_sysconfdir",      "php_version",      "php_version_id",      "php_windows_nt_domain_controller",      "php_windows_nt_server",      "php_windows_nt_workstation",      "php_windows_version_build",      "php_windows_version_major",      "php_windows_version_minor",      "php_windows_version_platform",      "php_windows_version_producttype",      "php_windows_version_sp_major",      "php_windows_version_sp_minor",      "php_windows_version_suitemask",      "php_zts",      "pm_str",      "positive_sign",      "print",      "private",      "protected",      "public",      "radixchar",      "require_once",      "seek_cur",      "seek_end",      "seek_set",      "sort_asc",      "sort_desc",      "sort_numeric",      "sort_regular",      "sort_string",      "static",      "str_pad_both",      "str_pad_left",      "str_pad_right",      "switch",      "t_fmt",      "t_fmt_ampm",      "thousands_sep",      "thousep",      "throw",      "try",      "unset",      "var",      "yesexpr",      "yesstr",      "commit",      "start",    ];
  }

  public addTimeMarkers() {
    this.timeLogParser.lastKnownTimeZone = this.tzFirst;
    this.preProcessContents();

    // Sets this.rowsWithTimeMarkers
    this.parsePreProcessedContents(this.preProcessedContents);

    // Uses this.rowsWithTimeMarkers to generate a textual representation of the parsed rows
    this.contentsWithTimeMarkers = this.generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
      this.rowsWithTimeMarkers,
    );
  }

  public notParsedAddTimeMarkersErrorSummary() {
    if (
      !this.notParsedAddTimeMarkersParsePreProcessedContents &&
      !this.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput
    ) {
      throw new TimeLogParsingException(
        "Can not summarize not-parsed errors without any unparsed contents",
      );
    }

    const summary = [];

    for (const v of Object.values(
      this.notParsedAddTimeMarkersParsePreProcessedContents,
    )) {
      if (v && v.sourceLine) {
        summary.push(v);
      } else {
        throw new TimeLogParsingException(
          "The unparsed contents did not contain information about the source line",
          v,
        );
      }
    }

    for (const v of Object.values(
      this.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput,
    )) {
      if (v && v.sourceLine) {
        summary.push(v);
      } else {
        throw new TimeLogParsingException(
          "The unparsed contents did not contain information about the source line",
          v,
        );
      }
    }

    return summary;
  }

  public notParsedTimeReportErrorSummary() {
    if (!this.notParsedTimeReport) {
      throw new TimeLogParsingException(
        "Can not summarize not-parsed errors without any unparsed contents",
      );
    }

    const summary = [];

    for (const v of Object.values(this.notParsedTimeReport)) {
      summary.push(v);
    }

    return summary;
  }

  public nonEmptyPreprocessedLines() {
    const lines: string[] = textIntoLinesArray(this.preProcessedContents);
    return lines.filter((line: string) => line.trim().length > 0);
  }

  public generateTimeReport(contentsWithTimeMarkers: string) {
    this.timeLogParser.lastKnownTimeZone = this.tzFirst;
    const times: { [k: string]: any } = {};

    if (this.categories.length === 0) {
      this.detectCategories(contentsWithTimeMarkers);
    }

    const lines: string[] = textIntoLinesArray(contentsWithTimeMarkers);
    let category = "Unspecified";

    for (const line of lines) {
      const trimmedLine = line.trim();

      // skip empty rows
      if (trimmedLine === "") {
        continue;
      }

      // Detect and switch category
      if (strpos(line, ".::") === 0) {
        const categoryNeedle = str_replace(".::", "", trimmedLine).trim();

        if (-1 !== this.categories.indexOf(categoryNeedle)) {
          category = categoryNeedle;
          continue;
        }
      }

      // skip all in the "Ignored" category
      if (category === "Ignored") {
        continue;
      }

      // Detect and switch timezone change
      if (strpos(trimmedLine, "|tz:") === 0) {
        this.timeLogParser.lastKnownTimeZone = str_replace(
          "|tz:",
          "",
          trimmedLine,
        );
        continue;
      }

      // DATETIME
      let parts = line.split(",");
      const dateRaw = parts.shift();
      const lineWithoutDate = parts.join(",");

      // Special care is necessary here - ts is already in UTC, so we parse it as such, but we keep
      // lastKnownTimeZone since we want to know the source row's timezone
      const _ = this.timeLogParser.lastKnownTimeZone
        ? cloneVariable(this.timeLogParser.lastKnownTimeZone)
        : undefined;
      this.timeLogParser.lastKnownTimeZone = "UTC";
      const { metadata } = this.timeLogParser.detectTimeStamp(dateRaw);
      const { ts, date /*, datetime*/ } = this.timeLogParser.interpretTsAndDate(
        dateRaw,
        metadata.dateRawFormat,
      );
      this.timeLogParser.lastKnownTimeZone = _;

      // Check for startstopline - they are not invalid, only ignored
      // Only check until first |
      parts = line.split(" | ");
      const beforeVertLine = parts[0];

      if (this.timeLogParser.isProbableStartStopLine(beforeVertLine)) {
        continue;
      }

      // invalidate
      let invalid =
        !date || strpos(lineWithoutDate, "min") === false || tsIsTooOld(ts);

      if (invalid) {
        this.notParsedTimeReport.push(line);
        continue;
      }

      // DURATION

      parts = lineWithoutDate.split("min");
      const tokens = this.timeLogParser.tokens();
      const duration = str_replace(tokens.approx, "", parts[0]).trim() + "min";
      const time = this.timeLogParser.durationToMinutes(duration);
      invalid = !time && time !== 0;

      // invalidate
      if (invalid) {
        this.notParsedTimeReport.push(line);
        continue;
      }

      // convert into hours
      const hoursRounded = Math.round((time / 60) * 100) / 100;
      const hours = time / 60;

      // TEXT
      /*const first =*/ parts.shift();
      let text = parts.join("min");
      invalid = !text;

      // console.debug("generateTimeReport - ", {date, invalid, line, metadata, text, time, ts});

      if (invalid) {
        text = "<empty log item>";
        // var_dump($first, $parts, $line); die();
        // this.notParsedTimeReport.push(line);continue;
      }

      if (!times[date]) {
        times[date] = {};
      }

      if (!times[date].text) {
        times[date].text = [];
      }

      times[date].text.push(trim(text, " ,\t\r\n"));

      if (!times[date][category]) {
        times[date][category] = hours;
      } else {
        times[date][category] += hours;
      }

      // Save a useful form of the time-marked rows that build up the hours-sum:
      const sourceComment: TimeReportSourceComment = {
        category,
        date,
        dateRaw,
        hours,
        hoursRounded,
        lineWithoutDate,
        text,
        // timeMarker,
        ts,
        tz: this.timeLogParser.lastKnownTimeZone,
      };
      this.timeReportSourceComments.push(sourceComment);
    }

    // console.debug("generateTimeReport - times object result", { times });

    this.metadataGenerateTimeReport = this.findFirstAndLastDates(times);

    // Fill out and sort the times-object

    this.timeReportData = times;
    this.timeReportDataWithNullFilledIntermediateDates = this.addNullFilledDates(
      times,
    );

    // console.debug("generateTimeReport - this.timeReportData", this.timeReportData,);

    // print this.timeReportData in a csv-format:

    this.timeReportExportData = this.generateTimeReportExportData();
    this.timeReportCsv = this.generateTimeReportCsv(this.timeReportExportData);
  }

  public addNullFilledDates(times): { [k: string]: any } {
    // console.debug("addNullFilledDates - { times }", { times });

    const { firstDateFound, lastDateFound } = this.findFirstAndLastDates(times);

    // console.debug("addNullFilledDates - { firstDateFound, lastDateFound }", { firstDateFound, lastDateFound });

    // Check if no times were found...
    if (!firstDateFound) {
      return {};
    }

    const timesWithNullFilledDates = this.addNullFilledDatesBetweenSpecificDates(
      times,
      firstDateFound,
      lastDateFound,
    );

    // console.debug("addNullFilledDates - { timesWithNullFilledDates }", { timesWithNullFilledDates });

    return timesWithNullFilledDates;
  }

  public findFirstAndLastDates(times: { [k: string]: any }) {
    // Find time span:
    let firstDateFound;
    let lastDateFound;
    const timezone = new DateTimeZone("UTC");

    for (const date of Object.keys(times)) {
      const dateWithoutTime = DateTime.createFromFormat(
        "Y-m-d H:i:s",
        date + " 00:00:00",
        timezone,
      );

      if (dateWithoutTime) {
        if (!firstDateFound) {
          firstDateFound = dateWithoutTime;
        }

        if (!lastDateFound) {
          lastDateFound = dateWithoutTime;
        }

        if (dateWithoutTime.getTimestamp() < firstDateFound.getTimestamp()) {
          firstDateFound = dateWithoutTime;
        }

        if (dateWithoutTime.getTimestamp() > lastDateFound.getTimestamp()) {
          lastDateFound = dateWithoutTime;
        }
      }
    }

    return {
      firstDateFound,
      lastDateFound,
    };
  }

  public addNullFilledDatesBetweenSpecificDates(
    timesArrayBeforePadding,
    fromDate: DateTime,
    toDate: DateTime,
  ) {
    const timezone = new DateTimeZone("UTC");

    const interval = {
      /* tslint:disable:object-literal-sort-keys */
      start: fromDate.getDate(),
      end: toDate.getDate(),
      /* tslint:enable:object-literal-sort-keys */
    };
    // console.debug("addNullFilledDatesBetweenSpecificDates - { timesArrayBeforePadding, interval, fromDate, toDate }", { timesArrayBeforePadding, interval, fromDate, toDate });

    const dates = eachDayOfIntervalUTC(interval);
    // console.debug({ dates });

    const timesWithNullFilledDates = {};

    for (const date of dates) {
      const dt = new DateTime(date, timezone);
      // console.debug({ dt });
      const xday = dt.format("Y-m-d");
      timesWithNullFilledDates[xday] =
        timesArrayBeforePadding[xday] !== undefined
          ? timesArrayBeforePadding[xday]
          : null;
    }

    return timesWithNullFilledDates;
  }

  public generateTimeReportExportData() {
    const timeReportExportData = [];
    for (const date of Object.keys(this.timeReportData)) {
      const hours = this.timeReportData[date];

      let activities;

      if (hours !== null) {
        activities = Array.from(hours.text).join(" | ");
        activities = newlineConvert(activities, "");
        activities = str_replace([";", "\t"], [",", "   "], activities);

        // Gotta limit the amount of data
        activities = mb_substr(activities, 0, 1024).trim();
      } else {
        activities = "";
      }

      //
      const hoursByCategoryRounded: { [k: string]: number } = {};

      for (const c of this.categories) {
        const hoursExact =
          hours !== null && undefined !== hours[c] ? hours[c] : 0;
        const hoursRounded = Math.round(hoursExact * 100) / 100;
        hoursByCategoryRounded[c] = hoursRounded;
      }

      // replace point by comma
      // $hours_by_category_rounded = str_replace(".", ",", $hours_by_category_rounded);

      const hoursByCategory: { [k: string]: string } = {};

      for (const c of this.categories) {
        const hoursExact =
          hours !== null && undefined !== hours[c] ? hours[c] : 0;
        const hoursExactFixed = hoursExact === 0 ? 0 : hoursExact.toFixed(15);
        hoursByCategory[c] = hoursExactFixed;

        // TMP - Mimic the same precision that PHP used to generate the fixture-csv:s
        // so that CSV comparisons pass until new CSV files are generated without this restriction
        /*
        const existingPrecision =
          hoursExact < 1
            ? hoursExact < 0.1
              ? -1
              : 0
            : parseInt(hoursExact, 10).toString.length;
        const precisionFactor = Math.pow(10, 14 - existingPrecision);
        const hoursLessExact = Math.round(hoursExact * precisionFactor) / precisionFactor;
        hoursByCategory += hoursLessExact+ ";";
        */
      }

      // replace point by comma
      // $hours_by_category = str_replace(".", ",", $hours_by_category);

      const timeReportExportEntry: TimeReportExportEntry = {
        activities,
        date,
        hoursByCategory,
        hoursByCategoryRounded,
      };

      timeReportExportData.push(timeReportExportEntry);
    }

    /*
    for (const line of Object.values(notParsed)) {
      // maybe attempt to add some debugging metadata here?
    }
    */

    return timeReportExportData;
  }

  public generateTimeReportCsv(timeReportExportData = null) {
    if (!timeReportExportData) {
      timeReportExportData = this.generateTimeReportExportData();
    }

    let timeReportCsv = "";

    timeReportCsv +=
      "Date;" +
      this.categories.join(" (rounded);") +
      " (rounded);" +
      this.categories.join(";") +
      ";Log_Items" +
      LogParser.NL_NIX;

    timeReportExportData.map((timeReportExportEntry: TimeReportExportEntry) => {
      timeReportCsv += timeReportExportEntry.date + ";";

      timeReportCsv +=
        this.categories
          .map(c => timeReportExportEntry.hoursByCategoryRounded[c])
          .join(";") + ";";
      timeReportCsv +=
        this.categories
          .map(c => timeReportExportEntry.hoursByCategory[c])
          .join(";") + ";";

      timeReportCsv += timeReportExportEntry.activities + LogParser.NL_NIX;
    });

    return timeReportCsv;
  }

  public getTimeLogMetadata(): TimeLogMetadata {
    // do {
    // } while (!$last["tsIsFaked"]);

    if (!this.contentsWithTimeMarkers) {
      return {};
    }

    if (!this.rowsWithTimeMarkers) {
      return {};
    }

    if (this.rowsWithTimeMarkers.length === 0) {
      return { error: "No time markers in log" };
    }

    const rowsWithTimeMarkers: RowMetadata[] = JSON.parse(
      JSON.stringify(this.rowsWithTimeMarkers),
    );
    const start = rowsWithTimeMarkers.shift();
    const startTs = start.ts;
    const name = start.dateRaw;
    const last = rowsWithTimeMarkers.pop();
    if (!last) {
      // console.debug("getTimeLogMetadata no last - rowsWithTimeMarkers, start", rowsWithTimeMarkers, start, this.sessionStarts,);
      return { error: "Not enough time markers in log" };
    }
    const lastTs = last.ts;
    const leadTime = lastTs - startTs;
    let hoursTotal = 0;

    for (const date of Object.keys(this.timeReportData)) {
      const time = this.timeReportData[date];
      for (const category of this.categories) {
        hoursTotal += time !== null ? time[category] : 0;
      }
    }

    const hoursLeadTime = Math.round((leadTime / 60 / 60) * 100) / 100;
    const nonHours = Math.round((hoursLeadTime - hoursTotal) * 100) / 100;
    return {
      hoursLeadTime,
      hoursTotal,
      lastTs,
      name,
      nonHours,
      startTs,
    };
  }

  public preProcessContents() {
    this.preProcessedContents = this.getPreProcessedContents(
      this.tzFirst,
      this.contents,
    );
  }

  public getPreProcessedContents(tzFirst, contents) {
    this.timeLogParser.lastKnownTimeZone = tzFirst;
    let processed = [];
    const rawLines = textIntoLinesArray(contents);
    let nextNeedToBeStart = true;

    // Phase 0 - skip lines after "#endts"
    const phase0ProcessedLines = [];
    for (const line of rawLines) {
      if (line.trim() === "#endts") {
        break;
      }

      phase0ProcessedLines.push(line);
    }

    // console.debug("{phase0ProcessedLines}", {phase0ProcessedLines});

    // Phase 1 - pause-fixes
    const phase1SourceLineContentsSourceLineMap = {};
    for (
      let sourceLineIndex = 0;
      sourceLineIndex < phase0ProcessedLines.length;
      sourceLineIndex++
    ) {
      const line = phase0ProcessedLines[sourceLineIndex];

      // Always use trimmed line for comparisons
      let trimmedLine = line.trim();

      // Actual source line is +1
      const sourceLine: number = sourceLineIndex + 1;

      if (!sourceLine || typeof sourceLine !== "number") {
        throw new TimeLogParsingException(
          "Encountered an invalid sourceLine variable in Phase 1",
          {
            phase0ProcessedLines,
            phase1SourceLineContentsSourceLineMap,
            sourceLine,
          },
        );
      }

      // Skip empty lines
      if (!trimmedLine || trimmedLine === "") {
        processed.push(trimmedLine);
        phase1SourceLineContentsSourceLineMap[processed.length] = sourceLine;
        continue;
      }

      // Convert typo "pause ->" to proper "pause->"
      let token = this.timeLogParser.startsWithOptionallySuffixedToken(
        trimmedLine,
        "pause",
        " ->",
      );
      if (token) {
        trimmedLine = str_replace(`${token} ->`, `${token}->`, trimmedLine);
      }

      token = this.timeLogParser.startsWithOptionallySuffixedToken(
        trimmedLine,
        "pause",
      );

      if (!!token && strpos(trimmedLine, "->") !== false) {
        // Checking if a timestamp exists before the "->"
        const rowParts = trimmedLine.split("->");
        const tokens = this.timeLogParser.tokens();
        let trimmedLineForDateCheck = str_replace(
          tokens.pause,
          "",
          rowParts[0].trim(),
        );
        trimmedLineForDateCheck = str_replace(
          tokens.approx,
          "",
          trimmedLineForDateCheck,
        );

        if (
          trimmedLineForDateCheck.length > 1 &&
          strpos(trimmedLineForDateCheck, "min") === false
        ) {
          const { metadata } = this.timeLogParser.detectTimeStamp(
            trimmedLineForDateCheck,
          );

          /*
          const { metadata } = this.timeLogParser.detectTimeStamp(dateRaw);
          const { ts, date, datetime } = this.timeLogParser.interpretTsAndDate(
            metadata.dateRaw,
            metadata.dateRawFormat,
          );
          // var_dump($metadata["dateRaw"], $trimmedLineForDateCheck, $ts, $date);
          // $invalid = empty($date);
          */

          if (metadata.dateRaw && metadata.dateRaw.trim() !== "") {
            // const formattedUtcDate = utcDateTime.format("Y-m-d H:i"); // :s
            const implicitMessage =
              trimmedLineForDateCheck + `, <just before ${token}>`;
            processed.push(implicitMessage);
            phase1SourceLineContentsSourceLineMap[
              processed.length
            ] = sourceLine;
            processed.push(`${token}->` + rowParts[1]);
            phase1SourceLineContentsSourceLineMap[
              processed.length
            ] = sourceLine;
            continue;
          }
        }
      }

      processed.push(trimmedLine);
      phase1SourceLineContentsSourceLineMap[processed.length] = sourceLine;
    }

    const phase1ProcessedLines: string[] = processed;

    // console.debug("{phase1ProcessedLines}", {phase1ProcessedLines});

    processed = [];

    // Phase 2 - missing start-lines
    for (
      let phase1ProcessedLineIndex = 0;
      phase1ProcessedLineIndex < phase1ProcessedLines.length;
      phase1ProcessedLineIndex++
    ) {
      const line = phase1ProcessedLines[phase1ProcessedLineIndex];

      // Always use trimmed line for comparisons
      const trimmedLine = line.trim();

      // Actual source line is +1
      const phase1ProcessedLine = phase1ProcessedLineIndex + 1;

      // Get raw source line
      const sourceLine =
        phase1SourceLineContentsSourceLineMap[phase1ProcessedLine];

      if (!sourceLine || typeof sourceLine !== "number") {
        throw new TimeLogParsingException(
          "Encountered an invalid sourceLine variable in Phase 2",
          {
            phase1ProcessedLine,
            phase1ProcessedLines,
            phase1SourceLineContentsSourceLineMap,
            sourceLine,
          },
        );
      }

      // Skip empty lines
      if (!trimmedLine || trimmedLine === "") {
        processed.push(trimmedLine);
        this.preProcessedContentsSourceLineContentsSourceLineMap[
          processed.length
        ] = sourceLine;
        continue;
      }

      // TODO: Use the timeLogParser.tokens().start array
      if (strpos(trimmedLine, "start") === 0) {
        nextNeedToBeStart = false;
      }

      if (nextNeedToBeStart) {
        const {
          /*
          ts,
          date,
          dateRaw,
          */
          datetime,
          lineWithoutDate,
          notTheFirstRowOfALogComment,
        } = this.timeLogParser.parseLogComment(trimmedLine);
        const trimmedLinewithoutdate = lineWithoutDate;

        if (!notTheFirstRowOfALogComment) {
          // A start row is missing, but we have a certain syntax that can
          // recover a missing start line, let's check for that:
          let preg = /^(ca|appr)? ?((\d)+h)?(\d+)min/; // todo dynamic insertion of apprtokens
          const m = trimmedLinewithoutdate.match(preg);

          let apprtoken;
          let hoursString;
          let minutesString;
          let foundADurationInFirstLine = false;

          if (!!m) {
            apprtoken = m[1];
            hoursString = m[3];
            minutesString = m[4];
            foundADurationInFirstLine = true;
          } else {
            // Check for hours without minutes as well
            preg = /^(ca|appr)? ?(\d)+h/; // todo dynamic insertion of apprtokens
            const m2 = trimmedLinewithoutdate.match(preg);

            if (!!m2) {
              apprtoken = m2[1];
              hoursString = m2[2];
              foundADurationInFirstLine = true;
            }
          }

          if (foundADurationInFirstLine) {
            // Here we, instead of start, have a single line with a duration. We can calculate the start from this...

            const hours =
              hoursString !== undefined ? parseInt(hoursString, 10) : 0;
            const minutes =
              minutesString !== undefined ? parseInt(minutesString, 10) : 0;

            const durationInMinutes = hours * 60 + minutes;

            // console.debug("getPreProcessedContents - {apprtoken, durationInMinutes, hours, minutes}", { apprtoken, durationInMinutes, hours, minutes },);

            if (!datetime) {
              throw new TimeLogParsingException(
                "To be able to calculate the special-syntax-missing-start-line we need to have the DateTime object of the line to subtract from",
              );
            }

            const probableStartDateTime = new DateTime(
              subMinutes(datetime.getDate(), durationInMinutes),
              datetime.getTimezone(),
            );
            const probableStart = probableStartDateTime.format("Y-m-d H:i"); // gmdate("Y-m-d H:i", $ts - $minutes * 60);
            // var_dump(__LINE__, $probableStart, $date, $minutes, $this->lastKnownTimeZone);

            // TODO: Also include timezone in the generated start-line (based on the first time marked line's last used timezone)
            processed.push(
              `start ${probableStart}` + (apprtoken ? apprtoken : ""),
            ); // note: timestamp generated from duration info in line below;
            this.preProcessedContentsSourceLineContentsSourceLineMap[
              processed.length
            ] = sourceLine;
            processed.push("");
            this.preProcessedContentsSourceLineContentsSourceLineMap[
              processed.length
            ] = sourceLine;
            processed.push(trimmedLine);
            this.preProcessedContentsSourceLineContentsSourceLineMap[
              processed.length
            ] = sourceLine;
            nextNeedToBeStart = false;
            // $processed[] = "start MISSING? asdasdas: ".$trimmedLinewithoutdate.print_r(array($trimmedLine, $dateRaw, $date, $trimmedLinewithoutdate, $notTheFirstRowOfALogComment), true).print_r($m, true);
            continue;
          }
        }

        if (strpos(trimmedLine, "#") === 0) {
          continue;
        }

        if (strpos(trimmedLine, "|tz:") === 0) {
          processed.push(trimmedLine);
          this.preProcessedContentsSourceLineContentsSourceLineMap[
            processed.length
          ] = sourceLine;
          nextNeedToBeStart = true;
          continue;
        }

        processed.push("start MISSING?");
        this.preProcessedContentsSourceLineContentsSourceLineMap[
          processed.length
        ] = sourceLine;
        nextNeedToBeStart = false;
      }

      const token = this.timeLogParser.startsWithOptionallySuffixedToken(
        trimmedLine + "|$",
        "pause",
        "->|$",
      );

      if (token) {
        processed.push(trimmedLine);
        this.preProcessedContentsSourceLineContentsSourceLineMap[
          processed.length
        ] = sourceLine;
        nextNeedToBeStart = true;
        continue;
      }

      processed.push(trimmedLine);
      this.preProcessedContentsSourceLineContentsSourceLineMap[
        processed.length
      ] = sourceLine;
    }

    const phase2ProcessedLines: string[] = processed;

    // console.debug("{phase2ProcessedLines}", {phase2ProcessedLines});

    return linesArrayIntoText(phase2ProcessedLines);
  }

  /**
   * Note: Public only to allow for testing this endpoint specifically
   * @param preProcessedContents
   */
  public parsePreProcessedContents(preProcessedContents: string) {
    this.rowsWithTimeMarkersHandled = 0;
    const lines = textIntoLinesArray(preProcessedContents);

    for (
      let preprocessedContentsSourceLineIndex = 0;
      preprocessedContentsSourceLineIndex < lines.length;
      preprocessedContentsSourceLineIndex++
    ) {
      const preprocessedContentsSourceLine =
        lines[preprocessedContentsSourceLineIndex];
      const trimmedLine = preprocessedContentsSourceLine.trim();

      // Actual source line is +1
      const preprocessedContentsSourceLineRow =
        preprocessedContentsSourceLineIndex + 1;

      // Skip empty rows
      if (trimmedLine === "") {
        continue;
      }

      // Get raw contents source line
      const sourceLine = this
        .preProcessedContentsSourceLineContentsSourceLineMap[
        preprocessedContentsSourceLineRow
      ];

      // Detect and switch timezone change
      if (strpos(trimmedLine, "|tz:") === 0) {
        this.timeLogParser.lastKnownTimeZone = str_replace(
          "|tz:",
          "",
          trimmedLine,
        );
        continue;
      }

      // Remove any comments at the end before datecheck
      const lineWithComment = cloneVariable(trimmedLine);
      const trimmedLineWithoutComment = trimmedLine.replace(/#.*/g, "").trim();

      // Remove whitespace noise
      const trimmedLineWithoutCommentAndWhiteSpaceNoise = newlineConvert(
        trimmedLineWithoutComment,
        "",
      );

      // Parse the log comment. Will successfullt set ts and date etc if it is an ordinary log comment (not a start/stop/pause line)
      const {
        ts,
        date,
        dateRaw,
        // datetime,
        // lineWithoutDate,
        notTheFirstRowOfALogComment,
        parseLogCommentDetectTimeStampMetadata,
      } = this.timeLogParser.parseLogComment(
        trimmedLineWithoutCommentAndWhiteSpaceNoise,
      );

      // trimmedLineWithoutCommentAndWhiteSpaceNoise = utf8_encode(trimmedLineWithoutCommentAndWhiteSpaceNoise);

      // Use UTC dates
      const utcDateTime = DateTime.createFromUnixTimestamp(
        ts,
      ).cloneWithAnotherTimezone(new DateTimeZone("UTC"));
      const formattedUtcDate = utcDateTime.format("Y-m-d H:i"); // :s

      const log = [];

      const lastKnownTimeZone = cloneVariable(
        this.timeLogParser.lastKnownTimeZone,
      );
      const lastUsedTimeZone = cloneVariable(
        this.timeLogParser.lastUsedTimeZone,
      );
      const lastSetTsAndDateErrorClass = cloneVariable(
        this.timeLogParser.lastSetTsAndDateErrorClass,
      );
      const lastSetTsAndDateErrorMessage = cloneVariable(
        this.timeLogParser.lastSetTsAndDateErrorMessage,
      );
      const lastInterpretTsAndDateErrorMessage = cloneVariable(
        this.timeLogParser.lastInterpretTsAndDateErrorMessage,
      );
      const lastParseLogCommentErrorMessage = cloneVariable(
        this.timeLogParser.lastParseLogCommentErrorMessage,
      );

      const metadata: RowMetadata = {
        date,
        dateRaw,
        formattedUtcDate,
        lastInterpretTsAndDateErrorMessage,
        lastKnownTimeZone,
        lastParseLogCommentErrorMessage,
        lastSetTsAndDateErrorClass,
        lastSetTsAndDateErrorMessage,
        lastUsedTimeZone,
        line: trimmedLineWithoutCommentAndWhiteSpaceNoise,
        lineWithComment,
        log,
        parseLogCommentDetectTimeStampMetadata,
        preprocessedContentsSourceLineIndex,
        rowsWithTimeMarkersHandled: cloneVariable(
          this.rowsWithTimeMarkersHandled,
        ),
        sourceLine,
        ts,
      };

      // Default
      let isNewRowWithTimeMarker = false;

      // console.debug(["first check", $notTheFirstRowOfALogComment, $metadata]);// While devving

      const notTheFirstRowOfALogCommentAndProbableStartStopLine =
        notTheFirstRowOfALogComment &&
        this.timeLogParser.isProbableStartStopLine(
          trimmedLineWithoutCommentAndWhiteSpaceNoise,
        );
      const previousRowWithTimeMarkerIndex =
        this.rowsWithTimeMarkersHandled - 1;
      const isTheFirstRowWithTimeMarker = !this.rowsWithTimeMarkers[
        previousRowWithTimeMarkerIndex
      ];
      const hasAPreviousRowWithTimeMarker = !isTheFirstRowWithTimeMarker;
      const previousRowWithTimeMarkerHasTheSameDate =
        hasAPreviousRowWithTimeMarker &&
        this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex]
          .formattedUtcDate === formattedUtcDate;

      // Catch lines that has a timestamp but not in the beginning
      if (notTheFirstRowOfALogCommentAndProbableStartStopLine) {
        isNewRowWithTimeMarker = true;
        const updates = this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
          trimmedLineWithoutCommentAndWhiteSpaceNoise,
          metadata,
        );
        if (updates.isNewRowWithTimeMarker !== undefined) {
          isNewRowWithTimeMarker = updates.isNewRowWithTimeMarker;
        }
      } else if (notTheFirstRowOfALogComment) {
        this.processAdditionalLogCommentRowUntilNextLogComment(
          trimmedLineWithoutCommentAndWhiteSpaceNoise,
          metadata,
        );
        isNewRowWithTimeMarker = false;
      } else if (previousRowWithTimeMarkerHasTheSameDate) {
        this.processAdditionalLogCommentRowUntilNextLogComment(
          trimmedLineWithoutCommentAndWhiteSpaceNoise,
          metadata,
        );
        isNewRowWithTimeMarker = false;
      } else {
        // const theFirstRowOfALogComment = true;
        const updates = this.processTheFirstRowOfALogComment(ts, metadata);
        isNewRowWithTimeMarker = updates.isNewRowWithTimeMarker;
      }

      // If an invalid timezone was encountered, send to this.notParsedAddTimeMarkersParsePreProcessedContents but parse anyway (so that general parsing goes through but that the log is not considered correct)
      if (
        this.timeLogParser.lastSetTsAndDateErrorClass ===
        "InvalidDateTimeZoneException"
      ) {
        const methodName = "parsePreProcessedContents";
        metadata.log.push(
          `Invalid timezone ('${
            this.timeLogParser.lastKnownTimeZone
          }') encountered when parsing a row (source line: ${sourceLine}). Not treating this row as valid time-marked row`,
        );
        metadata.log.push(
          "lastSetTsAndDateErrorMessage: " +
            this.timeLogParser.lastSetTsAndDateErrorMessage,
        );
        metadata.log.push("Sent to notParsed in " + methodName);
        this.notParsedAddTimeMarkersParsePreProcessedContents.push(metadata);
      }

      // Update metadata with the last error messages encountered
      metadata.lastKnownTimeZone = cloneVariable(
        this.timeLogParser.lastKnownTimeZone,
      );
      metadata.lastUsedTimeZone = cloneVariable(
        this.timeLogParser.lastUsedTimeZone,
      );
      metadata.lastSetTsAndDateErrorClass = cloneVariable(
        this.timeLogParser.lastSetTsAndDateErrorClass,
      );
      metadata.lastSetTsAndDateErrorMessage = cloneVariable(
        this.timeLogParser.lastSetTsAndDateErrorMessage,
      );
      metadata.lastInterpretTsAndDateErrorMessage = cloneVariable(
        this.timeLogParser.lastInterpretTsAndDateErrorMessage,
      );
      metadata.lastParseLogCommentErrorMessage = cloneVariable(
        this.timeLogParser.lastParseLogCommentErrorMessage,
      );

      // Handle new-found rows with time marker
      if (isNewRowWithTimeMarker) {
        this.rowsWithTimeMarkers[
          this.rowsWithTimeMarkersHandled
        ] = cloneVariable(metadata);
        this.rowsWithTimeMarkersHandled++;
      }

      if (this.collectDebugInfo) {
        this.debugOriginalUnsortedRows.push(cloneVariable(metadata));
      }

      // Limit the maximum amount of rows
      // TODO: Make configurable
      if (this.rowsWithTimeMarkersHandled >= 100000) {
        throw new TimeLogParsingException(
          "Time log exceeds maximum allowed size",
        );
      }
      // if (this.rowsWithTimeMarkersHandled >= 10) break; // While devving
    }

    // Remove "pause->" from notParsed array since/if it (probably accidentally)
    // lands there in processing, but in essence the "pause->" lines should already
    // have played out their role as session markers and are no longer necessary when
    // parsing the preProcessedContents of a single session like we are doing here
    if (this.notParsedAddTimeMarkersParsePreProcessedContents.length > 0) {
      for (
        let k = 0;
        k < this.notParsedAddTimeMarkersParsePreProcessedContents.length;
        k++
      ) {
        const metadata = this.notParsedAddTimeMarkersParsePreProcessedContents[
          k
        ];
        const token = this.timeLogParser.startsWithOptionallySuffixedToken(
          metadata.line + "|$",
          "pause",
          "->|$",
        );

        if (token) {
          delete this.notParsedAddTimeMarkersParsePreProcessedContents[k];
        }
      }
      // Filter away deleted items in the not-parsed array
      this.notParsedAddTimeMarkersParsePreProcessedContents = this.notParsedAddTimeMarkersParsePreProcessedContents.filter(
        _ => _ !== undefined,
      );
    }
  }

  private processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
    line: string,
    metadata: RowMetadata,
  ): { isNewRowWithTimeMarker: boolean } {
    let isNewRowWithTimeMarker;
    const previousRowWithTimeMarkerIndex = this.rowsWithTimeMarkersHandled - 1;
    const startsWithPauseToken = this.timeLogParser.startsWithOptionallySuffixedToken(
      line,
      "pause",
    );
    const isTheFirstRowWithTimeMarker = !this.rowsWithTimeMarkers[
      previousRowWithTimeMarkerIndex
    ];

    // Assume true
    let probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;

    // Check if it's a pause with written duration
    const trimmedLineWithoutComment = line.replace(/#.*/g, "").trim();
    const pauseWithWrittenDuration =
      startsWithPauseToken &&
      strpos(trimmedLineWithoutComment, "min") !== false;

    if (pauseWithWrittenDuration) {
      const updates = this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
        metadata,
      );
      if (
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp !== null
      ) {
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp =
          updates.probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp;
      }
      isNewRowWithTimeMarker = true;
    } else {
      const updates = this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
        line,
        startsWithPauseToken,
        metadata,
      );
      if (
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp !== null
      ) {
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp =
          updates.probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp;
      }
      isNewRowWithTimeMarker = updates.isNewRowWithTimeMarker;
    }

    if (!probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp) {
      // If last valid row is not enabled - throw a large exception, is this log contents?
      if (isTheFirstRowWithTimeMarker) {
        throw new TimeLogParsingException("No valid start of log file");
      }

      // If not successful, use last rows ts
      metadata.ts = this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex].ts;
      metadata.tsIsFaked = true;
      const utcDateTime = DateTime.createFromUnixTimestamp(
        metadata.ts,
      ).cloneWithAnotherTimezone(new DateTimeZone("UTC"));
      metadata.formattedUtcDate = utcDateTime.format("Y-m-d H:i:s");
      metadata.highlightWithNewlines = true;
      // metadata.line = metadata.line;
    } else {
      // We keep track of sessions starts for double-checking that time has registered on each of those dates
      const startsWithStartTokenFollowedByASpace = this.timeLogParser.startsWithOptionallySuffixedToken(
        line,
        "start",
        " ",
      );
      if (startsWithStartTokenFollowedByASpace) {
        this.sessionStarts.push(metadata);
      }
    }
    return { isNewRowWithTimeMarker };
  }

  private processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
    metadata: RowMetadata,
  ): { probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp: boolean } {
    let probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp;
    const previousRowWithTimeMarkerIndex = this.rowsWithTimeMarkersHandled - 1;

    const methodName =
      "processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration";
    metadata.log.push("found a pause with written duration");
    metadata.ts = this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex].ts;
    metadata.tsIsFaked = true;

    const _utcDateTime = DateTime.createFromUnixTimestamp(
      metadata.ts,
    ).cloneWithAnotherTimezone(new DateTimeZone("UTC"));

    metadata.formattedUtcDate = _utcDateTime.format("Y-m-d H:i:s");
    metadata.highlightWithNewlines = true;
    const parts = metadata.line.split("->");
    const lineForDurationCheck = parts[0];
    const m = lineForDurationCheck.match(/(([0-9])*h)?([0-9]*)min/);
    // preg_match('/([^-]-[^-]-2009) ([^:]*):([^c ]*)/', $lineForDateCheck, $m);
    // $metadata["duration_search_preg_debug"] = {lineForDurationCheck","m");

    if (!!m && !!m[0]) {
      metadata.log.push(
        "found pause duration, adding to accumulated pause duration (if any)",
      );
      const previousRowWithTimeMarker = this.rowsWithTimeMarkers[
        previousRowWithTimeMarkerIndex
      ];
      // console.debug("processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration - metadata.line, m, previousRowWithTimeMarker", metadata.line, m, previousRowWithTimeMarker);
      metadata.pauseDuration = previousRowWithTimeMarker.pauseDuration
        ? previousRowWithTimeMarker.pauseDuration
        : 0;
      const hoursString = m[2];
      const minutesString = m[3];
      const hours = hoursString !== undefined ? parseInt(hoursString, 10) : 0;
      const minutes =
        minutesString !== undefined ? parseInt(minutesString, 10) : 0;
      // console.debug("processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration - {hours, hoursString, minutes, minutesString}", {hours, hoursString, minutes, minutesString});
      metadata.pauseDuration += 60 * (hours * 60 + minutes);
      metadata.tsIsFaked = false;
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    } else {
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
      // To easily see patterns amongst these lines
      metadata.log.push("sent to notParsed in " + methodName);
      this.notParsedAddTimeMarkersParsePreProcessedContents.push(metadata);
    }

    return { probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp };
  }

  private processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
    line: string,
    startsWithPauseToken,
    metadata: RowMetadata,
  ): {
    isNewRowWithTimeMarker: boolean;
    probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp: boolean;
  } {
    let probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = null;
    let isNewRowWithTimeMarker;
    const methodName =
      "processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration";

    // Try to find a valid timestamp

    // Remove the pause specification before attempting to find a timestamp
    let lineForDateCheck = line;
    if (startsWithPauseToken) {
      lineForDateCheck = this.timeLogParser.removeSuffixedToken(
        lineForDateCheck,
        "pause",
        "->",
      );
      lineForDateCheck = this.timeLogParser.removeSuffixedToken(
        lineForDateCheck,
        "pause",
        " ",
      );
      lineForDateCheck = this.timeLogParser.removeSuffixedToken(
        lineForDateCheck,
        "pause",
        "",
      );
    }

    // Try to find a timestamp
    let datetime: DateTime;
    const result = this.timeLogParser.detectTimeStamp(lineForDateCheck);
    const interpretedTsAndDate = this.timeLogParser.interpretTsAndDate(
      result.metadata.dateRaw,
      result.metadata.dateRawFormat,
    );
    const { ts, date } = interpretedTsAndDate;
    datetime = interpretedTsAndDate.datetime;
    // var_dump($ts, $date, $datetime);
    const validTimestampFound = !!date;

    // Check if the timestamp is later or same as previous row with time marker (if not, something is wrong)

    let thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker;
    let durationSinceLast;
    if (validTimestampFound === true) {
      // Get duration from last count
      durationSinceLast = this.timeLogParser.durationFromLast(
        ts,
        this.rowsWithTimeMarkersHandled,
        this.rowsWithTimeMarkers,
      );

      thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker =
        durationSinceLast >= 0;
    }

    // Fill the debug log with contextual information so that we can get more information about
    // why the probable start-stop line ended up here even though it was not valid

    if (validTimestampFound !== true) {
      metadata.log.push(
        "Did NOT find a valid timestamp in a probable start/pause-row. Not treating this row as a time-marked row",
      );
      metadata.log.push(`Line: ${line}`);

      // Treat as AdditionalLogCommentRowUntilNextLogComment if not a pause line
      if (!startsWithPauseToken) {
        metadata.log.push(
          "Sent to processAdditionalLogCommentRowUntilNextLogComment in " +
            methodName,
        );
        this.processAdditionalLogCommentRowUntilNextLogComment(line, metadata);
        isNewRowWithTimeMarker = false;
      } else {
        // To easily see patterns amongst these lines
        metadata.log.push("Sent to notParsed in " + methodName);
        this.notParsedAddTimeMarkersParsePreProcessedContents.push(metadata);
      }

      return {
        isNewRowWithTimeMarker,
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
      };
    }

    if (thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker === false) {
      metadata.log.push(
        "Timestamp found in probable start/pause-row, but was earlier than last found",
      );
      metadata.log.push(`Line: ${line}`);
      const last = new DateTime(
        addSeconds(datetime.getDate(), Math.abs(durationSinceLast)),
        datetime.getTimezone(),
      );
      metadata.log.push(
        `Timestamp found: ${datetime.format(
          "Y-m-d H:i:s",
        )} vs last found (based on duration since last which is ${durationSinceLast}): ${last.format(
          "Y-m-d H:i:s",
        )}`,
      );

      // To easily see patterns amongst these lines
      metadata.log.push("Sent to notParsed in " + methodName);
      this.notParsedAddTimeMarkersParsePreProcessedContents.push(metadata);

      return {
        isNewRowWithTimeMarker,
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
      };
    }

    if (
      validTimestampFound &&
      thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker
    ) {
      metadata.log.push(
        "Found a valid timestamp in probable start/pause-row... interpreted as start/pause-row...",
      );
      metadata.ts = ts;
      metadata.date = date;
      const utcDateTime = DateTime.createFromUnixTimestamp(
        ts,
      ).cloneWithAnotherTimezone(new DateTimeZone("UTC"));
      metadata.formattedUtcDate = utcDateTime.format("Y-m-d H:i:s");
      metadata.tsIsFaked = false;
      metadata.highlightWithNewlines = true;
      metadata.lastSetTsAndDateErrorMessage = ""; //
      // metadata.line = metadata.line;
      isNewRowWithTimeMarker = true;
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    } else {
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
    }

    return {
      isNewRowWithTimeMarker,
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
    };
  }

  /**
   * @param line
   * @param metadata Only sent to be able to supply as debug information in case of an exception
   */
  private processAdditionalLogCommentRowUntilNextLogComment(
    line: string,
    metadata: RowMetadata,
  ) {
    const previousRowWithTimeMarkerIndex = this.rowsWithTimeMarkersHandled - 1;
    if (!this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex]) {
      throw new TimeLogParsingException(
        "Incorrect parsing state: For some reason we are attempting to collect additional log comment rows until new log comment but we have no previous log comments",
        {
          // debugOriginalUnsortedRows: this.debugOriginalUnsortedRows,
          metadata,
          previousRowWithTimeMarkerIndex,
          rowsWithTimeMarkers: this.rowsWithTimeMarkers,
        },
      );
    }

    // Until next date, we just add the lines up to the previous line
    this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex].line +=
      " | " + line;
  }

  private processTheFirstRowOfALogComment(
    ts: number,
    metadata: RowMetadata,
  ): { isNewRowWithTimeMarker: boolean } {
    let isNewRowWithTimeMarker;
    const previousRowWithTimeMarkerIndex = this.rowsWithTimeMarkersHandled - 1;

    // Get duration from last count
    const durationSinceLast = this.timeLogParser.durationFromLast(
      ts,
      this.rowsWithTimeMarkersHandled,
      this.rowsWithTimeMarkers,
    );

    if (durationSinceLast < 0) {
      metadata.log.push("negative duration since last");
      isNewRowWithTimeMarker = false;

      // Debug log info
      const timezone = new DateTimeZone("UTC");
      const datetime = DateTime.createFromUnixTimestamp(
        ts,
      ).cloneWithAnotherTimezone(timezone);
      const last = new DateTime(
        addSeconds(datetime.getDate(), Math.abs(durationSinceLast)),
        datetime.getTimezone(),
      );
      metadata.log.push(
        `Timestamp found: ${datetime.format(
          "Y-m-d H:i:s",
        )} vs last found (based on duration since last which is ${durationSinceLast}): ${last.format(
          "Y-m-d H:i:s",
        )}`,
      );
      const previousRowWithTimeMarker = this.rowsWithTimeMarkers[
        previousRowWithTimeMarkerIndex
      ];
      metadata.log.push(
        `$previousRowWithTimeMarker line: ${previousRowWithTimeMarker.line}`,
      );
      metadata.log.push("sent to notParsed in processTheFirstRowOfALogComment");
      this.notParsedAddTimeMarkersParsePreProcessedContents.push(metadata);
    } else if (durationSinceLast > 24 * 60 * 60) {
      // Warn on unlikely large entries (> 24h) - likely typos
      // TODO: Make limit configurable

      metadata.log.push(
        "excessive duration since last: " +
          this.timeLogParser.secondsToDuration(durationSinceLast),
      );
      this.notParsedAddTimeMarkersParsePreProcessedContents.push(metadata);
      isNewRowWithTimeMarker = true;
    } else {
      metadata.durationSinceLast = durationSinceLast;
      isNewRowWithTimeMarker = true;
    }
    return { isNewRowWithTimeMarker };
  }

  private generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
    rowsWithTimeMarkers: RowMetadata[],
  ) {
    if (!rowsWithTimeMarkers) {
      throw new TimeLogParsingException("No rows parsed...");
    }

    /*
    // Handle some special cases for the last log row
    const last = this.rowsWithTimeMarkers.pop();

    if (false) {
      // The last pause was started some time after the last log message
      // TODO: Handle
    } else {
      this.rowsWithTimeMarkers.push(last);
    }
    */

    // Generate structured log output
    return this.generateStructuredTimeMarkedOutput(rowsWithTimeMarkers);
  }

  private generateStructuredTimeMarkedOutput(
    rowsWithTimeMarkers: RowMetadata[],
  ) {
    let contentsWithTimeMarkers = "";
    contentsWithTimeMarkers += ".:: Uncategorized" + LogParser.NL_NIX;

    for (let k = 0; k < rowsWithTimeMarkers.length; k++) {
      const rowWithTimeMarker: RowMetadata = rowsWithTimeMarkers[k];
      const previousRowWithTimeMarker = rowsWithTimeMarkers[k - 1];

      if (
        rowWithTimeMarker.highlightWithNewlines !== undefined &&
        rowWithTimeMarker.highlightWithNewlines
      ) {
        contentsWithTimeMarkers += LogParser.NL_NIX;
      }

      contentsWithTimeMarkers += "\t";

      if (
        rowWithTimeMarker.durationSinceLast !== undefined &&
        rowWithTimeMarker.durationSinceLast !== null
      ) {
        // Remove any known pause durations
        if (previousRowWithTimeMarker.pauseDuration !== undefined) {
          rowWithTimeMarker.durationSinceLast -=
            previousRowWithTimeMarker.pauseDuration;
        }

        if (rowWithTimeMarker.durationSinceLast < 0) {
          rowWithTimeMarker.log.push("negative duration since last");
          rowWithTimeMarker.log.push(
            "sent to notParsed in generateStructuredTimeMarkedOutput",
          );
          this.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput.push(
            rowWithTimeMarker,
          );
        }

        const parts = rowWithTimeMarker.line.split(",");
        parts.shift();
        contentsWithTimeMarkers += rowWithTimeMarker.formattedUtcDate;
        contentsWithTimeMarkers +=
          ", " +
          this.timeLogParser.secondsToDuration(
            rowWithTimeMarker.durationSinceLast,
          );

        if (
          !!previousRowWithTimeMarker &&
          !!previousRowWithTimeMarker.tsIsFaked
        ) {
          // Treat this situation as invalid
          contentsWithTimeMarkers += " {!} ";
          rowWithTimeMarker.log.push(
            "duration since last is based on fake/interpolated timestamp",
          );
          rowWithTimeMarker.log.push(
            "previousRowWithTimeMarker.line: " + previousRowWithTimeMarker.line,
          );
          rowWithTimeMarker.log.push(
            "sent to notParsed in generateStructuredTimeMarkedOutput",
          );
          this.notParsedAddTimeMarkersGenerateStructuredTimeMarkedOutput.push(
            rowWithTimeMarker,
          );
        }

        contentsWithTimeMarkers += parts.join(",");
      } else {
        contentsWithTimeMarkers +=
          rowWithTimeMarker.line +
          " {" +
          rowWithTimeMarker.formattedUtcDate +
          "}";
      }

      contentsWithTimeMarkers += LogParser.NL_NIX;

      if (
        rowWithTimeMarker.highlightWithNewlines !== undefined &&
        rowWithTimeMarker.highlightWithNewlines
      ) {
        contentsWithTimeMarkers += LogParser.NL_NIX;
      }
    }

    return contentsWithTimeMarkers;
  }

  private detectCategories(contentsWithTimeMarkers) {
    this.categories = [];
    const lines = textIntoLinesArray(contentsWithTimeMarkers);

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty rows
      if (trimmedLine === "") {
        continue;
      }

      // Detect and switch category
      if (strpos(line, ".::") === 0) {
        const categoryNeedle = str_replace(".::", "", trimmedLine).trim();
        this.categories.push(categoryNeedle);
      }
    }

    if (this.categories.length === 0) {
      this.categories.push("Uncategorized");
    }
  }

  /*
  // Requires that the ->sessions array is populated
  public generateIcal()
  {
     //
  // Google calendar export
  //
  // BEGIN:VEVENT
  // DTSTART:20101217T130000Z
  // DTEND:20101217T153000Z
  // DTSTAMP:20101217T155736Z
  // UID:7746kmpuslj1n5ck0agbjspeoo@google.com
  // CREATED:20101217T155621Z
  // DESCRIPTION:DESCRIPTIONHHH
  // LAST-MODIFIED:20101217T155621Z
  // LOCATION:wheeeererer
  // SEQUENCE:0
  // STATUS:CONFIRMED
  // SUMMARY:TitleHERE
  // TRANSP:OPAQUE
  // END:VEVENT
  //
  // initiate new CALENDAR
  // $v->setProperty( 'X-WR-CALNAME'
  // , 'Sample calendar' );
  // $v->setProperty( 'X-WR-CALDESC'
  // , 'Description of the calendar' );
  // Helsinki - TODO - FIX THIS...? Does it matter? Seems not to matter...?
  // alt. production
  // $v->returnCalendar();                       // generate and redirect output to user browser
  // alt. dev. and test
  // generate and get output in string, for testing?
    Yii.import("vcalendar");
    const v = new vcalendar();
    v.setProperty("X-WR-TIMEZONE", "Europe/Stockholm");
    {
      const _tmp_0 = this.sessions;

      // var_dump($session["metadata"]);
      // Inactivating until have a solution for timezone split issues
      for (const k of Object.keys(_tmp_0)) {
        // Only sessions with work hours
        const session = _tmp_0[k];

        if (!session.metadata.hoursTotal) {
          continue;
        }

        const vevents = [];
        let start = gmdate("H:i", session.metadata.startTs);
        let last = gmdate("H:i", session.metadata.lastTs);
        const startdate = gmdate("Y-m-d", session.metadata.startTs);
        const lastdate = gmdate("Y-m-d", session.metadata.lastTs);
        let startTs = session.metadata.startTs;
        let lastTs = session.metadata.lastTs;

        if (false && startdate !== lastdate) {
          const days =
            (strtotime(lastdate) - strtotime(startdate)) / (24 * 3600);
          start = gmdate("Y-m-d H:i", session.metadata.startTs);
          last = gmdate("Y-m-d H:i", session.metadata.lastTs);

          for (let i = 0; i <= days; i++) {
            const idate = gmdate("Y-m-d", startTs + 24 * 3600 * i);

            if (idate === startdate) {
              startTs = startTs;
              lastTs = strtotime(idate + " 23:59");
            } else if (idate === lastdate) {
              startTs = strtotime(idate + " 00:00");
              lastTs = lastTs;
            } else {
              startTs = strtotime(idate + " 00:00");
              lastTs = strtotime(idate + " 23:59");
            }

            vevents.push({ startTs, lastTs });
          }
        } else {
          vevents.push({ startTs, lastTs });
        }

        let summary =
          session.metadata.hoursTotal +
          " project hours (" +
          start +
          "->" +
          last;

        if (!!session.metadata.nonHours) {
          summary += ", " + session.metadata.nonHours + " hours non-work";
        }

        summary += ") ";
        let description = "Start datetime: " + start + LogParser.NL_NIX;
        description += "End datetime: " + last + LogParser.NL_NIX;
        description +=
          "Work hours: " +
          session.metadata.hoursTotal +
          LogParser.NL_NIX;
        description +=
          "Non-work hours: " +
          session.metadata.nonHours +
          LogParser.NL_NIX;
        description += this.someMeaningInItAll(
          session.model.TimeLogParser.preProcessedContents,
        );

        if (
          true ||
          mb_strlen(
            session.model.TimeLogParser.contentsWithTimeMarkers,
            "UTF-8",
          ) < 1024
        ) {
          description += "\n\nFull time-marked log:\n";
          description += session.model.TimeLogParser.contentsWithTimeMarkers;
        } else {
          description += "\n\nCharacters in full time-marked log:\n";
          description += mb_strlen(
            session.model.TimeLogParser.contentsWithTimeMarkers,
            "UTF-8",
          );
        }

        description = utf8_decode(description);
        summary = utf8_decode(summary);

        // , 'WORK' );                   // catagorize
        // $e->setProperty( 'duration'
        // , 0, 0, 3 );                    // 3 hours
        // $e->setProperty( 'location'
        // , 'Home' );                     // locate the event
        // add component to calendar
        for (const vevent of Object.values(vevents)) {
          // $e->setProperty( 'categories'
          const e = new vevent();
          this.setVcalendarDt(e, "dtstart", vevent.startTs);
          this.setVcalendarDt(e, "dtend", vevent.lastTs);
          e.setProperty("description", description);
          e.setProperty("summary", summary);
          v.addComponent(e);
        }
      }
    }
    let str = v.createCalendar();
    str = utf8_encode(str);
    return str;
  }

  private setVcalendarDt(e, field, ts) {
    e.setProperty(
      field,
      gmdate("Y", ts),
      gmdate("m", ts),
      gmdate("d", ts),
      gmdate("H", ts),
      gmdate("i", ts),
      gmdate("s", ts),
    );
  }

  public someMeaningInItAll(
    str, // array_count_values() returns an array using the values of the input array as keys and their frequency in input as values.
  ) {
    if (!str) {
      return "";
    }

    let forReturn = "\nSubversion commit messages:\n";
    const lines = textIntoLinesArray(str);
    const commitLogLines = [];

    for (const line of Object.values(lines)) {
      if (this.isProbableCommitLogLine(line)) {
        commitLogLines.push(line);
      }
    }

    forReturn += this.timeLogParser.linesArrayIntoText(commitLogLines);
    const lower = str.toLowerCase();
    const words = str_word_count_utf8(lower, 1);
    const numWords = words.length;
    const word_count = array_count_values(words);
    arsort(word_count);
    forReturn += "\n\nCommon words:\n";
    let k = 1;

    for (const key of Object.keys(word_count)) {
      const val = word_count[key];
      const pausetoken = this.timeLogParser.startsWithOptionallySuffixedToken(key, "pause");

      if (
        mb_strlen(key, "UTF-8") > 2 &&
        !(-1 !== this.reservedWords.indexOf(key)) &&
        strpos(key, "-") === false &&
        !pausetoken
      ) {
        // utf8_encode
        // ($val)//number_format(($val/$numWords)*100)
        forReturn += "" + key + ", ";
        k++;
      }

      if (k > 50) {
        break;
      }
    }

    return forReturn;
  }
  */
}
