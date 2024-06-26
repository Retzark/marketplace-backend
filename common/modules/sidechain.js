const axios = require('axios').default;
const http = require('http');
const https = require('https');

class Sidechain {
  constructor({ rpc = 'https://api.hive-engine.com/rpc', blockProcessor = () => { } }) {
    const rpcNode = rpc.replace(/\/+$/, '');

    this.BLOCKCHAIN_RPC = `${rpcNode}/blockchain`;
    this.CONTRACT_RPC = `${rpcNode}/contracts`;

    this.PROCESSOR = blockProcessor;

    this.shouldStream = true;
  }

  static async request(rpc, request) {
    const postData = {
      jsonrpc: '2.0',
      id: Date.now(),
      ...request,
    };

    let result = null;

    const query = await axios.post(rpc, postData, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    });

    result = query.data.result;

    return result;
  }

  blockchain(request) {
    return this.constructor.request(this.BLOCKCHAIN_RPC, request);
  }

  contract(request) {
    return this.constructor.request(this.CONTRACT_RPC, request);
  }

  getLatestBlockInfo() {
    const request = {
      method: 'getLatestBlockInfo',
    };

    return this.blockchain(request);
  }

  getBlockInfo(blockNumber) {
    const request = {
      method: 'getBlockInfo',
      params: {
        blockNumber,
      },
    };

    return this.blockchain(request);
  }

  static processResponse(response) {
    const logs = JSON.parse(response.logs);

    if (!logs.errors && logs.events) {
      return {
        chain_block: response.refHiveBlockNumber || response.refSteemBlockNumber,
        sidechain_block: response.blockNumber,
        trx_id: response.transactionId,
        sender: response.sender,
        contract: response.contract,
        action: response.action,
        timestamp: new Date(`${response.timestamp}Z`).getTime(),
        payload: JSON.parse(response.payload),
        logs: JSON.parse(response.logs),
        isVirtualTransaction: response.virtualTransaction || false,
      };
    }

    return null;
  }

  processResponses(response) {
    const processedTransactions = [];

    const {
      blockNumber, timestamp, transactions, virtualTransactions,
    } = response;

    transactions.forEach((t) => {
      const trx = this.constructor.processResponse({ ...t, timestamp, blockNumber });

      if (trx) processedTransactions.push(trx);
    });

    virtualTransactions.forEach((t) => {
      const trx = this.constructor.processResponse({
        ...t,
        payload: (t.payload === '') ? '{}' : t.payload,
        timestamp,
        blockNumber,
        virtualTransaction: true,
      });

      if (trx) processedTransactions.push(trx);
    });

    return processedTransactions;
  }

  async streamBlocks(startBlock, endBlock = null, ts = 1000, ...args) {
    if (!this.shouldStream) return;

    try {
      const res = await this.getBlockInfo(startBlock);
      let nextBlock = startBlock;

      if (res !== null) {
        const response = this.processResponses(res);
        this.PROCESSOR(response, this, ...args);
        nextBlock += 1;
      }

      if (endBlock === null || (endBlock && nextBlock <= endBlock)) {
        setTimeout(() => {
          this.streamBlocks(nextBlock, endBlock, ts, ...args);
        }, ts);
      }
    } catch (err) {
      setTimeout(() => {
        this.streamBlocks(startBlock, endBlock, ts, ...args);
      }, ts);
    }
  }

  stopStream() {
    this.shouldStream = false;
  }

  getTransactionInfo(txid) {
    const request = {
      method: 'getTransactionInfo',
      params: {
        txid,
      },
    };

    return this.blockchain(request);
  }

  // CONTRACTS

  getBalance(account, symbol) {
    const query = { account };
    if (symbol) query.symbol = symbol;

    const request = {
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'balances',
        query,
      },
    };

    return this.contract(request);
  }

  getMetrics(symbols) {
    const request = {
      method: 'find',
      params: {
        contract: 'market',
        table: 'metrics',
        query: { symbol: { $in: symbols } },
      },
    };

    return this.contract(request);
  }
}

module.exports = Sidechain;
