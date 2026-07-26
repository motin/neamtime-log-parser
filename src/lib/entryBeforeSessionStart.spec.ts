import test, { ExecutionContext } from "ava";
import path from "path";
import { file_get_contents } from "./php-compat/fs";
import { fixturesPath } from "../inc/testUtils";
import { parseTimeLog } from "./parse";
import { TimeLogParseResult } from "./ProcessedTimeSpendingLog";

/**
 * Regression tests for the class of failure where a single malformed line made
 * a whole day of tracked time disappear from the parse result, silently.
 *
 * Real incident (2026-07-26): correcting a reconstructed log moved a session's
 * `start` from 08:56 to 09:15 while the block's only entry line still read
 * 08:57. The entry was rejected for having a negative duration since the last
 * time marker, the session-specific re-parse therefore raised a processing
 * error, and `parseDetectSessionsOneByOne` discarded the entire session - so
 * 2026-01-19 vanished from the output entirely, 344 tracked minutes gone, while
 * the entries that survived still summed to a plausible-looking total.
 *
 * The two fixtures are identical apart from that one timestamp, so any
 * divergence between them is the bug.
 */

const WELL_FORMED_FIXTURE = path.join(
  fixturesPath,
  "correct",
  "basics",
  "entry-right-after-its-own-start.tslog",
);

const ENTRY_BEFORE_START_FIXTURE = path.join(
  fixturesPath,
  "incorrect",
  "basics",
  "entry-timestamped-before-its-own-start.tslog",
);

const parseFixture = (fixturePath: string): TimeLogParseResult =>
  parseTimeLog(file_get_contents(fixturePath), { timezone: "UTC" });

const minutesPerDay = (
  result: TimeLogParseResult,
): { [date: string]: number } => {
  const minutes = {};
  for (const entry of result.entries) {
    minutes[entry.date] = (minutes[entry.date] || 0) + entry.hours * 60;
  }
  // Round away floating point noise from the hours-based accumulation
  for (const date of Object.keys(minutes)) {
    minutes[date] = Math.round(minutes[date] * 100) / 100;
  }
  return minutes;
};

test("a well-formed log with an entry right after its own start parses cleanly", (t: ExecutionContext) => {
  const result = parseFixture(WELL_FORMED_FIXTURE);

  t.is(result.status, "OK");
  t.is(result.errorCount, 0);
  t.is(result.metadata.sessionCount, 3);
  t.deepEqual(minutesPerDay(result), {
    "2026-01-18": 35,
    "2026-01-19": 688,
    "2026-01-20": 363,
  });
});

test("an entry timestamped before its own start keeps every minute of its day", (t: ExecutionContext) => {
  const wellFormed = parseFixture(WELL_FORMED_FIXTURE);
  const entryBeforeStart = parseFixture(ENTRY_BEFORE_START_FIXTURE);

  // The day must not disappear, and no other day may be affected either
  t.deepEqual(
    minutesPerDay(entryBeforeStart),
    minutesPerDay(wellFormed),
    "Tracked minutes per day must be unchanged by clamping the too-early entry",
  );
  t.is(entryBeforeStart.entries.length, wellFormed.entries.length);
  t.is(
    entryBeforeStart.metadata.sessionCount,
    wellFormed.metadata.sessionCount,
  );

  // The offending entry itself survives, with its text intact
  const clamped = entryBeforeStart.entries.filter((entry) =>
    entry.text.includes("immutable billing reconciliation"),
  );
  t.is(clamped.length, 1);
  t.is(clamped[0].date, "2026-01-19");
});

test("an entry timestamped before its own start is surfaced as a processing error", (t: ExecutionContext) => {
  const result = parseFixture(ENTRY_BEFORE_START_FIXTURE);

  t.not(result.status, "OK", "A clamped entry must never be reported as OK");
  t.true(result.errorCount > 0);

  const errors = result.errors.filter(
    (error) => error.ref === "entry-before-session-start",
  );
  t.is(
    errors.length,
    1,
    "The anomaly must be reported under its own error ref",
  );

  // The message has to be actionable on its own in errors.md: which line, and
  // both of the timestamps that contradict each other.
  const message = errors[0].message;
  t.true(message.includes("line 8"), `Expected a line number in: ${message}`);
  t.true(
    message.includes("2026-01-19 (+0200) 08:57"),
    `Expected the entry timestamp in: ${message}`,
  );
  t.true(
    message.includes("start 2026-01-19 (+0200) 09:15"),
    `Expected the start timestamp in: ${message}`,
  );
});

/**
 * The mechanism behind the data loss was general: ANY processing error raised
 * while re-parsing a session individually caused that session to be dropped
 * from the result. This fixture triggers a different anomaly - an entry earlier
 * than the preceding entry, which is deliberately still rejected rather than
 * clamped - and asserts that the rejection costs only that one line.
 */
const OUT_OF_ORDER_ENTRY_LOG = [
  "start 2026-01-19 (+0200) 09:15",
  "",
  "2026-01-19 (+0200) 09:16, first",
  "2026-01-19 (+0200) 09:10, out of order",
  "2026-01-19 (+0200) 10:00, third",
  "paus 2026-01-19 (+0200) 12:00->",
  "",
  "start 2026-01-20 (+0200) 09:30",
  "",
  "2026-01-20 (+0200) 09:31, next day",
  "paus 2026-01-20 (+0200) 15:33->",
  "",
].join("\n");

test("a session whose re-parse reports an error is still included in the result", (t: ExecutionContext) => {
  const result = parseTimeLog(OUT_OF_ORDER_ENTRY_LOG, { timezone: "UTC" });

  t.is(result.status, "Warnings");
  t.is(result.metadata.sessionCount, 2, "Neither session may be discarded");

  const minutes = minutesPerDay(result);
  t.is(
    minutes["2026-01-19"],
    165,
    "The day of the rejected line keeps the rest of its tracked time",
  );
  t.is(minutes["2026-01-20"], 363);
});
