const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  }

  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
};

const client = () => new checkoutNodeJssdk.core.PayPalHttpClient(environment());

const getOrder = async (orderId) => {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

  return client().execute(request);
};

module.exports = {
  client,
  getOrder,
};
