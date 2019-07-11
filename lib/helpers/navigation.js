'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.waitForRedirect = exports.getCurrentUrl = exports.waitForNavigationAndDomLoad = exports.waitForNavigation = undefined;

var waitForNavigation = exports.waitForNavigation = function () {
  var _ref = _asyncToGenerator(function* (page, options) {
    yield page.waitForNavigation(options);
  });

  return function waitForNavigation(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var waitForNavigationAndDomLoad = exports.waitForNavigationAndDomLoad = function () {
  var _ref2 = _asyncToGenerator(function* (page) {
    yield waitForNavigation(page, { waitUntil: 'domcontentloaded' });
  });

  return function waitForNavigationAndDomLoad(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var getCurrentUrl = exports.getCurrentUrl = function () {
  var _ref3 = _asyncToGenerator(function* (page, clientSide = false) {
    if (clientSide) {
      return page.evaluate(function () {
        return window.location.href;
      });
    }

    return page.url();
  });

  return function getCurrentUrl(_x4) {
    return _ref3.apply(this, arguments);
  };
}();

var waitForRedirect = exports.waitForRedirect = function () {
  var _ref4 = _asyncToGenerator(function* (page, timeout = 20000, clientSide = false, ignoreList = []) {
    var initial = yield getCurrentUrl(page, clientSide);

    try {
      yield (0, _waiting2.default)(_asyncToGenerator(function* () {
        var current = yield getCurrentUrl(page, clientSide);
        return current !== initial && !ignoreList.includes(current);
      }), `waiting for redirect from ${initial}`, timeout, 1000);
    } catch (e) {
      if (e && e.timeout) {
        var current = yield getCurrentUrl(page, clientSide);
        e.lastUrl = current;
      }
      throw e;
    }
  });

  return function waitForRedirect(_x5) {
    return _ref4.apply(this, arguments);
  };
}();

var _waiting = require('./waiting');

var _waiting2 = _interopRequireDefault(_waiting);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }