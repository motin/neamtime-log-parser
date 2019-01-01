export class TimeSpendingLogProcessingErrorsEncounteredException extends Error {
  public processedTimeSpendingLog;
  constructor(message, _errCode = null, _previous = null) {
    super(message);
  }
}
