# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
