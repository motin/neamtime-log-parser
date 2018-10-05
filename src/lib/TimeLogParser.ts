// Main contents holders
// Metadata arrays
// Helper variables
// var $notParsedAndNotStartStopLinesTimeReport = array();
//
// @param $date_raw
// @param $ts
// @param $date
// @param null $linewithoutdate
// @param $datetime
// @throws Exception
// @throws InvalidDateTimeZoneException
//
//
// Requires that the ->sessions array is populated
//
class TimeLogParser extends LogParser {
  constructor() {
    super(...arguments);
    this.contents = undefined;
    this.preProcessedContents = "";
    this.contentsWithTimeMarkers = "";
    this.contentsOfTimeReport = "";
    this.timeReportData = Array();
    this.notParsedTimeReport = Array();
    this.sessionStarts = Array();
    this.sessions = Array();
    this.timeReportSourceComments = Array();
    this.categories = Array();
    this.collectDebugInfo = false;
    this.debugAddTimeMarkers = Array();
    this.debugGenerateTimeReport = Array();
    this.preProcessedContentsSourceLineContentsSourceLineMap = Array();
    this.reserved_words = [
      "accessible",
      "add",
      "all",
      "alter",
      "analyze",
      "and",
      "as",
      "asc",
      "asensitive",
      "before",
      "between",
      "bigint",
      "binary",
      "blob",
      "both",
      "by",
      "call",
      "cascade",
      "case",
      "change",
      "char",
      "character",
      "check",
      "collate",
      "column",
      "condition",
      "connection",
      "constraint",
      "continue",
      "convert",
      "create",
      "cross",
      "current_date",
      "current_time",
      "current_timestamp",
      "current_user",
      "cursor",
      "database",
      "databases",
      "day_hour",
      "day_microsecond",
      "day_minute",
      "day_second",
      "dec",
      "decimal",
      "declare",
      "default",
      "delayed",
      "delete",
      "desc",
      "describe",
      "deterministic",
      "distinct",
      "distinctrow",
      "div",
      "double",
      "drop",
      "dual",
      "each",
      "else",
      "elseif",
      "enclosed",
      "escaped",
      "exists",
      "exit",
      "explain",
      "false",
      "fetch",
      "float",
      "float4",
      "float8",
      "for",
      "force",
      "foreign",
      "from",
      "fulltext",
      "goto",
      "grant",
      "group",
      "having",
      "high_priority",
      "hour_microsecond",
      "hour_minute",
      "hour_second",
      "if",
      "ignore",
      "in",
      "index",
      "infile",
      "inner",
      "inout",
      "insensitive",
      "insert",
      "int",
      "int1",
      "int2",
      "int3",
      "int4",
      "int8",
      "integer",
      "interval",
      "into",
      "is",
      "iterate",
      "join",
      "key",
      "keys",
      "kill",
      "label",
      "leading",
      "leave",
      "left",
      "like",
      "limit",
      "linear",
      "lines",
      "load",
      "localtime",
      "localtimestamp",
      "lock",
      "long",
      "longblob",
      "longtext",
      "loop",
      "low_priority",
      "master_ssl_verify_server_cert",
      "match",
      "mediumblob",
      "mediumint",
      "mediumtext",
      "middleint",
      "minute_microsecond",
      "minute_second",
      "mod",
      "modifies",
      "natural",
      "no_write_to_binlog",
      "not",
      "null",
      "numeric",
      "on",
      "optimize",
      "option",
      "optionally",
      "or",
      "order",
      "out",
      "outer",
      "outfile",
      "precision",
      "primary",
      "procedure",
      "purge",
      "range",
      "read",
      "read_only",
      "read_write",
      "reads",
      "real",
      "references",
      "regexp",
      "release",
      "rename",
      "repeat",
      "replace",
      "require",
      "reserved",
      "restrict",
      "return",
      "revoke",
      "right",
      "rlike",
      "schema",
      "schemas",
      "second_microsecond",
      "select",
      "sensitive",
      "separator",
      "set",
      "show",
      "smallint",
      "spatial",
      "specific",
      "sql",
      "sql_big_result",
      "sql_calc_found_rows",
      "sql_small_result",
      "sqlexception",
      "sqlstate",
      "sqlwarning",
      "ssl",
      "starting",
      "straight_join",
      "table",
      "terminated",
      "then",
      "tinyblob",
      "tinyint",
      "tinytext",
      "to",
      "trailing",
      "trigger",
      "true",
      "undo",
      "union",
      "unique",
      "unlock",
      "unsigned",
      "update",
      "upgrade",
      "usage",
      "use",
      "using",
      "utc_date",
      "utc_time",
      "utc_timestamp",
      "values",
      "varbinary",
      "varchar",
      "varcharacter",
      "varying",
      "when",
      "where",
      "while",
      "with",
      "write",
      "xor",
      "year_month",
      "zerofill",
      "__class__",
      "__compiler_halt_offset__",
      "__dir__",
      "__file__",
      "__function__",
      "__method__",
      "__namespace__",
      "abday_1",
      "abday_2",
      "abday_3",
      "abday_4",
      "abday_5",
      "abday_6",
      "abday_7",
      "abmon_1",
      "abmon_10",
      "abmon_11",
      "abmon_12",
      "abmon_2",
      "abmon_3",
      "abmon_4",
      "abmon_5",
      "abmon_6",
      "abmon_7",
      "abmon_8",
      "abmon_9",
      "abstract",
      "alt_digits",
      "am_str",
      "array",
      "assert_active",
      "assert_bail",
      "assert_callback",
      "assert_quiet_eval",
      "assert_warning",
      "break",
      "case_lower",
      "case_upper",
      "catch",
      "cfunction",
      "char_max",
      "class",
      "clone",
      "codeset",
      "connection_aborted",
      "connection_normal",
      "connection_timeout",
      "const",
      "count_normal",
      "count_recursive",
      "credits_all",
      "credits_docs",
      "credits_fullpage",
      "credits_general",
      "credits_group",
      "credits_modules",
      "credits_qa",
      "credits_sapi",
      "crncystr",
      "crypt_blowfish",
      "crypt_ext_des",
      "crypt_md5",
      "crypt_salt_length",
      "crypt_std_des",
      "currency_symbol",
      "d_fmt",
      "d_t_fmt",
      "day_1",
      "day_2",
      "day_3",
      "day_4",
      "day_5",
      "day_6",
      "day_7",
      "decimal_point",
      "default_include_path",
      "die",
      "directory_separator",
      "do",
      "e_all",
      "e_compile_error",
      "e_compile_warning",
      "e_core_error",
      "e_core_warning",
      "e_deprecated",
      "e_error",
      "e_notice",
      "e_parse",
      "e_strict",
      "e_user_deprecated",
      "e_user_error",
      "e_user_notice",
      "e_user_warning",
      "e_warning",
      "echo",
      "empty",
      "enddeclare",
      "endfor",
      "endforeach",
      "endif",
      "endswitch",
      "endwhile",
      "ent_compat",
      "ent_noquotes",
      "ent_quotes",
      "era",
      "era_d_fmt",
      "era_d_t_fmt",
      "era_t_fmt",
      "era_year",
      "eval",
      "extends",
      "extr_if_exists",
      "extr_overwrite",
      "extr_prefix_all",
      "extr_prefix_if_exists",
      "extr_prefix_invalid",
      "extr_prefix_same",
      "extr_skip",
      "final",
      "foreach",
      "frac_digits",
      "function",
      "global",
      "grouping",
      "html_entities",
      "html_specialchars",
      "implements",
      "include",
      "include_once",
      "info_all",
      "info_configuration",
      "info_credits",
      "info_environment",
      "info_general",
      "info_license",
      "info_modules",
      "info_variables",
      "ini_all",
      "ini_perdir",
      "ini_system",
      "ini_user",
      "instanceof",
      "int_curr_symbol",
      "int_frac_digits",
      "interface",
      "isset",
      "lc_all",
      "lc_collate",
      "lc_ctype",
      "lc_messages",
      "lc_monetary",
      "lc_numeric",
      "lc_time",
      "list",
      "lock_ex",
      "lock_nb",
      "lock_sh",
      "lock_un",
      "log_alert",
      "log_auth",
      "log_authpriv",
      "log_cons",
      "log_crit",
      "log_cron",
      "log_daemon",
      "log_debug",
      "log_emerg",
      "log_err",
      "log_info",
      "log_kern",
      "log_local0",
      "log_local1",
      "log_local2",
      "log_local3",
      "log_local4",
      "log_local5",
      "log_local6",
      "log_local7",
      "log_lpr",
      "log_mail",
      "log_ndelay",
      "log_news",
      "log_notice",
      "log_nowait",
      "log_odelay",
      "log_perror",
      "log_pid",
      "log_syslog",
      "log_user",
      "log_uucp",
      "log_warning",
      "m_1_pi",
      "m_2_pi",
      "m_2_sqrtpi",
      "m_e",
      "m_ln10",
      "m_ln2",
      "m_log10e",
      "m_log2e",
      "m_pi",
      "m_pi_2",
      "m_pi_4",
      "m_sqrt1_2",
      "m_sqrt2",
      "mon_1",
      "mon_10",
      "mon_11",
      "mon_12",
      "mon_2",
      "mon_3",
      "mon_4",
      "mon_5",
      "mon_6",
      "mon_7",
      "mon_8",
      "mon_9",
      "mon_decimal_point",
      "mon_grouping",
      "mon_thousands_sep",
      "n_cs_precedes",
      "n_sep_by_space",
      "n_sign_posn",
      "namespace",
      "negative_sign",
      "new",
      "noexpr",
      "nostr",
      "old_function",
      "p_cs_precedes",
      "p_sep_by_space",
      "p_sign_posn",
      "path_separator",
      "pathinfo_basename",
      "pathinfo_dirname",
      "pathinfo_extension",
      "pear_extension_dir",
      "pear_install_dir",
      "php_bindir",
      "php_config_file_path",
      "php_config_file_scan_dir",
      "php_datadir",
      "php_debug",
      "php_eol",
      "php_extension_dir",
      "php_extra_version",
      "php_int_max",
      "php_int_size",
      "php_libdir",
      "php_localstatedir",
      "php_major_version",
      "php_maxpathlen",
      "php_minor_version",
      "php_os",
      "php_output_handler_cont",
      "php_output_handler_end",
      "php_output_handler_start",
      "php_prefix",
      "php_release_version",
      "php_sapi",
      "php_shlib_suffix",
      "php_sysconfdir",
      "php_version",
      "php_version_id",
      "php_windows_nt_domain_controller",
      "php_windows_nt_server",
      "php_windows_nt_workstation",
      "php_windows_version_build",
      "php_windows_version_major",
      "php_windows_version_minor",
      "php_windows_version_platform",
      "php_windows_version_producttype",
      "php_windows_version_sp_major",
      "php_windows_version_sp_minor",
      "php_windows_version_suitemask",
      "php_zts",
      "pm_str",
      "positive_sign",
      "print",
      "private",
      "protected",
      "public",
      "radixchar",
      "require_once",
      "seek_cur",
      "seek_end",
      "seek_set",
      "sort_asc",
      "sort_desc",
      "sort_numeric",
      "sort_regular",
      "sort_string",
      "static",
      "str_pad_both",
      "str_pad_left",
      "str_pad_right",
      "switch",
      "t_fmt",
      "t_fmt_ampm",
      "thousands_sep",
      "thousep",
      "throw",
      "try",
      "unset",
      "var",
      "yesexpr",
      "yesstr",
      "commit",
      "start",
    ];
  }

  public tokens() {
    return {
      approx: ["ca", "appr"],
      pause: ["pause", "paus"],
      "start-stop": ["start", "stop"],
      start: ["start"],
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

  public removeSuffixedToken(string, keyword, suffix) {
    let forReturn = string;
    const tokens = this.tokens();

    for (const token of Object.values(tokens[keyword])) {
      forReturn = str_replace(token + suffix, "", forReturn);
    }

    return forReturn;
  }

  public set_ts_and_date(
    date_raw,
    ts,
    date,
    linewithoutdate,
    datetime, // Invalidate strings that are clearly too large to be a timestamp // var_dump($date_raw,$m);
  ) {
    this.lastSetTsAndDateErrorMessage = "";

    if (date_raw.length > 50) {
      this.lastSetTsAndDateErrorMessage =
        "Invalidate strings that are clearly too large to be a timestamp";
      return;
    }

    preg_match("/[0-9]+/", date_raw, m);

    if (!m) {
      this.lastSetTsAndDateErrorMessage =
        "Invalidate strings that do not contain numbers, since they can not be a timestamp";
      return;
    }

    if (date_raw.length < 8) {
      // var_dump($date_raw);
      date_raw = this.lastKnownDate + ` ${date_raw}`;
    }

    const tokens = this.tokens();
    date_raw = str_replace(tokens.approx, "", date_raw).trim();
    super.set_ts_and_date(date_raw, ts, date, linewithoutdate, datetime);
  }

  public loadContentsFromFile() {
    const tspath = _SERVER.argv[1];
    this.contents = file_get_contents(`${tspath}.txt`);
  }

  public isProbableStartStopLine(line, dump = false) {
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

    if (dump) {
      console.log(trimmedLine, trimmedLine, str_hex(trimmedLine), forReturn);
    }

    return forReturn;
  }

  public countDigits(str) {
    return preg_match_all("/[0-9]/", str);
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

  public preProcessContents() {
    this.preProcessedContents = this.getPreProcessedContents(
      this.tz_first,
      this.contents,
    );
  }

  public getPreProcessedContents(
    tz_first,
    contents, // Phase 0 - skip lines after "#endts" // Phase 1 - paus-fixes // Phase 2 - missing start-lines
  ) {
    this.lastKnownTimeZone = tz_first;
    let processed = Array();
    let lines = this.constructor.textIntoLinesArray(contents);
    let nextNeedToBeStart = true;
    const _lines = lines;
    lines = Array();

    for (const k in _lines) {
      const line = _lines[k];

      if (line.trim() == "#endts") {
        break;
      }

      lines.push(line);
    }

    const phase1_source_line_contents_source_line_map = Array();

    // Actual source line is +1
    // Skip empty lines
    for (const source_line_index in lines) {
      // always use trimmed line for comparisons
      const line = lines[source_line_index];
      let trimmedLine = line.trim();
      const source_line = source_line_index + 1;
      const testempty = trimmedLine;

      if (!testempty) {
        processed.push(trimmedLine);
        phase1_source_line_contents_source_line_map[
          processed.length
        ] = source_line;
        continue;
      }

      let token = this.startsWithOptionallySuffixedToken(
        trimmedLine,
        "pause",
        " ->",
      );

      if (token) {
        trimmedLine = str_replace(`${token} ->`, `${token}->`, trimmedLine);
      }

      token = this.startsWithOptionallySuffixedToken(trimmedLine, "pause");

      if (!!token && strpos(trimmedLine, "->") !== false) {
        // Checking if a timestamp exists before the "->"
        const rowParts = trimmedLine.split("->");
        const tokens = this.tokens();
        let trimmedLinefordatecheck = str_replace(
          tokens.pause,
          "",
          rowParts[0].trim(),
        );
        trimmedLinefordatecheck = str_replace(
          tokens.approx,
          "",
          trimmedLinefordatecheck,
        );

        if (
          trimmedLinefordatecheck.length > 1 &&
          strpos(trimmedLinefordatecheck, "min") === false
        ) {
          // var_dump($metadata["date_raw"], $trimmedLinefordatecheck, $ts, $date);
          // $invalid = empty($date);
          this.detectTimeStamp(trimmedLinefordatecheck, metadata);
          let datetime;
          this.set_ts_and_date(
            metadata.date_raw,
            ts,
            date,
            undefined,
            datetime,
          );

          if (!!metadata.date_raw) {
            // $formatted_date = gmdate("Y-m-d H:i", $ts); //:s
            const implicitMessage =
              trimmedLinefordatecheck + `, <just before ${token}>`;
            processed.push(implicitMessage);
            phase1_source_line_contents_source_line_map[
              processed.length
            ] = source_line;
            processed.push(`${token}->` + rowParts[1]);
            phase1_source_line_contents_source_line_map[
              processed.length
            ] = source_line;
            continue;
          }
        }
      }

      processed.push(trimmedLine);
      phase1_source_line_contents_source_line_map[
        processed.length
      ] = source_line;
    }

    lines = processed;
    processed = Array();

    // Actual source line is +1
    // Get raw source line
    // Skip empty lines
    for (const phase_1_processed_line_index in lines) {
      // always use trimmed line for comparisons
      const line = lines[phase_1_processed_line_index];
      trimmedLine = line.trim();
      const phase_1_processed_line = phase_1_processed_line_index + 1;
      source_line =
        phase1_source_line_contents_source_line_map[phase_1_processed_line];
      testempty = trimmedLine;

      if (!testempty) {
        processed.push(trimmedLine);
        this.preProcessedContentsSourceLineContentsSourceLineMap[
          processed.length
        ] = source_line;
        continue;
      }

      if (strpos(trimmedLine, "start") === 0) {
        nextNeedToBeStart = false;
      }

      if (nextNeedToBeStart) {
        // We have a certain syntax that can recover a missing start line, let's check for that:
        // @var DateTime $datetime
        let date_raw;
        let ts;
        let date;
        let trimmedLinewithoutdate;
        let notTheFirstRowOfALogComment;
        datetime = undefined;
        this.parseLogComment(
          trimmedLine,
          date_raw,
          ts,
          date,
          trimmedLinewithoutdate,
          notTheFirstRowOfALogComment,
          datetime,
        );

        if (!notTheFirstRowOfALogComment) {
          // todo dynamic insertion of apprtokens
          let preg = "/^(ca|appr)? ?((\\d)+h)?(\\d+)min/";
          preg_match(preg, trimmedLinewithoutdate, m);

          if (!!m) {
            const apprtoken = m[1];
            const hours = Math.round(m[3]);
            const minutes = Math.round(m[4]) + hours * 60;
          } // Check for hours without minutes as well
          // todo dynamic insertion of apprtokens
          else {
            preg = "/^(ca|appr)? ?(\\d)+h/";
            preg_match(preg, trimmedLinewithoutdate, m);

            if (!!m) {
              apprtoken = m[1];
              hours = Math.round(m[2]);
              minutes = hours * 60;
            }
          }

          if (!!minutes) {
            // Here we, instead of start, have a single line with a duration. We can calculate the start from this...
            // gmdate("Y-m-d H:i", $ts - $minutes * 60);
            // var_dump(__LINE__, $probableStart, $date, $minutes, $this->lastKnownTimeZone);
            // note: timestamp generated from duration info in line below;
            // $processed[] = "start MISSING? asdasdas: ".$trimmedLinewithoutdate.print_r(array($trimmedLine, $date_raw, $date, $trimmedLinewithoutdate, $notTheFirstRowOfALogComment), true).print_r($m, true);
            const interval = DateInterval.createFromDateString(
              minutes + " minutes",
            );

            if (!datetime) {
              throw new TimeLogParsingException(
                "To be able to calculate the special-syntax-missing-start-line we need to have the DateTime object of the line to subtract from",
              );
            }

            const probableStartDateTime = datetime.sub(interval);
            const probableStart = probableStartDateTime.format("Y-m-d H:i");
            processed.push(`start ${probableStart}` + apprtoken);
            this.preProcessedContentsSourceLineContentsSourceLineMap[
              processed.length
            ] = source_line;
            processed.push("");
            this.preProcessedContentsSourceLineContentsSourceLineMap[
              processed.length
            ] = source_line;
            processed.push(trimmedLine);
            this.preProcessedContentsSourceLineContentsSourceLineMap[
              processed.length
            ] = source_line;
            nextNeedToBeStart = false;
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
          ] = source_line;
          nextNeedToBeStart = true;
          continue;
        }

        processed.push("start MISSING?");
        this.preProcessedContentsSourceLineContentsSourceLineMap[
          processed.length
        ] = source_line;
        nextNeedToBeStart = false;
      }

      token = this.startsWithOptionallySuffixedToken(
        trimmedLine + "|$",
        "pause",
        "->|$",
      );

      if (token) {
        processed.push(trimmedLine);
        this.preProcessedContentsSourceLineContentsSourceLineMap[
          processed.length
        ] = source_line;
        nextNeedToBeStart = true;
        continue;
      }

      processed.push(trimmedLine);
      this.preProcessedContentsSourceLineContentsSourceLineMap[
        processed.length
      ] = source_line;
    }

    return this.constructor.linesArrayIntoText(processed);
  }

  public parseLogComment(
    line,
    date_raw,
    ts,
    date,
    linewithoutdate,
    notTheFirstRowOfALogComment,
    datetime, // "," is the main separator between date and any written comment...
  ) {
    this.parseLogCommentWithSeparator(
      ",",
      line,
      date_raw,
      ts,
      date,
      linewithoutdate,
      notTheFirstRowOfALogComment,
      datetime,
    );

    if (!notTheFirstRowOfALogComment) {
      return;
    }

    this.parseLogCommentWithSeparator(
      " -",
      line,
      date_raw,
      ts,
      date,
      linewithoutdate,
      notTheFirstRowOfALogComment,
      datetime,
    );

    if (!notTheFirstRowOfALogComment) {
      return;
    }

    this.parseLogCommentWithSeparator(
      ": ",
      line,
      date_raw,
      ts,
      date,
      linewithoutdate,
      notTheFirstRowOfALogComment,
      datetime,
    );

    if (!notTheFirstRowOfALogComment) {
      return;
    }
  }

  public parseLogCommentWithSeparator(
    separator,
    line,
    date_raw,
    ts,
    date,
    linewithoutdate,
    notTheFirstRowOfALogComment,
    datetime, // Check if we have a valid date already // If not, allow one more separated chunk into the date_raw and try again // since some timestamp formats may include the seperator (at most once)
  ) {
    const parts = line.split(separator);
    date_raw = parts.shift();
    date = undefined;
    linewithoutdate = parts.join(separator);
    datetime = undefined;
    this.parseLogCommentDateRawCandidate(
      date_raw,
      ts,
      date,
      linewithoutdate,
      notTheFirstRowOfALogComment,
      datetime,
    );

    if (notTheFirstRowOfALogComment && parts.length > 1) {
      date_raw += separator + parts.shift();
      date = undefined;
      linewithoutdate = parts.join(separator);
      datetime = undefined;
      this.parseLogCommentDateRawCandidate(
        date_raw,
        ts,
        date,
        linewithoutdate,
        notTheFirstRowOfALogComment,
        datetime,
      );
    }
  }

  public parseLogCommentDateRawCandidate(
    date_raw,
    ts,
    date,
    linewithoutdate,
    notTheFirstRowOfALogComment,
    datetime, // invalidate pure numbers (including those with fractional parts) if there is no comment on the other side - probably not a real log comment // invalidate lines without a valid date
  ) {
    preg_match("/[0-9\\.\\,]+/", date_raw, m);

    if (!!m[0]) {
      const firstMatch = m[0];
      const trimmedDateRaw = date_raw.trim();

      if (
        str_replace([".", ","], "", firstMatch) ===
          str_replace([".", ","], "", trimmedDateRaw) &&
        !linewithoutdate.trim()
      ) {
        // Due to some odd logic in some other file, we also can't set ts and date for this row
        notTheFirstRowOfALogComment = true;
        return;
      }
    }

    this.set_ts_and_date(date_raw, ts, date, linewithoutdate, datetime);
    notTheFirstRowOfALogComment = !date;
  }

  public addTimeMarkers() {
    this.lastKnownTimeZone = this.tz_first;
    this.preProcessContents();
    const rows_with_timemarkers = Array();
    const not_parsed = Array();

    if (this.collectDebugInfo) {
      this.debugAddTimeMarkers = Array();
    }

    this.parsePreProcessedContents(
      this.preProcessedContents,
      rows_with_timemarkers,
      not_parsed,
    );
    this.contentsWithTimeMarkers = this.generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
      rows_with_timemarkers,
      not_parsed,
    );

    if (this.collectDebugInfo) {
      this.debugAddTimeMarkers.rows_with_timemarkers = rows_with_timemarkers;
      this.debugAddTimeMarkers.not_parsed = not_parsed;
    }
  }

  public parsePreProcessedContents(
    preProcessedContents,
    rows_with_timemarkers,
    not_parsed,
  ) {
    const original_unsorted_rows = Array();
    let rows_with_timemarkers_handled = 0;
    const lines = this.constructor.textIntoLinesArray(preProcessedContents);

    // skip empty rows
    // Detect and switch timezone change
    // Remove whitespace noise
    // Save the trimmed line as $line since the legacy code expects it to be called that
    // DATETIME
    // $line = utf8_encode($line);
    // :s
    // If lastKnownTimeZone and lastUsedTimeZone are different: Send to not_parsed but parse anyway (so that general parsing goes through but that the log is not considered correct)
    // codecept_debug(["first check", $notTheFirstRowOfALogComment, $metadata]); // While devving
    // Catch lines that has a timestamp but not in the beginning
    // Handle new-found rows with timemarker
    // While devving, just work on small subset of all rows
    for (const preprocessed_contents_source_line_index in lines) {
      // Actual source line is +1
      let line = lines[preprocessed_contents_source_line_index];
      let trimmedLine = line.trim();
      const preprocessed_contents_source_line =
        preprocessed_contents_source_line_index + 1;

      if (trimmedLine == "") {
        continue;
      }

      const source_line = this
        .preProcessedContentsSourceLineContentsSourceLineMap[
        preprocessed_contents_source_line
      ];

      if (strpos(trimmedLine, "|tz:") === 0) {
        this.lastKnownTimeZone = str_replace("|tz:", "", trimmedLine);
        continue;
      }

      const line_with_comment = trimmedLine;
      trimmedLine = trimmedLine.replace(/#.*/g, "").trim();
      trimmedLine = this.constructor.newline_convert(trimmedLine, "");
      const line = trimmedLine;
      let date_raw;
      let ts;
      let date;
      let linewithoutdate;
      let notTheFirstRowOfALogComment;
      let datetime;
      this.parseLogComment(
        line,
        date_raw,
        ts,
        date,
        linewithoutdate,
        notTheFirstRowOfALogComment,
        datetime,
      );
      const timezone = new DateTimeZone("UTC");
      datetime = new DateTime();
      datetime.setTimezone(timezone);
      datetime.setTimestamp(ts);
      const formatted_date = datetime.format("Y-m-d H:i");
      const log = Array();
      const lastKnownTimeZone = this.lastKnownTimeZone;
      const lastUsedTimeZone = this.lastUsedTimeZone;
      const lastSetTsAndDateErrorMessage = this.lastSetTsAndDateErrorMessage;
      const metadata = compact(
        "rows_with_timemarkers_handled",
        "line",
        "line_with_comment",
        "formatted_date",
        "date",
        "date_raw",
        "ts",
        "log",
        "source_line",
        "preprocessed_contents_source_line_index",
        "lastKnownTimeZone",
        "lastUsedTimeZone",
        "lastSetTsAndDateErrorMessage",
      );

      if (this.interpretLastKnownTimeZone() !== this.lastUsedTimeZone) {
        const methodName = "parsePreProcessedContents";
        metadata.log.push(
          `Invalid timezone ('${
            this.lastKnownTimeZone
          }') encountered when parsing a row (source line: ${source_line}). Not treating this row as valid time-marked row`,
        );
        metadata.log.push("Sent to not_parsed in " + methodName);
        not_parsed.push(metadata);
      }

      let isNewRowWithTimeMarker = false;
      const notTheFirstRowOfALogCommentAndProbableStartStopLine =
        notTheFirstRowOfALogComment && this.isProbableStartStopLine(line);
      const isTheFirstRowWithTimeMarker = !rows_with_timemarkers[
        rows_with_timemarkers_handled - 1
      ];
      const hasAPreviousRowWithTimemarker = !isTheFirstRowWithTimeMarker;
      const previousRowWithTimemarkerHasTheSameDate =
        hasAPreviousRowWithTimemarker &&
        rows_with_timemarkers[rows_with_timemarkers_handled - 1]
          .formatted_date == formatted_date;

      if (notTheFirstRowOfALogCommentAndProbableStartStopLine) {
        isNewRowWithTimeMarker = true;
        this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
          line,
          metadata,
          rows_with_timemarkers,
          rows_with_timemarkers_handled,
          not_parsed,
          isNewRowWithTimeMarker,
        );
      } else if (notTheFirstRowOfALogComment) {
        this.processAdditionalLogCommentRowUntilNextLogComment(
          line,
          rows_with_timemarkers,
          rows_with_timemarkers_handled,
        );
        isNewRowWithTimeMarker = false;
      } else if (previousRowWithTimemarkerHasTheSameDate) {
        this.processAdditionalLogCommentRowUntilNextLogComment(
          line,
          rows_with_timemarkers,
          rows_with_timemarkers_handled,
        );
        isNewRowWithTimeMarker = false;
      } else {
        const theFirstRowOfALogComment = true;
        this.processTheFirstRowOfALogComment(
          ts,
          isNewRowWithTimeMarker,
          metadata,
          rows_with_timemarkers,
          rows_with_timemarkers_handled,
          not_parsed,
        );
      }

      if (isNewRowWithTimeMarker) {
        rows_with_timemarkers[rows_with_timemarkers_handled] = metadata;
        rows_with_timemarkers_handled++;
      }

      original_unsorted_rows.push(metadata);

      if (rows_with_timemarkers_handled >= 100000) {
        throw new TimeLogParsingException(
          "Time log exceeds maximum allowed size",
        );
        break;
      }
    }

    if (this.collectDebugInfo) {
      this.debugAddTimeMarkers.original_unsorted_rows = original_unsorted_rows;
    }
  }

  public processNotTheFirstRowOfALogCommentAndProbableStartStopLine(
    line,
    metadata,
    rows_with_timemarkers,
    rows_with_timemarkers_handled,
    not_parsed,
    isNewRowWithTimeMarker, // Assume true // Check if it's a pause with written duration
  ) {
    const startsWithPauseToken = this.startsWithOptionallySuffixedToken(
      line,
      "pause",
    );
    const isTheFirstRowWithTimeMarker = !rows_with_timemarkers[
      rows_with_timemarkers_handled - 1
    ];
    const probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    const pauseWithWrittenDuration =
      startsWithPauseToken && strpos(line, "min") !== false;

    if (pauseWithWrittenDuration) {
      this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
        metadata,
        rows_with_timemarkers,
        rows_with_timemarkers_handled,
        not_parsed,
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
      );
    } else {
      this.processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
        line,
        startsWithPauseToken,
        metadata,
        rows_with_timemarkers,
        rows_with_timemarkers_handled,
        not_parsed,
        probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
        isNewRowWithTimeMarker,
      );
    }

    if (!probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp) {
      // If last valid row is not enabled - throw a large exception, is this log contents?
      if (isTheFirstRowWithTimeMarker) {
        throw new TimeLogParsingException("No valid start of log file");
      }

      metadata.ts = rows_with_timemarkers[rows_with_timemarkers_handled - 1].ts;
      metadata.ts_is_faked = true;
      const timezone = new DateTimeZone("UTC");
      const datetime = new DateTime();
      datetime.setTimezone(timezone);
      datetime.setTimestamp(metadata.ts);
      metadata.formatted_date = datetime.format("Y-m-d H:i:s");
      metadata.highlight_with_newlines = true;
      metadata.line = metadata.line;
    } // We keep track of sessions starts for double-checking that time has registered on each of those dates
    else {
      const startsWithStartTokenFollowedByASpace = this.startsWithOptionallySuffixedToken(
        line,
        "start",
        " ",
      );

      if (startsWithStartTokenFollowedByASpace) {
        this.sessionStarts.push(metadata);
      }
    }
  }

  public processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration(
    metadata,
    rows_with_timemarkers,
    rows_with_timemarkers_handled,
    not_parsed,
    probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp, // preg_match('/([^-]-[^-]-2009) ([^:]*):([^c ]*)/', $linefordatecheck, $m); // $metadata["duration_search_preg_debug"] = compact("linefordurationcheck","m");
  ) {
    const methodName =
      "processNotTheFirstRowOfALogCommentAndProbableStartStopLine_pauseWithWrittenDuration";
    metadata.log.push("found a pause with written duration");
    metadata.ts = rows_with_timemarkers[rows_with_timemarkers_handled - 1].ts;
    metadata.ts_is_faked = true;
    const timezone = new DateTimeZone("UTC");

    const _datetime = new DateTime();

    _datetime.setTimezone(timezone);

    _datetime.setTimestamp(metadata.ts);

    metadata.formatted_date = _datetime.format("Y-m-d H:i:s");
    metadata.highlight_with_newlines = true;
    const parts = metadata.line.split("->");
    const linefordurationcheck = parts[0];
    preg_match_all("/(([0-9])*h)?([0-9]*)min/", linefordurationcheck, m);

    if (!!m && !!m[0]) {
      // var_dump($line, $m, $rows_with_timemarkers_handled, $rows_with_timemarkers);
      metadata.log.push(
        "found pause duration, adding to accumulated pause duration (if any)",
      );

      if (
        !!rows_with_timemarkers[rows_with_timemarkers_handled - 1]
          .pause_duration
      ) {
        metadata.pause_duration = Math.round(
          rows_with_timemarkers[rows_with_timemarkers_handled - 1]
            .pause_duration,
        );
      } else {
        metadata.pause_duration = 0;
      }

      metadata.pause_duration +=
        60 * (Math.round(m[2][0]) * 60 + Math.round(m[3][0]));
      metadata.ts_is_faked = false;
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    } // To easily see patterns amongst these lines
    else {
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
      metadata.log.push("sent to not_parsed in " + methodName);
      not_parsed.push(metadata);
    }
  }

  public processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration(
    line,
    startsWithPauseToken,
    metadata,
    rows_with_timemarkers,
    rows_with_timemarkers_handled,
    not_parsed,
    probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp,
    isNewRowWithTimeMarker, // Try to find a valid timestamp // Remove the pause specification before attempting to find a timestamp // @var DateTime $datetime // var_dump($ts, $date, $datetime); // Check if the timestamp is later or same as previous row with time marker (if not, something is wrong)
  ) {
    const methodName =
      "processNotTheFirstRowOfALogCommentAndProbableStartStopLine_notPauseWithWrittenDuration";
    let linefordatecheck = line;

    if (startsWithPauseToken) {
      linefordatecheck = this.removeSuffixedToken(
        linefordatecheck,
        "pause",
        "->",
      );
      linefordatecheck = this.removeSuffixedToken(
        linefordatecheck,
        "pause",
        " ",
      );
      linefordatecheck = this.removeSuffixedToken(
        linefordatecheck,
        "pause",
        "",
      );
    }

    this.detectTimeStamp(linefordatecheck, metadata);
    let datetime;
    let ts;
    let date;
    this.set_ts_and_date(metadata.date_raw, ts, date, undefined, datetime);
    const validTimestampFound = !!date;
    let thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker;
    let duration_since_last;

    if (validTimestampFound === true) {
      // Get duration from last count
      duration_since_last = this.durationFromLast(
        ts,
        rows_with_timemarkers_handled,
        rows_with_timemarkers,
      );

      if (duration_since_last < 0) {
        thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker = false;
      } else {
        thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker = true;
      }
    }

    if (validTimestampFound !== true) {
      // Treat as AdditionalLogCommentRowUntilNextLogComment if not a pause line
      metadata.log.push(
        "Did NOT find a valid timestamp in a probable start/pause-row. Not treating this row as a time-marked row",
      );
      metadata.log.push(`Line: ${line}`);

      if (!startsWithPauseToken) {
        metadata.log.push(
          "Sent to processAdditionalLogCommentRowUntilNextLogComment in " +
            methodName,
        );
        this.processAdditionalLogCommentRowUntilNextLogComment(
          line,
          rows_with_timemarkers,
          rows_with_timemarkers_handled,
        );
        isNewRowWithTimeMarker = false;
      } // To easily see patterns amongst these lines
      else {
        metadata.log.push("Sent to not_parsed in " + methodName);
        not_parsed.push(metadata);
      }
    }

    if (thisTimestampIsLaterOrSameAsPreviousRowWithTimeMarker === false) {
      // To easily see patterns amongst these lines
      metadata.log.push(
        "Timestamp found in probable start/pause-row, but was earlier than last found",
      );
      metadata.log.push(`Line: ${line}`);
      const last = clone(datetime);
      last.add(new DateInterval("PT" + Math.abs(duration_since_last) + "S"));
      metadata.log.push(
        `Timestamp found: ${datetime.format(
          "Y-m-d H:i:s",
        )} vs last found (based on duration since last which is ${duration_since_last}): ${last.format(
          "Y-m-d H:i:s",
        )}`,
      );
      metadata.log.push("Sent to not_parsed in " + methodName);
      not_parsed.push(metadata);
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
      datetime = new DateTime();
      datetime.setTimezone(timezone);
      datetime.setTimestamp(ts);
      metadata.formatted_date = datetime.format("Y-m-d H:i:s");
      metadata.ts_is_faked = false;
      metadata.highlight_with_newlines = true;
      metadata.line = metadata.line;
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = true;
    } else {
      probableStartStopLineIsIndeedStartStopLineWithSaneTimestamp = false;
    }
  }

  public processAdditionalLogCommentRowUntilNextLogComment(
    line,
    rows_with_timemarkers,
    rows_with_timemarkers_handled,
  ) {
    if (
      !(undefined !== rows_with_timemarkers[rows_with_timemarkers_handled - 1])
    ) {
      throw new TimeLogParsingException(
        "Incorrect parsing state: For some reason we are attempting to collect additional log comment rows until new log comment but we have no previous log comments",
      );
    }

    rows_with_timemarkers[rows_with_timemarkers_handled - 1].line +=
      " | " + line;
  }

  public processTheFirstRowOfALogComment(
    ts,
    isNewRowWithTimeMarker,
    metadata,
    rows_with_timemarkers,
    rows_with_timemarkers_handled,
    not_parsed, // Get duration from last count
  ) {
    const duration_since_last = this.durationFromLast(
      ts,
      rows_with_timemarkers_handled,
      rows_with_timemarkers,
    );

    if (duration_since_last < 0) {
      // Debug log info
      metadata.log.push("negative duration since last");
      isNewRowWithTimeMarker = false;
      const timezone = new DateTimeZone("UTC");
      const datetime = new DateTime();
      datetime.setTimezone(timezone);
      datetime.setTimestamp(ts);
      const last = clone(datetime);
      last.add(new DateInterval("PT" + Math.abs(duration_since_last) + "S"));
      metadata.log.push(
        `Timestamp found: ${datetime.format(
          "Y-m-d H:i:s",
        )} vs last found (based on duration since last which is ${duration_since_last}): ${last.format(
          "Y-m-d H:i:s",
        )}`,
      );
      const previousRowWithTimeMarker =
        rows_with_timemarkers[rows_with_timemarkers_handled - 1];
      metadata.log.push(
        `$previousRowWithTimeMarker line: ${previousRowWithTimeMarker.line}`,
      );
      metadata.log.push(
        "sent to not_parsed in processTheFirstRowOfALogComment",
      );
      not_parsed.push(metadata);
    } else if (duration_since_last > 24 * 60 * 60) {
      // Warn on unlikely large entries (> 24h) - likely typos
      // TODO: Make limit configurable
      metadata.log.push(
        "excessive duration since last: " +
          this.secondsToDuration(duration_since_last),
      );
      not_parsed.push(metadata);
      isNewRowWithTimeMarker = true;
    } else {
      metadata.duration_since_last = duration_since_last;
      isNewRowWithTimeMarker = true;
    }
  }

  public generateStructuredTimeMarkedOutputBasedOnParsedRowsWithTimeMarkers(
    rows_with_timemarkers,
    not_parsed, // Generate structured log output
  ) {
    if (!rows_with_timemarkers) {
      throw new TimeLogParsingException("No rows parsed...");
    }

    const last = rows_with_timemarkers.pop();

    if (false) {
      // The last pause was started some time after the last log message
    } else {
      rows_with_timemarkers.push(last);
    }

    return this.generateStructuredTimeMarkedOutput(
      rows_with_timemarkers,
      not_parsed,
    );
  }

  public generateStructuredTimeMarkedOutput(
    rows_with_timemarkers,
    not_parsed, // Remove "paus->" from not_parsed array
  ) {
    let contentsWithTimeMarkers = "";
    contentsWithTimeMarkers += ".:: Uncategorized\n";

    for (const k in rows_with_timemarkers) {
      const metadata = rows_with_timemarkers[k];

      if (
        undefined !== metadata.highlight_with_newlines &&
        metadata.highlight_with_newlines
      ) {
        contentsWithTimeMarkers += this.constructor.NL_NIX;
      }

      contentsWithTimeMarkers += "\t";

      if (
        undefined !== metadata.duration_since_last &&
        !is_null(metadata.duration_since_last)
      ) {
        // Remove any known pause durations
        if (!!rows_with_timemarkers[k - 1].pause_duration) {
          metadata.duration_since_last -=
            rows_with_timemarkers[k - 1].pause_duration;
        }

        if (metadata.duration_since_last < 0) {
          metadata.log.push("negative duration since last");
          metadata.log.push(
            "sent to not_parsed in generateStructuredTimeMarkedOutput",
          );
          not_parsed.push(metadata);
        }

        const parts = metadata.line.split(",");
        parts.shift();
        contentsWithTimeMarkers += metadata.formatted_date;
        contentsWithTimeMarkers +=
          ", " + this.secondsToDuration(metadata.duration_since_last);

        if (
          !!rows_with_timemarkers[k - 1] &&
          !!rows_with_timemarkers[k - 1].ts_is_faked
        ) {
          // Treat this situation as invalid
          contentsWithTimeMarkers += " {!} ";
          const previousRow = rows_with_timemarkers[k - 1];
          metadata.log.push(
            "duration since last is based on fake/interpolated timestamp",
          );
          metadata.log.push("$previousRow line: " + previousRow.line);
          metadata.log.push(
            "sent to not_parsed in generateStructuredTimeMarkedOutput",
          );
          not_parsed.push(metadata);
        }

        contentsWithTimeMarkers += parts.join(",");
      } else {
        contentsWithTimeMarkers +=
          metadata.line + " {" + metadata.formatted_date + "}";
      }

      contentsWithTimeMarkers += this.constructor.NL_NIX;

      if (
        undefined !== metadata.highlight_with_newlines &&
        metadata.highlight_with_newlines
      ) {
        contentsWithTimeMarkers += this.constructor.NL_NIX;
      }
    }

    if (!!not_parsed) {
      for (const k in not_parsed) {
        const metadata = not_parsed[k];
        const token = this.startsWithOptionallySuffixedToken(
          metadata.line + "|$",
          "pause",
          "->|$",
        );

        if (token) {
          delete not_parsed[k];
        }
      }
    }

    this.notParsedAddTimeMarkers = not_parsed;
    return contentsWithTimeMarkers;
  }

  public notParsedAddTimeMarkersErrorSummary(not_parsed) {
    if (!not_parsed) {
      throw new TimeLogParsingException(
        "Can not summarize not-parsed errors without any unparsed contents",
      );
    }

    const summary = Array();

    for (const v of Object.values(not_parsed)) {
      if (Array.isArray(v) && !!v.source_line) {
        summary[v.source_line] = v;
      } else {
        throw new TimeLogParsingException(
          "The unparsed contents did not contain information about the source line: " +
            print_r(v, true),
        );
      }
    }

    return summary;
  }

  public notParsedTimeReportErrorSummary(not_parsed) {
    if (!not_parsed) {
      throw new TimeLogParsingException(
        "Can not summarize not-parsed errors without any unparsed contents",
      );
    }

    const summary = Array();

    for (const v of Object.values(not_parsed)) {
      summary.push(v);
    }

    return summary;
  }

  public detectCategories() {
    this.categories = Array();
    const lines = this.constructor.textIntoLinesArray(
      this.contentsWithTimeMarkers,
    );

    for (const line of Object.values(lines)) {
      // skip empty rows
      const trimmedLine = line.trim();

      if (trimmedLine == "") {
        continue;
      }

      if (strpos(line, ".::") === 0) {
        const catneedle = str_replace(".::", "", trimmedLine).trim();
        this.categories.push(catneedle);
      }
    }
  }

  public generateTimeReport() // Fill out and sort the times-array
  // print in a csv-format:
  // var_dump($times);
  {
    this.lastKnownTimeZone = this.tz_first;
    let contentsOfTimeReport = "";
    let times = Array();
    const not_parsed = Array();

    if (!this.categories) {
      this.detectCategories(this.contentsWithTimeMarkers);
    }

    const lines = this.constructor.textIntoLinesArray(
      this.contentsWithTimeMarkers,
    );
    let category = "Unspecified";

    // Special care is necessary here - ts is already in UTC, so we parse it as such, but we keep lastKnownTimeZone since we want to know the source row's timezone
    // Check for startstopline - they are not invalid, only ignored
    // Only check until first |
    // invalidate
    // TEXT
    // Save a useful form of the time-marked rows that build up the hours-sum:
    for (const lineno in lines) {
      // skip empty rows
      const line = lines[lineno];
      const trimmedLine = line.trim();

      if (trimmedLine == "") {
        continue;
      }

      if (strpos(line, ".::") === 0) {
        const catneedle = str_replace(".::", "", trimmedLine).trim();

        if (-1 !== this.categories.indexOf(catneedle)) {
          category = catneedle;
          continue;
        }
      }

      if (category == "Ignored") {
        continue;
      }

      if (strpos(trimmedLine, "|tz:") === 0) {
        this.lastKnownTimeZone = str_replace("|tz:", "", trimmedLine);
        continue;
      }

      let parts = line.split(",");
      const date_raw = parts.shift();
      const linewithoutdate = parts.join(",");
      let datetime;
      const _ = this.lastKnownTimeZone;
      this.lastKnownTimeZone = "UTC";
      this.set_ts_and_date(date_raw, ts, date, linewithoutdate, datetime);
      this.lastKnownTimeZone = _;
      parts = line.split(" | ");
      const beforeVertLine = parts[0];

      if (this.isProbableStartStopLine(beforeVertLine)) {
        continue;
      }

      let invalid =
        !date ||
        strpos(linewithoutdate, "min") === false ||
        ts < time() - 24 * 3600 * 365 * 10;

      if (invalid) {
        not_parsed.push(line);
        continue;
      }

      parts = linewithoutdate.split("min");
      const tokens = this.tokens();
      const duration = str_replace(tokens.approx, "", parts[0]).trim() + "min";
      const time = this.durationToMinutes(duration);
      invalid = !time && time !== 0;

      if (invalid) {
        not_parsed.push(line);
        continue;
      }

      const hours_rounded = Math.round(time / 60, 2);
      const hours = time / 60;
      const first = parts.shift();
      let text = parts.join("min");
      invalid = !text;

      if (invalid) {
        // var_dump($first, $parts, $line); die();
        // $not_parsed[] = $line; continue;
        text = "<empty log item>";
      }

      if (!times[date]) {
        times[date] = Array();
      }

      if (!times[date].text) {
        times[date].text = Array();
      }

      times[date].text.push(trim(text, " ,\t\r\n"));

      if (!times[date][category]) {
        times[date][category] = hours;
      } else {
        times[date][category] += hours;
      }

      const sourceComment = compact(
        "category",
        "timemarker",
        "linewithoutdate",
        "ts",
        "date_raw",
        "date",
        "hours_rounded",
        "hours",
        "text",
      );
      sourceComment.tz = this.lastKnownTimeZone;
      this.timeReportSourceComments.push(sourceComment);
    }

    this.timeReportData = times = this.addZeroFilledDates(times);
    contentsOfTimeReport +=
      "Date;" +
      this.categories.join(" (rounded);") +
      " (rounded);" +
      this.categories.join(";") +
      ";Log_Items\n";

    //
    // replace point by comma
    // $hours_by_category_rounded = str_replace(".", ",", $hours_by_category_rounded);
    // replace point by comma
    // $hours_by_category = str_replace(".", ",", $hours_by_category);
    for (const date in times) {
      // Gotta limit the amount of data
      const hours = times[date];
      let activities = Array.from(hours.text).join(" | ");
      activities = this.constructor.newline_convert(activities, "");
      activities = str_replace([";", "\t"], [",", "   "], activities);
      activities = mb_substr(activities, 0, 1024, "UTF-8").trim();
      let hours_by_category_rounded = "";

      for (const c of Object.values(this.categories)) {
        const hours_exact = undefined !== hours[c] ? hours[c] : 0;
        hours_rounded = Math.round(hours_exact, 2);
        hours_by_category_rounded += hours_rounded + ";";
      }

      let hours_by_category = "";

      for (const c of Object.values(this.categories)) {
        hours_exact = undefined !== hours[c] ? hours[c] : 0;
        hours_by_category += hours_exact + ";";
      }

      contentsOfTimeReport +=
        date +
        ";" +
        hours_by_category_rounded +
        hours_by_category +
        activities +
        this.constructor.NL_NIX;
    }

    this.notParsedTimeReport = not_parsed;

    for (const line of Object.values(not_parsed)) {
      // maybe attempt to add some debugging metadata here?
    }

    this.contentsOfTimeReport = contentsOfTimeReport;
  }

  public addZeroFilledDates(
    times, // Find time span: // codecept_debug(compact("period", "firstdatefound", "lastdatefound", "interval"));
  ) {
    let firstdatefound;
    let lastdatefound;
    let times_ = times;
    times = Array();
    const timezone = new DateTimeZone("UTC");

    for (const date in times_) {
      const hours = times_[date];
      const datetime = DateTime.createFromFormat(
        "Y-m-d H:i:s",
        date + " 00:00:00",
        timezone,
      );

      if (!!datetime) {
        if (!firstdatefound) {
          firstdatefound = clone(datetime);
        }

        if (!lastdatefound) {
          lastdatefound = clone(datetime);
        }

        if (datetime < firstdatefound) {
          firstdatefound = clone(datetime);
        }

        if (datetime > lastdatefound) {
          lastdatefound = clone(datetime);
        }

        times[datetime.format("Y-m-d")] = hours;
      }
    }

    if (this.collectDebugInfo) {
      this.debugGenerateTimeReport = compact(
        "firstdatefound",
        "lastdatefound",
        "times",
      );
    }

    if (!firstdatefound) {
      return Array();
    }

    const interval = DateInterval.createFromDateString("1 day");
    lastdatefound = lastdatefound.add(interval);
    const period = new DatePeriod(firstdatefound, interval, lastdatefound);
    times_ = times;
    times = Array();

    for (const dt of Object.values(period)) {
      const xday = dt.format("Y-m-d");
      times[xday] = undefined !== times_[xday] ? times_[xday] : 0;
    }

    return times;
  }

  public getTimeLogMetadata() // do {
  // } while (!$last["ts_is_faked"]);
  {
    if (!this.contentsWithTimeMarkers) {
      return Array();
    }

    if (!this.debugAddTimeMarkers.rows_with_timemarkers) {
      return Array();
    }

    const rows_with_timemarkers = this.debugAddTimeMarkers
      .rows_with_timemarkers;
    const start = rows_with_timemarkers.shift();
    const startts = start.ts;
    const name = start.date_raw;
    const last = rows_with_timemarkers.pop();
    const lastts = last.ts;
    const leadtime = lastts - startts;
    const times = this.debugGenerateTimeReport.times;
    let hours_total = 0;

    for (const time of Object.values(times)) {
      for (const category of Object.values(this.categories)) {
        hours_total += time[category];
      }
    }

    const hours_leadtime = Math.round(leadtime / 60 / 60, 2);
    const nonhours = Math.round(hours_leadtime - hours_total, 2);
    return compact(
      "name",
      "startts",
      "lastts",
      "hours_total",
      "hours_leadtime",
      "nonhours",
    );
  }

  public generateIcal() //
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
  {
    Yii.import("vcalendar");
    const v = new vcalendar();
    v.setProperty("X-WR-TIMEZONE", "Europe/Stockholm");
    {
      const _tmp_0 = this.sessions;

      // var_dump($session["metadata"]);
      // Inactivating until have a solution for timezone split issues
      for (const k in _tmp_0) {
        // Only sessions with work hours
        const session = _tmp_0[k];

        if (!session.metadata.hours_total) {
          continue;
        }

        const vevents = Array();
        let start = gmdate("H:i", session.metadata.startts);
        let last = gmdate("H:i", session.metadata.lastts);
        const startdate = gmdate("Y-m-d", session.metadata.startts);
        const lastdate = gmdate("Y-m-d", session.metadata.lastts);
        let startts = session.metadata.startts;
        let lastts = session.metadata.lastts;

        if (false && startdate != lastdate) {
          const days =
            (strtotime(lastdate) - strtotime(startdate)) / (24 * 3600);
          start = gmdate("Y-m-d H:i", session.metadata.startts);
          last = gmdate("Y-m-d H:i", session.metadata.lastts);

          for (let i = 0; i <= days; i++) {
            const idate = gmdate("Y-m-d", startts + 24 * 3600 * i);

            if (idate == startdate) {
              startts = startts;
              lastts = strtotime(idate + " 23:59");
            } else if (idate == lastdate) {
              startts = strtotime(idate + " 00:00");
              lastts = lastts;
            } else {
              startts = strtotime(idate + " 00:00");
              lastts = strtotime(idate + " 23:59");
            }

            vevents.push(compact("startts", "lastts"));
          }
        } else {
          vevents.push(compact("startts", "lastts"));
        }

        let summary =
          session.metadata.hours_total +
          " project hours (" +
          start +
          "->" +
          last;

        if (!!session.metadata.nonhours) {
          summary += ", " + session.metadata.nonhours + " hours non-work";
        }

        summary += ") ";
        let description = "Start datetime: " + start + this.constructor.NL_NIX;
        description += "End datetime: " + last + this.constructor.NL_NIX;
        description +=
          "Work hours: " +
          session.metadata.hours_total +
          this.constructor.NL_NIX;
        description +=
          "Non-work hours: " +
          session.metadata.nonhours +
          this.constructor.NL_NIX;
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
          this.setVcalendarDt(e, "dtstart", vevent.startts);
          this.setVcalendarDt(e, "dtend", vevent.lastts);
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

  public setVcalendarDt(e, field, ts) {
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
    const lines = this.constructor.textIntoLinesArray(str);
    const commitLogLines = Array();

    for (const line of Object.values(lines)) {
      if (this.isProbableCommitLogLine(line)) {
        commitLogLines.push(line);
      }
    }

    forReturn += this.constructor.linesArrayIntoText(commitLogLines);
    const lower = str.toLowerCase();
    const words = str_word_count_utf8(lower, 1);
    const numWords = words.length;
    const word_count = array_count_values(words);
    arsort(word_count);
    forReturn += "\n\nCommon words:\n";
    let k = 1;

    for (const key in word_count) {
      const val = word_count[key];
      const pausetoken = this.startsWithOptionallySuffixedToken(key, "pause");

      if (
        mb_strlen(key, "UTF-8") > 2 &&
        !(-1 !== this.reserved_words.indexOf(key)) &&
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
}

class TimeLogParsingException extends Error {}
