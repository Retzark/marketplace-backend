const { differenceInMinutes } = require('date-fns');
const { Inventory, Operation, Purchase } = require('../../common/models');
const logger = require('../../common/modules/logger');
const config = require('../../common/config');

module.exports = async (trx) => {
  const {
    sender: username,
    trx_id: trxId,
    timestamp,
    payload,
  } = trx;

  const {
    memo, quantity, symbol, to,
  } = payload;

  const receivedAmount = Number(quantity);

  if (to === config.ACCOUNT && memo && memo.startsWith('P-')) {
    try {
      const order = await Purchase.findOne({ uid: memo.trim(), payment_method: 'crypto', payment_made: false });

      if (order) {
        if (differenceInMinutes(new Date(), new Date(order.created_at)) > 30) {
          throw new Error('30 minutes have been passed since the order was created!');
        }

        if (order.payment.amount <= receivedAmount && order.payment.currency === symbol) {
          order.completed_at = timestamp;
          order.trx_id = trxId;
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
                  ref_trx: trxId,
                },
              },
            });

            return ops;
          }, []);

          await Operation.bulkWrite(insertOnes);

          logger.info(`Operations has been inserted. UID: ${order.uid}`);

          logger.info(`Payment has been processed. UID: ${order.uid}`, { username, trx_id: trxId, payload });
        }
      }
    } catch (e) {
      logger.error('Error in processing sidechain payment.', {
        error: e.message, username, trx_id: trxId, payload,
      });
    }
  }
};
