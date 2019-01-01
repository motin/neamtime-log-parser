<?php

class TimeSpendingLogTest extends \PHPUnit_Framework_TestCase
{

    protected function setUp()
    {
    }

    protected function tearDown()
    {
    }

    public static function correctTimeSpendingLogContentsProvider()
    {
        $pathToFolderWhereTsLogsReside = codecept_data_dir('neamtime/time-spending-logs/correct');
        $timeSpendingLogPaths = static::timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside);
        $providerData = [];
        foreach ($timeSpendingLogPaths as $timeSpendingLogPath) {
            $providerData[] = [$timeSpendingLogPath];
        }
        return $providerData;
    }

    /**
     * @group coverage:full
     * @dataProvider correctTimeSpendingLogContentsProvider
     */
    public function testprocessAndAssertCorrectTimeSpendingLog($timeSpendingLogPath)
    {
        $this->processAndAssertCorrectTimeSpendingLog($timeSpendingLogPath);
    }

    /**
     * @group coverage:full
     * @dataProvider correctTimeSpendingLogContentsProvider
     */
    public function testCorrectTimeSpendingLogsCorrectness($timeSpendingLogPath)
    {

        $correspondingCsvDataFilePath = $this->correspondingCsvDataFilePath($timeSpendingLogPath);
        $correspondingCsvDataFileContents = file_get_contents($correspondingCsvDataFilePath);
        $processedTimeSpendingLog = $this->processedTimeSpendingLog($timeSpendingLogPath);
        $this->assertEquals($correspondingCsvDataFileContents, $processedTimeSpendingLog->timeReportCsv, "CSV contents for '$timeSpendingLogPath' matches expected");

    }

    public static function incorrectTimeSpendingLogContentsProvider()
    {
        $pathToFolderWhereTsLogsReside = codecept_data_dir('neamtime/time-spending-logs/incorrect');
        $timeSpendingLogPaths = static::timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside);
        $providerData = [];
        foreach ($timeSpendingLogPaths as $timeSpendingLogPath) {
            $processingErrorsJsonFilePath = str_replace(".tslog", ".processing-errors.json", $timeSpendingLogPath);
            $providerData[] = [$timeSpendingLogPath, $processingErrorsJsonFilePath];
        }
        return $providerData;
    }

    /**
     * @group coverage:full
     * @dataProvider incorrectTimeSpendingLogContentsProvider
     */
    public function testCorrectlyReportedProcessingErrors($timeSpendingLogPath, $processingErrorsJsonFilePath)
    {

        codecept_debug($timeSpendingLogPath);

        $thrownException = null;
        $processedTimeSpendingLog = null;
        try {
            $processedTimeSpendingLog = $this->processedTimeSpendingLog($timeSpendingLogPath);
        } catch (TimeSpendingLogProcessingErrorsEncounteredException $e) {

            $thrownException = $e;
            $processedTimeSpendingLog = $e->processedTimeSpendingLog;

            codecept_debug($e->processedTimeSpendingLog->getTroubleshootingInfo());
            //codecept_debug($e->processedTimeSpendingLog->getTimeLogParser()->preProcessedContentsSourceLineContentsSourceLineMap);

            $errorsJson = AppJson::encode($e->processedTimeSpendingLog->getProcessingErrors(), JSON_PRETTY_PRINT);

            // To update all existing (when having changed the error log format for instance)
            /*
            file_put_contents(
                $processingErrorsJsonFilePath,
                $errorsJson
            );
            */

            // To make it easier to update with correct contents for the first time
            file_put_contents(
                $timeSpendingLogPath . ".latest-run.processing-errors.json",
                $errorsJson
            );

        }

        // Save timeReportCsv in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.timeReportCsv.csv",
            $processedTimeSpendingLog->timeReportCsv
        );

        // Save preProcessedContents in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.preProcessedContents",
            $processedTimeSpendingLog->preProcessedContents
        );

        // Save processedLogContentsWithTimeMarkers in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.processedLogContentsWithTimeMarkers",
            $processedTimeSpendingLog->processedLogContentsWithTimeMarkers
        );

        if (!empty($thrownException)) {
            $processingErrorsJsonFileContents = file_get_contents($processingErrorsJsonFilePath);
            $this->assertEquals($processingErrorsJsonFileContents, $errorsJson, 'Expected error json matches actual error json for ' . $timeSpendingLogPath);
        }

        $this->assertInstanceOf("TimeSpendingLogProcessingErrorsEncounteredException", $thrownException, "We should have encountered log processing error(s), but we did not");

    }


    public function processAndAssertCorrectTimeSpendingLog($timeSpendingLogPath)
    {

        $processedTimeSpendingLog = $this->processTimeSpendingLog($timeSpendingLogPath, $thrownException);

        $this->assertNotInstanceOf("TimeSpendingLogProcessingErrorsEncounteredException", $thrownException, "We should not have encountered any log processing error, but we did. Check .latest-run.processing-errors.json for more info.");

        codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

        return $processedTimeSpendingLog->calculateTotalReportedTime();

    }

    public function processTimeSpendingLog($timeSpendingLogPath, &$thrownException = null)
    {

        codecept_debug($timeSpendingLogPath);
        codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

        $correspondingCsvDataFilePath = $this->correspondingCsvDataFilePath($timeSpendingLogPath);

        $thrownException = null;
        $processedTimeSpendingLog = null;
        try {
            codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

            $processedTimeSpendingLog = $this->processedTimeSpendingLog($timeSpendingLogPath);

            codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

            //codecept_debug($processedTimeSpendingLog->timeReportCsv);

            // To update the expected contents based on the current output (use only when certain that everything
            // is correct and only the format of the output file has been changed)
            /*
            file_put_contents(
                $correspondingCsvDataFilePath,
                $processedTimeSpendingLog->timeReportCsv
            );
            */

            // To make it easier to update with correct contents for the first time
            file_put_contents(
                $correspondingCsvDataFilePath . ".latest-run.csv",
                $processedTimeSpendingLog->timeReportCsv
            );

            $timeLogEntriesWithMetadata = $processedTimeSpendingLog->getTimeLogEntriesWithMetadata();

            codecept_debug(__LINE__ . " - Memory usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MiB");

            //codecept_debug($timeLogEntriesWithMetadata);
            codecept_debug(count($timeLogEntriesWithMetadata) . " time log entries");

            // All tested time logs should include at least 1 time log entry
            $this->assertGreaterThan(0, count($timeLogEntriesWithMetadata));

            // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
            file_put_contents(
                $timeSpendingLogPath . ".latest-run.timeLogEntriesWithMetadata.json",
                AppJson::encode($timeLogEntriesWithMetadata, JSON_PRETTY_PRINT)
            );

        } catch (TimeSpendingLogProcessingErrorsEncounteredException $e) {

            $thrownException = $e;
            $processedTimeSpendingLog = $e->processedTimeSpendingLog;

            $errorsJson = AppJson::encode($e->processedTimeSpendingLog->getProcessingErrors(), JSON_PRETTY_PRINT);

            // To make it easier to update with correct contents for the first time
            file_put_contents(
                $timeSpendingLogPath . ".latest-run.processing-errors.json",
                $errorsJson
            );

        }

        // Save preProcessedContents in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.preProcessedContents",
            $processedTimeSpendingLog->preProcessedContents
        );

        // Save processedLogContentsWithTimeMarkers in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.processedLogContentsWithTimeMarkers",
            $processedTimeSpendingLog->processedLogContentsWithTimeMarkers
        );

        // Save processedLogContentsWithTimeMarkers_debug in order to make debugging easier
        file_put_contents(
            $timeSpendingLogPath . ".latest-run.processedLogContentsWithTimeMarkers_debug.json",
            $processedTimeSpendingLog->processedLogContentsWithTimeMarkers_debug
        );

        return $processedTimeSpendingLog;

    }

    protected function processedTimeSpendingLog($timeSpendingLogPath)
    {

        $timeSpendingLogContents = file_get_contents($timeSpendingLogPath);
        if (is_file($timeSpendingLogPath . ".tzFirst")) {
            $tzFirst = trim(file_get_contents($timeSpendingLogPath . ".tzFirst"));
        } else {
            $tzFirst = 'UTC';
        }

        $timeSpendingLog = new TimeSpendingLog();
        $timeSpendingLog->rawLogContents = $timeSpendingLogContents;
        $timeSpendingLog->tzFirst = $tzFirst;
        $processedTimeSpendingLog = new ProcessedTimeSpendingLog($timeSpendingLog);

        return $processedTimeSpendingLog;

    }

    protected function correspondingCsvDataFilePath($timeSpendingLogPath)
    {
        return str_replace(".tslog", ".csv", $timeSpendingLogPath);
    }

    protected static function timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside)
    {
        // handle bear-exported txt-files
        $timeSpendingLogPaths = glob($pathToFolderWhereTsLogsReside . '/*.txt');
        foreach ($timeSpendingLogPaths as $rawTimeSpendingLogPath) {
            // first rename the file to make it shorter, and end with .tslog
            $dirname = pathinfo($rawTimeSpendingLogPath, PATHINFO_DIRNAME);
            $filename = pathinfo($rawTimeSpendingLogPath, PATHINFO_FILENAME);
            $_ = explode(" - ", $filename);
            $newFilename = trim($_[0]);
            $timeSpendingLogPath = $dirname . "/" . $newFilename . ".tslog";
            rename($rawTimeSpendingLogPath, $timeSpendingLogPath);
        }

        // pick up properly named files for parsing
        $timeSpendingLogPaths = glob($pathToFolderWhereTsLogsReside . '/*.tslog');
        return $timeSpendingLogPaths;
    }

}
