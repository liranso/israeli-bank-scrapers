'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var fetchAccountData = function () {
  var _ref = _asyncToGenerator(function* (page, options) {
    var apiSiteUrl = `${BASE_URL}/Titan/gatewayAPI`;

    var accountDataUrl = `${apiSiteUrl}/userAccountsData`;
    var accountInfo = yield (0, _fetch.fetchGetWithinPage)(page, accountDataUrl);
    var accountNumber = accountInfo.UserAccountsData.DefaultAccountNumber;

    var defaultStartMoment = (0, _moment2.default)().subtract(1, 'years').add(1, 'day');
    var startDate = options.startDate || defaultStartMoment.toDate();
    var startMoment = _moment2.default.max(defaultStartMoment, (0, _moment2.default)(startDate));

    var startDateStr = startMoment.format(DATE_FORMAT);
    var txnsUrl = `${apiSiteUrl}/lastTransactions/${accountNumber}/Date?IsCategoryDescCode=True&IsTransactionDetails=True&IsEventNames=True&IsFutureTransactionFlag=True&FromDate=${startDateStr}`;
    var txnsResult = yield (0, _fetch.fetchGetWithinPage)(page, txnsUrl);
    if (txnsResult.Error) {
      return {
        success: false,
        errorType: 'generic',
        errorMessage: txnsResult.Error.MsgText
      };
    }

    var completedTxns = convertTransactions(txnsResult.CurrentAccountLastTransactions.OperationEntry, _constants.TRANSACTION_STATUS.COMPLETED);
    var rawFutureTxns = _lodash2.default.get(txnsResult, 'CurrentAccountLastTransactions.FutureTransactionsBlock.FutureTransactionEntry');
    var pendingTxns = convertTransactions(rawFutureTxns, _constants.TRANSACTION_STATUS.PENDING);

    var accountData = {
      success: true,
      accounts: [{
        accountNumber: accountNumber,
        txns: [...completedTxns, ...pendingTxns]
      }]
    };

    return accountData;
  });

  return function fetchAccountData(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var navigateOrErrorLabel = function () {
  var _ref2 = _asyncToGenerator(function* (page) {
    try {
      yield (0, _navigation.waitForNavigation)(page);
    } catch (e) {
      yield (0, _elementsInteractions.waitUntilElementFound)(page, '#general-error', false, 100);
    }
  });

  return function navigateOrErrorLabel(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _baseScraperWithBrowser = require('./base-scraper-with-browser');

var _elementsInteractions = require('../helpers/elements-interactions');

var _navigation = require('../helpers/navigation');

var _fetch = require('../helpers/fetch');

var _constants = require('../constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BASE_URL = 'https://start.telebank.co.il';
var DATE_FORMAT = 'YYYYMMDD';

function convertTransactions(txns, txnStatus) {
  if (!txns) {
    return [];
  }
  return txns.map(function (txn) {
    return {
      type: _constants.NORMAL_TXN_TYPE,
      identifier: txn.OperationNumber,
      date: (0, _moment2.default)(txn.OperationDate, DATE_FORMAT).toISOString(),
      processedDate: (0, _moment2.default)(txn.ValueDate, DATE_FORMAT).toISOString(),
      originalAmount: txn.OperationAmount,
      originalCurrency: 'ILS',
      chargedAmount: txn.OperationAmount,
      description: txn.OperationDescriptionToDisplay,
      status: txnStatus
    };
  });
}

function getPossibleLoginResults() {
  var urls = {};
  urls[_baseScraperWithBrowser.LOGIN_RESULT.SUCCESS] = [`${BASE_URL}/apollo/core/templates/default/masterPage.html#/MY_ACCOUNT_HOMEPAGE`];
  urls[_baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD] = [`${BASE_URL}/apollo/core/templates/lobby/masterPage.html#/LOGIN_PAGE`];
  urls[_baseScraperWithBrowser.LOGIN_RESULT.CHANGE_PASSWORD] = [`${BASE_URL}/apollo/core/templates/lobby/masterPage.html#/PWD_RENEW`];
  return urls;
}

function createLoginFields(credentials) {
  return [{ selector: '#tzId', value: credentials.id }, { selector: '#tzPassword', value: credentials.password }, { selector: '#aidnum', value: credentials.num }];
}

class DiscountScraper extends _baseScraperWithBrowser.BaseScraperWithBrowser {
  getLoginOptions(credentials) {
    var _this = this;

    return {
      loginUrl: `${BASE_URL}/apollo/core/templates/lobby/masterPage.html#/LOGIN_PAGE`,
      checkReadiness: function () {
        var _ref3 = _asyncToGenerator(function* () {
          return (0, _elementsInteractions.waitUntilElementFound)(_this.page, '#tzId');
        });

        return function checkReadiness() {
          return _ref3.apply(this, arguments);
        };
      }(),
      fields: createLoginFields(credentials),
      submitButtonSelector: '.sendBtn',
      postAction: function () {
        var _ref4 = _asyncToGenerator(function* () {
          return navigateOrErrorLabel(_this.page);
        });

        return function postAction() {
          return _ref4.apply(this, arguments);
        };
      }(),
      possibleResults: getPossibleLoginResults()
    };
  }

  fetchData() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      return fetchAccountData(_this2.page, _this2.options, function (msg) {
        return _this2.notify(msg);
      });
    })();
  }
}

exports.default = DiscountScraper;