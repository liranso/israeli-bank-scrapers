'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var getRestContext = function () {
  var _ref = _asyncToGenerator(function* (page) {
    yield (0, _waiting2.default)(_asyncToGenerator(function* () {
      return page.evaluate(function () {
        return !!window.bnhpApp;
      });
    }), 'waiting for app data load');

    var result = yield page.evaluate(function () {
      return window.bnhpApp.restContext;
    });

    return result.slice(1);
  });

  return function getRestContext(_x) {
    return _ref.apply(this, arguments);
  };
}();

var fetchPoalimXSRFWithinPage = function () {
  var _ref3 = _asyncToGenerator(function* (page, url, pageUuid) {
    var cookies = yield page.cookies();
    var XSRFCookie = cookies.find(function (cookie) {
      return cookie.name === 'XSRF-TOKEN';
    });
    var headers = {};
    if (XSRFCookie != null) {
      headers['X-XSRF-TOKEN'] = XSRFCookie.value;
    }
    headers.pageUuid = pageUuid;
    headers.uuid = (0, _v2.default)();
    headers['Content-Type'] = 'application/json;charset=UTF-8';
    return (0, _fetch.fetchPostWithinPage)(page, url, [], headers);
  });

  return function fetchPoalimXSRFWithinPage(_x2, _x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

var fetchAccountData = function () {
  var _ref4 = _asyncToGenerator(function* (page, options) {
    var restContext = yield getRestContext(page);
    var apiSiteUrl = `${BASE_URL}/${restContext}`;
    var accountDataUrl = `${BASE_URL}/ServerServices/general/accounts`;
    var accountsInfo = yield (0, _fetch.fetchGetWithinPage)(page, accountDataUrl);

    var defaultStartMoment = (0, _moment2.default)().subtract(1, 'years').add(1, 'day');
    var startDate = options.startDate || defaultStartMoment.toDate();
    var startMoment = _moment2.default.max(defaultStartMoment, (0, _moment2.default)(startDate));

    var startDateStr = startMoment.format(DATE_FORMAT);
    var endDateStr = (0, _moment2.default)().format(DATE_FORMAT);

    var accounts = [];
    for (var accountIndex = 0; accountIndex < accountsInfo.length; accountIndex += 1) {
      var accountNumber = `${accountsInfo[accountIndex].bankNumber}-${accountsInfo[accountIndex].branchNumber}-${accountsInfo[accountIndex].accountNumber}`;

      var txnsUrl = `${apiSiteUrl}/current-account/transactions?accountId=${accountNumber}&numItemsPerPage=150&retrievalEndDate=${endDateStr}&retrievalStartDate=${startDateStr}&sortCode=1`;

      var txnsResult = yield fetchPoalimXSRFWithinPage(page, txnsUrl, '/current-account/transactions');
      var txns = [];
      if (txnsResult) {
        txns = convertTransactions(txnsResult.transactions);
      }

      accounts.push({
        accountNumber: accountNumber,
        txns: txns
      });
    }

    var accountData = {
      success: true,
      accounts: accounts
    };

    return accountData;
  });

  return function fetchAccountData(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _baseScraperWithBrowser = require('./base-scraper-with-browser');

var _navigation = require('../helpers/navigation');

var _waiting = require('../helpers/waiting');

var _waiting2 = _interopRequireDefault(_waiting);

var _constants = require('../constants');

var _fetch = require('../helpers/fetch');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BASE_URL = 'https://login.bankhapoalim.co.il';
var DATE_FORMAT = 'YYYYMMDD';

function convertTransactions(txns) {
  return txns.map(function (txn) {
    var isOutbound = txn.eventActivityTypeCode === 2;

    var memo = null;
    if (txn.beneficiaryDetailsData) {
      var _txn$beneficiaryDetai = txn.beneficiaryDetailsData,
          partyHeadline = _txn$beneficiaryDetai.partyHeadline,
          partyName = _txn$beneficiaryDetai.partyName,
          messageHeadline = _txn$beneficiaryDetai.messageHeadline,
          messageDetail = _txn$beneficiaryDetai.messageDetail;

      var memoLines = [];
      if (partyHeadline) {
        memoLines.push(partyHeadline);
      }

      if (partyName) {
        memoLines.push(`${partyName}.`);
      }

      if (messageHeadline) {
        memoLines.push(messageHeadline);
      }

      if (messageDetail) {
        memoLines.push(`${messageDetail}.`);
      }

      if (memoLines.length) {
        memo = memoLines.join(' ');
      }
    }

    return {
      type: _constants.NORMAL_TXN_TYPE,
      identifier: txn.referenceNumber,
      date: (0, _moment2.default)(txn.eventDate, DATE_FORMAT).toISOString(),
      processedDate: (0, _moment2.default)(txn.valueDate, DATE_FORMAT).toISOString(),
      originalAmount: isOutbound ? -txn.eventAmount : txn.eventAmount,
      originalCurrency: 'ILS',
      chargedAmount: isOutbound ? -txn.eventAmount : txn.eventAmount,
      description: txn.activityDescription,
      status: txn.serialNumber === 0 ? _constants.TRANSACTION_STATUS.PENDING : _constants.TRANSACTION_STATUS.COMPLETED,
      memo: memo
    };
  });
}

function getPossibleLoginResults() {
  var urls = {};
  urls[_baseScraperWithBrowser.LOGIN_RESULT.SUCCESS] = [`${BASE_URL}/portalserver/HomePage`, `${BASE_URL}/ng-portals-bt/rb/he/homepage`, `${BASE_URL}/ng-portals/rb/he/homepage`];
  urls[_baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD] = [`${BASE_URL}/AUTHENTICATE/LOGON?flow=AUTHENTICATE&state=LOGON&errorcode=1.6&callme=false`];
  urls[_baseScraperWithBrowser.LOGIN_RESULT.CHANGE_PASSWORD] = [`${BASE_URL}/MCP/START?flow=MCP&state=START&expiredDate=null`, /\/ABOUTTOEXPIRE\/START/i];
  return urls;
}

function createLoginFields(credentials) {
  return [{ selector: '#userID', value: credentials.userCode }, { selector: '#userPassword', value: credentials.password }];
}

class HapoalimScraper extends _baseScraperWithBrowser.BaseScraperWithBrowser {
  getLoginOptions(credentials) {
    var _this = this;

    return {
      loginUrl: `${BASE_URL}/cgi-bin/poalwwwc?reqName=getLogonPage`,
      fields: createLoginFields(credentials),
      submitButtonSelector: '#inputSend',
      postAction: function () {
        var _ref5 = _asyncToGenerator(function* () {
          return (0, _navigation.waitForRedirect)(_this.page);
        });

        return function postAction() {
          return _ref5.apply(this, arguments);
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

exports.default = HapoalimScraper;