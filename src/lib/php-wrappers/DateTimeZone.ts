import {
  convertTimeToDate,
  findTimeZone,
  getUnixTime,
  getZonedTime,
  // parseZonedTime,
  listTimeZones,
} from "timezone-support";
import { parseZonedTime } from "timezone-support/dist/parse-format";

export class DateTimeZone {
  // https://github.com/prantlf/date-fns-timezone/blob/master/src/parseFromString.js
  public static parseZonedString(dateString, formatString) {
    const time = parseZonedTime(dateString, formatString);
    return convertTimeToDate(time);
  }
  private readonly timeZone: string;
  private readonly timeZoneInfo: any;
  constructor(timeZone) {
    this.timeZone = timeZone;
    this.timeZoneInfo = findTimeZone(timeZone);
    // TODO: Unknown or bad timezone
    console.log("timeZone, timeZoneInfo", timeZone, typeof this.timeZoneInfo);
  }
  public toString() {
    return this.timeZone;
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
