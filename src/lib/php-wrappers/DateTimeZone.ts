import {
  // convertTimeToDate,
  findTimeZone,
  getUnixTime,
  // getUTCOffset,
  getZonedTime,
  // parseZonedTime,
  listTimeZones,
} from "timezone-support";
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
  public foo() {
    // List canonical time zone names: [ 'Africa/Abidjan', ... ]
    const timeZones = listTimeZones();

    // Find a particular time zone: { name: 'Europe/Berlin', ... }
    const berlin = findTimeZone("Europe/Berlin");

    // Convert a date to a specific time zone: { year, month, day, dayOfWeek,
    // hours, minutes, seconds, milliseconds, epoch, zone: { abbreviation, offset } }
    const nativeDate = new Date();
    const berlinTime = getZonedTime(nativeDate, berlin);

    // Convert a time from a specific time zone: native Date object
    // const berlinTime = { year: 2018, month: 9, day: 2, hours: 10, minutes: 0 };
    const nativeDate2 = new Date(getUnixTime(berlinTime, berlin));

    console.log(
      "timeZones, berlinTime, nativeDate2",
      timeZones,
      berlinTime,
      nativeDate2,
      this.timeZoneInfo,
    );
  }
}
