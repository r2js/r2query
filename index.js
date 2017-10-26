const async = require('async');

const run = (query = {}, model, options = {}) => (
  new Promise((resolve, reject) => {
    let Model = model;
    const { sort, skip = 0, fields, populate } = options;
    const { qName } = query;
    let { qType = 'all' } = query;
    let { limit = 10 } = options;
    let treeFunc;

    if (qType) {
      delete query.qType;
    }

    if (qName) {
      delete query.qName;
    }

    // set maximum limit
    if (['all', 'allTotal'].includes(qType) && limit > 1000) {
      limit = 1000;
    }

    // query type
    switch (qType) {
      case 'all':
      case 'allTotal':
        Model = Model.find(query);
        break;

      case 'one':
        Model = Model.findOne(query);
        break;

      case 'total':
        Model = Model.count(query);
        break;

      case 'tree':
        treeFunc = 'GetTree';
        break;

      case 'arrayTree':
        treeFunc = 'GetArrayTree';
        break;

      default:
        return reject({ type: 'notSupportedQueryType' });
    }

    if (['tree', 'arrayTree'].includes(qType)) {
      if (!Model[treeFunc]) {
        return reject({ type: 'notSupportedTreeModel' });
      }

      const childOpts = query.childOpts || {};
      if (query.childOpts) {
        delete query.childOpts;
      }

      return Model[treeFunc](query, childOpts, (err, tree) => {
        resolve(tree);
      });
    }

    if (['all', 'allTotal', 'one'].includes(qType)) {
      if (sort) Model.sort(sort);
      if (skip) Model.skip(skip);
      if (limit) Model.limit(limit);
      if (fields) Model.select(fields);
      if (populate) Model.populate(populate);
    }

    const qFunc = qName && (typeof model[qName] === 'function' || typeof Model[qName] === 'function');
    let qModel = Model;

    // get statics or query function
    if (qFunc) {
      qModel = model[qName] ? model[qName](query, options) : Model[qName](query, options);
      // override qName as 'all' for statics (because qFind[qName] could throw error)
      if (model[qName]) {
        qType = 'all';
      }
    }

    if (['all', 'one', 'total'].includes(qType)) {
      return resolve(qModel.exec ? qModel.exec() : qModel);
    }

    if (['allTotal'].includes(qType)) {
      const qFind = model.find(query);
      const a = {
        rows: cb => qModel.exec(cb),
        total: cb => (qFunc ? qFind[qName](query, options) : qFind).count().exec(cb),
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
      schema.statics.apiQuery = function (query, options) { // eslint-disable-line
        return run(query, this, options);
      };
    },
  };
};
