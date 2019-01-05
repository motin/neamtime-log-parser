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
    this.assertGreaterThan(0, timeLogEntriesWithMetadata.length);
    file_put_contents(
      timeSpendingLogPath + ".latest-run.timeLogEntriesWithMetadata.json",
      JSON.stringify(timeLogEntriesWithMetadata, null, 2),
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

  console.debug(
    "after error potentially - processedTimeSpendingLog",
    processedTimeSpendingLog,
  );

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
    processedTimeSpendingLog.processingDebugInfo,
  );
  return { processedTimeSpendingLog, thrownException };
};

correctTimeSpendingLogContents().forEach((testData, index) => {
  test.only(
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
  processingErrorsJsonFilePath,
) => {
  t.log(timeSpendingLogPath);
  let thrownException;
  let processedTimeSpendingLog;
  let errorsJson;

  try {
    processedTimeSpendingLog = getProcessedTimeSpendingLog(timeSpendingLogPath);
  } catch (e) {
    if (e instanceof TimeSpendingLogProcessingErrorsEncounteredException) {
      // t.log($e->processedTimeSpendingLog->getTimeLogParser()->preProcessedContentsSourceLineContentsSourceLineMap);
      // To update all existing (when having changed the error log format for instance)
      // file_put_contents(
      //                $processingErrorsJsonFilePath,
      //                $errorsJson
      //            );
      // To make it easier to update with correct contents for the first time
      thrownException = e;
      processedTimeSpendingLog = e.processedTimeSpendingLog;
      t.log(e.processedTimeSpendingLog.getTroubleshootingInfo());
      errorsJson = prettyJson(e.processedTimeSpendingLog.getProcessingErrors());
      file_put_contents(
        timeSpendingLogPath + ".latest-run.processing-errors.json",
        errorsJson,
      );
    } else {
      throw e;
    }
  }

  file_put_contents(
    timeSpendingLogPath + ".latest-run.timeReportCsv.csv",
    processedTimeSpendingLog.timeReportCsv,
  );
  // Save preProcessedContents in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath + ".latest-run.preProcessedContents",
    processedTimeSpendingLog.preProcessedContents,
  );
  // Save processedLogContentsWithTimeMarkers in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers",
    processedTimeSpendingLog.processedLogContentsWithTimeMarkers,
  );

  if (!!thrownException) {
    const processingErrorsJsonFileContents = file_get_contents(
      processingErrorsJsonFilePath,
    );
    this.assertEquals(
      processingErrorsJsonFileContents,
      errorsJson,
      "Expected error json matches actual error json for " +
        timeSpendingLogPath,
    );
  }

  this.assertInstanceOf(
    "TimeSpendingLogProcessingErrorsEncounteredException",
    thrownException,
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
  );
});
