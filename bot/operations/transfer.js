const { differenceInMinutes } = require('date-fns');
const { Inventory, Operation, Purchase } = require('../../common/models');
const { Asset } = require('../../common/utils');
const config = require('../../common/config');
const logger = require('../../common/modules/logger');

module.exports = async (data) => {
  console.log(data);
  try {
    if (data.to === config.ACCOUNT && data.memo.startsWith('P-')) {
      const {
        from: username, trx_id: trxId, memo, amount,
      } = data;

      const asset = Asset.from(amount);

      const order = await Purchase.findOne({ uid: memo.trim(), payment_method: 'crypto', payment_made: false });

      if (order) {
        if (differenceInMinutes(new Date(), new Date(order.created_at)) > 30) {
          throw new Error('30 minutes have been passed after the order was created');
        }

        if (order.payment.amount <= asset.amount && order.payment.currency === asset.symbol) {
          order.completed_at = Date.now();
          order.trx_id = trxId;
          order.payment_made = true;

          await order.save();

          logger.info(`Order data has been updated. UID: ${order.uid}`);

          console.log(`Order data has been updated. UID: ${order.uid}`);


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

          console.log(`Inventories have been updated. UID: ${order.uid}`);

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

          logger.info(`Payment has been processed. UID: ${order.uid}`, { username, ...data });

          console.log(`Inventories have been updated. UID: ${order.uid}`);

        }
      }
    }
  } catch (e) {
    logger.error('Error in processing HIVE/HBD payment.', { error: e.message, data });
  }
};
