const config = require('../common/config');

const plugins = [{
  plugin: './plugins/auth',
  options: {
    PASSWORD: config.COOKIE_ENCRYPTION_PASS,
  },
}, {
  plugin: './plugins/routes',
  options: {
    DIR: 'api/routes',
  },
}];

exports.manifest = {
  server: {
    router: {
      stripTrailingSlash: true,
      isCaseSensitive: false,
    },
    routes: {
      security: {
        hsts: false,
        xss: true,
        noOpen: true,
        noSniff: true,
        xframe: false,
      },
      cors: {
        origin: ['*'],
        credentials: true,
      },
    },
    mime: {
      override: {
        'text/event-stream': {
          compressible: false,
        },
      },
    },
    port: config.PORT,
    host: 'localhost',
    debug: process.env.NODE_ENV === 'production' ? false : { request: ['error'] },
  },

  register: {
    plugins,
  },
};

exports.options = {};
