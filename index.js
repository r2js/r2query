const parse = require('api-query-params');
const async = require('async');

const parseQuery = (query) => {
  const parsed = parse(query, {
    casters: {
      lowercase: val => val.toLowerCase(),
      int: val => parseInt(val, 10),
      starts: val => new RegExp(`^${val}`, 'i'),
      ends: val => new RegExp(`${val}$`, 'i'),
      contains: val => new RegExp(val, 'i'),
    },
  });

  return parsed;
};

const parsePopulate = populateArr => (
  populateArr.map((val) => {
    if (!val.path) {
      return val;
    }

    if (val.query) {
      const query = parseQuery(val.query);
      const { filter = {}, sort = {}, limit, skip = 0, projection = {} } = query;
      Object.assign(val, {
        path: val.path,
        match: filter,
        select: projection,
        options: { sort, limit, skip },
      }, { query: undefined });
    }

    if (val.populate) {
      parsePopulate(val.populate);
    }

    return val;
  })
);

const run = (query, model) => (
  new Promise((resolve, reject) => {
    const parsed = parseQuery(query);
    let Model = model;

    if (!parsed) {
      return reject({ type: 'queryParserError' });
    }

    const notSupported = { type: 'notSupportedQueryType' };
    const { filter = {}, sort = {}, skip = 0, projection = {} } = parsed;
    const { qType, qName, populate } = filter;
    let { populateQuery, limit = 10 } = parsed;

    if (qType) {
      delete filter.qType;
    }

    if (qName) {
      delete filter.qName;
    }

    if (populate) {
      populateQuery = parsePopulate(populate);
      delete filter.populate;
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
      if (populateQuery) Model.populate(populateQuery);
    }

    const qFunc = qName && typeof Model[qName] === 'function';
    const qModel = (qFunc ? Model[qName](parsed) : Model);

    if (['all', 'one', 'total'].includes(qType)) {
      return resolve(qModel.exec());
    }

    if (['allTotal'].includes(qType)) {
      const qFind = model.find(filter);
      const a = {
        rows: cb => qModel.exec(cb),
        total: cb => (qFunc ? qFind[qName](parsed) : qFind).count().exec(cb),
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
