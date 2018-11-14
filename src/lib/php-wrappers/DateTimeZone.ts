export class DateTimeZone {
  private readonly timeZone: string;
  constructor(timeZone) {
    console.log("DateTimeZone TODO", timeZone);
    this.timeZone = timeZone;
  }
  public toString() {
    return this.timeZone;
  }
}
