const Glue = require('@hapi/glue');
const serverConfig = require('./manifest');
const { updateTokenPriceFeed } = require('../common/utils');

require('../common/db');

const options = { ...serverConfig.options, relativeTo: __dirname };

const init = async () => {
  const server = await Glue.compose(serverConfig.manifest, options);

  await server.start();

  await updateTokenPriceFeed();

  console.log('API running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err.message);
  process.exit(1);
});

init();
