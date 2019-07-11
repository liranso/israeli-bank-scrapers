'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _baseIsracardAmex = require('./base-isracard-amex');

var _baseIsracardAmex2 = _interopRequireDefault(_baseIsracardAmex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BASE_URL = 'https://digital.isracard.co.il';
var COMPANY_CODE = '11';

class IsracardScraper extends _baseIsracardAmex2.default {
  constructor(options) {
    super(options, BASE_URL, COMPANY_CODE);
  }
}

exports.default = IsracardScraper;