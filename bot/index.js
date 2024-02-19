const nodeCleanup = require('node-cleanup');
const Sidechain = require('../common/modules/sidechain');
const State = require('../common/modules/state');
const Stream = require('../common/modules/stream');
const DB = require('../common/db');
const config = require('../common/config');
const sidechainBlockProcessor = require('./sidechain');
const mainchainOperations = require('./operations');
const logger = require('../common/modules/logger');
const { Operation } = require('../common/models');
const { hiveClient, PrivateKey, sleep } = require('../common/utils');

const state = new State();

state.createTable();

let hiveStream;
let sidechainClient;

const processPendingOperations = async () => {
  try {
    const op = await Operation.findOne({ processed: false });

    if (op) {
      const {
        type: contractAction, symbol, to, quantity, from,
      } = op;

      const json = JSON.stringify({
        contractName: 'tokens',
        contractAction,
        contractPayload: {
          symbol,
          to,
          quantity: quantity.toString(),
        },
      });

      const { id } = await hiveClient.broadcast.json({
        required_auths: [from],
        required_posting_auths: [],
        id: config.SIDECHAIN_ID,
        json,
      }, PrivateKey.from(config.ACTIVE_KEY));

      op.trx_id = id;
      op.processed = true;
      op.processed_at = new Date();

      await op.save();
    }
  } catch (e) {
    logger.error(`Error processing pending operations. Error: ${e.message}`);
  }

  setTimeout(processPendingOperations, 20 * 1000);
};

const main = async () => {
  const lastHiveBlock = await state.loadState('hive');
  const lastHEBlock = await state.loadState('hive-engine');

  console.log(`Last processed Hive block: ${lastHiveBlock} and Hive-Engine block: ${lastHEBlock}`);

  hiveStream = new Stream(config.NODES);

  hiveStream.start(lastHiveBlock === 0 ? undefined : lastHiveBlock + 1);

  hiveStream.on('transfer', (data) => mainchainOperations.transfer(data));

  hiveStream.on('block', (block) => state.saveState({ chain: 'hive', block }));

  hiveStream.on('error', async (error) => {
    logger.error(error.message);
  });

  sidechainClient = new Sidechain({
    rpc: config.SIDECHAIN_RPC,
    blockProcessor: sidechainBlockProcessor,
  });

  console.log(config.SIDECHAIN_RPC)
  let blockNumber = lastHEBlock + 1;

  if (blockNumber <= 1) {
    const blockInfo = await sidechainClient.getLatestBlockInfo();
    blockNumber = blockInfo.blockNumber;
  }

  sidechainClient.streamBlocks(blockNumber, null, 1000, state);

  await processPendingOperations();
};

main();

const shutDownSequence = async (exitCode, signal) => {
  sidechainClient.stopStream();
  hiveStream.stop();

  await sleep(30 * 1000);

  await state.destroy();
  await DB.close();

  process.kill(process.pid, signal);
};

nodeCleanup((exitCode, signal) => {
  shutDownSequence(exitCode, signal);

  nodeCleanup.uninstall();

  return false;
});
