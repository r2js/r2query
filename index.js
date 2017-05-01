const parse = require('api-query-params');
const async = require('async');

const run = (query, model) => (
  new Promise((resolve, reject) => {
    // TODO: populate uygulanacak
    // TODO: mask uygulanacak

    const parsed = parse.default(query);
    let Model = model;

    if (!parsed) {
      return reject({ type: 'queryParserError' });
    }

    const notSupported = { type: 'notSupportedQueryType' };
    const { filter = {}, sort, skip = 0, projection } = parsed;
    const { qType } = filter;
    let { limit = 10 } = parsed;

    if (qType) {
      delete filter.qType;
    }

    // set maximum limit
    if (['all', 'allTotal'].includes(qType) && limit > 1000) {
      limit = 1000;
    }

    // query type
    switch (qType) {
      case 'all':
      case 'allTotal':
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

    if (['all', 'allTotal', 'one'].includes(qType)) {
      if (sort) Model.sort(sort);
      if (skip) Model.skip(skip);
      if (limit) Model.limit(limit);
      if (projection) Model.select(projection);
    }

    if (['all', 'one', 'total'].includes(qType)) {
      return resolve(Model.exec());
    }

    if (['allTotal'].includes(qType)) {
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
    plugin(schema) {
      schema.statics.apiQuery = function (query) { // eslint-disable-line
        return run(query, this);
      };
    },
  };
};
