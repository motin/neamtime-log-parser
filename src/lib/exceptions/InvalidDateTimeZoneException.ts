export class InvalidDateTimeZoneException extends Error {
  constructor(message, _errCode, _previous) {
    super(message);
  }
}
