'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var parseTransactionPage = function () {
  var _ref = _asyncToGenerator(function* (page) {
    var tdsValues = yield (0, _elementsInteractions.pageEvalAll)(page, '#dataTable077 tbody tr td', [], function (tds) {
      return tds.map(function (td) {
        return {
          classList: td.getAttribute('class'),
          innerText: td.innerText
        };
      });
    });

    var txns = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = tdsValues[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var element = _step.value;
        var classList = element.classList,
            innerText = element.innerText;

        if (classList.includes('date')) {
          var newTransaction = {};
          newTransaction.date = innerText;
          txns.push(newTransaction);
        } else {
          var changedTransaction = txns.pop();
          if (classList.includes('reference')) {
            changedTransaction.description = innerText;
          } else if (classList.includes('details')) {
            changedTransaction.reference = innerText;
          } else if (classList.includes('credit')) {
            changedTransaction.credit = innerText;
          } else if (classList.includes('debit')) {
            changedTransaction.debit = innerText;
          } else if (classList.includes('balance')) {
            changedTransaction.balance = innerText;
          }
          txns.push(changedTransaction);
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

  return function parseTransactionPage(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getAccountSummary = function () {
  var _ref2 = _asyncToGenerator(function* (page) {
    var balanceElm = yield page.$('.current_balance');
    var balanceInnerTextElm = yield balanceElm.getProperty('innerText');
    var balanceText = yield balanceInnerTextElm.jsonValue();
    var balanceValue = getAmountData(balanceText, true);
    // TODO: Find the credit field in bank website (could see it in my account)
    return {
      balance: Number.isNaN(balanceValue.amount) ? 0 : balanceValue.amount,
      creditLimit: 0.0,
      creditUtilization: 0.0,
      balanceCurrency: balanceValue.currency
    };
  });

  return function getAccountSummary(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var fetchTransactionsForAccount = function () {
  var _ref3 = _asyncToGenerator(function* (page, startDate) {
    var summary = yield getAccountSummary(page);
    yield (0, _elementsInteractions.waitUntilElementFound)(page, 'input#fromDate');
    // Get account number
    var branchNum = yield page.$eval('.branch_num', function (span) {
      return span.innerText;
    });

    var accountNmbr = yield page.$eval('.acc_num', function (span) {
      return span.innerText;
    });
    var accountNumber = `14-${branchNum}-${accountNmbr}`;
    // Search for relavant transaction from startDate
    yield (0, _elementsInteractions.clickButton)(page, '#tabHeader4');
    yield (0, _elementsInteractions.fillInput)(page, 'input#fromDate', startDate.format('DD/MM/YYYY'));

    yield (0, _elementsInteractions.clickButton)(page, '#fibi_tab_dates .fibi_btn:nth-child(2)');
    yield (0, _navigation.waitForNavigation)(page);
    yield (0, _elementsInteractions.waitUntilElementFound)(page, 'table#dataTable077, #NO_DATA077');
    var hasNextPage = true;
    var txns = [];

    var noTransactionElm = yield page.$('#NO_DATA077');
    if (noTransactionElm == null) {
      // Scape transactions (this maybe spanned on multiple pages)
      while (hasNextPage) {
        var pageTxns = yield parseTransactionPage(page);
        txns = txns.concat(pageTxns);
        var button = yield page.$('#Npage');
        hasNextPage = false;
        if (button != null) {
          hasNextPage = true;
        }
        if (hasNextPage) {
          yield (0, _elementsInteractions.clickButton)(page, '#Npage');
          yield (0, _navigation.waitForNavigation)(page);
          yield (0, _elementsInteractions.waitUntilElementFound)(page, 'table#dataTable077');
        }
      }
    }

    return {
      accountNumber: accountNumber,
      summary: summary,
      txns: convertTransactions(txns.slice(1)) // Remove first line which is "opening balance"
    };
  });

  return function fetchTransactionsForAccount(_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

var fetchTransactions = function () {
  var _ref4 = _asyncToGenerator(function* (page, startDate) {
    // TODO need to extend to support multiple accounts and foreign accounts
    return [yield fetchTransactionsForAccount(page, startDate)];
  });

  return function fetchTransactions(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

var waitForPostLogin = function () {
  var _ref5 = _asyncToGenerator(function* (page) {
    // TODO check for condition to provide new password
    return Promise.race([(0, _elementsInteractions.waitUntilElementFound)(page, 'div.lotusFrame', true), (0, _elementsInteractions.waitUntilElementFound)(page, 'div.fibi_pwd_error', true)]);
  });

  return function waitForPostLogin(_x7) {
    return _ref5.apply(this, arguments);
  };
}();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _baseScraperWithBrowser = require('./base-scraper-with-browser');

var _navigation = require('../helpers/navigation');

var _elementsInteractions = require('../helpers/elements-interactions');

var _constants = require('../constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BASE_URL = 'https://online.bankotsar.co.il';
var DATE_FORMAT = 'DD/MM/YY';

function getPossibleLoginResults() {
  var urls = {};
  urls[_baseScraperWithBrowser.LOGIN_RESULT.SUCCESS] = [`${BASE_URL}/wps/myportal/FibiMenu/Online`];
  urls[_baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD] = [`${BASE_URL}/LoginServices/login2.do`];
  // TODO: support change password
  /* urls[LOGIN_RESULT.CHANGE_PASSWORD] = [``]; */
  return urls;
}

function getTransactionsUrl() {
  return `${BASE_URL}/wps/myportal/FibiMenu/Online/OnAccountMngment/OnBalanceTrans/PrivateAccountFlow`;
}

function createLoginFields(credentials) {
  return [{ selector: '#username', value: credentials.username }, { selector: '#password', value: credentials.password }];
}

function getAmountData(amountStr, hasCurrency = false) {
  var amountStrCln = amountStr.replace(',', '');
  var currency = null;
  var amount = null;
  if (!hasCurrency) {
    amount = parseFloat(amountStrCln);
    currency = _constants.SHEKEL_CURRENCY;
  } else if (amountStrCln.includes(_constants.SHEKEL_CURRENCY_SYMBOL)) {
    amount = parseFloat(amountStrCln.replace(_constants.SHEKEL_CURRENCY_SYMBOL, ''));
    currency = _constants.SHEKEL_CURRENCY;
  } else {
    var parts = amountStrCln.split(' ');
    amount = parseFloat(parts[0]);

    var _parts = _slicedToArray(parts, 2);

    currency = _parts[1];
  }

  return {
    amount: amount,
    currency: currency
  };
}

function convertTransactions(txns) {
  return txns.map(function (txn) {
    var txnDate = (0, _moment2.default)(txn.date, DATE_FORMAT).toISOString();
    var credit = getAmountData(txn.credit).amount;
    var debit = getAmountData(txn.debit).amount;
    var amount = (Number.isNaN(credit) ? 0 : credit) - (Number.isNaN(debit) ? 0 : debit);

    return {
      type: _constants.NORMAL_TXN_TYPE,
      identifier: txn.reference ? parseInt(txn.reference, 10) : null,
      date: txnDate,
      processedDate: txnDate,
      originalAmount: amount,
      originalCurrency: _constants.SHEKEL_CURRENCY,
      chargedAmount: amount,
      description: txn.description
    };
  });
}

class OtsarHahayalScraper extends _baseScraperWithBrowser.BaseScraperWithBrowser {
  getLoginOptions(credentials) {
    var _this = this;

    return {
      loginUrl: `${BASE_URL}/LoginServices/login2.do?bankId=OTSARPRTAL`,
      fields: createLoginFields(credentials),
      submitButtonSelector: '#login_btn',
      postAction: function () {
        var _ref6 = _asyncToGenerator(function* () {
          return waitForPostLogin(_this.page);
        });

        return function postAction() {
          return _ref6.apply(this, arguments);
        };
      }(),
      possibleResults: getPossibleLoginResults()
    };
  }

  fetchData() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var defaultStartMoment = (0, _moment2.default)().subtract(1, 'years').add(1, 'day');
      var startDate = _this2.options.startDate || defaultStartMoment.toDate();
      var startMoment = _moment2.default.max(defaultStartMoment, (0, _moment2.default)(startDate));

      var url = getTransactionsUrl();
      yield _this2.navigateTo(url);

      var accounts = yield fetchTransactions(_this2.page, startMoment);

      return {
        success: true,
        accounts: accounts
      };
    })();
  }
}

exports.default = OtsarHahayalScraper;