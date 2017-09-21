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
    slug: { type: String },
    name: { type: String, required: true },
    description: { type: String, allowHtml: true },
    email: { type: String, pattern: 'email' },
    user: { type: ObjectId, ref: 'user' },
    isEnabled: { type: String, enum: ['y', 'n'], default: 'n' },
    createdAt: { type: Date },
    workerCount: { type: Number, default: 0, lte: 1000 },
    num1: { type: Number, default: 0, lte: 1000 },
    num2: { type: Number },
    num3: { type: Number },
    num4: { type: Number },
    arr1: { type: [String], settings: { html: { allowedTags: ['a'] } } },
    arr2: { type: [String], allowHtml: true, match: /test/i, minLength: 2 },
    arr3: [{ type: String, allowHtml: true, arrOpts: { minLength: 2, maxLength: 8 } }],
    numsArr1: { type: [Number], gte: 1, lte: 100 },
    numsArr2: [Number],
    links: {
      web: { type: String, pattern: 'url' },
      apple: { type: String, pattern: 'url' },
      google: { type: String, pattern: 'url' },
    },
    workers: { type: [ObjectId], ref: 'user' },
    votes: { type: [votesSchema], arrOpts: { minLength: 2 } },
    testRef1: { type: ObjectId, ref: 'test' },
    testRef2: { type: ObjectId, ref: 'test' },
  });

  schema.query.overrideLimitSkip = function(parsed) {
    return this.skip(1).limit(2);
  };

  schema.query.overrideFilter = function(parsed) {
    return this.find({ name: 'Project Title 3' });
  };

  schema.query.overrideFilterOne = function(parsed) {
    return this.findOne({ name: 'Project Title 3' });
  };

  schema.query.overrideFilterTotal = function(parsed) {
    return this.count({ name: 'Project Title 3' });
  };

  schema.query.overrideFilterAllTotal = function(parsed) {
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
