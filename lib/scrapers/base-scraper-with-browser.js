'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOGIN_RESULT = exports.BaseScraperWithBrowser = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var getKeyByValue = function () {
  var _ref = _asyncToGenerator(function* (object, value) {
    var keys = Object.keys(object);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        var conditions = object[key];

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = conditions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var condition = _step2.value;

            var result = false;

            if (condition instanceof RegExp) {
              result = condition.test(value);
            } else if (typeof condition === 'function') {
              result = yield condition();
            } else {
              result = value.toLowerCase() === condition.toLowerCase();
            }

            if (result) {
              return Promise.resolve(key);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return Promise.resolve(_constants.LOGIN_RESULT.UNKNOWN_ERROR);
  });

  return function getKeyByValue(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var _puppeteer = require('puppeteer');

var _puppeteer2 = _interopRequireDefault(_puppeteer);

var _baseScraper = require('./base-scraper');

var _constants = require('../constants');

var _navigation = require('../helpers/navigation');

var _elementsInteractions = require('../helpers/elements-interactions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var VIEWPORT_WIDTH = 1024;
var VIEWPORT_HEIGHT = 768;
var OK_STATUS = 200;

function handleLoginResult(scraper, loginResult) {
  switch (loginResult) {
    case _constants.LOGIN_RESULT.SUCCESS:
      scraper.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGIN_SUCCESS);
      return { success: true };
    case _constants.LOGIN_RESULT.INVALID_PASSWORD:
    case _constants.LOGIN_RESULT.UNKNOWN_ERROR:
      scraper.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGIN_FAILED);
      return {
        success: false,
        errorType: loginResult
      };
    case _constants.LOGIN_RESULT.CHANGE_PASSWORD:
      scraper.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.CHANGE_PASSWORD);
      return {
        success: false,
        errorType: loginResult
      };
    default:
      throw new Error(`unexpected login result "${loginResult}"`);
  }
}

function createGeneralError() {
  return {
    success: false,
    errorType: _constants.GENERAL_ERROR
  };
}

class BaseScraperWithBrowser extends _baseScraper.BaseScraper {
  initialize() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.INITIALIZING);

      var env = null;
      if (_this.options.verbose) {
        env = Object.assign({ DEBUG: '*' }, process.env);
      }

      if (typeof _this.options.browser !== 'undefined' && _this.options.browser !== null) {
        _this.browser = _this.options.browser;
      } else {
        _this.browser = yield _puppeteer2.default.launch({ env: env, headless: !_this.options.showBrowser });
      }

      var pages = yield _this.browser.pages();
      if (pages.length) {
        var _pages = _slicedToArray(pages, 1);

        _this.page = _pages[0];
      } else {
        _this.page = yield _this.browser.newPage();
      }
      yield _this.page.setViewport({
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT
      });
    })();
  }

  navigateTo(url, page) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var pageToUse = page || _this2.page;
      var response = yield pageToUse.goto(url);
      if (!response || response.status() !== OK_STATUS) {
        throw new Error(`Error while trying to navigate to url ${url}`);
      }
    })();
  }

  getLoginOptions() {
    throw new Error(`getLoginOptions() is not created in ${this.options.companyId}`);
  }

  fillInputs(fields) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var modified = [...fields];
      var input = modified.shift();
      yield (0, _elementsInteractions.fillInput)(_this3.page, input.selector, input.value);
      if (modified.length) {
        return _this3.fillInputs(modified);
      }
      return null;
    })();
  }

  login(credentials) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (!credentials) {
        return createGeneralError();
      }

      var loginOptions = _this4.getLoginOptions(credentials);

      yield _this4.navigateTo(loginOptions.loginUrl);
      if (loginOptions.checkReadiness) {
        yield loginOptions.checkReadiness();
      } else {
        yield (0, _elementsInteractions.waitUntilElementFound)(_this4.page, loginOptions.submitButtonSelector);
      }

      if (loginOptions.preAction) {
        yield loginOptions.preAction();
      }
      yield _this4.fillInputs(loginOptions.fields);
      yield (0, _elementsInteractions.clickButton)(_this4.page, loginOptions.submitButtonSelector);
      _this4.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGGING_IN);

      if (loginOptions.postAction) {
        yield loginOptions.postAction();
      } else {
        yield (0, _navigation.waitForNavigation)(_this4.page);
      }

      var current = yield (0, _navigation.getCurrentUrl)(_this4.page, true);
      var loginResult = yield getKeyByValue(loginOptions.possibleResults, current);
      return handleLoginResult(_this4, loginResult);
    })();
  }

  terminate() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      _this5.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.TERMINATING);
      yield _this5.browser.close();
    })();
  }
}

exports.BaseScraperWithBrowser = BaseScraperWithBrowser;
exports.LOGIN_RESULT = _constants.LOGIN_RESULT;