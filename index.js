const parse = require('api-query-params');
const async = require('async');

const run = (type, query, model) => (
  new Promise((resolve, reject) => {
    const parsed = parse.default(query);
    let Model = model;

    if (!parsed) {
      return reject({ type: 'queryParserError' });
    }

    const notSupported = { type: 'notSupportedQueryType' };
    const { filter, sort, skip = 0, projection } = parsed;
    let { limit = 10 } = parsed;

    // set maximum limit
    if (['all', 'allCount'].includes(type) && limit > 1000) {
      limit = 1000;
    }

    // query type
    switch (type) {
      case 'all':
      case 'allCount':
        Model = Model.find(filter);
        break;

      case 'one':
        Model = Model.findOne(filter);
        break;

      case 'total':
        Model = Model.count(filter);
        break;

      default:
        return reject(notSupported);
    }

    if (['all', 'allCount', 'one'].includes(type)) {
      if (sort) Model.sort(sort);
      if (skip) Model.skip(skip);
      if (limit) Model.limit(limit);
      if (projection) Model.select(projection);
    }

    if (['all', 'one', 'total'].includes(type)) {
      return resolve(Model.exec());
    }

    if (['allCount'].includes(type)) {
      const a = {
        rows: cb => Model.exec(cb),
        total: cb => Model.count(filter, cb),
      };

      async.parallel(a, (err, results = {}) => {
        const { rows, total } = results;
        return resolve({ rows, total });
      });
    }

    return true;
  })
);

module.exports = function Query() {
  return {
    parse,
    plugin(schema) {
      ['all', 'allCount', 'one', 'total'].map(type => (
        schema.statics[type] = function (query) { // eslint-disable-line
          return run(type, query, this);
        }
      ));
    },
  };
};
