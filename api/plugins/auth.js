const Cookie = require('@hapi/cookie');

exports.plugin = {
  async register(server, options) {
    await server.register(Cookie);

    server.auth.strategy('cookie', 'cookie', {
      cookie: {
        ttl: 90 * 24 * 60 * 60 * 1000,
        name: 'session',
        password: options.PASSWORD,
        isSecure: process.env.NODE_ENV === 'production',
        isSameSite: 'Lax',
        path: '/',
        clearInvalid: true,
      },
      keepAlive: true,
      validateFunc: async (request, session) => {
        const { username, smartlock } = session;

        if (!username) {
          return { valid: false };
        }

        return { valid: true, credentials: { username, smartlock } };
      },
    });
  },
  name: 'Cookie',
  version: '1.0.0',
};
