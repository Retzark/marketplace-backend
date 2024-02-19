const Joi = require('joi');
const Boom = require('@hapi/boom');
const config = require('../../common/config');
const { Inventory, Operation, Purchase } = require('../../common/models');
const {
  generateUlid, getCoinPrice, getTokenPrice, toFixedWithoutRounding,
} = require('../../common/utils');
const { coinpayments } = require('../../common/modules/coinpayments');
const { getOrder } = require('../../common/modules/paypal');
const logger = require('../../common/modules/logger');

const PACKS = config.PACKS.map((p) => p.symbol);
const PEGGED_TOKENS = config.PEGGED_TOKENS.map((c) => c.symbol);
const HIVE_TOKENS = config.HIVE_TOKENS.map((c) => c.symbol);
const HE_TOKENS = config.HE_TOKENS.map((c) => c.symbol);
const OTHER_CRYPTOS = config.OTHER_CRYPTOS.map((c) => c.symbol);

module.exports = [
  {
    method: 'POST',
    path: '/purchases/start',
    options: {
      auth: 'cookie',
      validate: {
        payload: Joi.object({
          username: Joi.string().lowercase().min(3).max(16)
            .required(),
          items: Joi.array().items(Joi.object().keys({
            symbol: Joi.string().uppercase().valid(...PACKS).required(),
            quantity: Joi.number().min(1).max(2000).required(),
          })).min(1).required(),
          payment_method: Joi.string().lowercase().valid('paypal', 'crypto').required(),
          currency: Joi.when('payment_method', { is: 'crypto', then: Joi.string().uppercase().required() }),
        }).options({ stripUnknown: true }),
      },
    },
    handler: async (request) => {
      const {
        username, items, payment_method: paymentMethod, currency,
      } = request.payload;

      const itemsInfo = await Inventory.find({ symbol: { $in: items.map((i) => i.symbol) } });

      const orderableItems = [];
      const errors = [];

      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];

        const itemInfo = itemsInfo.find((info) => info.symbol === item.symbol);

        if (itemInfo.remaining < item.quantity) {
          errors.push(`Pack ${item.symbol} does not have sufficient quantity.`);

          break;
        }

        let { quantity } = item;

        if (quantity >= config.BONUSES[0][0]) {
          quantity = config.BONUSES.reduce((acc, cur) => {
            if (quantity >= cur[0]) {
              // eslint-disable-next-line no-param-reassign
              acc = quantity * (1 + cur[1]);
            }

            return acc;
          }, 0);

          quantity = toFixedWithoutRounding(quantity);
        }

        orderableItems.push({
          symbol: itemInfo.symbol,
          quantity,
          original_quantity: item.quantity,
          price: Number(item.quantity * itemInfo.price),
        });
      }

      if (errors.length === 0 && orderableItems.length >= 1) {
        const totalPrice = Number(orderableItems.reduce((acc, cur) => acc + cur.price, 0)
          .toFixed(3));

        const uid = `P-${generateUlid()}`;

        const payment = {
          amount: totalPrice,
          currency: 'USD',
        };

        const paymentObj = {
          username,
          uid,
          payment_method: paymentMethod,
          payment,
          items: orderableItems,
          total_price: {
            amount: totalPrice,
            currency: 'USD',
          },
          payment_info: null,
        };

        if (paymentMethod === 'crypto') {
          if (PEGGED_TOKENS.includes(currency)) {
            const token = config.PEGGED_TOKENS.find((c) => c.symbol === currency);

            const amount = toFixedWithoutRounding(
              totalPrice / token.peg, token.precision,
            );

            paymentObj.payment = {
              amount,
              currency,
            };

            paymentObj.payment_info = {
              currency,
              amount,
              address: config.ACCOUNT,
              memo: uid,
              type: 'hive-engine',
            };
          } else if (HIVE_TOKENS.includes(currency)) {
            const amount = toFixedWithoutRounding(totalPrice / await getCoinPrice(currency), 3);

            paymentObj.payment = {
              amount,
              currency,
            };

            paymentObj.payment_info = {
              currency,
              amount,
              address: config.ACCOUNT,
              memo: uid,
              type: 'hive',
            };
          } else if (HE_TOKENS.includes(currency)) {
            let amount;
            const token = config.HE_TOKENS.find((c) => c.symbol === currency);

            if (currency === 'SWAP.HIVE') {
              amount = toFixedWithoutRounding(totalPrice / await getCoinPrice('HIVE'), 3);
            } else {
              amount = toFixedWithoutRounding(
                totalPrice / await getTokenPrice(currency), token.precision,
              );
            }

            paymentObj.payment = {
              amount,
              currency,
            };

            paymentObj.payment_info = {
              currency,
              amount,
              address: config.ACCOUNT,
              memo: uid,
              type: 'hive-engine',
            };
          } else if (OTHER_CRYPTOS.includes(currency)) {
            const cpData = await coinpayments.createTransaction({
              currency1: 'USD',
              currency2: currency,
              amount: totalPrice,
              buyer_email: config.COINPAYMENTS_EMAIL,
              invoice: uid,
            });

            paymentObj.payment = {
              amount: Number(cpData.amount),
              currency,
            };

            paymentObj.payment_info = {
              currency,
              amount: Number(cpData.amount),
              address: cpData.address,
              memo: cpData.dest_tag || null,
              timeout: cpData.timeout,
              txn_id: cpData.txn_id,
              confirms_needed: cpData.confirms_needed,
              checkout_url: cpData.checkout_url,
              status_url: cpData.status_url,
              qrcode_url: cpData.qrcode_url,
              type: 'coinpayments',
            };
          }
        }

        const purchase = await Purchase.create(paymentObj);

        return {
          uid: purchase.uid,
          username: purchase.username,
          payment_method: purchase.payment_method,
          items: purchase.items,
          payment: purchase.payment,
          total_price: purchase.total_price,
          created_at: purchase.created_at,
          updated_at: purchase.updated_at,
          payment_info: purchase.payment_info,
          type: purchase.type,
        };
      }

      return Boom.badData(JSON.stringify(errors));
    },
  },
  {
    method: 'POST',
    path: '/purchases/paypal',
    options: {
      validate: {
        payload: Joi.object({
          uid: Joi.string().required(),
          tx: Joi.string().required(),
        }).options({ stripUnknown: true }),
      },
    },
    handler: async (request) => {
      const { tx: trxId } = request.payload;

      try {
        const paymentDetails = await getOrder(trxId);

        if (paymentDetails.result.status === 'COMPLETED') {
          const [unit] = paymentDetails.result.purchase_units;

          const order = await Purchase.findOne({ uid: unit.reference_id, payment_method: 'paypal', payment_made: false });

          if (order
            && unit.amount.currency_code === order.payment.currency
            && Number(unit.amount.value) === Number(order.payment.amount)) {
            order.completed_at = Date.now();
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

            logger.info(`PayPal payment has been processed. UID: ${order.uid}`);

            return {
              success: 'OK',
            };
          }
        }
      } catch (e) {
        console.log(e.message);
      }

      return Boom.paymentRequired();
    },
  },
];
