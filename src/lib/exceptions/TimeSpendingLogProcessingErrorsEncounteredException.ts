export class TimeSpendingLogProcessingErrorsEncounteredException extends Error {
  public processedTimeSpendingLog;
  constructor(message, _errCode, _previous) {
    super(message);
  }
}
