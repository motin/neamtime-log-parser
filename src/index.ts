import fs from "fs";
import {
  file_get_contents,
  pathinfo,
  PATHINFO_DIRNAME,
  PATHINFO_FILENAME,
} from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import { glob, is_file } from "./lib/php-wrappers";
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
