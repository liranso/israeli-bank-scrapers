'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var fetchAccounts = function () {
  var _ref = _asyncToGenerator(function* (page, servicesUrl, monthMoment) {
    var dataUrl = getAccountsUrl(servicesUrl, monthMoment);
    var dataResult = yield (0, _fetch.fetchGetWithinPage)(page, dataUrl);
    if (_lodash2.default.get(dataResult, 'Header.Status') === '1' && dataResult.DashboardMonthBean) {
      var cardsCharges = dataResult.DashboardMonthBean.cardsCharges;

      if (cardsCharges) {
        return cardsCharges.map(function (cardCharge) {
          return {
            index: parseInt(cardCharge.cardIndex, 10),
            accountNumber: cardCharge.cardNumber,
            processedDate: (0, _moment2.default)(cardCharge.billingDate, DATE_FORMAT).toISOString()
          };
        });
      }
    }
    return null;
  });

  return function fetchAccounts(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var fetchTransactions = function () {
  var _ref2 = _asyncToGenerator(function* (page, options, startMoment, monthMoment) {
    var accounts = yield fetchAccounts(page, options.servicesUrl, monthMoment);
    var dataUrl = getTransactionsUrl(options.servicesUrl, monthMoment);
    var dataResult = yield (0, _fetch.fetchGetWithinPage)(page, dataUrl);
    if (_lodash2.default.get(dataResult, 'Header.Status') === '1' && dataResult.CardsTransactionsListBean) {
      var accountTxns = {};
      accounts.forEach(function (account) {
        var txnGroups = _lodash2.default.get(dataResult, `CardsTransactionsListBean.Index${account.index}.CurrentCardTransactions`);
        if (txnGroups) {
          var allTxns = [];
          txnGroups.forEach(function (txnGroup) {
            if (txnGroup.txnIsrael) {
              var txns = convertTransactions(txnGroup.txnIsrael, account.processedDate);
              allTxns.push(...txns);
            }
            if (txnGroup.txnAbroad) {
              var _txns = convertTransactions(txnGroup.txnAbroad, account.processedDate);
              allTxns.push(..._txns);
            }
          });

          if (!options.combineInstallments) {
            allTxns = (0, _transactions.fixInstallments)(allTxns);
          }
          allTxns = (0, _transactions.filterOldTransactions)(allTxns, startMoment, options.combineInstallments);

          accountTxns[account.accountNumber] = {
            accountNumber: account.accountNumber,
            index: account.index,
            txns: allTxns
          };
        }
      });
      return accountTxns;
    }

    return null;
  });

  return function fetchTransactions(_x4, _x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
}();

var fetchAllTransactions = function () {
  var _ref3 = _asyncToGenerator(function* (page, options, startMoment) {
    var allMonths = (0, _dates2.default)(startMoment, true);
    var results = yield Promise.all(allMonths.map(function () {
      var _ref4 = _asyncToGenerator(function* (monthMoment) {
        return fetchTransactions(page, options, startMoment, monthMoment);
      });

      return function (_x11) {
        return _ref4.apply(this, arguments);
      };
    }()));

    var combinedTxns = {};
    results.forEach(function (result) {
      Object.keys(result).forEach(function (accountNumber) {
        var txnsForAccount = combinedTxns[accountNumber];
        if (!txnsForAccount) {
          txnsForAccount = [];
          combinedTxns[accountNumber] = txnsForAccount;
        }
        var toBeAddedTxns = result[accountNumber].txns;
        combinedTxns[accountNumber].push(...toBeAddedTxns);
      });
    });

    var accounts = Object.keys(combinedTxns).map(function (accountNumber) {
      return {
        accountNumber: accountNumber,
        txns: combinedTxns[accountNumber]
      };
    });

    return {
      success: true,
      accounts: accounts
    };
  });

  return function fetchAllTransactions(_x8, _x9, _x10) {
    return _ref3.apply(this, arguments);
  };
}();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _buildUrl = require('build-url');

var _buildUrl2 = _interopRequireDefault(_buildUrl);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _baseScraperWithBrowser = require('./base-scraper-with-browser');

var _fetch = require('../helpers/fetch');

var _constants = require('../constants');

var _dates = require('../helpers/dates');

var _dates2 = _interopRequireDefault(_dates);

var _transactions = require('../helpers/transactions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var COUNTRY_CODE = '212';
var ID_TYPE = '1';
var INSTALLMENTS_KEYWORD = 'תשלום';

var DATE_FORMAT = 'DD/MM/YYYY';

function getAccountsUrl(servicesUrl, monthMoment) {
  var billingDate = monthMoment.format('YYYY-MM-DD');
  return (0, _buildUrl2.default)(servicesUrl, {
    queryParams: {
      reqName: 'DashboardMonth',
      actionCode: 0,
      billingDate: billingDate,
      format: 'Json'
    }
  });
}

function getTransactionsUrl(servicesUrl, monthMoment) {
  var month = monthMoment.month() + 1;
  var year = monthMoment.year();
  var monthStr = month < 10 ? `0${month}` : month.toString();
  return (0, _buildUrl2.default)(servicesUrl, {
    queryParams: {
      reqName: 'CardsTransactionsList',
      month: monthStr,
      year: year,
      requiredDate: 'N'
    }
  });
}

function convertCurrency(currencyStr) {
  if (currencyStr === _constants.SHEKEL_CURRENCY_KEYWORD || currencyStr === _constants.ALT_SHEKEL_CURRENCY) {
    return _constants.SHEKEL_CURRENCY;
  }
  return currencyStr;
}

function getInstallmentsInfo(txn) {
  if (!txn.moreInfo || !txn.moreInfo.includes(INSTALLMENTS_KEYWORD)) {
    return null;
  }
  var matches = txn.moreInfo.match(/\d+/g);
  if (!matches || matches.length < 2) {
    return null;
  }

  return {
    number: parseInt(matches[0], 10),
    total: parseInt(matches[1], 10)
  };
}

function getTransactionType(txn) {
  return getInstallmentsInfo(txn) ? _constants.INSTALLMENTS_TXN_TYPE : _constants.NORMAL_TXN_TYPE;
}

function convertTransactions(txns, processedDate) {
  var filteredTxns = txns.filter(function (txn) {
    return txn.dealSumType !== '1' && txn.voucherNumberRatz !== '000000000' && txn.voucherNumberRatzOutbound !== '000000000';
  });

  return filteredTxns.map(function (txn) {
    var isOutbound = txn.dealSumOutbound;
    var txnDateStr = isOutbound ? txn.fullPurchaseDateOutbound : txn.fullPurchaseDate;
    var txnMoment = (0, _moment2.default)(txnDateStr, DATE_FORMAT);

    return {
      type: getTransactionType(txn),
      identifier: isOutbound ? txn.voucherNumberRatzOutbound : txn.voucherNumberRatz,
      date: txnMoment.toISOString(),
      processedDate: processedDate,
      originalAmount: isOutbound ? -txn.dealSumOutbound : -txn.dealSum,
      originalCurrency: convertCurrency(txn.currencyId),
      chargedAmount: isOutbound ? -txn.paymentSumOutbound : -txn.paymentSum,
      description: isOutbound ? txn.fullSupplierNameOutbound : txn.fullSupplierNameHeb,
      memo: txn.moreInfo,
      installments: getInstallmentsInfo(txn),
      status: _constants.TRANSACTION_STATUS.COMPLETED
    };
  });
}

class IsracardAmexBaseScraper extends _baseScraperWithBrowser.BaseScraperWithBrowser {
  constructor(options, baseUrl, companyCode) {
    var clonedOptions = Object.assign(options, {
      baseUrl: baseUrl,
      servicesUrl: `${baseUrl}/services/ProxyRequestHandler.ashx`,
      companyCode: companyCode
    });
    super(clonedOptions);
  }

  login(credentials) {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.navigateTo(`${_this.options.baseUrl}/personalarea/Login`);

      _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGGING_IN);

      var validateUrl = `${_this.options.servicesUrl}?reqName=ValidateIdData`;
      var validateRequest = {
        id: credentials.id,
        cardSuffix: credentials.card6Digits,
        countryCode: COUNTRY_CODE,
        idType: ID_TYPE,
        checkLevel: '1',
        companyCode: _this.options.companyCode
      };
      var validateResult = yield (0, _fetch.fetchPostWithinPage)(_this.page, validateUrl, validateRequest);
      if (!validateResult || !validateResult.Header || validateResult.Header.Status !== '1' || !validateResult.ValidateIdDataBean) {
        throw new Error('unknown error during login');
      }

      var validateReturnCode = validateResult.ValidateIdDataBean.returnCode;
      if (validateReturnCode === '1') {
        var userName = validateResult.ValidateIdDataBean.userName;


        var loginUrl = `${_this.options.servicesUrl}?reqName=performLogonI`;
        var request = {
          KodMishtamesh: userName,
          MisparZihuy: credentials.id,
          Sisma: credentials.password,
          cardSuffix: credentials.card6Digits,
          countryCode: COUNTRY_CODE,
          idType: ID_TYPE
        };
        var loginResult = yield (0, _fetch.fetchPostWithinPage)(_this.page, loginUrl, request);
        if (loginResult.status === '1') {
          _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGIN_SUCCESS);
          return { success: true };
        }

        if (loginResult.status === '3') {
          _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.CHANGE_PASSWORD);
          return {
            success: false,
            errorType: _baseScraperWithBrowser.LOGIN_RESULT.CHANGE_PASSWORD
          };
        }

        _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGIN_FAILED);
        return {
          success: false,
          errorType: _baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD
        };
      }

      if (validateReturnCode === '4') {
        _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.CHANGE_PASSWORD);
        return {
          success: false,
          errorType: _baseScraperWithBrowser.LOGIN_RESULT.CHANGE_PASSWORD
        };
      }

      _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGIN_FAILED);
      return {
        success: false,
        errorType: _baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD
      };
    })();
  }

  fetchData() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var defaultStartMoment = (0, _moment2.default)().subtract(1, 'years');
      var startDate = _this2.options.startDate || defaultStartMoment.toDate();
      var startMoment = _moment2.default.max(defaultStartMoment, (0, _moment2.default)(startDate));

      return fetchAllTransactions(_this2.page, _this2.options, startMoment);
    })();
  }
}

exports.default = IsracardAmexBaseScraper;