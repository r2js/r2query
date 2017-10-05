const parse = require('api-query-params');
const inspector = require('schema-inspector');
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
      if (!query) {
        return val;
      }

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

const parseAll = (query, options) => {
  const parsed = parseQuery(query);

  if (!parsed) {
    return false;
  }

  const { filter = {}, sort = {}, limit = 10, skip = 0, projection = {} } = parsed;
  const { qType = 'all', qName, populate } = filter;
  let { populateQuery } = parsed;

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

  let response = {
    filter,
    sort,
    limit,
    skip,
    projection,
    qType,
    qName,
    populate: populateQuery,
    error: null,
  };

  if (options) {
    const sanitized = inspector.sanitize(options, response);
    response = sanitized.data;
    const { error, valid } = inspector.validate(options, sanitized.data);

    if (!valid) {
      return { error: { type: 'queryValidationError', message: error } };
    }
  }

  return response;
};

const run = (query, model, options) => (
  new Promise((resolve, reject) => {
    const parsed = parseAll(query, options);

    if (!parsed) {
      return reject({ type: 'queryParserError' });
    }

    let Model = model;
    const notSupported = { type: 'notSupportedQueryType' };
    const { filter, sort, skip, projection, qName, populate, error } = parsed;
    let { limit, qType } = parsed;

    if (error) {
      return reject(error);
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
      if (populate) Model.populate(populate);
    }

    const qFunc = qName && (typeof model[qName] === 'function' || typeof Model[qName] === 'function');
    let qModel = Model;

    // get statics or query function
    if (qFunc) {
      qModel = model[qName] ? model[qName](parsed) : Model[qName](parsed);
      // override qName as 'all' for statics (because qFind[qName] could throw error)
      if (model[qName]) {
        qType = 'all';
      }
    }

    if (['all', 'one', 'total'].includes(qType)) {
      return resolve(qModel.exec ? qModel.exec() : qModel);
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
    plugin(schema, options) {
      schema.statics.apiQuery = function (query) { // eslint-disable-line
        return run(query, this, options);
      };
    },

    parseAll,
  };
};
