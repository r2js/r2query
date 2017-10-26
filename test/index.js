const chai = require('chai');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2query = require('../index');
const testData = require('./data');

const expect = chai.expect;
process.chdir(__dirname);

const app = r2base();
app.start()
  .serve(r2query)
  .serve(r2mongoose, { database: 'r2query' })
  .load('model')
  .into(app);

const Test = app.service('model/test');
const Category = app.service('model/category');
const Query = app.service('Query');

before((done) => {
  app.service('Mongoose').set('debug', false);
  Test.create({ name: 'Project Title 1', slug: 'project-title-1' })
    .then(data => Test.create({ name: 'Project Title 2', slug: 'project-title-2', testRef: data.id }))
    .then(data => Test.create({ name: 'Project Title 3', slug: 'project-title-3', testRef: data.id }))
    .then(data => Test.create({ name: 'Project Title 4', slug: 'project-title-4', testRef: data.id }))
    .then(data => Test.create({ name: 'Project Title 5', slug: 'project-title-5', testRef: data.id }))
    .then(() => testData(app))
    .then(() => done())
    .catch(() => done());
});

describe('r2query', () => {
  describe('type', () => {
    it('should run query, default: all', (done) => {
      Test.apiQuery({})
        .then((data) => {
          expect(data.length).to.equal(5);
          expect(data[0].name).to.equal('Project Title 1');
          expect(data[1].name).to.equal('Project Title 2');
          expect(data[2].name).to.equal('Project Title 3');
          expect(data[3].name).to.equal('Project Title 4');
          expect(data[4].name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });

    it('should run query, all', (done) => {
      Test.apiQuery({})
        .then((data) => {
          expect(data.length).to.equal(5);
          expect(data[0].name).to.equal('Project Title 1');
          expect(data[1].name).to.equal('Project Title 2');
          expect(data[2].name).to.equal('Project Title 3');
          expect(data[3].name).to.equal('Project Title 4');
          expect(data[4].name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });

    it('should run query, allTotal', (done) => {
      Test.apiQuery({ qType: 'allTotal' })
        .then((data) => {
          expect(data.rows.length).to.equal(5);
          expect(data.total).to.equal(5);
          expect(data.rows[0].name).to.equal('Project Title 1');
          expect(data.rows[1].name).to.equal('Project Title 2');
          expect(data.rows[2].name).to.equal('Project Title 3');
          expect(data.rows[3].name).to.equal('Project Title 4');
          expect(data.rows[4].name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });

    it('should run query, one', (done) => {
      Test.apiQuery({ qType: 'one' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 1');
          expect(data.slug).to.equal('project-title-1');
          done();
        })
        .catch(done);
    });

    it('should run query, total', (done) => {
      Test.apiQuery({ qType: 'total' })
        .then((data) => {
          expect(data).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should run query, tree', (done) => {
      Category.apiQuery({
        _id: global.cat2.id,
        childOpts: { condition: { name: 'Category 2.1' } },
        qType: 'tree',
      })
        .then((data) => {
          const cat2 = global.cat2;
          expect(data[cat2.id]).to.not.equal(undefined);
          expect(data[cat2.id].name).to.equal('Category 2');
          expect(Object.keys(data[cat2.id].children).length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should run query, arrayTree', (done) => {
      Category.apiQuery({
        _id: global.cat2.id,
        childOpts: { condition: { name: 'Category 2.1' } },
        qType: 'arrayTree',
      })
        .then((data) => {
          const cat2 = global.cat2;
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Category 2');
          expect(data[0].children.length).to.equal(1);
          done();
        })
        .catch(done);
    });
  });

  describe('options', () => {
    it('should respect limit option', (done) => {
      Test.apiQuery({ qType: 'allTotal' }, { limit: 2 })
        .then((data) => {
          expect(data.rows.length).to.equal(2);
          expect(data.total).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should respect limit option via skip', (done) => {
      Test.apiQuery({ qType: 'allTotal' }, { skip: 4, limit: 2 })
        .then((data) => {
          expect(data.rows.length).to.equal(1);
          expect(data.total).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should respect limit option via other params', (done) => {
      Test.apiQuery({ qType: 'allTotal', slug: { $in: ['project-title-1', 'project-title-2', 'project-title-3'] } }, { skip: 2, limit: 2 })
        .then((data) => {
          expect(data.rows.length).to.equal(1);
          expect(data.total).to.equal(3);
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=all', () => {
    it('should not override via unknown query name', (done) => {
      Test.apiQuery({ qName: 'overrideUnknown' })
        .then((data) => {
          expect(data.length).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should override limit and skip via query name', (done) => {
      Test.apiQuery({ qName: 'overrideLimitSkip' })
        .then((data) => {
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Project Title 2');
          expect(data[1].name).to.equal('Project Title 3');
          done();
        })
        .catch(done);
    });

    it('should override query via query name', (done) => {
      Test.apiQuery({ qName: 'overrideQuery', name: 'Project Title 1' })
        .then((data) => {
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Project Title 3');
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=one', () => {
    it('should override query via query name', (done) => {
      Test.apiQuery({ qType: 'one', qName: 'overrideQueryOne', name: 'Project Title 1' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 3');
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=total', () => {
    it('should override query via query name', (done) => {
      Test.apiQuery({ qType: 'total', qName: 'overrideQueryTotal', name: 'Project Title 1' })
        .then((data) => {
          expect(data).to.equal(1);
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=allTotal', () => {
    it('should override query via query name', (done) => {
      Test.apiQuery({ qType: 'allTotal', qName: 'overrideQuery' })
        .then((data) => {
          expect(data.rows[0].name).to.equal('Project Title 3');
          expect(data.total).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should override query via query name and respect limit option', (done) => {
      Test.apiQuery({ qType: 'allTotal', qName: 'overrideQueryAllTotal' }, { limit: 1 })
        .then((data) => {
          expect(data.rows[0].name).to.equal('Project Title 1');
          expect(data.total).to.equal(3);
          done();
        })
        .catch(done);
    });
  });

  describe('statics', () => {
    it('should run statics function', (done) => {
      Test.apiQuery({ name: 'Project Title 2', qName: 'staticsTest' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });

    it('should run statics function, return data object manually', (done) => {
      Test.apiQuery({ name: 'Project Title 2', qName: 'staticsTestData' })
        .then((data) => {
          expect(data).to.deep.equal({ a: 1 });
          done();
        })
        .catch(done);
    });

    it('should run statics function, override qName=allTotal as qName=all', (done) => {
      Test.apiQuery({ name: 'Project Title 2', qName: 'staticsTest' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });
  });

  describe('populate', () => {
    it('should populate field', (done) => {
      Test.apiQuery({ qType: 'one', name: 'Project Title 2' }, { populate: { path: 'testRef', select: 'name' } })
        .then((data) => {
          expect(data.name).to.equal('Project Title 2');
          expect(data.testRef.name).to.equal('Project Title 1');
          expect(data.testRef.slug).to.equal(undefined);
          done();
        })
        .catch(done);
    });
  });
});

function dropDatabase(done) {
  this.timeout(0);
  app.service('Mongoose').connection.dropDatabase();
  done();
}

after(dropDatabase);
