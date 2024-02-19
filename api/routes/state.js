const State = require('../../common/modules/state');
const { hiveClient, sidechainClient } = require('../../common/utils');

const state = new State();

state.createTable();

module.exports = [
  {
    method: 'GET',
    path: '/state',
    handler: async () => {
      let response = {
        hive_head_block: 0,
        hive_last_processed_block: 0,
        sidechain_head_block: 0,
        sidechain_last_processed_block: 0,
      };

      try {
        const [
          { head_block_number: hiveHeadBlock },
          { blockNumber: heHeadBlock },
        ] = await Promise.all([
          hiveClient.database.getDynamicGlobalProperties(),
          sidechainClient.getLatestBlockInfo(),
        ]);

        const [lastHiveBlock, lastHEBlock] = await Promise.all([
          state.loadState('hive'),
          state.loadState('hive-engine'),
        ]);

        response = {
          hive_head_block: hiveHeadBlock,
          hive_last_processed_block: lastHiveBlock,
          hive_block_difference: hiveHeadBlock - lastHiveBlock,
          sidechain_head_block: heHeadBlock,
          sidechain_last_processed_block: lastHEBlock,
          sidechain_block_difference: heHeadBlock - lastHEBlock,
        };
      } catch {
        //
      }

      return response;
    },
  },
];
