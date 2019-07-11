'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var getBankDebits = function () {
  var _ref = _asyncToGenerator(function* (authHeader, accountId) {
    var bankDebitsUrl = getBankDebitsUrl(accountId);
    return (0, _fetch.fetchGet)(bankDebitsUrl, authHeader);
  });

  return function getBankDebits(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var getTransactionsNextPage = function () {
  var _ref2 = _asyncToGenerator(function* (authHeader) {
    var hasNextPageUrl = `${BASE_URL}/CalTransNextPage`;
    return (0, _fetch.fetchGet)(hasNextPageUrl, authHeader);
  });

  return function getTransactionsNextPage(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var fetchTxns = function () {
  var _ref3 = _asyncToGenerator(function* (authHeader, cardId, debitDates) {
    var txns = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = debitDates[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var date = _step.value;

        var fetchTxnUrl = getTransactionsUrl(cardId, date);
        var txnResponse = yield (0, _fetch.fetchGet)(fetchTxnUrl, authHeader);
        if (txnResponse.Transactions) {
          txns.push(...txnResponse.Transactions);
        }
        while (txnResponse.HasNextPage) {
          txnResponse = yield getTransactionsNextPage(authHeader);
          if (txnResponse.Transactions != null) {
            txns.push(...txnResponse.Transactions);
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

    return txns;
  });

  return function fetchTxns(_x4, _x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var getTxnsOfCard = function () {
  var _ref4 = _asyncToGenerator(function* (authHeader, card, bankDebits) {
    var cardId = card.Id;
    var cardDebitDates = bankDebits.filter(function (bankDebit) {
      return bankDebit.CardId === cardId;
    }).map(function (cardDebit) {
      return cardDebit.Date;
    });
    return fetchTxns(authHeader, cardId, cardDebitDates);
  });

  return function getTxnsOfCard(_x7, _x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

var getTransactionsForAllAccounts = function () {
  var _ref5 = _asyncToGenerator(function* (authHeader, startMoment, options) {
    var cardsByAccountUrl = `${BASE_URL}/CardsByAccounts`;
    var banksResponse = yield (0, _fetch.fetchGet)(cardsByAccountUrl, authHeader);

    if (_lodash2.default.get(banksResponse, 'Response.Status.Succeeded')) {
      var accounts = [];
      for (var i = 0; i < banksResponse.BankAccounts.length; i += 1) {
        var bank = banksResponse.BankAccounts[i];
        var bankDebits = yield getBankDebits(authHeader, bank.AccountID);
        // Check that the bank has an active card to scrape
        if (bank.Cards.some(function (card) {
          return card.IsEffectiveInd;
        })) {
          if (_lodash2.default.get(bankDebits, 'Response.Status.Succeeded')) {
            for (var j = 0; j < bank.Cards.length; j += 1) {
              var rawTxns = yield getTxnsOfCard(authHeader, bank.Cards[j], bankDebits.Debits);
              if (rawTxns) {
                var txns = convertTransactions(rawTxns);
                txns = prepareTransactions(txns, startMoment, options.combineInstallments);
                var result = {
                  accountNumber: bank.Cards[j].LastFourDigits,
                  txns: txns
                };
                accounts.push(result);
              }
            }
          } else {
            var _bankDebits$Response$ = bankDebits.Response.Status,
                Description = _bankDebits$Response$.Description,
                Message = _bankDebits$Response$.Message;


            if (Message !== NO_DATA_FOUND_MSG) {
              var message = `${Description}. ${Message}`;
              throw new Error(message);
            }
          }
        }
      }
      return {
        success: true,
        accounts: accounts
      };
    }

    return { success: false };
  });

  return function getTransactionsForAllAccounts(_x10, _x11, _x12) {
    return _ref5.apply(this, arguments);
  };
}();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _buildUrl = require('build-url');

var _buildUrl2 = _interopRequireDefault(_buildUrl);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _baseScraper = require('./base-scraper');

var _constants = require('../constants');

var _fetch = require('../helpers/fetch');

var _transactions = require('../helpers/transactions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BASE_URL = 'https://cal4u.cal-online.co.il/Cal4U';
var AUTH_URL = 'https://connect.cal-online.co.il/api/authentication/login';
var DATE_FORMAT = 'DD/MM/YYYY';

var PASSWORD_EXPIRED_MSG = 'תוקף הסיסמא פג';
var INVALID_CREDENTIALS = 'שם המשתמש או הסיסמה שהוזנו שגויים';
var NO_DATA_FOUND_MSG = 'לא נמצאו חיובים לטווח תאריכים זה';

var NORMAL_TYPE_CODE = '5';
var REFUND_TYPE_CODE = '6';
var WITHDRAWAL_TYPE_CODE = '7';
var INSTALLMENTS_TYPE_CODE = '8';
var CANCEL_TYPE_CODE = '25';
var WITHDRAWAL_TYPE_CODE_2 = '27';
var CREDIT_PAYMENTS_CODE = '59';
var MEMBERSHIP_FEE_TYPE_CODE = '67';
var SERVICES_REFUND_TYPE_CODE = '71';
var SERVICES_TYPE_CODE = '72';
var REFUND_TYPE_CODE_2 = '76';

var HEADER_SITE = { 'X-Site-Id': '8D37DF16-5812-4ACD-BAE7-CD1A5BFA2206' };

function getBankDebitsUrl(accountId) {
  var toDate = (0, _moment2.default)().add(2, 'months');
  var fromDate = (0, _moment2.default)().subtract(6, 'months');

  return (0, _buildUrl2.default)(BASE_URL, {
    path: `CalBankDebits/${accountId}`,
    queryParams: {
      DebitLevel: 'A',
      DebitType: '2',
      FromMonth: (fromDate.month() + 1).toString().padStart(2, '0'),
      FromYear: fromDate.year().toString(),
      ToMonth: (toDate.month() + 1).toString().padStart(2, '0'),
      ToYear: toDate.year().toString()
    }
  });
}

function getTransactionsUrl(cardId, debitDate) {
  return (0, _buildUrl2.default)(BASE_URL, {
    path: `CalTransactions/${cardId}`,
    queryParams: {
      ToDate: debitDate,
      FromDate: debitDate
    }
  });
}

function convertTransactionType(txnType) {
  switch (txnType) {
    case NORMAL_TYPE_CODE:
    case REFUND_TYPE_CODE:
    case CANCEL_TYPE_CODE:
    case WITHDRAWAL_TYPE_CODE:
    case WITHDRAWAL_TYPE_CODE_2:
    case REFUND_TYPE_CODE_2:
    case SERVICES_REFUND_TYPE_CODE:
    case MEMBERSHIP_FEE_TYPE_CODE:
    case SERVICES_TYPE_CODE:
      return _constants.NORMAL_TXN_TYPE;
    case INSTALLMENTS_TYPE_CODE:
    case CREDIT_PAYMENTS_CODE:
      return _constants.INSTALLMENTS_TXN_TYPE;
    default:
      throw new Error(`unknown transaction type ${txnType}`);
  }
}

function convertCurrency(currency) {
  switch (currency) {
    case _constants.SHEKEL_CURRENCY_SYMBOL:
      return _constants.SHEKEL_CURRENCY;
    case _constants.DOLLAR_CURRENCY_SYMBOL:
      return _constants.DOLLAR_CURRENCY;
    default:
      return currency;
  }
}

function getInstallmentsInfo(txn) {
  if (!txn.CurrentPayment || txn.CurrentPayment === '0') {
    return null;
  }

  return {
    number: parseInt(txn.CurrentPayment, 10),
    total: parseInt(txn.TotalPayments, 10)
  };
}

function getTransactionMemo(txn) {
  var txnType = txn.TransType,
      txnTypeDescription = txn.TransTypeDesc;

  switch (txnType) {
    case NORMAL_TYPE_CODE:
      return txnTypeDescription === 'רכישה רגילה' ? '' : txnTypeDescription;
    case INSTALLMENTS_TYPE_CODE:
      return `תשלום ${txn.CurrentPayment} מתוך ${txn.TotalPayments}`;
    default:
      return txn.TransTypeDesc;
  }
}

function convertTransactions(txns) {
  return txns.map(function (txn) {
    return {
      type: convertTransactionType(txn.TransType),
      date: (0, _moment2.default)(txn.Date, DATE_FORMAT).toISOString(),
      processedDate: (0, _moment2.default)(txn.DebitDate, DATE_FORMAT).toISOString(),
      originalAmount: -txn.Amount.Value,
      originalCurrency: convertCurrency(txn.Amount.Symbol),
      chargedAmount: -txn.DebitAmount.Value,
      description: txn.MerchantDetails.Name,
      memo: getTransactionMemo(txn),
      installments: getInstallmentsInfo(txn),
      status: _constants.TRANSACTION_STATUS.COMPLETED
    };
  });
}

function prepareTransactions(txns, startMoment, combineInstallments) {
  var clonedTxns = Array.from(txns);
  if (!combineInstallments) {
    clonedTxns = (0, _transactions.fixInstallments)(clonedTxns);
  }
  clonedTxns = (0, _transactions.sortTransactionsByDate)(clonedTxns);
  clonedTxns = (0, _transactions.filterOldTransactions)(clonedTxns, startMoment, combineInstallments);
  return clonedTxns;
}

class VisaCalScraper extends _baseScraper.BaseScraper {
  login(credentials) {
    var _this = this;

    return _asyncToGenerator(function* () {
      var authRequest = {
        username: credentials.username,
        password: credentials.password,
        rememberMe: null
      };

      _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGGING_IN);

      var authResponse = yield (0, _fetch.fetchPost)(AUTH_URL, authRequest, HEADER_SITE);
      if (authResponse === PASSWORD_EXPIRED_MSG) {
        return {
          success: false,
          errorType: _baseScraper.LOGIN_RESULT.CHANGE_PASSWORD
        };
      }

      if (authResponse === INVALID_CREDENTIALS) {
        return {
          success: false,
          errorType: _baseScraper.LOGIN_RESULT.INVALID_PASSWORD
        };
      }

      if (!authResponse || !authResponse.token) {
        return {
          success: false,
          errorType: _baseScraper.LOGIN_RESULT.UNKNOWN_ERROR,
          errorMessage: `No token found in authResponse: ${JSON.stringify(authResponse)}`
        };
      }
      _this.authHeader = `CALAuthScheme ${authResponse.token}`;
      _this.emitProgress(_constants.SCRAPE_PROGRESS_TYPES.LOGIN_SUCCESS);
      return { success: true };
    })();
  }

  fetchData() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var defaultStartMoment = (0, _moment2.default)().subtract(1, 'years');
      var startDate = _this2.options.startDate || defaultStartMoment.toDate();
      var startMoment = _moment2.default.max(defaultStartMoment, (0, _moment2.default)(startDate));

      var authHeader = Object.assign({ Authorization: _this2.authHeader }, HEADER_SITE);
      return getTransactionsForAllAccounts(authHeader, startMoment, _this2.options);
    })();
  }
}

exports.default = VisaCalScraper;