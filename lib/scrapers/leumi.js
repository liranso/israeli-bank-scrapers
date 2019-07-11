'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var extractCompletedTransactionsFromPage = function () {
  var _ref = _asyncToGenerator(function* (page) {
    var txns = [];
    var tdsValues = yield (0, _elementsInteractions.pageEvalAll)(page, '#WorkSpaceBox #ctlActivityTable tr td', [], function (tds) {
      return tds.map(function (td) {
        return {
          classList: td.getAttribute('class'),
          innerText: td.innerText
        };
      });
    });

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = tdsValues[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var element = _step.value;

        if (element.classList.includes('ExtendedActivityColumnDate')) {
          var newTransaction = { status: _constants.TRANSACTION_STATUS.COMPLETED };
          newTransaction.date = (element.innerText || '').trim();
          txns.push(newTransaction);
        } else if (element.classList.includes('ActivityTableColumn1LTR') || element.classList.includes('ActivityTableColumn1')) {
          var changedTransaction = txns.pop();
          changedTransaction.description = element.innerText;
          txns.push(changedTransaction);
        } else if (element.classList.includes('ReferenceNumberUniqeClass')) {
          var _changedTransaction = txns.pop();
          _changedTransaction.reference = element.innerText;
          txns.push(_changedTransaction);
        } else if (element.classList.includes('AmountDebitUniqeClass')) {
          var _changedTransaction2 = txns.pop();
          _changedTransaction2.debit = element.innerText;
          txns.push(_changedTransaction2);
        } else if (element.classList.includes('AmountCreditUniqeClass')) {
          var _changedTransaction3 = txns.pop();
          _changedTransaction3.credit = element.innerText;
          txns.push(_changedTransaction3);
        } else if (element.classList.includes('number_column')) {
          var _changedTransaction4 = txns.pop();
          _changedTransaction4.balance = element.innerText;
          txns.push(_changedTransaction4);
        } else if (element.classList.includes('tdDepositRowAdded')) {
          var _changedTransaction5 = txns.pop();
          _changedTransaction5.memo = (element.innerText || '').trim();
          txns.push(_changedTransaction5);
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

  return function extractCompletedTransactionsFromPage(_x) {
    return _ref.apply(this, arguments);
  };
}();

var extractPendingTransactionsFromPage = function () {
  var _ref2 = _asyncToGenerator(function* (page) {
    var txns = [];
    var tdsValues = yield (0, _elementsInteractions.pageEvalAll)(page, '#WorkSpaceBox #trTodayActivityNapaTableUpper tr td', [], function (tds) {
      return tds.map(function (td) {
        return {
          classList: td.getAttribute('class'),
          innerText: td.innerText
        };
      });
    });

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = tdsValues[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var element = _step2.value;

        if (element.classList.includes('Colume1Width')) {
          var newTransaction = { status: _constants.TRANSACTION_STATUS.PENDING };
          newTransaction.date = (element.innerText || '').trim();
          txns.push(newTransaction);
        } else if (element.classList.includes('Colume2Width')) {
          var changedTransaction = txns.pop();
          changedTransaction.description = element.innerText;
          txns.push(changedTransaction);
        } else if (element.classList.includes('Colume3Width')) {
          var _changedTransaction6 = txns.pop();
          _changedTransaction6.reference = element.innerText;
          txns.push(_changedTransaction6);
        } else if (element.classList.includes('Colume4Width')) {
          var _changedTransaction7 = txns.pop();
          _changedTransaction7.debit = element.innerText;
          txns.push(_changedTransaction7);
        } else if (element.classList.includes('Colume5Width')) {
          var _changedTransaction8 = txns.pop();
          _changedTransaction8.credit = element.innerText;
          txns.push(_changedTransaction8);
        } else if (element.classList.includes('Colume6Width')) {
          var _changedTransaction9 = txns.pop();
          _changedTransaction9.balance = element.innerText;
          txns.push(_changedTransaction9);
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return txns;
  });

  return function extractPendingTransactionsFromPage(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var fetchTransactionsForAccount = function () {
  var _ref3 = _asyncToGenerator(function* (page, startDate, accountId) {
    yield (0, _elementsInteractions.dropdownSelect)(page, 'select#ddlAccounts_m_ddl', accountId);
    yield (0, _elementsInteractions.dropdownSelect)(page, 'select#ddlTransactionPeriod', '004');
    yield (0, _elementsInteractions.waitUntilElementFound)(page, 'select#ddlTransactionPeriod');
    yield (0, _elementsInteractions.fillInput)(page, 'input#dtFromDate_textBox', startDate.format(DATE_FORMAT));
    yield (0, _elementsInteractions.clickButton)(page, 'input#btnDisplayDates');
    yield (0, _navigation.waitForNavigation)(page);
    yield (0, _elementsInteractions.waitUntilElementFound)(page, 'table#WorkSpaceBox table#ctlActivityTable');

    var hasExpandAllButton = yield (0, _elementsInteractions.elementPresentOnPage)(page, 'a#lnkCtlExpandAllInPage');

    if (hasExpandAllButton) {
      yield (0, _elementsInteractions.clickButton)(page, 'a#lnkCtlExpandAllInPage');
    }

    var selectedSnifAccount = yield page.$eval('#ddlAccounts_m_ddl option[selected="selected"]', function (option) {
      return option.innerText;
    });

    var accountNumber = selectedSnifAccount.replace('/', '_');

    var pendingTxns = yield extractPendingTransactionsFromPage(page);
    var completedTxns = yield extractCompletedTransactionsFromPage(page);
    var txns = [...pendingTxns, ...completedTxns];

    return {
      accountNumber: accountNumber,
      txns: convertTransactions(txns)
    };
  });

  return function fetchTransactionsForAccount(_x3, _x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();

var fetchTransactions = function () {
  var _ref4 = _asyncToGenerator(function* (page, startDate) {
    var res = [];
    // Loop through all available accounts and collect transactions from all
    var accounts = yield (0, _elementsInteractions.dropdownElements)(page, 'select#ddlAccounts_m_ddl');
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = accounts[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var account = _step3.value;

        // Skip "All accounts" option
        if (account.value !== '-1') {
          res.push((yield fetchTransactionsForAccount(page, startDate, account.value)));
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return res;
  });

  return function fetchTransactions(_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();

var waitForPostLogin = function () {
  var _ref5 = _asyncToGenerator(function* (page) {
    // TODO check for condition to provide new password
    return Promise.race([(0, _elementsInteractions.waitUntilElementFound)(page, 'div.leumi-container', true), (0, _elementsInteractions.waitUntilElementFound)(page, '#loginErrMsg', true)]);
  });

  return function waitForPostLogin(_x8) {
    return _ref5.apply(this, arguments);
  };
}();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _baseScraperWithBrowser = require('./base-scraper-with-browser');

var _elementsInteractions = require('../helpers/elements-interactions');

var _navigation = require('../helpers/navigation');

var _constants = require('../constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BASE_URL = 'https://hb2.bankleumi.co.il';
var DATE_FORMAT = 'DD/MM/YY';

function getTransactionsUrl() {
  return `${BASE_URL}/ebanking/Accounts/ExtendedActivity.aspx?WidgetPar=1#/`;
}

function getPossibleLoginResults() {
  var urls = {};
  urls[_baseScraperWithBrowser.LOGIN_RESULT.SUCCESS] = [/ebanking\/SO\/SPA.aspx/];
  urls[_baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD] = [/InternalSite\/CustomUpdate\/leumi\/LoginPage.ASP/];
  // urls[LOGIN_RESULT.CHANGE_PASSWORD] = ``; // TODO should wait until my password expires
  return urls;
}

function createLoginFields(credentials) {
  return [{ selector: '#wtr_uid', value: credentials.username }, { selector: '#wtr_password', value: credentials.password }];
}

function getAmountData(amountStr) {
  var amountStrCopy = amountStr.replace(',', '');
  var amount = parseFloat(amountStrCopy);
  var currency = _constants.SHEKEL_CURRENCY;

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
      status: txn.status,
      description: txn.description,
      memo: txn.memo
    };
  });
}

class LeumiScraper extends _baseScraperWithBrowser.BaseScraperWithBrowser {
  getLoginOptions(credentials) {
    var _this = this;

    return {
      loginUrl: `${BASE_URL}`,
      fields: createLoginFields(credentials),
      submitButtonSelector: '#enter',
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

exports.default = LeumiScraper;