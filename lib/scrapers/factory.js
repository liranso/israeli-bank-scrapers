'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createScraper;

var _hapoalim = require('./hapoalim');

var _hapoalim2 = _interopRequireDefault(_hapoalim);

var _otsarHahayal = require('./otsar-hahayal');

var _otsarHahayal2 = _interopRequireDefault(_otsarHahayal);

var _leumi = require('./leumi');

var _leumi2 = _interopRequireDefault(_leumi);

var _discount = require('./discount');

var _discount2 = _interopRequireDefault(_discount);

var _leumiCard = require('./leumi-card');

var _leumiCard2 = _interopRequireDefault(_leumiCard);

var _visaCal = require('./visa-cal');

var _visaCal2 = _interopRequireDefault(_visaCal);

var _isracard = require('./isracard');

var _isracard2 = _interopRequireDefault(_isracard);

var _amex = require('./amex');

var _amex2 = _interopRequireDefault(_amex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createScraper(options) {
  switch (options.companyId) {
    case 'hapoalim':
      return new _hapoalim2.default(options);
    case 'leumi':
      return new _leumi2.default(options);
    case 'discount':
      return new _discount2.default(options);
    case 'otsarHahayal':
      return new _otsarHahayal2.default(options);
    case 'visaCal':
      return new _visaCal2.default(options);
    case 'leumiCard':
      return new _leumiCard2.default(options);
    case 'isracard':
      return new _isracard2.default(options);
    case 'amex':
      return new _amex2.default(options);
    default:
      throw new Error(`unknown company id ${options.companyId}`);
  }
}