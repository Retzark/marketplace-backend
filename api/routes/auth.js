const Joi = require('joi');
const Boom = require('@hapi/boom');
const { cryptoUtils, Signature } = require('@hiveio/dhive');
const { differenceInMinutes } = require('date-fns');
const { hiveClient } = require('../../common/utils');
const { User } = require('../../common/models');

module.exports = [
  {
    method: 'POST',
    path: '/auth/login',
    options: {
      validate: {
        payload: Joi.object({
          username: Joi.string().required().min(3).max(16),
          ts: Joi.number().required(),
          sig: Joi.string().required(),
          smartlock: Joi.boolean().default(false),
        }).options({ stripUnknown: true }),
      },
    },
    handler: async (request, h) => {
      const response = Boom.unauthorized('Invalid username or signature');

      try {
        const {
          username, ts, sig, smartlock,
        } = request.payload;

        if (process.env.NODE_ENV === 'production') {
          const timeDifference = differenceInMinutes(Date.now(), ts);

          if (timeDifference >= 1) return Boom.unauthorized('Provided timestamp is invalid or too old. Please check that your system clock has the correct date and time.');
        }

        const [account] = await hiveClient.database.getAccounts([username]);

        let validSignature = false;

        const publicKey = Signature.fromString(sig)
          .recover(cryptoUtils.sha256(`${username}${ts}`))
          .toString();

        const thresholdPosting = account.posting.weight_threshold;
        const thresholdActive = account.active.weight_threshold;

        const authorizedAccountsPosting = new Map(account.posting.account_auths);
        const authorizedAccountsActive = new Map(account.active.account_auths);

        // Trying to validate using posting key
        if (!validSignature) {
          for (let i = 0; i < account.posting.key_auths.length; i += 1) {
            const auth = account.posting.key_auths[i];

            if (auth[0] === publicKey && auth[1] >= thresholdPosting) {
              validSignature = true;
              break;
            }
          }
        }

        // Trying to validate using active key
        if (!validSignature) {
          for (let i = 0; i < account.active.key_auths.length; i += 1) {
            const auth = account.active.key_auths[i];

            if (auth[0] === publicKey && auth[1] >= thresholdActive) {
              validSignature = true;
              break;
            }
          }
        }

        // Trying to validate using posting authority
        if (!validSignature && authorizedAccountsPosting.size > 0) {
          let accountsData = await hiveClient.database.getAccounts(
            Array.from(authorizedAccountsPosting.keys()),
          );

          accountsData = accountsData.map((a) => a.posting.key_auths[0]);

          for (let i = 0; i < accountsData.length; i += 1) {
            const auth = accountsData[i];

            if (auth[0] === publicKey && auth[1] >= thresholdPosting) {
              validSignature = true;
              break;
            }
          }
        }

        // Trying to validate using active authority
        if (!validSignature && authorizedAccountsActive.size > 0) {
          let accountsData = await hiveClient.database.getAccounts(
            Array.from(authorizedAccountsActive.keys()),
          );

          accountsData = accountsData.map((a) => a.active.key_auths[0]);

          for (let i = 0; i < accountsData.length; i += 1) {
            const auth = accountsData[i];

            if (auth[0] === publicKey && auth[1] >= thresholdActive) {
              validSignature = true;
              break;
            }
          }
        }

        if (validSignature) {
          try {
            await User.findOneAndUpdate(
              { username },
              { $setOnInsert: { username } },
              { upsert: true, new: true, setDefaultsOnInsert: true },
            ).select('-_id username').lean();
          } catch {
            //
          }

          request.cookieAuth.set({ username, smartlock });

          return h.response({ username, smartlock });
        }
      } catch (e) {
        console.log(e.message);
      }

      return response;
    },
  },
  {
    method: 'POST',
    path: '/auth/me',
    options: {
      auth: 'cookie',
    },
    handler: async (request) => {
      try {
        const { username, smartlock } = request.auth.credentials;

        try {
          await User.updateOne({ username }, { logged_in_at: new Date() });
        } catch {
          //
        }

        return {
          username,
          smartlock,
        };
      } catch {
        //
      }

      return Boom.unauthorized();
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: async (request, h) => {
      request.cookieAuth.clear();

      return h.continue;
    },
  },
];
