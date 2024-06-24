const { Inventory } = require('../../common/models');
const config = require('../../common/config');

module.exports = [
  {
    method: 'GET',
    path: '/',
    options: {},
    handler: () => ({
      success: true,
    }),
  },
  {
    method: 'GET',
    path: '/settings',
    options: {},
    handler: async () => {

      const {
        ACCOUNT, CURRENCY, MARKET_FEE, BONUSES,
        SIDECHAIN_ID, SIDECHAIN_RPC, NFT_SYMBOL, PAYPAL_CLIENT_ID, PACKS,
      } = config;
      const inventories = await Inventory.find({ remaining: { $gt: 0 } }, { _id: 0 });

      return {
        account: ACCOUNT,
        sidechain_id: SIDECHAIN_ID,
        sidechain_rpc: SIDECHAIN_RPC,
        nft_symbol: NFT_SYMBOL,
        packs: inventories,
        bonuses: BONUSES,
        currencies: [
          ...config.PEGGED_TOKENS,
          ...config.HIVE_TOKENS,
          ...config.HE_TOKENS,
          ...config.OTHER_CRYPTOS,
        ],
        currency: CURRENCY,
        market_fee: MARKET_FEE,
        paypal_client_id: PAYPAL_CLIENT_ID,
      };
    },
  },
];
