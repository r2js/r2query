const material = require('mongoose-materialized');

module.exports = (app) => {
  const mongoose = app.service('Mongoose');
  const query = app.service('Query');
  const ObjectId = mongoose.Schema.Types.ObjectId;
  const { Schema } = mongoose;

  const schema = new Schema({
    name: { type: String },
    slug: { type: String },
  });

  schema.plugin(query.plugin);
  schema.plugin(material);

  return mongoose.model('category', schema);
};
