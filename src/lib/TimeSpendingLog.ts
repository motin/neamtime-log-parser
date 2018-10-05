class TimeSpendingLog {
  public static createFromStdClass(timeSpendingLogStdClass: stdClass) {
    const timeSpendingLog = new TimeSpendingLog();
    timeSpendingLog.setAttributesFromStdClass(timeSpendingLogStdClass);
    return timeSpendingLog;
  }

  public static createFromStdClassAndUseDefaultsForMissingAttributes(
    timeSpendingLogStdClass: stdClass
  ) {
    this.useDefaultsForMissingAttributesInStdClassRepresentation(
      timeSpendingLogStdClass
    );
    const timeSpendingLog = new TimeSpendingLog();
    timeSpendingLog.setAttributesFromStdClass(timeSpendingLogStdClass);
    return timeSpendingLog;
  }

  public static createFromPathAndStdClassAndUseDefaultsForMissingAttributes(
    timeSpendingLogPath,
    timeSpendingLogStdClass: stdClass
  ) {
    const timeSpendingLogContents = file_get_contents(timeSpendingLogPath);
    timeSpendingLogStdClass.rawLogContents = timeSpendingLogContents;
    const timeSpendingLog = this.createFromStdClassAndUseDefaultsForMissingAttributes(
      timeSpendingLogStdClass
    );
    return timeSpendingLog;
  }

  public static useDefaultsForMissingAttributesInStdClassRepresentation(
    timeSpendingLogStdClass: stdClass
  ) {
    if (!(undefined !== timeSpendingLogStdClass.tzFirst)) {
      timeSpendingLogStdClass.tzFirst = 'UTC';
    }

    if (!(undefined !== timeSpendingLogStdClass.inputContentTypeRef)) {
      timeSpendingLogStdClass.inputContentTypeRef = 'neamtime-log';
    }

    if (!(undefined !== timeSpendingLogStdClass.firstRowsCommentIsTheName)) {
      timeSpendingLogStdClass.firstRowsCommentIsTheName = !timeSpendingLogStdClass.name
        ? '1'
        : undefined;
    }
  }

  public static validateStdClassRepresentation(
    timeSpendingLogStdClass: stdClass
  ) {
    if (!(undefined !== timeSpendingLogStdClass.tzFirst)) {
      throw new InvalidArgumentException('Missing param: tzFirst');
    }

    if (!(undefined !== timeSpendingLogStdClass.rawLogContents)) {
      throw new InvalidArgumentException('Missing param: rawLogContents');
    }

    if (!(undefined !== timeSpendingLogStdClass.name)) {
      throw new InvalidArgumentException('Missing param: name');
    }
  }

  public setAttributesFromStdClass(timeSpendingLogStdClass: stdClass) {
    this.tzFirst = timeSpendingLogStdClass.tzFirst;
    this.rawLogContents = timeSpendingLogStdClass.rawLogContents;

    if (undefined !== timeSpendingLogStdClass.inputContentTypeRef) {
      this.inputContentTypeRef = timeSpendingLogStdClass.inputContentTypeRef;
    }

    if (!!timeSpendingLogStdClass.firstRowsCommentIsTheName) {
      this.name = this.nameFromFirstRowOfRawLogContents();
    } else {
      this.name = timeSpendingLogStdClass.name;
    }
  }

  public nameFromFirstRowOfRawLogContents() {
    if (!this.rawLogContents) {
      throw new InvalidArgumentException(
        'nameFromFirstRowOfRawLogContents requires that rawLogContents is not empty'
      );
    }

    const name = str_replace(
      '#',
      '',
      LogParser.readFirstNonEmptyLineOfText(this.rawLogContents)
    ).trim();

    if (!name) {
      throw new Error('nameFromFirstRowOfRawLogContents yielded an empty name');
    }

    return name;
  }
}
