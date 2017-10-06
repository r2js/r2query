module.exports = (app) => {
  const mongoose = app.service('Mongoose');
  const query = app.service('Query');
  const ObjectId = mongoose.Schema.Types.ObjectId;
  const { Schema } = mongoose;

  const votesSchema = new Schema({
    _id: false,
    user: { type: ObjectId, ref: 'users' },
    type: { type: String, enum: ['p', 'n'] },
  });

  const schema = new Schema({
    name: { type: String },
    slug: { type: String },
    testRef: { type: ObjectId, ref: 'test' },
  });

  schema.query.overrideLimitSkip = function(parsed) {
    return this.skip(1).limit(2);
  };

  schema.query.overrideQuery = function(parsed) {
    return this.find({ name: 'Project Title 3' });
  };

  schema.query.overrideQueryOne = function(parsed) {
    return this.findOne({ name: 'Project Title 3' });
  };

  schema.query.overrideQueryTotal = function(parsed) {
    return this.count({ name: 'Project Title 3' });
  };

  schema.query.overrideQueryAllTotal = function(parsed, options) {
    return this.find({ slug: { $in: ['project-title-1', 'project-title-2', 'project-title-3'] } }).sort({ name: 1 });
  };

  schema.statics.staticsTest = function(parsed) {
    return this.findOne({ name: 'Project Title 5' });
  };

  schema.statics.staticsTestData = function(parsed) {
    return { a: 1 };
  };

  schema.plugin(query.plugin);
  const model = mongoose.model('test', schema);
  return model;
};
