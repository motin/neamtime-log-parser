import fs from "fs";
import {
  file_get_contents,
  pathinfo,
  PATHINFO_DIRNAME,
  PATHINFO_FILENAME,
} from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import { TimeSpendingLogProcessingErrorsEncounteredException } from "./lib/exceptions/TimeSpendingLogProcessingErrorsEncounteredException";
import {
  file_put_contents,
  glob,
  is_file,
  memory_get_usage,
} from "./lib/php-wrappers";
import { ProcessedTimeSpendingLog } from "./lib/ProcessedTimeSpendingLog";
import { TimeSpendingLog } from "./lib/TimeSpendingLog";

export * from "./lib/LogParser";
export * from "./lib/TimeLogParser";
export * from "./lib/TimeSpendingLog";
export * from "./lib/TimeLogProcessor";

export const timeSpendingLogPathsInFolder = (
  pathToFolderWhereTsLogsReside, // handle bear-exported txt-files // pick up properly named files for parsing
) => {
  const timeSpendingLogTextPaths = glob(
    pathToFolderWhereTsLogsReside + "/*.txt",
  );
  for (const rawTimeSpendingLogPath of Object.values(
    timeSpendingLogTextPaths,
  )) {
    // first rename the file to make it shorter, and end with .tslog
    const dirname = pathinfo(rawTimeSpendingLogPath, PATHINFO_DIRNAME);
    const filename = pathinfo(rawTimeSpendingLogPath, PATHINFO_FILENAME);

    const _ = filename.split(" - ");
    const newFilename = _[0].trim();

    const timeSpendingLogPath = dirname + "/" + newFilename + ".tslog";
    fs.renameSync(rawTimeSpendingLogPath, timeSpendingLogPath);
  }

  const timeSpendingLogPaths = glob(pathToFolderWhereTsLogsReside + "/*.tslog");
  return timeSpendingLogPaths;
};

export const getProcessedTimeSpendingLog = (
  timeSpendingLogPath,
): ProcessedTimeSpendingLog => {
  const timeSpendingLogContents = file_get_contents(timeSpendingLogPath);

  const tzFirst = is_file(timeSpendingLogPath + ".tzFirst")
    ? file_get_contents(timeSpendingLogPath + ".tzFirst").trim()
    : "UTC";

  const timeSpendingLog = new TimeSpendingLog();
  timeSpendingLog.rawLogContents = timeSpendingLogContents;
  timeSpendingLog.tzFirst = tzFirst;
  const processedTimeSpendingLog = new ProcessedTimeSpendingLog(
    timeSpendingLog,
  );
  return processedTimeSpendingLog;
};

export const getCorrespondingCsvDataFilePath = timeSpendingLogPath => {
  return str_replace(".tslog", ".csv", timeSpendingLogPath);
};

export const processTimeSpendingLog = (t, timeSpendingLogPath) => {
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
  // Save processedLogContentsWithTimeMarkers in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath + ".latest-run.processedLogContentsWithTimeMarkers",
    processedTimeSpendingLog.processedLogContentsWithTimeMarkers,
  );
  // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
  file_put_contents(
    timeSpendingLogPath +
      ".latest-run.processedLogContentsWithTimeMarkers_debug.json",
    processedTimeSpendingLog.processedLogContentsWithTimeMarkers_debug,
  );
  return { processedTimeSpendingLog, thrownException };
};
