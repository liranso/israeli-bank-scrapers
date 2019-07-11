'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var waitUntilElementFound = function () {
  var _ref = _asyncToGenerator(function* (page, elementSelector, onlyVisible = false, timeout = 30000) {
    yield page.waitForSelector(elementSelector, { visible: onlyVisible, timeout: timeout });
  });

  return function waitUntilElementFound(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var fillInput = function () {
  var _ref2 = _asyncToGenerator(function* (page, inputSelector, inputValue) {
    yield page.$eval(inputSelector, function (input) {
      var inputElement = input;
      inputElement.value = '';
    });
    yield page.type(inputSelector, inputValue);
  });

  return function fillInput(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

var clickButton = function () {
  var _ref3 = _asyncToGenerator(function* (page, buttonSelector) {
    var button = yield page.$(buttonSelector);
    yield button.click();
  });

  return function clickButton(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

var pageEvalAll = function () {
  var _ref4 = _asyncToGenerator(function* (page, selector, defaultResult, callback) {
    var result = defaultResult;
    try {
      result = yield page.$$eval(selector, callback);
    } catch (e) {
      // TODO temporary workaround to puppeteer@1.5.0 which breaks $$eval bevahvior until they will release a new version.
      if (e.message.indexOf('Error: failed to find elements matching selector') !== 0) {
        throw e;
      }
    }

    return result;
  });

  return function pageEvalAll(_x8, _x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  };
}();

var elementPresentOnPage = function () {
  var _ref5 = _asyncToGenerator(function* (page, selector) {
    return (yield page.$(selector)) !== null;
  });

  return function elementPresentOnPage(_x12, _x13) {
    return _ref5.apply(this, arguments);
  };
}();

var dropdownSelect = function () {
  var _ref6 = _asyncToGenerator(function* (page, selectSelector, value) {
    yield page.select(selectSelector, value);
  });

  return function dropdownSelect(_x14, _x15, _x16) {
    return _ref6.apply(this, arguments);
  };
}();

var dropdownElements = function () {
  var _ref7 = _asyncToGenerator(function* (page, selector) {
    var options = yield page.evaluate(function (optionSelector) {
      return Array.from(document.querySelectorAll(optionSelector)).filter(function (o) {
        return o.value;
      }).map(function (o) {
        return {
          name: o.text,
          value: o.value
        };
      });
    }, `${selector} > option`);
    return options;
  });

  return function dropdownElements(_x17, _x18) {
    return _ref7.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.waitUntilElementFound = waitUntilElementFound;
exports.fillInput = fillInput;
exports.clickButton = clickButton;
exports.dropdownSelect = dropdownSelect;
exports.dropdownElements = dropdownElements;
exports.pageEvalAll = pageEvalAll;
exports.elementPresentOnPage = elementPresentOnPage;