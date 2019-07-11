"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function timeoutPromise(ms, promise, description) {
  var timeout = new Promise(function (resolve, reject) {
    var id = setTimeout(function () {
      clearTimeout(id);
      var error = new Error(description);
      error.timeout = true;
      reject(error);
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

function waitUntil(asyncTest, description = null, timeout = 10000, interval = 100) {
  var promise = new Promise(function (resolve, reject) {
    function wait() {
      asyncTest().then(function (value) {
        if (value === true) {
          resolve();
        } else {
          setTimeout(wait, interval);
        }
      }).catch(function () {
        reject();
      });
    }
    wait();
  });
  return timeoutPromise(timeout, promise, description);
}

exports.default = waitUntil;