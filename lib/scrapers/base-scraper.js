'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOGIN_RESULT = exports.BaseScraper = undefined;

var _events = require('events');

var _constants = require('../constants');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var SCRAPE_PROGRESS = 'SCRAPE_PROGRESS';

function createErrorResult(errorType, errorMessage) {
  return {
    success: false,
    errorType: errorType,
    errorMessage: errorMessage
  };
}

function createTimeoutError(errorMessage) {
  return createErrorResult(_constants.ERRORS.TIMEOUT, errorMessage);
}

function createGenericError(errorMessage) {
  return createErrorResult(_constants.ERRORS.GENERIC, errorMessage);
}

class BaseScraper {
  constructor(options) {
    this.options = options;
    this.eventEmitter = new _events.EventEmitter();
  }

  initialize() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.INITIALIZING);
    })();
  }

  scrape(credentials) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.START_SCRAPING);
      yield _this2.initialize();

      var loginResult = void 0;
      try {
        loginResult = yield _this2.login(credentials);
      } catch (e) {
        loginResult = e.timeout ? createTimeoutError(e.message) : createGenericError(e.message);
      }

      var scrapeResult = void 0;
      if (loginResult.success) {
        try {
          scrapeResult = yield _this2.fetchData();
        } catch (e) {
          scrapeResult = e.timeout ? createTimeoutError(e.message) : createGenericError(e.message);
        }
      } else {
        scrapeResult = loginResult;
      }

      try {
        yield _this2.terminate();
      } catch (e) {
        scrapeResult = createGenericError(e.message);
      }
      _this2.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.END_SCRAPING);

      return scrapeResult;
    })();
  }

  login() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      throw new Error(`login() is not created in ${_this3.options.companyId}`);
    })();
  }

  fetchData() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      throw new Error(`fetchData() is not created in ${_this4.options.companyId}`);
    })();
  }

  terminate() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      _this5.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.TERMINATING);
    })();
  }

  emitProgress(type) {
    this.emit(SCRAPE_PROGRESS, { type: type });
  }

  emit(eventName, payload) {
    this.eventEmitter.emit(eventName, this.options.companyId, payload);
  }

  onProgress(func) {
    this.eventEmitter.on(SCRAPE_PROGRESS, func);
  }
}

exports.BaseScraper = BaseScraper;
exports.LOGIN_RESULT = _constants.LOGIN_RESULT;