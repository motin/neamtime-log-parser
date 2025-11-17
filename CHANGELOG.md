# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
