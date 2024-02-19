const { Inventory, Operation, Purchase } = require('../../common/models');
const { validateIPN } = require('../../common/modules/coinpayments');
const config = require('../../common/config');
const logger = require('../../common/modules/logger');

module.exports = [
  {
    method: 'POST',
    path: '/ipns/paypal',
    options: {},
    handler: (request) => {
      console.log(request.payload);

      return {
        success: true,
      };
    },
  },
  {
    method: 'POST',
    path: '/ipns/coinpayments',
    options: {},
    handler: async (request) => {
      const { hmac } = request.headers;

      if (validateIPN(hmac, request.payload)) {
        const {
          merchant,
          status,
          currency2,
          amount2,
          invoice,
          ipn_mode: ipnMode,
          ipn_type: ipnType,
          txn_id: txnId,
        } = request.payload;

        console.log(request.payload);

        if (merchant === config.COINPAYMENTS_MERCHANT_ID
          && status && currency2 && amount2 && invoice && txnId
          && ipnMode === 'hmac' && ipnType === 'api') {
          const order = await Purchase.findOne({
            uid: invoice,
            payment_method: 'crypto',
            payment_made: false,
            'payment_info.currency': currency2,
          });

          if (order && Number(status) === 100 && order.payment.amount <= Number(amount2)) {
            logger.info(`Processing Coinpayments IPN. Invoice: ${invoice}`, request.payload);

            order.completed_at = Date.now();
            order.trx_id = txnId;
            order.payment_made = true;

            await order.save();

            logger.info(`Order data has been updated. UID: ${order.uid}`);

            const updateOnes = order.items.reduce((ops, item) => {
              ops.push({
                updateOne: {
                  filter: { symbol: item.symbol },
                  update: {
                    $inc: { remaining: -item.quantity },
                  },
                },
              });

              return ops;
            }, []);

            await Inventory.bulkWrite(updateOnes);

            logger.info(`Inventories have been updated. UID: ${order.uid}`);

            const insertOnes = order.items.reduce((ops, item) => {
              ops.push({
                insertOne: {
                  document: {
                    type: config.MINT_TYPE,
                    from: config.ACCOUNT,
                    to: order.username,
                    quantity: item.quantity,
                    symbol: item.symbol,
                    ref_trx: txnId,
                  },
                },
              });

              return ops;
            }, []);

            await Operation.bulkWrite(insertOnes);

            logger.info(`Operations has been inserted. UID: ${order.uid}`);

            logger.info(`CoinPayments payment has been processed. UID: ${order.uid}`);
          }
        }
      }

      return {
        success: true,
      };
    },
  },
];
