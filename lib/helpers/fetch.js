'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchPostWithinPage = exports.fetchGetWithinPage = exports.fetchPost = exports.fetchGet = undefined;

var fetchGet = exports.fetchGet = function () {
  var _ref = _asyncToGenerator(function* (url, extraHeaders) {
    var headers = getJsonHeaders();
    if (extraHeaders) {
      headers = Object.assign(headers, extraHeaders);
    }
    var request = {
      method: 'GET',
      headers: headers
    };
    var result = yield (0, _nodeFetch2.default)(url, request);
    return result.json();
  });

  return function fetchGet(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var fetchPost = exports.fetchPost = function () {
  var _ref2 = _asyncToGenerator(function* (url, data, extraHeaders) {
    var headers = getJsonHeaders();
    if (extraHeaders) {
      headers = Object.assign(headers, extraHeaders);
    }
    var request = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    };
    var result = yield (0, _nodeFetch2.default)(url, request);
    return result.json();
  });

  return function fetchPost(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

var fetchGetWithinPage = exports.fetchGetWithinPage = function () {
  var _ref3 = _asyncToGenerator(function* (page, url) {
    return page.evaluate(function (url) {
      return new Promise(function (resolve, reject) {
        fetch(url, {
          credentials: 'include'
        }).then(function (result) {
          if (result.status === 204) {
            resolve(null);
          } else {
            resolve(result.json());
          }
        }).catch(function (e) {
          reject(e);
        });
      });
    }, url);
  });

  return function fetchGetWithinPage(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

var fetchPostWithinPage = exports.fetchPostWithinPage = function () {
  var _ref4 = _asyncToGenerator(function* (page, url, data, extraHeaders = {}) {
    return page.evaluate(function (url, data, extraHeaders) {
      return new Promise(function (resolve, reject) {
        fetch(url, {
          method: 'POST',
          body: JSON.stringify(data),
          credentials: 'include',
          headers: new Headers(Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, extraHeaders))
        }).then(function (result) {
          if (result.status === 204) {
            // No content response
            resolve(null);
          } else {
            resolve(result.json());
          }
        }).catch(function (e) {
          reject(e);
        });
      });
    }, url, data, extraHeaders);
  });

  return function fetchPostWithinPage(_x8, _x9, _x10) {
    return _ref4.apply(this, arguments);
  };
}();

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var JSON_CONTENT_TYPE = 'application/json';

function getJsonHeaders() {
  return {
    Accept: JSON_CONTENT_TYPE,
    'Content-Type': JSON_CONTENT_TYPE
  };
}