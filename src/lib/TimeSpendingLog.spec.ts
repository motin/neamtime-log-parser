import test, { ExecutionContext, Macro } from "ava";
import { file_get_contents } from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import path from "path";
import { fixturesPath, memoryUsageInMiB } from "../inc/testUtils";
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

  return providerData.slice(0, 1);
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

  return providerData.slice(0, 1);
};

test("there exists at least one incorrect time spending log fixture paths", (t: ExecutionContext) => {
  const paths = incorrectTimeSpendingLogContents();
  t.true(paths.length > 0);
});

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
  t.false(
    thrownException instanceof
      TimeSpendingLogProcessingErrorsEncounteredException,
    "We should not have encountered any log processing error, but we did. Check .latest-run.processing-errors.json for more info.",
  );
  t.log(650 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
  return processedTimeSpendingLog.calculateTotalReportedTime();
};

const processTimeSpendingLog = (t: ExecutionContext, timeSpendingLogPath) => {
  t.log(660 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
  t.log(timeSpendingLogPath);
  const correspondingCsvDataFilePath = getCorrespondingCsvDataFilePath(
    timeSpendingLogPath,
  );
  let thrownException;
  let processedTimeSpendingLog: ProcessedTimeSpendingLog;

  try // t.log($processedTimeSpendingLog->timeReportCsv);
  {
    // To update the expected contents based on the current output (use only when certain that everything
    // is correct and only the format of the output file has been changed)
    // file_put_contents(
    //                $correspondingCsvDataFilePath,
    //                $processedTimeSpendingLog->timeReportCsv
    //            );
    // To make it easier to update with correct contents for the first time
    // t.log($timeLogEntriesWithMetadata);
    // All tested time logs should include at least 1 time log entry
    t.log(667 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
    processedTimeSpendingLog = getProcessedTimeSpendingLog(timeSpendingLogPath);
    t.log(671 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
    file_put_contents(
      correspondingCsvDataFilePath + ".latest-run.csv",
      processedTimeSpendingLog.getTimeLogProcessor().timeReportCsv,
    );
    const timeLogEntriesWithMetadata = processedTimeSpendingLog.getTimeLogEntriesWithMetadata();
    t.log(692 + " - Memory usage: " + memoryUsageInMiB() + " MiB");
    t.log(timeLogEntriesWithMetadata.length + " time log entries");
    t.true(timeLogEntriesWithMetadata.length > 0);
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

const testCorrectTimeSpendingLogsCorrectness: Macro = (
  t: ExecutionContext,
  timeSpendingLogPath,
) => {
  const correspondingCsvDataFilePath = getCorrespondingCsvDataFilePath(
    timeSpendingLogPath,
  );
  const correspondingCsvDataFileContents = file_get_contents(
    correspondingCsvDataFilePath,
  );
  const processedTimeSpendingLog = getProcessedTimeSpendingLog(
    timeSpendingLogPath,
  );
  t.is(
    processedTimeSpendingLog.getTimeLogProcessor().timeReportCsv,
    correspondingCsvDataFileContents,
    `CSV contents for '${timeSpendingLogPath}' matches expected`,
  );
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
  t.log("timeSpendingLogPath", timeSpendingLogPath);
  let thrownException;
  let processedTimeSpendingLog: ProcessedTimeSpendingLog;
  let encounteredProcessingErrors;

  const expectedProcessingErrorsJsonFileContents = file_get_contents(
    expectedProcessingErrorsJsonFilePath,
  );

  const expectedProcessingErrorsOriginal = JSON.parse(
    expectedProcessingErrorsJsonFileContents,
  );

  // Temporarily normalize existing for better comparisons across versions
  const keyRenames = {
    date_raw: "dateRaw",
    date_raw_format: "dateRawFormat",
    date_raw_was_nonempty_before_detectTimeStamp:
      "dateRawWasNonEmptyBeforeDetectTimeStamp",
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
      return v.map((el) => migrateValue(el));
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
  const expectedProcessingErrors = migrateProcessingErrorsObject(
    expectedProcessingErrorsOriginal,
  );

  try {
    processedTimeSpendingLog = getProcessedTimeSpendingLog(timeSpendingLogPath);
  } catch (e) {
    if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
      thrownException = e;
      processedTimeSpendingLog = e.processedTimeSpendingLog;

      t.log(
        "e.processedTimeSpendingLog.getTroubleshootingInfo()",
        e.processedTimeSpendingLog.getTroubleshootingInfo(),
      );
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

  if (thrownException) {
    t.deepEqual(
      encounteredProcessingErrors,
      expectedProcessingErrors,
      "Expected errors matches actual errors for " + timeSpendingLogPath,
    );
  }

  t.true(
    thrownException instanceof
      TimeSpendingLogProcessingErrorsEncounteredException,
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
