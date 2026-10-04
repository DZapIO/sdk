const pkg = require('bitcoin-address-validation');

module.exports = {
  Network: pkg.Network,
  AddressType: pkg.AddressType,
  validate: pkg.validate,
  getAddressInfo: pkg.getAddressInfo,
  default: pkg.validate,
};
