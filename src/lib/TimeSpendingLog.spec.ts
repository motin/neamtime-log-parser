import test, { ExecutionContext, Macro } from "ava";
import { file_get_contents } from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import path from "path";
import { fixturesPath /*, memoryUsageInMiB*/ } from "../inc/testUtils";
import {
  getCorrespondingCsvDataFilePath,
  getProcessedTimeSpendingLog,
  timeSpendingLogPathsInFolder,
} from "../index";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "./exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import { file_put_contents } from "./php-wrappers";
import { ProcessedTimeSpendingLog } from "./ProcessedTimeSpendingLog";
import { prettyJson } from "./string-utils";

const pathToFolderWhereCorrectTsLogsReside = path.join(fixturesPath, "correct");
const pathToFolderWhereIncorrectTsLogsReside = path.join(
  fixturesPath,
  "incorrect",
);

const correctTimeSpendingLogContents = () => {
  const timeSpendingLogPaths = timeSpendingLogPathsInFolder(
    pathToFolderWhereCorrectTsLogsReside,
  );
  const providerData = Array();

  for (const timeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
    providerData.push([timeSpendingLogPath]);
  }

  return providerData;
};

test("there exists at least one correct time spending log fixture paths", (t: ExecutionContext) => {
  const paths = correctTimeSpendingLogContents();
  t.true(paths.length > 0);
});

const incorrectTimeSpendingLogContents = () => {
  const timeSpendingLogPaths = timeSpendingLogPathsInFolder(
    pathToFolderWhereIncorrectTsLogsReside,
  );
  const providerData = Array();

  for (const timeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
    const processingErrorsJsonFilePath = str_replace(
      ".tslog",
      ".processing-errors.json",
      timeSpendingLogPath,
    );
    providerData.push([timeSpendingLogPath, processingErrorsJsonFilePath]);
  }

  return providerData;
};

test("there exists at least one incorrect time spending log fixture paths", (t: ExecutionContext) => {
  const paths = incorrectTimeSpendingLogContents();
  t.true(paths.length > 0);
});

/**
 * This test produces the .latest-run. artifacts in the fixtures folder
 * and verifies that no processing errors were encountered, but it does
 * not check the correctness of the generated time report against the
 * existing csv file.
 *
 * @param t
 * @param timeSpendingLogPath
 */
const testProcessAndAssertCorrectTimeSpendingLog: Macro = (
  t: ExecutionContext,
  timeSpendingLogPath: string,
) => {
  processAndAssertCorrectTimeSpendingLog(t, timeSpendingLogPath);
};

testProcessAndAssertCorrectTimeSpendingLog.title = (
  providedTitle: string,
  timeSpendingLogPath: string,
) =>
  `: ${providedTitle} ${timeSpendingLogPath.replace(fixturesPath, "")}`.trim();

const processAndAssertCorrectTimeSpendingLog = (
  t: ExecutionContext,
  timeSpendingLogPath,
) => {
  const { processedTimeSpendingLog, thrownException } = processTimeSpendingLog(
    t,
    timeSpendingLogPath,
  );
  const processingErrorsWasEncountered =
    thrownException instanceof
    TimeSpendingLogProcessingErrorsEncounteredException;
  t.false(
    processingErrorsWasEncountered,
    "We should not have encountered any log processing error, but we did. Check .latest-run.processing-errors.json for more info.",
  );
  // t.log(650 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
  return processedTimeSpendingLog.calculateTotalReportedTime();
};

const processTimeSpendingLog = (t: ExecutionContext, timeSpendingLogPath) => {
  // t.log(660 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
  // t.log(timeSpendingLogPath);
  const correspondingCsvDataFilePath = getCorrespondingCsvDataFilePath(
    timeSpendingLogPath,
  );
  let thrownException;
  let processedTimeSpendingLog: ProcessedTimeSpendingLog;

  try // t.log($processedTimeSpendingLog->timeReportCsv);
  {
    // t.log(667 + " - Memory usage: " + memoryUsageInMiB() + " MiB");

    processedTimeSpendingLog = getProcessedTimeSpendingLog(timeSpendingLogPath);

    // t.log(671 + " - Memory usage: " + memoryUsageInMiB() + " MiB");

    const timeReportCsv = processedTimeSpendingLog.getTimeLogProcessor()
      .timeReportCsv;

    // To update the expected contents based on the current output (use only when certain that everything
    // is correct and only the format of the output file has been changed)
    // Note: Updates all existing CSV files that does not have any processing errors
    /*
    file_put_contents(
      correspondingCsvDataFilePath,
      timeReportCsv,
    );
    */

    // To make it easier to update with correct contents for the first time
    file_put_contents(
      correspondingCsvDataFilePath + ".latest-run.csv",
      timeReportCsv,
    );

    const timeLogEntriesWithMetadata = processedTimeSpendingLog.getTimeLogEntriesWithMetadata();
    // t.log({timeLogEntriesWithMetadata});

    // t.log(692 + " - Memory usage: " + memoryUsageInMiB() + " MiB");

    t.log(timeLogEntriesWithMetadata.length + " time log entries");

    // Most tested time logs should include at least 1 time log entry
    if (timeLogEntriesWithMetadata.length === 0) {
      // Only check on non-empty logs
      if (
        processedTimeSpendingLog
          .getTimeLogProcessor()
          .nonEmptyPreprocessedLines().length > 0
      ) {
        t.true(timeLogEntriesWithMetadata.length > 0);
      }
    }

    file_put_contents(
      timeSpendingLogPath + ".latest-run.timeLogEntriesWithMetadata.json",
      prettyJson(timeLogEntriesWithMetadata),
    );
  } catch (e) {
    if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
      // To make it easier to update with correct contents for the first time
      thrownException = e;
      processedTimeSpendingLog = e.processedTimeSpendingLog;
      const errorsJson = prettyJson(
        e.processedTimeSpendingLog.getProcessingErrors(),
      );
      file_put_contents(
        timeSpendingLogPath + ".latest-run.processing-errors.json",
        errorsJson,
      );
    } else {
      throw e;
    }
  }

  t.truthy(
    processedTimeSpendingLog,
    "processedTimeSpendingLog should be available regardless of success or failure in the processing",
  );

  file_put_contents(
    timeSpendingLogPath + ".latest-run.preProcessedContents",
    processedTimeSpendingLog.getTimeLogProcessor().preProcessedContents,
  );
  // Save processedLogContentsWithTimeMarkers in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers",
    processedTimeSpendingLog.getTimeLogProcessor().contentsWithTimeMarkers,
  );
  // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath +
      ".latest-run.processedLogContentsWithTimeMarkers_debug.json",
    prettyJson(processedTimeSpendingLog.processingDebugInfo),
  );
  return { processedTimeSpendingLog, thrownException };
};

correctTimeSpendingLogContents().forEach((testData, index) => {
  test(
    "testProcessAndAssertCorrectTimeSpendingLog - " + index,
    testProcessAndAssertCorrectTimeSpendingLog,
    testData[0],
  );
});

/**
 * This test checks the correctness of the generated time report against the
 * existing csv file without producing any artifacts in the fixtures folder.
 *
 * @param t
 * @param timeSpendingLogPath
 */
const testCorrectTimeSpendingLogsCorrectness: Macro = (
  t: ExecutionContext,
  timeSpendingLogPath,
) => {
  try {
    const processedTimeSpendingLog = getProcessedTimeSpendingLog(
      timeSpendingLogPath,
    );
    const timeReportCsv = processedTimeSpendingLog.getTimeLogProcessor()
      .timeReportCsv;
    const correspondingCsvDataFilePath = getCorrespondingCsvDataFilePath(
      timeSpendingLogPath,
    );
    const correspondingCsvDataFileContents = file_get_contents(
      correspondingCsvDataFilePath,
    );
    t.is(
      timeReportCsv,
      correspondingCsvDataFileContents,
      `CSV contents for '${timeSpendingLogPath}' matches expected`,
    );
  } catch (e) {
    if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
      t.log(
        "e.processedTimeSpendingLog.getTimeLogProcessor().notParsedAddTimeMarkersErrorSummary().slice(0,2)",
        e.processedTimeSpendingLog
          .getTimeLogProcessor()
          .notParsedAddTimeMarkersErrorSummary()
          .slice(0, 2),
      );
      t.true(
        false,
        "Encountered an TimeSpendingLogProcessingErrorsEncounteredException while checking for time spending log correctness",
      );
    } else {
      throw e;
    }
  }
};

testCorrectTimeSpendingLogsCorrectness.title = (
  providedTitle: string,
  timeSpendingLogPath: string,
) =>
  `: ${providedTitle} ${timeSpendingLogPath.replace(fixturesPath, "")}`.trim();

correctTimeSpendingLogContents().forEach((testData, index) => {
  test(
    "testCorrectTimeSpendingLogsCorrectness - " + index,
    testCorrectTimeSpendingLogsCorrectness,
    testData[0],
  );
});

const testCorrectlyReportedProcessingErrors: Macro = (
  t: ExecutionContext,
  timeSpendingLogPath,
  expectedProcessingErrorsJsonFilePath,
) => {
  // t.log("timeSpendingLogPath", timeSpendingLogPath);
  let thrownException;
  let processedTimeSpendingLog: ProcessedTimeSpendingLog;
  let encounteredProcessingErrors;

  // Temporarily normalize existing error objects for better comparisons after recent refactoring
  const keyRenames = {
    date_raw: "dateRaw",
    date_raw_format: "dateRawFormat",
    date_raw_was_nonempty_before_detectTimeStamp:
      "dateRawWasNonEmptyBeforeDetectTimestamp",
    formatted_date: "formattedUtcDate",
    highlight_with_newlines: "highlightWithNewlines",
    line_with_comment: "lineWithComment",
    preprocessed_contents_source_line_index:
      "preprocessedContentsSourceLineIndex",
    rows_with_timemarkers_handled: "rowsWithTimeMarkersHandled",
    source_line: "sourceLine",
    time_raw: "timeRaw",
    ts_is_faked: "tsIsFaked",
  };
  const migrateValue = (v, key = null) => {
    if (v instanceof Array) {
      return v.map(el => migrateValue(el));
    } else {
      if (typeof v === "object") {
        return migrateProcessingErrorsObject(v);
      } else {
        if (typeof v === "string") {
          if (key === "ts") {
            return parseInt(v, 10);
          } else {
            return v
              .replace("timeReportCsv-", "timeReportData-")
              .replace("ent to not_parsed", "ent to notParsed");
          }
        } else {
          return v;
        }
      }
    }
  };
  const migrateProcessingErrorsObject = v => {
    if (v === undefined || v === null) {
      return v;
    }
    if (typeof v === "object") {
      const migratedObj = {};
      const keys = Object.keys(v);
      for (const key of keys) {
        const migratedNameOfKey = keyRenames[key] ? keyRenames[key] : key;
        migratedObj[migratedNameOfKey] = migrateValue(v[key], key);
      }
      return migratedObj;
    } else {
      return v;
    }
  };

  try {
    processedTimeSpendingLog = getProcessedTimeSpendingLog(timeSpendingLogPath);
  } catch (e) {
    if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
      thrownException = e;
      processedTimeSpendingLog = e.processedTimeSpendingLog;

      // t.log("e.processedTimeSpendingLog.getTroubleshootingInfo()", e.processedTimeSpendingLog.getTroubleshootingInfo(),);
      // t.log(e.processedTimeSpendingLog.getTimeLogParser().preProcessedContentsSourceLineContentsSourceLineMap);

      const encounteredProcessingErrorsOriginal = e.processedTimeSpendingLog.getProcessingErrors();
      encounteredProcessingErrors = migrateProcessingErrorsObject(
        encounteredProcessingErrorsOriginal,
      );

      // To update all existing (when having changed the error log format for instance)
      /*
      file_put_contents(
        expectedProcessingErrorsJsonFilePath,
        prettyJson(encounteredProcessingErrors),
      );
      */

      // To make it easier to update with correct contents for the first time
      file_put_contents(
        timeSpendingLogPath + ".latest-run.processing-errors.json",
        prettyJson(encounteredProcessingErrors),
      );
    } else {
      throw e;
    }
  }

  const expectedProcessingErrorsJsonFileContents = file_get_contents(
    expectedProcessingErrorsJsonFilePath,
  );

  const expectedProcessingErrorsOriginal = JSON.parse(
    expectedProcessingErrorsJsonFileContents,
  );

  const expectedProcessingErrors = migrateProcessingErrorsObject(
    expectedProcessingErrorsOriginal,
  );

  file_put_contents(
    timeSpendingLogPath + ".latest-run.timeReportCsv.csv",
    processedTimeSpendingLog.getTimeLogProcessor().timeReportCsv,
  );
  // Save preProcessedContents in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath + ".latest-run.preProcessedContents",
    processedTimeSpendingLog.getTimeLogProcessor().preProcessedContents,
  );
  // Save processedLogContentsWithTimeMarkers in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers",
    processedTimeSpendingLog.getTimeLogProcessor().contentsWithTimeMarkers,
  );
  // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath +
      ".latest-run.processedLogContentsWithTimeMarkers_debug.json",
    prettyJson(processedTimeSpendingLog.processingDebugInfo),
  );

  if (thrownException) {
    t.deepEqual(
      encounteredProcessingErrors,
      expectedProcessingErrors,
      "Expected errors matches actual errors for " + timeSpendingLogPath,
    );
  }

  const processingErrorsWasEncountered =
    thrownException instanceof
    TimeSpendingLogProcessingErrorsEncounteredException;
  t.true(
    processingErrorsWasEncountered,
    "We should have encountered log processing error(s), but we did not",
  );
};

testCorrectlyReportedProcessingErrors.title = (
  providedTitle: string,
  timeSpendingLogPath: string,
) =>
  `: ${providedTitle} ${timeSpendingLogPath.replace(fixturesPath, "")}`.trim();

incorrectTimeSpendingLogContents().forEach((testData, index) => {
  test(
    "testCorrectlyReportedProcessingErrors - " + index,
    testCorrectlyReportedProcessingErrors,
    testData[0],
    testData[1],
  );
});
