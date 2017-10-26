module.exports = (app) => {
  const mCategory = app.service('model/category');
  let cat1, cat2 ,cat3;

  return new Promise((resolve) => {
    mCategory.create({ name: 'Category 1' })
      .then(data => {
        global.cat1 = data;
        cat1 = data;
        return mCategory.create({ parentId: cat1.id, name: 'Category 1.1' });
      })
      .then(() => mCategory.create({ parentId: cat1.id, name: 'Category 1.2' }))
      .then(() => mCategory.create({ parentId: cat1.id, name: 'Category 1.3' }))
      .then(() => mCategory.create({ name: 'Category 2' }))
      .then(data => {
        global.cat2 = data;
        cat2 = data;
        return mCategory.create({ parentId: cat2.id, name: 'Category 2.1' });
      })
      .then(() => mCategory.create({ parentId: cat2.id, name: 'Category 2.2' }))
      .then(() => mCategory.create({ parentId: cat2.id, name: 'Category 2.3' }))
      .then(() => mCategory.create({ name: 'Category 3' }))
      .then(data => {
        global.cat3 = data;
        cat3 = data;
        return mCategory.create({ parentId: cat3.id, name: 'Category 3.1' });
      })
      .then(() => mCategory.create({ parentId: cat3.id, name: 'Category 3.2' }))
      .then(() => mCategory.create({ parentId: cat3.id, name: 'Category 3.3' }))
      .then(resolve)
      .catch(resolve);
  });
}
