/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const Hoek = require('@hapi/hoek');
const glob = require('glob');
const path = require('path');
const util = require('util');

const getRoutes = async (baseDir, pattern = '**/!(_)*.js') => {
  if (Array.isArray(baseDir)) {
    const promise = new Promise((resolve) => {
      Promise.all(baseDir.map((d) => this.getFiles(d, pattern)))
        .then((value) => resolve(Hoek.flatten(value)));
    });
    return promise;
  }

  const absolutePattern = path.join(baseDir, pattern);
  const globPromised = util.promisify(glob);

  const filePaths = await globPromised(absolutePattern, {});

  const routes = filePaths.map((p) => require(path.resolve(p)));

  return routes.map((file) => Hoek.clone(file));
};

exports.plugin = {
  async register(server, { DIR }) {
    const routes = await getRoutes(DIR);

    routes.forEach((r) => {
      server.route(r);
    });
  },
  name: 'routes',
  version: '1.0.0',
};
