<?php

class TimeSpendingLog
{

    public $tzFirst;
    public $rawLogContents;
    public $name;
    public $inputContentTypeRef;

    static public function createFromStdClass(stdClass $timeSpendingLogStdClass)
    {
        $timeSpendingLog = new TimeSpendingLog();
        $timeSpendingLog->setAttributesFromStdClass($timeSpendingLogStdClass);
        return $timeSpendingLog;
    }

    static public function createFromStdClassAndUseDefaultsForMissingAttributes(stdClass $timeSpendingLogStdClass)
    {
        static::useDefaultsForMissingAttributesInStdClassRepresentation($timeSpendingLogStdClass);
        $timeSpendingLog = new TimeSpendingLog();
        $timeSpendingLog->setAttributesFromStdClass($timeSpendingLogStdClass);
        return $timeSpendingLog;
    }

    static public function createFromPathAndStdClassAndUseDefaultsForMissingAttributes($timeSpendingLogPath, stdClass $timeSpendingLogStdClass)
    {
        $timeSpendingLogContents = file_get_contents($timeSpendingLogPath);
        $timeSpendingLogStdClass->rawLogContents = $timeSpendingLogContents;
        $timeSpendingLog = static::createFromStdClassAndUseDefaultsForMissingAttributes($timeSpendingLogStdClass);
        return $timeSpendingLog;
    }

    static protected function useDefaultsForMissingAttributesInStdClassRepresentation(stdClass &$timeSpendingLogStdClass)
    {
        if (!isset($timeSpendingLogStdClass->tzFirst)) {
            $timeSpendingLogStdClass->tzFirst = 'UTC';
        }
        if (!isset($timeSpendingLogStdClass->inputContentTypeRef)) {
            $timeSpendingLogStdClass->inputContentTypeRef = 'neamtime-log';
        }
        if (!isset($timeSpendingLogStdClass->firstRowsCommentIsTheName)) {
            $timeSpendingLogStdClass->firstRowsCommentIsTheName = empty($timeSpendingLogStdClass->name) ? '1' : null;
        }
    }

    public function setAttributesFromStdClass(stdClass $timeSpendingLogStdClass)
    {
        $this->tzFirst = $timeSpendingLogStdClass->tzFirst;
        $this->rawLogContents = $timeSpendingLogStdClass->rawLogContents;
        if (isset($timeSpendingLogStdClass->inputContentTypeRef)) {
            $this->inputContentTypeRef = $timeSpendingLogStdClass->inputContentTypeRef;
        }
        if (!empty($timeSpendingLogStdClass->firstRowsCommentIsTheName)) {
            $this->name = $this->nameFromFirstRowOfRawLogContents();
        } else {
            $this->name = $timeSpendingLogStdClass->name;
        }
    }

    static public function validateStdClassRepresentation(stdClass $timeSpendingLogStdClass)
    {
        if (!isset($timeSpendingLogStdClass->tzFirst)) {
            throw new InvalidArgumentException("Missing param: tzFirst");
        }
        if (!isset($timeSpendingLogStdClass->rawLogContents)) {
            throw new InvalidArgumentException("Missing param: rawLogContents");
        }
        if (!isset($timeSpendingLogStdClass->name)) {
            throw new InvalidArgumentException("Missing param: name");
        }
    }

    public function nameFromFirstRowOfRawLogContents()
    {
        if (empty($this->rawLogContents)) {
            throw new InvalidArgumentException("nameFromFirstRowOfRawLogContents requires that rawLogContents is not empty");
        }
        $name = trim(str_replace("#", "", LogParser::readFirstNonEmptyLineOfText($this->rawLogContents)));
        if (empty($name)) {
            throw new Exception("nameFromFirstRowOfRawLogContents yielded an empty name");
        }
        return $name;
    }

}
