import { findTimeZone } from "timezone-support";
// import { parseZonedTime } from "timezone-support/dist/parse-format";

export class DateTimeZone {
  // https://github.com/prantlf/date-fns-timezone/blob/master/src/parseFromString.js
  public static interpretTimezoneString(timezoneString) {
    const interpretationMap = {
      /* tslint:disable:object-literal-sort-keys */
      "GMT-6": "-06:00",
      "UTC-6": "-06:00",
      "UTC-06": "-06:00",
      Orlando: "America/New_York",
      "Las Vegas/GMT-8": "-08:00",
      "Austin/GMT-6": "-06:00",
      "US/San Francisco": "America/Los_Angeles",
      /* tslint:enable:object-literal-sort-keys */
    };
    if (undefined !== interpretationMap[timezoneString]) {
      return interpretationMap[timezoneString];
    }
    return timezoneString;
  }

  /*
  public static parseZonedString(dateString, formatString) {
    const time = parseZonedTime(dateString, formatString);
    return convertTimeToDate(time);
  }
  */
  private readonly timeZone: string;
  private readonly timeZoneInfo: any;
  constructor(timezoneString) {
    this.timeZone = DateTimeZone.interpretTimezoneString(timezoneString);
    // This is weird - can't use offsets directly, instead must translate
    // Even weirder is that GMT timezones count backwards
    switch (this.timeZone) {
      case "-06:00":
        this.timeZone = "Etc/GMT+6";
        break;
    }
    this.timeZoneInfo = findTimeZone(this.timeZone);
  }
  public toString() {
    return this.timeZone;
  }
  public getName() {
    return this.timeZone;
  }
  public getTimeZoneInfo() {
    return this.timeZoneInfo;
  }
}
