const tokensTransfer = require('./tokens-transfer');
const config = require('../../common/config');

const blockProcessor = async (data, scClient, state) => {
  if (data.length <= 0) return;

  for (let i = 0; i < data.length; i += 1) {
    const trx = data[i];

    if (trx.contract === 'tokens' && trx.action === 'transfer' && trx.payload.to === config.ACCOUNT) {
      console.log("trx", trx);
      await tokensTransfer(trx, scClient);
    }
  }

  state.saveState({ chain: 'hive-engine', block: data[0].sidechain_block });
};

module.exports = blockProcessor;
