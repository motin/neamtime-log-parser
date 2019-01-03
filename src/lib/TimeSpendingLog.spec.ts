import test, { ExecutionContext, Macro } from "ava";
import { file_get_contents } from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import path from "path";
import { fixturesPath } from "../inc/testUtils";
import {
  getProcessedTimeSpendingLog,
  processTimeSpendingLog,
  timeSpendingLogPathsInFolder,
} from "../index";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "./exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import { file_put_contents, memory_get_usage } from "./php-wrappers";

const correctTimeSpendingLogContents = () => {
  const pathToFolderWhereTsLogsReside = path.join(
    fixturesPath,
    "neamtime/time-spending-logs/correct",
  );
  const timeSpendingLogPaths = timeSpendingLogPathsInFolder(
    pathToFolderWhereTsLogsReside,
  );
  const providerData = Array();

  for (const timeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
    providerData.push([timeSpendingLogPath]);
  }

  return providerData;
};

const incorrectTimeSpendingLogContents = () => {
  const pathToFolderWhereTsLogsReside = path.join(
    fixturesPath,
    "neamtime/time-spending-logs/incorrect",
  );
  const timeSpendingLogPaths = timeSpendingLogPathsInFolder(
    pathToFolderWhereTsLogsReside,
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

const testProcessAndAssertCorrectTimeSpendingLog: Macro = (
  t: ExecutionContext,
  timeSpendingLogPath,
) => {
  processAndAssertCorrectTimeSpendingLog(t, timeSpendingLogPath);
};

const processAndAssertCorrectTimeSpendingLog = (t, timeSpendingLogPath) => {
  const { processedTimeSpendingLog, thrownException } = processTimeSpendingLog(
    t,
    timeSpendingLogPath,
  );
  this.assertNotInstanceOf(
    "TimeSpendingLogProcessingErrorsEncounteredException",
    thrownException,
    "We should not have encountered any log processing error, but we did. Check .latest-run.processing-errors.json for more info.",
  );
  t.log(
    650 +
      " - Memory usage: " +
      Math.round((memory_get_usage(true) / 1024 / 1024) * 100) / 100 +
      " MiB",
  );
  return processedTimeSpendingLog.calculateTotalReportedTime();
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
  const correspondingCsvDataFilePath = this.correspondingCsvDataFilePath(
    timeSpendingLogPath,
  );
  const correspondingCsvDataFileContents = file_get_contents(
    correspondingCsvDataFilePath,
  );
  const processedTimeSpendingLog = getProcessedTimeSpendingLog(
    timeSpendingLogPath,
  );
  t.is(
    processedTimeSpendingLog.timeReportCsv,
    correspondingCsvDataFileContents,
    `CSV contents for '${timeSpendingLogPath}' matches expected`,
  );
};

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
      errorsJson = JSON.stringify(
        e.processedTimeSpendingLog.getProcessingErrors(),
        null,
        2,
      );
      file_put_contents(
        timeSpendingLogPath + ".latest-run.processing-errors.json",
        errorsJson,
      );
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

incorrectTimeSpendingLogContents().forEach((testData, index) => {
  test(
    "testCorrectlyReportedProcessingErrors - " + index,
    testCorrectlyReportedProcessingErrors,
    testData[0],
  );
});
