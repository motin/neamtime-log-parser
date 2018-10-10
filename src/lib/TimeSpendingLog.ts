import { file_get_contents } from "locutus/php/filesystem";
import { str_replace } from "locutus/php/strings";
import { InvalidArgumentException } from "./exceptions/InvalidArgumentException";
import { LogParser } from "./LogParser";

interface TimeSpendingLogStdClass {
  tzFirst;
  rawLogContents;
  inputContentTypeRef;
  name;
  firstRowsCommentIsTheName;
}

export class TimeSpendingLog {
  public static createFromStdClass(
    timeSpendingLogStdClass: TimeSpendingLogStdClass,
  ) {
    const timeSpendingLog = new TimeSpendingLog();
    timeSpendingLog.setAttributesFromStdClass(timeSpendingLogStdClass);
    return timeSpendingLog;
  }

  public static createFromStdClassAndUseDefaultsForMissingAttributes(
    timeSpendingLogStdClass: TimeSpendingLogStdClass,
  ) {
    this.useDefaultsForMissingAttributesInStdClassRepresentation(
      timeSpendingLogStdClass,
    );
    const timeSpendingLog = new TimeSpendingLog();
    timeSpendingLog.setAttributesFromStdClass(timeSpendingLogStdClass);
    return timeSpendingLog;
  }

  public static createFromPathAndStdClassAndUseDefaultsForMissingAttributes(
    timeSpendingLogPath,
    timeSpendingLogStdClass: TimeSpendingLogStdClass,
  ) {
    const timeSpendingLogContents = file_get_contents(timeSpendingLogPath);
    timeSpendingLogStdClass.rawLogContents = timeSpendingLogContents;
    const timeSpendingLog = this.createFromStdClassAndUseDefaultsForMissingAttributes(
      timeSpendingLogStdClass,
    );
    return timeSpendingLog;
  }

  public static useDefaultsForMissingAttributesInStdClassRepresentation(
    timeSpendingLogStdClass: TimeSpendingLogStdClass,
  ) {
    if (!(undefined !== timeSpendingLogStdClass.tzFirst)) {
      timeSpendingLogStdClass.tzFirst = "UTC";
    }

    if (!(undefined !== timeSpendingLogStdClass.inputContentTypeRef)) {
      timeSpendingLogStdClass.inputContentTypeRef = "neamtime-log";
    }

    if (!(undefined !== timeSpendingLogStdClass.firstRowsCommentIsTheName)) {
      timeSpendingLogStdClass.firstRowsCommentIsTheName = !timeSpendingLogStdClass.name
        ? "1"
        : undefined;
    }
  }

  public static validateStdClassRepresentation(
    timeSpendingLogStdClass: TimeSpendingLogStdClass,
  ) {
    if (!(undefined !== timeSpendingLogStdClass.tzFirst)) {
      throw new InvalidArgumentException("Missing param: tzFirst");
    }

    if (!(undefined !== timeSpendingLogStdClass.rawLogContents)) {
      throw new InvalidArgumentException("Missing param: rawLogContents");
    }

    if (!(undefined !== timeSpendingLogStdClass.name)) {
      throw new InvalidArgumentException("Missing param: name");
    }
  }

  public tzFirst;
  public rawLogContents;
  public inputContentTypeRef;
  public name;

  public setAttributesFromStdClass(
    timeSpendingLogStdClass: TimeSpendingLogStdClass,
  ) {
    this.tzFirst = timeSpendingLogStdClass.tzFirst;
    this.rawLogContents = timeSpendingLogStdClass.rawLogContents;

    if (undefined !== timeSpendingLogStdClass.inputContentTypeRef) {
      this.inputContentTypeRef = timeSpendingLogStdClass.inputContentTypeRef;
    }

    this.name = !!timeSpendingLogStdClass.firstRowsCommentIsTheName
      ? this.nameFromFirstRowOfRawLogContents()
      : timeSpendingLogStdClass.name;
  }

  public nameFromFirstRowOfRawLogContents() {
    if (!this.rawLogContents) {
      throw new InvalidArgumentException(
        "nameFromFirstRowOfRawLogContents requires that rawLogContents is not empty",
      );
    }

    const name = str_replace(
      "#",
      "",
      LogParser.readFirstNonEmptyLineOfText(this.rawLogContents),
    ).trim();

    if (!name) {
      throw new Error("nameFromFirstRowOfRawLogContents yielded an empty name");
    }

    return name;
  }
}
