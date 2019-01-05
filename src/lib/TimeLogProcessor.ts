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
} from "./LogParser";
import {
  cloneVariable,
  DateTime,
  DateTimeZone,
  // mb_strlen,
  mb_substr,
} from "./php-wrappers";
// import { str_hex, str_word_count_utf8, utf8_decode } from "./string-utils";
import { TimeLogParser } from "./TimeLogParser";

export interface TimeLogSession {
  timeReportSourceComments: TimeLogEntryWithMetadata[];
  tzFirst: string;
  metadata: RowMetadata;
  k;
  start;
}

export interface RowMetadata {
  date: any;
  dateRaw: any;
  formattedDate: any;
  lastInterpretTsAndDateErrorMessage: any;
  lastKnownTimeZone: any;
  lastSetTsAndDateErrorMessage: any;
  lastUsedTimeZone: any;
  line: any;
  lineWithComment: any;
  log: any;
  preprocessedContentsSourceLineIndex: number;
  rowsWithTimeMarkersHandled: number;
  sourceLine: any;
  ts: number;
  // TODO: Possibly split into separate child interface
  tsIsFaked?: boolean;
  highlightWithNewlines?: boolean;
  pauseDuration?: any;
  durationSinceLast?: any;
}

export interface TimeReportSourceComment {
  category: any;
  date: any;
  dateRaw: any;
  hours: any;
  hoursRounded: any;
  lineWithoutDate: any;
  text: any;
  ts: any;
  tz: any;
}

export interface TimeLogEntryWithMetadata {
  dateRaw: any;
  gmtTimestamp: any;
  sessionMeta: any;
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
  public timeReportCsv: string = "";
  public timeReportData: any = {};
  public sessionStarts: any[] = [];
  public sessions: TimeLogSession[] = [];
  public categories: any[] = [];
  public timeReportSourceComments: TimeReportSourceComment[] = [];
  public metadataGenerateTimeReport: {
    firstDateFound: any;
    lastDateFound: any;
  };
  public debugOriginalUnsortedRows?: any[];

  // Metadata arrays
  public notParsedAddTimeMarkers: RowMetadata[] = [];
  public notParsedTimeReport: RowMetadata[] = [];
  public rowsWithTimeMarkers: RowMetadata[] = [];
  public readonly preProcessedContentsSourceLineContentsSourceLineMap: any = {};

  // State / tmp
  private rowsWithTimeMarkersHandled;

  // The time log parser does a lot of the heavy lifting
  private timeLogParser: TimeLogParser;

  // Misc
  private readonly collectDebugInfo: boolean = false;

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

    this.contentsWithTimeMarkers = this.generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
      this.rowsWithTimeMarkers,
    );
  }

  public notParsedAddTimeMarkersErrorSummary() {
    if (!this.notParsedAddTimeMarkers) {
      throw new TimeLogParsingException(
        "Can not summarize not-parsed errors without any unparsed contents",
      );
    }

    const summary = {};

    for (const v of Object.values(this.notParsedAddTimeMarkers)) {
      if (v && v.sourceLine) {
        summary[v.sourceLine] = v;
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

  /*
    // Metadata arrays
  private notParsedAddTimeMarkers: RowMetadata[] = [];
  private notParsedTimeReport: RowMetadata[] = [];
  private rowsWithTimeMarkers: RowMetadata[] = [];


   */

  public generateTimeReport(
    contentsWithTimeMarkers: string, // Fill out and sort the times-array // print in a csv-format: // var_dump($times);
  ) {
    this.timeLogParser.lastKnownTimeZone = this.tzFirst;
    let timeReportCsv = "";
    const times = [];

    if (!this.categories) {
      this.detectCategories(contentsWithTimeMarkers);
    }

    const lines = textIntoLinesArray(contentsWithTimeMarkers);
    let category = "Unspecified";

    // Special care is necessary here - ts is already in UTC, so we parse it as such, but we keep lastKnownTimeZone since we want to know the source row's timezone
    // Check for startstopline - they are not invalid, only ignored
    // Only check until first |
    // invalidate
    // TEXT
    // Save a useful form of the time-marked rows that build up the hours-sum:
    for (const lineno of Object.keys(lines)) {
      // skip empty rows
      const line = lines[lineno];
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        continue;
      }

      if (strpos(line, ".::") === 0) {
        const categoryNeedle = str_replace(".::", "", trimmedLine).trim();

        if (-1 !== this.categories.indexOf(categoryNeedle)) {
          category = categoryNeedle;
          continue;
        }
      }

      if (category === "Ignored") {
        continue;
      }

      if (strpos(trimmedLine, "|tz:") === 0) {
        this.timeLogParser.lastKnownTimeZone = str_replace(
          "|tz:",
          "",
          trimmedLine,
        );
        continue;
      }

      let parts = line.split(",");
      const dateRaw = parts.shift();
      const lineWithoutDate = parts.join(",");
      const _ = this.timeLogParser.lastKnownTimeZone;
      this.timeLogParser.lastKnownTimeZone = "UTC";
      const { ts, date /*, datetime*/ } = this.timeLogParser.interpretTsAndDate(
        dateRaw,
      );
      this.timeLogParser.lastKnownTimeZone = _;
      parts = line.split(" | ");
      const beforeVertLine = parts[0];

      if (this.timeLogParser.isProbableStartStopLine(beforeVertLine)) {
        continue;
      }

      let invalid =
        !date ||
        strpos(lineWithoutDate, "min") === false ||
        ts < Date.now() / 1000 - 24 * 3600 * 365 * 10;

      if (invalid) {
        this.notParsedTimeReport.push(line);
        continue;
      }

      parts = lineWithoutDate.split("min");
      const tokens = this.timeLogParser.tokens();
      const duration = str_replace(tokens.approx, "", parts[0]).trim() + "min";
      const time = this.timeLogParser.durationToMinutes(duration);
      invalid = !time && time !== 0;

      if (invalid) {
        this.notParsedTimeReport.push(line);
        continue;
      }

      const hoursRounded = Math.round((time / 60) * 100) / 100;
      const hours = time / 60;
      /*const first =*/ parts.shift();
      let text = parts.join("min");
      invalid = !text;

      if (invalid) {
        // var_dump($first, $parts, $line); die();
        // $this.notParsedTimeReport[] = $line; continue;
        text = "<empty log item>";
      }

      if (!times[date]) {
        times[date] = [];
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

    this.timeReportData = this.addZeroFilledDates(times);
    timeReportCsv +=
      "Date;" +
      this.categories.join(" (rounded);") +
      " (rounded);" +
      this.categories.join(";") +
      ";Log_Items\n";

    //
    // replace point by comma
    // $hoursByCategoryRounded = str_replace(".", ",", $hoursByCategoryRounded);
    // replace point by comma
    // $hoursByCategory = str_replace(".", ",", $hoursByCategory);
    for (const date of Object.keys(this.timeReportData)) {
      // Gotta limit the amount of data
      const hours = this.timeReportData[date];
      let activities = Array.from(hours.text).join(" | ");
      activities = newlineConvert(activities, "");
      activities = str_replace([";", "\t"], [",", "   "], activities);
      activities = mb_substr(activities, 0, 1024).trim();
      let hoursByCategoryRounded = "";

      for (const c of Object.values(this.categories)) {
        const hoursExact = undefined !== hours[c] ? hours[c] : 0;
        const hoursRounded = Math.round(hoursExact * 100) / 100;
        hoursByCategoryRounded += hoursRounded + ";";
      }

      let hoursByCategory = "";

      for (const c of Object.values(this.categories)) {
        const hoursExact = undefined !== hours[c] ? hours[c] : 0;
        hoursByCategory += hoursExact + ";";
      }

      timeReportCsv +=
        date +
        ";" +
        hoursByCategoryRounded +
        hoursByCategory +
        activities +
        LogParser.NL_NIX;
    }

    /*
    for (const line of Object.values(notParsed)) {
      // maybe attempt to add some debugging metadata here?
    }
    */

    this.timeReportCsv = timeReportCsv;
  }

  public addZeroFilledDates(times) {
    let firstDateFound;
    let lastDateFound;
    const originalTimesArray = cloneVariable(times);
    times = {};
    const timezone = new DateTimeZone("UTC");

    for (const date of Object.keys(originalTimesArray)) {
      const hours = originalTimesArray[date];
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

        times[dateWithoutTime.format("Y-m-d")] = hours;
      }
    }

    this.metadataGenerateTimeReport = {
      firstDateFound,
      lastDateFound,
    };

    if (!firstDateFound) {
      return [];
    }

    const interval = {
      /* tslint:disable:object-literal-sort-keys */
      start: firstDateFound.date,
      end: lastDateFound.date,
      /* tslint:enable:object-literal-sort-keys */
    };
    // console.debug({ times, interval, firstDateFound, lastDateFound });

    const dates = eachDayOfIntervalUTC(interval);
    // console.debug({ dates });

    const timesArrayBeforePadding = cloneVariable(times);
    times = {};

    for (const date of dates) {
      const dt = new DateTime(date, timezone);
      // console.debug({ dt });
      const xday = dt.format("Y-m-d");
      times[xday] =
        timesArrayBeforePadding[xday] !== undefined
          ? timesArrayBeforePadding[xday]
          : 0;
    }

    // console.debug({ times });

    return times;
  }

  public getTimeLogMetadata() {
    // do {
    // } while (!$last["tsIsFaked"]);

    if (!this.contentsWithTimeMarkers) {
      return [];
    }

    if (!this.rowsWithTimeMarkers) {
      return [];
    }

    const rowsWithTimeMarkers: RowMetadata[] = JSON.parse(
      JSON.stringify(this.rowsWithTimeMarkers),
    );
    const start = rowsWithTimeMarkers.shift();
    const startTs = start.ts;
    const name = start.dateRaw;
    const last = rowsWithTimeMarkers.pop();
    const lastTs = last.ts;
    const leadTime = lastTs - startTs;
    let hoursTotal = 0;

    for (const time of Object.values(this.timeReportData)) {
      for (const category of Object.values(this.categories)) {
        hoursTotal += time[category];
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

  /**
   * Note: Public only to allow for testing this endpoint specifically
   * @param preProcessedContents
   */
  public parsePreProcessedContents(preProcessedContents: string) {
    const debugOriginalUnsortedRows: RowMetadata[] = [];
    this.rowsWithTimeMarkersHandled = 0;
    const lines = textIntoLinesArray(preProcessedContents);

    for (
      let preprocessedContentsSourceLineIndex = 0;
      preprocessedContentsSourceLineIndex < lines.length;
      preprocessedContentsSourceLineIndex++
    ) {
      const preprocessedContentsSourceLine =
        lines[preprocessedContentsSourceLineIndex];
      let trimmedLine = preprocessedContentsSourceLine.trim();

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
      const lineWithComment = trimmedLine;
      trimmedLine = trimmedLine.replace(/#.* /g, "").trim();

      // Remove whitespace noise
      trimmedLine = newlineConvert(trimmedLine, "");

      // Save the trimmed line as $line since the legacy code expects it to be called that
      const line = trimmedLine;

      // DATETIME
      const {
        ts,
        date,
        dateRaw,
        // datetime,
        // lineWithoutDate,
        notTheFirstRowOfALogComment,
      } = this.timeLogParser.parseLogComment(line);

      // $line = utf8_encode($line);

      // Use UTC dates
      const timezone = new DateTimeZone("UTC");
      const datetime = DateTime.createFromUnixTimestamp(
        ts,
      ).cloneWithAnotherTimezone(timezone);
      const formattedDate = datetime.format("Y-m-d H:i"); // :s

      const log = [];
      const lastKnownTimeZone = this.timeLogParser.lastKnownTimeZone;
      const lastUsedTimeZone = this.timeLogParser.lastUsedTimeZone;
      const lastSetTsAndDateErrorMessage = this.timeLogParser
        .lastSetTsAndDateErrorMessage;
      const lastInterpretTsAndDateErrorMessage = this.timeLogParser
        .lastInterpretTsAndDateErrorMessage;
      const metadata: RowMetadata = {
        date,
        dateRaw,
        formattedDate,
        lastInterpretTsAndDateErrorMessage,
        lastKnownTimeZone,
        lastSetTsAndDateErrorMessage,
        lastUsedTimeZone,
        line,
        lineWithComment,
        log,
        preprocessedContentsSourceLineIndex,
        rowsWithTimeMarkersHandled: this.rowsWithTimeMarkersHandled,
        sourceLine,
        ts,
      };

      // If lastKnownTimeZone and lastUsedTimeZone are different: Send to this.notParsedAddTimeMarkers but parse anyway (so that general parsing goes through but that the log is not considered correct)
      if (
        this.timeLogParser.interpretLastKnownTimeZone() !==
        this.timeLogParser.lastUsedTimeZone
      ) {
        const methodName = "parsePreProcessedContents";
        metadata.log.push(
          `Invalid timezone ('${
            this.timeLogParser.lastKnownTimeZone
          }') encountered when parsing a row (source line: ${sourceLine}). Not treating this row as valid time-marked row`,
        );
        metadata.log.push("Sent to notParsed in " + methodName);
        this.notParsedAddTimeMarkers.push(metadata);
      }

      // Default
      let isNewRowWithTimeMarker = false;

      // console.debug(["first check", $notTheFirstRowOfALogComment, $metadata]);// While devving

      const notTheFirstRowOfALogCommentAndProbableStartStopLine =
        notTheFirstRowOfALogComment &&
        this.timeLogParser.isProbableStartStopLine(line);
      const previousRowWithTimeMarkerIndex =
        this.rowsWithTimeMarkersHandled - 1;
      const isTheFirstRowWithTimeMarker = !this.rowsWithTimeMarkers[
        previousRowWithTimeMarkerIndex
      ];
      const hasAPreviousRowWithTimeMarker = !isTheFirstRowWithTimeMarker;
      const previousRowWithTimeMarkerHasTheSameDate =
        hasAPreviousRowWithTimeMarker &&
        this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex]
          .formattedDate === formattedDate;

      // Catch lines that has a timestamp but not in the beginning
      if (notTheFirstRowOfALogCommentAndProbableStartStopLine) {
        isNewRowWithTimeMarker = true;
        const updates = this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
          line,
          metadata,
        );
        isNewRowWithTimeMarker = updates.isNewRowWithTimeMarker;
      } else if (notTheFirstRowOfALogComment) {
        this.processAdditionalLogCommentRowUntilNextLogComment(line);
        isNewRowWithTimeMarker = false;
      } else if (previousRowWithTimeMarkerHasTheSameDate) {
        this.processAdditionalLogCommentRowUntilNextLogComment(line);
        isNewRowWithTimeMarker = false;
      } else {
        // const theFirstRowOfALogComment = true;
        const updates = this.processTheFirstRowOfALogComment(ts, metadata);
        isNewRowWithTimeMarker = updates.isNewRowWithTimeMarker;
      }

      // Handle new-found rows with time marker
      if (isNewRowWithTimeMarker) {
        this.rowsWithTimeMarkers[this.rowsWithTimeMarkersHandled] = metadata;
        this.rowsWithTimeMarkersHandled++;
      }

      debugOriginalUnsortedRows.push(metadata);

      // Limit the maximum amount of rows
      // TODO: Make configurable
      if (this.rowsWithTimeMarkersHandled >= 100000) {
        throw new TimeLogParsingException(
          "Time log exceeds maximum allowed size",
        );
      }
      // if (this.rowsWithTimeMarkersHandled >= 10) break; // While devving
    }

    if (this.collectDebugInfo) {
      this.debugOriginalUnsortedRows = debugOriginalUnsortedRows;
    }
  }

  private getPreProcessedContents(tzFirst, contents) {
    this.timeLogParser.lastKnownTimeZone = tzFirst;
    let processed = [];
    const rawLines = textIntoLinesArray(contents);
    let nextNeedToBeStart = true;

    // Phase 0 - skip lines after "#endts"
    const lines = [];
    for (const k of Object.keys(rawLines)) {
      const line = rawLines[k];

      if (line.trim() === "#endts") {
        break;
      }

      lines.push(line);
    }

    // Phase 1 - pause-fixes
    const phase1SourceLineContentsSourceLineMap = {};
    for (
      let sourceLineIndex = 0;
      sourceLineIndex < lines.length;
      sourceLineIndex++
    ) {
      const line = lines[sourceLineIndex];

      // Always use trimmed line for comparisons
      let trimmedLine = line.trim();

      // Actual source line is +1
      const sourceLine: number = sourceLineIndex + 1;

      if (!sourceLine || typeof sourceLine !== "number") {
        throw new TimeLogParsingException(
          "Encountered an invalid sourceLine variable in Phase 1",
          { sourceLine, lines, phase1SourceLineContentsSourceLineMap },
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
          const { ts, date, datetime } = this.timeLogParser.interpretTsAndDate(
            metadata.dateRaw,
          );
          // var_dump($metadata["dateRaw"], $trimmedLineForDateCheck, $ts, $date);
          // $invalid = empty($date);
          */

          if (metadata.dateRaw && metadata.dateRaw.trim() !== "") {
            // $formattedDate = gmdate("Y-m-d H:i", $ts); //:s
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
    processed = [];

    // Phase 2 - missing start-lines
    for (
      let phase1ProcessedLineIndex = 0;
      phase1ProcessedLineIndex < lines.length;
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
            lines,
            phase1ProcessedLine,
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

      if (strpos(trimmedLine, "start") === 0) {
        nextNeedToBeStart = false;
      }

      if (nextNeedToBeStart) {
        // We have a certain syntax that can recover a missing start line, let's check for that:
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
          let preg = /^(ca|appr)? ?((\d)+h)?(\d+)min/; // todo dynamic insertion of apprtokens
          const m = trimmedLinewithoutdate.match(preg);

          let apprtoken;
          let hours;
          let minutes;

          if (!!m) {
            apprtoken = m[1];
            hours = Math.round(parseFloat(m[3]));
            minutes = Math.round(parseFloat(m[4])) + hours * 60;
          } else {
            // Check for hours without minutes as well
            preg = /^(ca|appr)? ?(\d)+h/; // todo dynamic insertion of apprtokens
            const m2 = trimmedLinewithoutdate.match(preg);

            if (!!m2) {
              apprtoken = m2[1];
              hours = Math.round(parseFloat(m2[2]));
              minutes = hours * 60;
            }
          }

          if (!!minutes) {
            // Here we, instead of start, have a single line with a duration. We can calculate the start from this...

            if (!datetime) {
              throw new TimeLogParsingException(
                "To be able to calculate the special-syntax-missing-start-line we need to have the DateTime object of the line to subtract from",
              );
            }

            const probableStartDateTime = new DateTime(
              subMinutes(datetime.getDate(), minutes),
              datetime.getTimezone(),
            );
            const probableStart = probableStartDateTime.format("Y-m-d H:i"); // gmdate("Y-m-d H:i", $ts - $minutes * 60);
            // var_dump(__LINE__, $probableStart, $date, $minutes, $this->lastKnownTimeZone);

            processed.push(`start ${probableStart}` + apprtoken); // note: timestamp generated from duration info in line below;
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

    return linesArrayIntoText(processed);
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
    const pauseWithWrittenDuration =
      startsWithPauseToken && strpos(line, "min") !== false;

    if (pauseWithWrittenDuration) {
      const updates = this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
        metadata,
      );
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp =
        updates.probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp;
    } else {
      const updates = this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
        line,
        startsWithPauseToken,
        metadata,
      );
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp =
        updates.probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp;
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
      const timezone = new DateTimeZone("UTC");
      const datetime = DateTime.createFromUnixTimestamp(
        metadata.ts,
      ).cloneWithAnotherTimezone(timezone);
      metadata.formattedDate = datetime.format("Y-m-d H:i:s");
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
    const timezone = new DateTimeZone("UTC");

    const _datetime = DateTime.createFromUnixTimestamp(
      metadata.ts,
    ).cloneWithAnotherTimezone(timezone);

    metadata.formattedDate = _datetime.format("Y-m-d H:i:s");
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
      // var_dump($line, $m, $this.rowsWithTimeMarkersHandled, $this.rowsWithTimeMarkers);
      if (
        !!this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex].pauseDuration
      ) {
        metadata.pauseDuration = Math.round(
          this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex]
            .pauseDuration,
        );
      } else {
        metadata.pauseDuration = 0;
      }
      metadata.pauseDuration +=
        60 * (Math.round(m[2][0]) * 60 + Math.round(m[3][0]));
      metadata.tsIsFaked = false;
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    } else {
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
      // To easily see patterns amongst these lines
      metadata.log.push("sent to notParsed in " + methodName);
      this.notParsedAddTimeMarkers.push(metadata);
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
    let probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp;
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
        this.processAdditionalLogCommentRowUntilNextLogComment(line);
        isNewRowWithTimeMarker = false;
      } else {
        // To easily see patterns amongst these lines
        metadata.log.push("Sent to notParsed in " + methodName);
        this.notParsedAddTimeMarkers.push(metadata);
      }
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
      this.notParsedAddTimeMarkers.push(metadata);
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
      const timezone = new DateTimeZone("UTC");
      datetime = DateTime.createFromUnixTimestamp(ts).cloneWithAnotherTimezone(
        timezone,
      );
      metadata.formattedDate = datetime.format("Y-m-d H:i:s");
      metadata.tsIsFaked = false;
      metadata.highlightWithNewlines = true;
      // metadata.line = metadata.line;
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    } else {
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
    }

    return {
      isNewRowWithTimeMarker,
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
    };
  }

  private processAdditionalLogCommentRowUntilNextLogComment(line: string) {
    const previousRowWithTimeMarkerIndex = this.rowsWithTimeMarkersHandled - 1;
    if (!this.rowsWithTimeMarkers[previousRowWithTimeMarkerIndex]) {
      throw new TimeLogParsingException(
        "Incorrect parsing state: For some reason we are attempting to collect additional log comment rows until new log comment but we have no previous log comments",
        {
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
      this.notParsedAddTimeMarkers.push(metadata);
    } else if (durationSinceLast > 24 * 60 * 60) {
      // Warn on unlikely large entries (> 24h) - likely typos
      // TODO: Make limit configurable

      metadata.log.push(
        "excessive duration since last: " +
          this.timeLogParser.secondsToDuration(durationSinceLast),
      );
      this.notParsedAddTimeMarkers.push(metadata);
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
      const metadata: RowMetadata = rowsWithTimeMarkers[k];
      const rowIndex = k - 1;

      if (
        metadata.highlightWithNewlines !== undefined &&
        metadata.highlightWithNewlines
      ) {
        contentsWithTimeMarkers += LogParser.NL_NIX;
      }

      contentsWithTimeMarkers += "\t";

      if (
        metadata.durationSinceLast !== undefined &&
        metadata.durationSinceLast !== null
      ) {
        // Remove any known pause durations
        if (!!rowsWithTimeMarkers[rowIndex].pauseDuration) {
          metadata.durationSinceLast -=
            rowsWithTimeMarkers[rowIndex].pauseDuration;
        }

        if (metadata.durationSinceLast < 0) {
          metadata.log.push("negative duration since last");
          metadata.log.push(
            "sent to notParsed in generateStructuredTimeMarkedOutput",
          );
          this.notParsedAddTimeMarkers.push(metadata);
        }

        const parts = metadata.line.split(",");
        parts.shift();
        contentsWithTimeMarkers += metadata.formattedDate;
        contentsWithTimeMarkers +=
          ", " +
          this.timeLogParser.secondsToDuration(metadata.durationSinceLast);

        if (
          !!rowsWithTimeMarkers[rowIndex] &&
          !!rowsWithTimeMarkers[rowIndex].tsIsFaked
        ) {
          // Treat this situation as invalid
          contentsWithTimeMarkers += " {!} ";
          const previousRow = rowsWithTimeMarkers[rowIndex];
          metadata.log.push(
            "duration since last is based on fake/interpolated timestamp",
          );
          metadata.log.push("$previousRow line: " + previousRow.line);
          metadata.log.push(
            "sent to notParsed in generateStructuredTimeMarkedOutput",
          );
          this.notParsedAddTimeMarkers.push(metadata);
        }

        contentsWithTimeMarkers += parts.join(",");
      } else {
        contentsWithTimeMarkers +=
          metadata.line + " {" + metadata.formattedDate + "}";
      }

      contentsWithTimeMarkers += LogParser.NL_NIX;

      if (
        metadata.highlightWithNewlines !== undefined &&
        metadata.highlightWithNewlines
      ) {
        contentsWithTimeMarkers += LogParser.NL_NIX;
      }
    }

    // Remove "pause->" from notParsed array
    if (!!this.notParsedAddTimeMarkers) {
      for (const k of Object.keys(this.notParsedAddTimeMarkers)) {
        const metadata = this.notParsedAddTimeMarkers[k];
        const token = this.timeLogParser.startsWithOptionallySuffixedToken(
          metadata.line + "|$",
          "pause",
          "->|$",
        );

        if (token) {
          delete this.notParsedAddTimeMarkers[k];
        }
      }
    }

    return contentsWithTimeMarkers;
  }

  private detectCategories(contentsWithTimeMarkers) {
    this.categories = [];
    const lines = textIntoLinesArray(contentsWithTimeMarkers);

    for (const line of Object.values(lines)) {
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
