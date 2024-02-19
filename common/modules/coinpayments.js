const Coinpayments = require('coinpayments');
const { verify } = require('coinpayments-ipn');

const coinpayments = new Coinpayments({
  key: process.env.COINPAYMENTS_PUBLIC_KEY,
  secret: process.env.COINPAYMENTS_PRIVATE_KEY,
});

const validateIPN = (hmac, payload) => {
  let isValid = false;

  try {
    isValid = verify(hmac, process.env.COINPAYMENTS_IPN_SECRET, payload);
  } catch (e) {
    // console.log(e);
  }

  return !!isValid;
};

module.exports = {
  coinpayments,
  validateIPN,
};
