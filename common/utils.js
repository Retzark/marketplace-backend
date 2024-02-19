const {
  Asset, Client, PrivateKey, utils: { sleep },
} = require('@hiveio/dhive');
const { monotonicFactory } = require('ulid');
const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const Sidechain = require('./modules/sidechain');
const config = require('./config');

const priceFeedFile = '../prices.json';

const ulid = monotonicFactory();

const generateUlid = () => ulid();

const clientOptions = {
  failoverThreshold: 20,
  consoleOnFailover: true,
  timeout: 20 * 1000,
};

const hiveClient = new Client(config.NODES, clientOptions);

const sidechainClient = new Sidechain({ rpc: config.SIDECHAIN_RPC });

const toFixedWithoutRounding = (t, l = 3) => {
  const a = 10 ** l;
  const s = t * a;
  return Math.trunc(s) / a;
};

const updateTokenPriceFeed = async () => {
  const prices = JSON.parse(fs.readFileSync(path.join(__dirname, priceFeedFile)));
  const tokens = config.HE_TOKENS.filter((s) => s.symbol !== 'SWAP.HIVE').map((t) => t.symbol);

  const newPrices = {};

  try {
    const metrics = await sidechainClient.getMetrics(tokens);

    metrics.forEach((data) => {
      const tokenPrices = prices[data.symbol] || [];
      const lastPrice = Number(data.lastPrice);

      if (tokenPrices.length >= 30) tokenPrices.pop();

      tokenPrices.unshift(lastPrice);

      newPrices[data.symbol] = tokenPrices;
    });

    fs.writeFileSync(path.join(__dirname, priceFeedFile), JSON.stringify(newPrices, null, 2));
  } catch {
    //
  }

  setTimeout(updateTokenPriceFeed, 10 * 60 * 1000);
};

const getCoinPrice = async (coin) => {
  const { data: prices } = await axios.get(config.PRICE_API);

  return prices[coin.toLowerCase()];
};

const getTokenPrice = async (token) => {
  const prices = JSON.parse(fs.readFileSync(path.join(__dirname, priceFeedFile)));

  const tokenPrices = prices[token.toUpperCase()];
  const hivePrice = await getCoinPrice('hive');

  return (tokenPrices.reduce((a, c) => a + c, 0) / tokenPrices.length) * hivePrice;
};

module.exports = {
  Asset,
  generateUlid,
  getCoinPrice,
  getTokenPrice,
  hiveClient,
  sidechainClient,
  toFixedWithoutRounding,
  updateTokenPriceFeed,
  PrivateKey,
  sleep,
};
