require('dotenv').config();

module.exports = {
  ACCOUNT: process.env.ACCOUNT,
  ACTIVE_KEY: process.env.ACTIVE_KEY,
  SIDECHAIN_ID: 'ssc-mainnet-hive',
  SIDECHAIN_RPC: 'https://enginerpc.com',
  NODES: ['https://api.hive.blog', 'https://api.deathwing.me', 'https://rpc.ausbit.dev', 'https://rpc.ecency.com'],
  PORT: 3000,
  MONGODB: process.env.MONGODB,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_ENCRYPTION_PASS: process.env.COOKIE_ENCRYPTION_PASS, // Must be 32 characters long
  PACKS: [
    {
      symbol: 'DATA',
      cards: 10,
      price: 2,
      image: 'https://cdn.tribaldex.com/tribaldex/token-icons/DOJO.png',
      maxOpen: 6,
      quantity: 1000000,
      remaining: 1000000,
    },
    {
      symbol: 'ALPHAPACK',
      name: 'Retzark Alpha Pack',
      image: 'https://cdn.tribaldex.com/tribaldex/token-icons/DOJO.png',
      cards: 5,
      price: 5,
      quantity: 300000,
      remaining: 300000,
      max_open: 6,
    }
  ],
  BONUSES: [[100, 0.10], [500, 0.15], [2000, 0.20]],
  NFT_SYMBOL: 'ALPHAPACK',
  PEGGED_TOKENS: [{
    symbol: 'FARM',
    name: 'FARM',
    precision: 5,
    peg: 1,
  }],
  HE_TOKENS: [{
    symbol: 'PAL',
    name: 'PALcoin',
    precision: 3,
  }, {
    symbol: 'LEO',
    name: 'LeoFinance',
    precision: 3,
  }, {
    symbol: 'BEE',
    name: 'Hive Engine Token',
    precision: 8,
  }, {
    symbol: 'DEC',
    name: 'Dark Energy Crystals',
    precision: 3,
  }, {
    symbol: 'SIM',
    name: 'dCITY Token',
    precision: 3,
  }, {
    symbol: 'SPT',
    name: 'Splintertalk',
    precision: 3,
  }, {
    symbol: 'SPS',
    name: 'Splintershards',
    precision: 8,
  }, {
    symbol: 'STARBITS',
    name: 'StarBits',
    precision: 0,
  }, {
    symbol: 'SWAP.HIVE',
    name: 'HIVE Pegged',
    precision: 3,
  }],
  HIVE_TOKENS: [{
    symbol: 'HIVE',
    name: 'HIVE',
  }, {
    symbol: 'HBD',
    name: 'Hive Dollars',
  }],
  OTHER_CRYPTOS: [{
    symbol: 'BTC',
    name: 'Bitcoin',
  }, {
    symbol: 'LTC',
    name: 'Litecoin',
  }, {
    symbol: 'ETH',
    name: 'Ether',
  }, {
    symbol: 'ETC',
    name: 'Ether Classic',
  }, {
    symbol: 'BCH',
    name: 'Bitcoin Cash',
  }, {
    symbol: 'BNB',
    name: 'BNB Coin',
  }, {
    symbol: 'BNB.ERC20',
    name: 'BNB Coin',
  }, {
    symbol: 'BSV',
    name: 'Bitcoin SV',
  }, {
    symbol: 'DAI',
    name: 'Dai',
  }, {
    symbol: 'DASH',
    name: 'Dash',
  }, {
    symbol: 'DGB',
    name: 'DigiByte',
  }, {
    symbol: 'DOGE',
    name: 'Dogecoin',
  }, {
    symbol: 'ETN',
    name: 'Electroneum',
  }, {
    symbol: 'GUSD',
    name: 'Gemini Dollar',
  }, {
    symbol: 'KCS',
    name: 'KuCoin Shares',
  }, {
    symbol: 'LSK',
    name: 'Lisk',
  }, {
    symbol: 'NEO',
    name: 'NEO',
  }, {
    symbol: 'RVN',
    name: 'Ravencoin',
  }, {
    symbol: 'SMART',
    name: 'SmartCash',
  }, {
    symbol: 'STORJ',
    name: 'StorjToken',
  }, {
    symbol: 'USDC',
    name: 'USD Coin',
  }, {
    symbol: 'TRX',
    name: 'TRON',
  }, {
    symbol: 'USDT.ERC20',
    name: 'Tether USD',
  }, {
    symbol: 'WAVES',
    name: 'Waves',
  }, {
    symbol: 'XEM',
    name: 'NEM',
  }, {
    symbol: 'XMR',
    name: 'Monero',
  }, {
    symbol: 'XVG',
    name: 'VERGE',
  }, {
    symbol: 'ZEC',
    name: 'ZCASH',
  }],
  COINPAYMENTS_EMAIL: process.env.COINPAYMENTS_EMAIL,
  COINPAYMENTS_MERCHANT_ID: process.env.COINPAYMENTS_MERCHANT_ID,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PRICE_API: 'https://prices.splinterlands.com/prices',
  CURRENCY: 'ZARK',
  MARKET_FEE: 500,
  MINT_TYPE: 'issue', // transfer or issue
};
