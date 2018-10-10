// tslint:disable:no-expression-statement
import test from "ava";
import {
  file_get_contents,
  pathinfo,
  PATHINFO_DIRNAME,
  PATHINFO_FILENAME,
} from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "./exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import {
  file_put_contents,
  is_file,
  memory_get_usage,
} from "./php-wrappers";
import { ProcessedTimeSpendingLog } from "./ProcessedTimeSpendingLog";
import { TimeSpendingLog } from "./TimeSpendingLog";

test("foo", t => {
  // t.is(actual, expected);
  t.is(1, 1);
});

const correctTimeSpendingLogContents = () => {
  const pathToFolderWhereTsLogsReside = codecept_data_dir(
    "neamtime/time-spending-logs/correct",
  );
  const timeSpendingLogPaths = this.timeSpendingLogPathsInFolder(
    pathToFolderWhereTsLogsReside,
  );
  const providerData = Array();

  for (const timeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
    providerData.push([timeSpendingLogPath]);
  }

  return providerData;
};

const incorrectTimeSpendingLogContents = () => {
  const pathToFolderWhereTsLogsReside = codecept_data_dir(
    "neamtime/time-spending-logs/incorrect",
  );
  const timeSpendingLogPaths = this.timeSpendingLogPathsInFolder(
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

const timeSpendingLogPathsInFolder = (
  pathToFolderWhereTsLogsReside, // handle bear-exported txt-files // pick up properly named files for parsing
) => {
  let timeSpendingLogPaths = glob(pathToFolderWhereTsLogsReside + "/*.txt");

  for (const rawTimeSpendingLogPath of Object.values(timeSpendingLogPaths)) {
    // first rename the file to make it shorter, and end with .tslog
    const dirname = pathinfo(rawTimeSpendingLogPath, PATHINFO_DIRNAME);
    const filename = pathinfo(rawTimeSpendingLogPath, PATHINFO_FILENAME);

    const _ = filename.split(" - ");

    const newFilename = _[0].trim();

    const timeSpendingLogPath = dirname + "/" + newFilename + ".tslog";
    rename(rawTimeSpendingLogPath, timeSpendingLogPath);
  }

  timeSpendingLogPaths = glob(pathToFolderWhereTsLogsReside + "/*.tslog");
  return timeSpendingLogPaths;
};

const testprocessAndAssertCorrectTimeSpendingLog = (t, timeSpendingLogPath) => {
  processAndAssertCorrectTimeSpendingLog(t, timeSpendingLogPath);
};

const testCorrectTimeSpendingLogsCorrectness = timeSpendingLogPath => {
  const correspondingCsvDataFilePath = this.correspondingCsvDataFilePath(
    timeSpendingLogPath,
  );
  const correspondingCsvDataFileContents = file_get_contents(
    correspondingCsvDataFilePath,
  );
  const processedTimeSpendingLog = getProcessedTimeSpendingLog(
    timeSpendingLogPath,
  );
  this.assertEquals(
    correspondingCsvDataFileContents,
    processedTimeSpendingLog.timeReportCsv,
    `CSV contents for '${timeSpendingLogPath}' matches expected`,
  );
};

const testCorrectlyReportedProcessingErrors = (
  t,
  timeSpendingLogPath,
  processingErrorsJsonFilePath, // Save preProcessedContents in order to make debugging easier // Save processedLogContentsWithTimeMarkers in order to make debugging easier
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
  file_put_contents(
    timeSpendingLogPath + ".latest-run.preProcessedContents",
    processedTimeSpendingLog.preProcessedContents,
  );
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

// Save processedLogContentsWithTimeMarkers in order to make debugging easier // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
const processTimeSpendingLog = (t, timeSpendingLogPath) => {
  t.log(
    660 +
      " - Memory usage: " +
      Math.round((memory_get_usage(true) / 1024 / 1024) * 100) / 100 +
      " MiB",
  );
  t.log(timeSpendingLogPath);
  const correspondingCsvDataFilePath = getCorrespondingCsvDataFilePath(
    timeSpendingLogPath,
  );
  let thrownException;
  let processedTimeSpendingLog;

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
    // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
    t.log(
      667 +
        " - Memory usage: " +
        Math.round((memory_get_usage(true) / 1024 / 1024) * 100) / 100 +
        " MiB",
    );
    processedTimeSpendingLog = getProcessedTimeSpendingLog(timeSpendingLogPath);
    t.log(
      671 +
        " - Memory usage: " +
        Math.round((memory_get_usage(true) / 1024 / 1024) * 100) / 100 +
        " MiB",
    );
    file_put_contents(
      correspondingCsvDataFilePath + ".latest-run.csv",
      processedTimeSpendingLog.timeReportCsv,
    );
    const timeLogEntriesWithMetadata = processedTimeSpendingLog.getTimeLogEntriesWithMetadata();
    t.log(
      692 +
        " - Memory usage: " +
        Math.round((memory_get_usage(true) / 1024 / 1024) * 100) / 100 +
        " MiB",
    );
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
      const errorsJson = JSON.stringify(
        e.processedTimeSpendingLog.getProcessingErrors(),
      );
      file_put_contents(
        timeSpendingLogPath + ".latest-run.processing-errors.json",
        errorsJson,
      );
    }
  }

  file_put_contents(
    timeSpendingLogPath + ".latest-run.preProcessedContents",
    processedTimeSpendingLog.preProcessedContents,
  );
  file_put_contents(
    timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers",
    processedTimeSpendingLog.processedLogContentsWithTimeMarkers,
  );
  file_put_contents(
    timeSpendingLogPath +
      ".latest-run.processedLogContentsWithTimeMarkers_debug.json",
    processedTimeSpendingLog.processedLogContentsWithTimeMarkers_debug,
  );
  return { processedTimeSpendingLog, thrownException };
};

const getProcessedTimeSpendingLog = (
  timeSpendingLogPath,
): ProcessedTimeSpendingLog => {
  const timeSpendingLogContents = file_get_contents(timeSpendingLogPath);

  let tzFirst;
  if (is_file(timeSpendingLogPath + ".tzFirst")) {
    tzFirst = file_get_contents(timeSpendingLogPath + ".tzFirst").trim();
  } else {
    tzFirst = "UTC";
  }

  const timeSpendingLog = new TimeSpendingLog();
  timeSpendingLog.rawLogContents = timeSpendingLogContents;
  timeSpendingLog.tzFirst = tzFirst;
  const processedTimeSpendingLog = new ProcessedTimeSpendingLog(
    timeSpendingLog,
  );
  return processedTimeSpendingLog;
};

const getCorrespondingCsvDataFilePath = timeSpendingLogPath => {
  return str_replace(".tslog", ".csv", timeSpendingLogPath);
};
