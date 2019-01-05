export class TimeLogParsingException extends Error {
  public debug: any;
  constructor(message, debug = null, _errCode = null, _previous = null) {
    super(message);
    this.debug = debug;
  }
}
