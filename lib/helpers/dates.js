'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getAllMonthMoments;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getAllMonthMoments(startMoment, includeNext) {
  var monthMoment = (0, _moment2.default)(startMoment).startOf('month');

  var allMonths = [];
  var lastMonth = (0, _moment2.default)().startOf('month');
  if (includeNext) {
    lastMonth = lastMonth.add(1, 'month');
  }
  while (monthMoment.isSameOrBefore(lastMonth)) {
    allMonths.push(monthMoment);
    monthMoment = (0, _moment2.default)(monthMoment).add(1, 'month');
  }

  return allMonths;
}