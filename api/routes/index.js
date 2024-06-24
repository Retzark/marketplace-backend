const { Inventory } = require('../../common/models');
const  config  = require('../../common/config');

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
    handler: async (request, h) => {
      try {
        const {
          ACCOUNT, CURRENCY, MARKET_FEE, BONUSES,
          SIDECHAIN_ID, SIDECHAIN_RPC, NFT_SYMBOL, PAYPAL_CLIENT_ID, PACKS,
        } = config;

        // Log the NFT_SYMBOL to ensure it's being read correctly
        console.log('NFT_SYMBOL:', NFT_SYMBOL);

        // Query inventories with remaining greater than 0 and symbol matching NFT_SYMBOL
        const inventories = await Inventory.find({ remaining: { $gt: 0 }, symbol: NFT_SYMBOL }, { _id: 0 });

        // Log the query result to check if inventories are fetched correctly
        console.log('Inventories:', inventories);

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
      } catch (error) {
        // Log the error to help diagnose the issue
        console.error('Error in /settings handler:', error);

        // Return an internal server error response
        return h.response({
          success: false,
          message: 'Internal Server Error',
        }).code(500);
      }
    },
  },
];
