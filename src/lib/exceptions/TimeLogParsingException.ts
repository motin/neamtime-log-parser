export class TimeLogParsingException extends Error {
  constructor(message, _errCode = null, _previous = null) {
    super(message);
  }
}
