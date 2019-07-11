'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var getCurrentTransactions = function () {
    var _ref = _asyncToGenerator(function* (page) {

        var preHtmlElement = yield page.$(`pre`);

        var strJsonResponse = yield page.evaluate(function (item) {
            return item.innerText;
        }, preHtmlElement);

        var response = JSON.parse(strJsonResponse);

        var parsedTransactions = response.result.transactions.reduce(function (accountTransactions, transaction) {
            if (!accountTransactions[transaction.shortCardNumber]) {
                accountTransactions[transaction.shortCardNumber] = [];
            }
            accountTransactions[transaction.shortCardNumber].push(mapTransaction(transaction));

            return accountTransactions;
        }, {});

        return parsedTransactions;
    });

    return function getCurrentTransactions(_x) {
        return _ref.apply(this, arguments);
    };
}();

var fetchTransactionsForMonth = function () {
    var _ref2 = _asyncToGenerator(function* (browser, navigateToFunc, monthMoment) {
        var page = yield browser.newPage();
        var url = getTransactionsUrl(monthMoment);

        yield navigateToFunc(url, page);
        var txns = yield getCurrentTransactions(page);
        yield page.close();
        return txns;
    });

    return function fetchTransactionsForMonth(_x2, _x3, _x4) {
        return _ref2.apply(this, arguments);
    };
}();

var fetchTransactions = function () {
    var _ref3 = _asyncToGenerator(function* (browser, options, navigateToFunc) {
        var defaultStartMoment = (0, _moment2.default)().subtract(1, 'years');
        var startDate = options.startDate || defaultStartMoment.toDate();
        var startMoment = _moment2.default.max(defaultStartMoment, (0, _moment2.default)(startDate));
        var allMonths = (0, _dates2.default)(startMoment, false);

        var allResults = {};
        for (var i = 0; i < allMonths.length; i += 1) {
            var result = yield fetchTransactionsForMonth(browser, navigateToFunc, allMonths[i]);
            allResults = addResult(allResults, result);
        }

        Object.keys(allResults).forEach(function (accountNumber) {
            var txns = allResults[accountNumber];
            txns = prepareTransactions(txns, startMoment, options.combineInstallments);
            allResults[accountNumber] = txns;
        });

        return allResults;
    });

    return function fetchTransactions(_x5, _x6, _x7) {
        return _ref3.apply(this, arguments);
    };
}();

var _buildUrl = require('build-url');

var _buildUrl2 = _interopRequireDefault(_buildUrl);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _baseScraperWithBrowser = require('./base-scraper-with-browser');

var _navigation = require('../helpers/navigation');

var _elementsInteractions = require('../helpers/elements-interactions');

var _constants = require('../constants');

var _dates = require('../helpers/dates');

var _dates2 = _interopRequireDefault(_dates);

var _transactions = require('../helpers/transactions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var BASE_ACTIONS_URL = 'https://online.max.co.il';
var BASE_API_ACTIONS_URL = 'https://onlinelcapi.max.co.il';
var BASE_WELCOME_URL = 'https://www.max.co.il';
var NORMAL_TYPE_NAME = 'רגילה';
var ATM_TYPE_NAME = 'חיוב עסקות מיידי';
var INTERNET_SHOPPING_TYPE_NAME = 'אינטרנט/חו"ל';
var INSTALLMENTS_TYPE_NAME = 'תשלומים';
var MONTHLY_CHARGE_TYPE_NAME = 'חיוב חודשי';
var ONE_MONTH_POSTPONED_TYPE_NAME = 'דחוי חודש';
var MONTHLY_POSTPONED_TYPE_NAME = 'דחוי לחיוב החודשי';
var THIRTY_DAYS_PLUS_TYPE_NAME = 'עסקת 30 פלוס';
var TWO_MONTHS_POSTPONED_TYPE_NAME = 'דחוי חודשיים';
var MONTHLY_CHARGE_PLUS_INTEREST_TYPE_NAME = 'חודשי + ריבית';
var CREDIT_TYPE_NAME = 'קרדיט';

var INVALID_DETAILS_SELECTOR = '#popupWrongDetails';
var LOGIN_ERROR_SELECTOR = '#popupCardHoldersLoginError';

function redirectOrDialog(page) {
    return Promise.race([(0, _navigation.waitForRedirect)(page, 20000, false, [BASE_WELCOME_URL, `${BASE_WELCOME_URL}/`]), (0, _elementsInteractions.waitUntilElementFound)(page, INVALID_DETAILS_SELECTOR, true), (0, _elementsInteractions.waitUntilElementFound)(page, LOGIN_ERROR_SELECTOR, true)]);
}

function getTransactionsUrl(monthMoment) {
    var month = monthMoment.month() + 1;
    var year = monthMoment.year();
    var date = `${year}-${month}-01`;

    /**
     * url explanation:
     * userIndex: -1 for all account owners
     * cardIndex: -1 for all cards under the account
     * all other query params are static, beside the date which changes for request per month
     */
    return (0, _buildUrl2.default)(BASE_API_ACTIONS_URL, {
        path: `/api/registered/transactionDetails/getTransactionsAndGraphs?filterData={"userIndex":-1,"cardIndex":-1,"monthView":true,"date":"${date}","dates":{"startDate":"0","endDate":"0"}}&v=V3.13-HF.6.26`
    });
}

function getTransactionType(txnTypeStr) {
    var cleanedUpTxnTypeStr = txnTypeStr.replace('\t', ' ').trim();
    switch (cleanedUpTxnTypeStr) {
        case ATM_TYPE_NAME:
        case NORMAL_TYPE_NAME:
        case MONTHLY_CHARGE_TYPE_NAME:
        case ONE_MONTH_POSTPONED_TYPE_NAME:
        case MONTHLY_POSTPONED_TYPE_NAME:
        case THIRTY_DAYS_PLUS_TYPE_NAME:
        case TWO_MONTHS_POSTPONED_TYPE_NAME:
        case INTERNET_SHOPPING_TYPE_NAME:
        case MONTHLY_CHARGE_PLUS_INTEREST_TYPE_NAME:
            return _constants.NORMAL_TXN_TYPE;
        case INSTALLMENTS_TYPE_NAME:
        case CREDIT_TYPE_NAME:
            return _constants.INSTALLMENTS_TXN_TYPE;
        default:
            throw new Error(`Unknown transaction type ${cleanedUpTxnTypeStr}`);
    }
}

function getInstallmentsInfo(comments) {
    if (!comments) {
        return null;
    }
    var matches = comments.match(/\d+/g);
    if (!matches || matches.length < 2) {
        return null;
    }

    return {
        number: parseInt(matches[0], 10),
        total: parseInt(matches[1], 10)
    };
}

function mapTransaction(rawTransaction) {
    return {
        type: getTransactionType(rawTransaction.planName),
        date: (0, _moment2.default)(rawTransaction.purchaseDate).toISOString(),
        processedDate: (0, _moment2.default)(rawTransaction.paymentDate).toISOString(),
        originalAmount: -rawTransaction.originalAmount,
        originalCurrency: rawTransaction.originalCurrency,
        chargedAmount: -rawTransaction.actualPaymentAmount,
        description: rawTransaction.merchantName.trim(),
        memo: rawTransaction.comments,
        installments: getInstallmentsInfo(rawTransaction.comments),
        status: _constants.TRANSACTION_STATUS.COMPLETED
    };
}

function addResult(allResults, result) {
    var clonedResults = Object.assign({}, allResults);
    Object.keys(result).forEach(function (accountNumber) {
        if (!clonedResults[accountNumber]) {
            clonedResults[accountNumber] = [];
        }
        clonedResults[accountNumber].push(...result[accountNumber]);
    });
    return clonedResults;
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

function getPossibleLoginResults(page) {
    var urls = {};
    urls[_baseScraperWithBrowser.LOGIN_RESULT.SUCCESS] = [`${BASE_WELCOME_URL}/homepage/personal`];
    urls[_baseScraperWithBrowser.LOGIN_RESULT.CHANGE_PASSWORD] = [`${BASE_ACTIONS_URL}/Anonymous/Login/PasswordExpired.aspx`];
    urls[_baseScraperWithBrowser.LOGIN_RESULT.INVALID_PASSWORD] = [_asyncToGenerator(function* () {
        return (0, _elementsInteractions.elementPresentOnPage)(page, INVALID_DETAILS_SELECTOR);
    })];
    urls[_baseScraperWithBrowser.LOGIN_RESULT.UNKNOWN_ERROR] = [_asyncToGenerator(function* () {
        return (0, _elementsInteractions.elementPresentOnPage)(page, LOGIN_ERROR_SELECTOR);
    })];
    return urls;
}

function createLoginFields(inputGroupName, credentials) {
    return [{ selector: `#${inputGroupName}_txtUserName`, value: credentials.username }, { selector: '#txtPassword', value: credentials.password }];
}

class LeumiCardScraper extends _baseScraperWithBrowser.BaseScraperWithBrowser {
    getLoginOptions(credentials) {
        var _this = this;

        var inputGroupName = 'PlaceHolderMain_CardHoldersLogin1';
        return {
            loginUrl: `${BASE_ACTIONS_URL}/Anonymous/Login/CardholdersLogin.aspx`,
            fields: createLoginFields(inputGroupName, credentials),
            submitButtonSelector: `#${inputGroupName}_btnLogin`,
            preAction: function () {
                var _ref6 = _asyncToGenerator(function* () {
                    if (yield (0, _elementsInteractions.elementPresentOnPage)(_this.page, '#closePopup')) {
                        yield (0, _elementsInteractions.clickButton)(_this.page, '#closePopup');
                    }
                });

                return function preAction() {
                    return _ref6.apply(this, arguments);
                };
            }(),
            postAction: function () {
                var _ref7 = _asyncToGenerator(function* () {
                    return redirectOrDialog(_this.page);
                });

                return function postAction() {
                    return _ref7.apply(this, arguments);
                };
            }(),
            possibleResults: getPossibleLoginResults(this.page)
        };
    }

    fetchData() {
        var _this2 = this;

        return _asyncToGenerator(function* () {
            var results = yield fetchTransactions(_this2.browser, _this2.options, _this2.navigateTo);
            var accounts = Object.keys(results).map(function (accountNumber) {
                return {
                    accountNumber: accountNumber,
                    txns: results[accountNumber]
                };
            });

            return {
                success: true,
                accounts: accounts
            };
        })();
    }
}

exports.default = LeumiCardScraper;