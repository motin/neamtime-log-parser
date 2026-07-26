# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.7.3"></a>
## [0.7.3](https://github.com/motin/neamtime-log-parser/compare/v0.7.0...v0.7.3) (2026-07-26)

### Bug Fixes

* **parser**: A session is no longer discarded when its individual re-parse reports a
  processing error. `parseDetectSessionsOneByOne` caught
  `TimeSpendingLogProcessingErrorsEncounteredException`, recorded the error, and then
  dropped the session — even though the exception carried a fully-parsed processor with
  its `timeReportSourceComments` populated. Every entry of that session vanished from
  `parseTimeLog().entries` while the remaining days still summed to a plausible total.
  The processor is now salvaged and the session kept.
* **parser**: An entry timestamped *before* the `start` line of its own session is clamped
  to the start timestamp instead of being dropped, and reported as a processing error with
  ref `entry-before-session-start` naming the source line and both timestamps — so the
  parse status is `Warnings`, never `OK`. Clamping preserves the day's tracked minutes
  exactly (the entry's own duration is the gap between it and the start, which simply
  moves) and keeps the entry text. Entries merely out of order relative to a preceding
  *entry* are still rejected, which after the fix above costs one line rather than a day.

  Together these fixed a silent data loss: shifting a `start` to a later time — the single
  most common edit when correcting a log — deleted the entire enclosing session, in one
  real case 344 tracked minutes from a log used for client invoicing, with no error
  anywhere. Reported downstream as rememberthis issue #65.

### Internal

* New `TimeLogProcessor.entriesClampedToSessionStart`, and `RowMetadata` gains
  `tsClampedToSessionStart` / `tsBeforeClamp` / `clampedToLine`.
* Regression coverage in `src/lib/entryBeforeSessionStart.spec.ts` plus a fixture pair
  (`fixtures/correct/basics/entry-right-after-its-own-start.tslog` and
  `fixtures/incorrect/basics/entry-timestamped-before-its-own-start.tslog`) that differ
  only in the one timestamp.

**Note on versioning**: this jumps 0.7.0 → 0.7.3. Versions 0.7.1 and 0.7.2 were published
to a local Verdaccio registry and never to npm; 0.7.3 is chosen so that `^0.7.0` resolves
to this release on machines that can see either registry.

<a name="0.7.0"></a>
# [0.7.0](https://github.com/motin/neamtime-log-parser/compare/v0.6.0...v0.7.0) (2026-01-30)

### Features

* **parser**: Add frontmatter and category tag parsing for client/project tracking ([4da3ccd](https://github.com/motin/neamtime-log-parser/commit/4da3ccd))
* **parser**: Fix multi-session parsing: propagate frontmatter and category tags ([55ac0d6](https://github.com/motin/neamtime-log-parser/commit/55ac0d6))

### Internal

* Remove locutus dependency, replace with lightweight TypeScript implementations ([ab4b7cf](https://github.com/motin/neamtime-log-parser/commit/ab4b7cf))
* Modernize dependencies and tooling ([631a5ee](https://github.com/motin/neamtime-log-parser/commit/631a5ee))
* Upgrade ESLint to v9 with flat config ([28c53e3](https://github.com/motin/neamtime-log-parser/commit/28c53e3))
* Fix CI: set TZ=Europe/Stockholm for timezone-sensitive tests ([3214452](https://github.com/motin/neamtime-log-parser/commit/3214452))
* Fix test scripts to avoid recursive/redundant test runs ([cb7d1ee](https://github.com/motin/neamtime-log-parser/commit/cb7d1ee))

<a name="0.6.0"></a>
# [0.6.0](https://github.com/motin/neamtime-log-parser/compare/v0.5.0...v0.6.0) (2025-11-17)

### Features

* **api**: New high-level API with structured error handling ([7868deb](https://github.com/motin/neamtime-log-parser/commit/7868deb), [00596d2](https://github.com/motin/neamtime-log-parser/commit/00596d2))
  - Added `parseTimeLog()` and `parseTimeLogFile()` functions with clean, type-safe interface
  - Structured result format with `status`, `entries`, `metadata`, and `errors`
  - Better separation between warnings and fatal errors
  - Comprehensive TypeScript types for all result data

### Bug Fixes

* **parser**: Preserve category markers (`.::`) during parsing ([b06e4c6](https://github.com/motin/neamtime-log-parser/commit/b06e4c6))
  - Category markers like `.:: Client / Project` are no longer merged into previous log entries
  - Category markers can now appear before the first time entry
  - Fixes preprocessing to handle category markers without 'start MISSING?' errors
  - All time entries are now correctly categorized in reports

### Documentation

* **readme**: Add category marker documentation with examples ([c2f3a45](https://github.com/motin/neamtime-log-parser/commit/c2f3a45))
* **api**: Document new high-level API with usage examples
* **testing**: Document local registry workflow for testing unreleased versions

<a name="0.5.0"></a>
# [0.5.0](https://github.com/motin/neamtime-log-parser/compare/v0.4.0...v0.5.0) (2025-10-14)

### Features

* **npm**: First public npm release with MIT license
* **docs**: Comprehensive README with API documentation and examples
* **parser**: Extended date detection to support years before 1999 and after 2020
* **parser**: Improved handling of timelogs without time markers
* **cli**: Better error handling and reporting
* **cli**: Support for binaries on all major platforms
* **export**: Structured time report data format

### Bug Fixes

* Restored passing tests by extending date range support to 100 years
* Properly handle empty raw log contents and timezone errors
* Test cleanups and improvements

### Internal

* Updated date-fns dependency
* Added comprehensive test fixtures

<a name="0.4.0"></a>
# [0.4.0](https://github.com/motin/neamtime-log-parser/compare/v0.3.0...v0.4.0) (2019-03-26)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/motin/neamtime-log-parser/compare/v0.2.0...v0.3.0) (2019-03-15)



<a name="0.2.0"></a>
# [0.2.0](https://github.com/motin/neamtime-log-parser/compare/v0.1.0...v0.2.0) (2019-02-22)


### Bug Fixes

* Also supporting negative offset timezone specifications (such as -05:00) ([a7df83f](https://github.com/motin/neamtime-log-parser/commit/a7df83f))



<a name="0.1.0"></a>
# 0.1.0 (2019-01-07)


### Bug Fixes

* 🐛 Fix bug in secondsToDuration triggered on even hours etc ([9394e4d](https://github.com/motin/neamtime-log-parser/commit/9394e4d))
* Remove use ot "return" as variable name ([1fb94a0](https://github.com/motin/neamtime-log-parser/commit/1fb94a0))


### Features

* Tweak npm scripts ([58f0fc1](https://github.com/motin/neamtime-log-parser/commit/58f0fc1))
