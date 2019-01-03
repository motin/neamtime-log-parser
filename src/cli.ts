// import {timeSpendingLogPathsInFolder} from "./index";

// TODO: cli arg handling etc

/*
    public function iImportTheTslogsInFixtureFolder($fixtureFolder)
    {

        $pathToFolderWhereTsLogsReside = codecept_data_dir($fixtureFolder);
        $timeSpendingLogPaths = static::timeSpendingLogPathsInFolder($pathToFolderWhereTsLogsReside);

        // first ensure that the tslogs can be parsed properly

        $expectedReportedHoursByTslogFilename = [];
        $expectedReportedHoursByTslogFilenameRounded = [];
        $processingErrorsCountByTslogFilename = [];
        foreach ($timeSpendingLogPaths as $timeSpendingLogPath) {

            $timeSpendingLogFilename = pathinfo($timeSpendingLogPath, PATHINFO_FILENAME);

            $processedTimeSpendingLog = $this->processTimeSpendingLog($timeSpendingLogPath);
            $expectedReportedHours = $processedTimeSpendingLog->calculateTotalReportedTime();
            $expectedReportedHoursByTslogFilename[$timeSpendingLogFilename] = $expectedReportedHours;
            $expectedReportedHoursByTslogFilenameRounded[$timeSpendingLogFilename] = (string) round($expectedReportedHours, 2);

            // Denote the success of the parsing, to get an idea of what needs to be corrected before being able to trust the numbers
            $processingErrorsCountByTslogFilename[$timeSpendingLogFilename] = count($processedTimeSpendingLog->getProcessingErrors());

        }

        codecept_debug(compact("expectedReportedHoursByTslogFilenameRounded", "processingErrorsCountByTslogFilename"));

        // To make it easier to check these important results
        file_put_contents(
            $pathToFolderWhereTsLogsReside . "/0-hoursByTslogFilenameRounded.latest-run.json",
            \AppJson::encode($expectedReportedHoursByTslogFilenameRounded, JSON_PRETTY_PRINT)
        );
        file_put_contents(
            $pathToFolderWhereTsLogsReside . "/0-processingErrorsCountByTslogFilename.latest-run.json",
            \AppJson::encode($processingErrorsCountByTslogFilename, JSON_PRETTY_PRINT)
        );

        $totalProcessingErrorsCount = \Functional\sum($processingErrorsCountByTslogFilename);

        codecept_debug(compact("totalProcessingErrorsCount"));

        $this->assertEquals(0, $totalProcessingErrorsCount, "No processing errors for tslogs in the folder '$pathToFolderWhereTsLogsReside'");

        // import the tslogs

        $this->importTsLogsByPaths($timeSpendingLogPaths, $expectedReportedHoursByTslogFilename);

    }

    iImportTheTslogsInFixtureFolder(fixtureFolder) //first ensure that the tslogs can be parsed properly
    //To make it easier to check these important results
    //import the tslogs
    {
        var pathToFolderWhereTsLogsReside = codecept_data_dir(fixtureFolder);
        var timeSpendingLogPaths = this.constructor.timeSpendingLogPathsInFolder(pathToFolderWhereTsLogsReside);
        var expectedReportedHoursByTslogFilename = Array();
        var expectedReportedHoursByTslogFilenameRounded = Array();
        var processingErrorsCountByTslogFilename = Array();

        for (var timeSpendingLogPath of Object.values(timeSpendingLogPaths)) //Denote the success of the parsing, to get an idea of what needs to be corrected before being able to trust the numbers
        {
            var timeSpendingLogFilename = pathinfo(timeSpendingLogPath, PATHINFO_FILENAME);
            var processedTimeSpendingLog = this.processTimeSpendingLog(timeSpendingLogPath);
            var expectedReportedHours = processedTimeSpendingLog.calculateTotalReportedTime();
            expectedReportedHoursByTslogFilename[timeSpendingLogFilename] = expectedReportedHours;
            expectedReportedHoursByTslogFilenameRounded[timeSpendingLogFilename] = String(Math.round(expectedReportedHours, 2));
            processingErrorsCountByTslogFilename[timeSpendingLogFilename] = processedTimeSpendingLog.getProcessingErrors().length;
        }

        codecept_debug(compact("expectedReportedHoursByTslogFilenameRounded", "processingErrorsCountByTslogFilename"));
        file_put_contents(pathToFolderWhereTsLogsReside + "/0-hoursByTslogFilenameRounded.latest-run.json", global.AppJson.encode(expectedReportedHoursByTslogFilenameRounded, JSON_PRETTY_PRINT));
        file_put_contents(pathToFolderWhereTsLogsReside + "/0-processingErrorsCountByTslogFilename.latest-run.json", global.AppJson.encode(processingErrorsCountByTslogFilename, JSON_PRETTY_PRINT));
        var totalProcessingErrorsCount = global.Functional.sum(processingErrorsCountByTslogFilename);
        codecept_debug(compact("totalProcessingErrorsCount"));
        this.assertEquals(0, totalProcessingErrorsCount, `No processing errors for tslogs in the folder '${pathToFolderWhereTsLogsReside}'`);
        this.importTsLogsByPaths(timeSpendingLogPaths, expectedReportedHoursByTslogFilename);
    }

 */
