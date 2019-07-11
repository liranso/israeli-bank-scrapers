'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fixInstallments = fixInstallments;
exports.sortTransactionsByDate = sortTransactionsByDate;
exports.filterOldTransactions = filterOldTransactions;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _constants = require('../constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isNormalTransaction(txn) {
  return txn.type === _constants.NORMAL_TXN_TYPE;
}

function isInstallmentTransaction(txn) {
  return txn.type === _constants.INSTALLMENTS_TXN_TYPE;
}

function isNonInitialInstallmentTransaction(txn) {
  return isInstallmentTransaction(txn) && txn.installments && txn.installments.number > 1;
}

function isInitialInstallmentTransaction(txn) {
  return isInstallmentTransaction(txn) && txn.installments && txn.installments.number === 1;
}

function fixInstallments(txns) {
  return txns.map(function (txn) {
    var clonedTxn = Object.assign({}, txn);
    if (isNonInitialInstallmentTransaction(clonedTxn)) {
      var dateMoment = (0, _moment2.default)(clonedTxn.date);
      var actualDateMoment = dateMoment.add(clonedTxn.installments.number - 1, 'month');
      clonedTxn.date = actualDateMoment.toISOString();
    }
    return clonedTxn;
  });
}

function sortTransactionsByDate(txns) {
  return _lodash2.default.sortBy(txns, ['date']);
}

function filterOldTransactions(txns, startMoment, combineInstallments) {
  return txns.filter(function (txn) {
    var combineNeededAndInitialOrNormal = combineInstallments && (isNormalTransaction(txn) || isInitialInstallmentTransaction(txn));
    return !combineInstallments && startMoment.isSameOrBefore(txn.date) || combineNeededAndInitialOrNormal && startMoment.isSameOrBefore(txn.date);
  });
}