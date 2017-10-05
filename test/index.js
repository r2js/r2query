const chai = require('chai');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2query = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

const app = r2base();
app.start()
  .serve(r2query)
  .serve(r2mongoose, { database: 'r2query' })
  .load('model')
  .into(app);

const Test = app.service('model/test');
const Test2 = app.service('model/test2');
const Query = app.service('Query');

before((done) => {
  Test.create({ name: 'Project Title 1', slug: 'project-title-1' })
    .then(data => Test.create({ name: 'Project Title 2', slug: 'project-title-2', testRef1: data.id }))
    .then(data => Test.create({ name: 'Project Title 3', slug: 'project-title-3', testRef1: data.id }))
    .then(data => Test.create({ name: 'Project Title 4', slug: 'project-title-4', testRef1: data.id }))
    .then(data => Test.create({ name: 'Project Title 5', slug: 'project-title-5', testRef1: data.id }))
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
      Test.apiQuery({ qType: 'all' })
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
  });

  describe('operators', () => {
    it('should query via caster, starts', (done) => {
      Test.apiQuery({ qType: 'all', name: 'starts(project)' })
        .then((data) => {
          expect(data.length).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should query via caster, ends', (done) => {
      Test.apiQuery({ qType: 'all', name: 'ends(title 3)' })
        .then((data) => {
          expect(data.length).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should query via caster, contains', (done) => {
      Test.apiQuery({ qType: 'all', name: 'contains(title)' })
        .then((data) => {
          expect(data.length).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should respect limit operator', (done) => {
      Test.apiQuery({ qType: 'allTotal', limit: 2 })
        .then((data) => {
          expect(data.rows.length).to.equal(2);
          expect(data.total).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should respect limit operator via skip', (done) => {
      Test.apiQuery({ qType: 'allTotal', skip: 4, limit: 2 })
        .then((data) => {
          expect(data.rows.length).to.equal(1);
          expect(data.total).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should respect limit operator via other params', (done) => {
      Test.apiQuery({ qType: 'allTotal', skip: 2, limit: 2, slug: 'project-title-1,project-title-2,project-title-3' })
        .then((data) => {
          expect(data.rows.length).to.equal(1);
          expect(data.total).to.equal(3);
          done();
        })
        .catch(done);
    });
  });

  describe('populate', () => {
    it('should query via populate', (done) => {
      Test.apiQuery({ qType: 'all', name: 'starts(project)', filter: '{"populate":[{"path":"testRef1","query":"fields=name,testRef1","populate":[{"path":"testRef1","query":"fields=name"}]}]}' })
        .then((data) => {
          expect(data.length).to.equal(5);
          expect(data[2].name).to.equal('Project Title 3');
          expect(data[2].slug).to.equal('project-title-3');
          expect(data[2].testRef1.name).to.equal('Project Title 2');
          expect(data[2].testRef1.slug).to.equal(undefined);
          expect(data[2].testRef1.testRef1.name).to.equal('Project Title 1');
          expect(data[2].testRef1.testRef1.slug).to.equal(undefined);
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=all', () => {
    it('should not override via unknown query name', (done) => {
      Test.apiQuery({ qType: 'all', qName: 'overrideUnknown' })
        .then((data) => {
          expect(data.length).to.equal(5);
          done();
        })
        .catch(done);
    });

    it('should override limit and skip via query name', (done) => {
      Test.apiQuery({ qType: 'all', qName: 'overrideLimitSkip' })
        .then((data) => {
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Project Title 2');
          expect(data[1].name).to.equal('Project Title 3');
          done();
        })
        .catch(done);
    });

    it('should override filter via query name', (done) => {
      Test.apiQuery({ qType: 'all', qName: 'overrideFilter', name: 'Project Title 1' })
        .then((data) => {
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Project Title 3');
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=one', () => {
    it('should override filter via query name', (done) => {
      Test.apiQuery({ qType: 'one', qName: 'overrideFilterOne', name: 'Project Title 1' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 3');
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=total', () => {
    it('should override filter via query name', (done) => {
      Test.apiQuery({ qType: 'total', qName: 'overrideFilterTotal', name: 'Project Title 1' })
        .then((data) => {
          expect(data).to.equal(1);
          done();
        })
        .catch(done);
    });
  });

  describe('override, qType=allTotal', () => {
    it('should override filter via query name', (done) => {
      Test.apiQuery({ qType: 'allTotal', qName: 'overrideFilter' })
        .then((data) => {
          expect(data.rows[0].name).to.equal('Project Title 3');
          expect(data.total).to.equal(1);
          done();
        })
        .catch(done);
    });

    it('should override filter via query name and respect limit operator', (done) => {
      Test.apiQuery({ qType: 'allTotal', limit: 1, qName: 'overrideFilterAllTotal' })
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
      Test.apiQuery({ qType: 'all', name: 'Project Title 2', qName: 'staticsTest' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });

    it('should run statics function, return data object manually', (done) => {
      Test.apiQuery({ qType: 'all', name: 'Project Title 2', qName: 'staticsTestData' })
        .then((data) => {
          expect(data).to.deep.equal({ a: 1 });
          done();
        })
        .catch(done);
    });

    it('should run statics function, override qName=allTotal as qName=all', (done) => {
      Test.apiQuery({ qType: 'allTotal', name: 'Project Title 2', qName: 'staticsTest' })
        .then((data) => {
          expect(data.name).to.equal('Project Title 5');
          done();
        })
        .catch(done);
    });
  });

  const queryOptions = {
    type: 'object',
    strict: true,
    properties: {
      filter: {
        type: 'object',
        properties: {
          name: { type: 'string', optional: true },
        },
      },
      sort: {
        type: 'object',
        properties: {
          createdAt: { type: 'number', eq: [-1], optional: true },
        },
      },
      limit: { type: 'number', max: 100 },
      skip: { type: 'number', max: 100 },
      projection: {
        type: 'object',
        properties: {
          name: { type: 'number', eq: 1, optional: true },
          testRef1: { type: 'number', eq: 1, optional: true },
        },
      },
      qType: { type: 'string', eq: ['all', 'allTotal'] },
      qName: { type: 'string', eq: ['newMethod'], optional: true },
    }
  };

  describe('inspector', () => {
    it('should run schema inspector, return sanitized query', (done) => {
      const filter = Query.parseAll({
        qType: 'all',
        qName: 'newMethod',
        name: 'test',
        sort: '-createdAt',
        limit: 1000,
        skip: 1000,
        fields: 'name,testRef1',
        filter: '{"populate":[{"path":"testRef1","query":"name=test&fields=name,testRef1"}]}',
      }, queryOptions);

      expect(filter).to.deep.equal({
        filter: { name: 'test' },
        sort: { createdAt: -1 },
        limit: 100,
        skip: 100,
        projection: { name: 1, testRef1: 1 },
        qType: 'all',
        qName: 'newMethod',
      });

      done();
    });

    it('should run schema inspector, return validation error', (done) => {
      const filter = Query.parseAll({
        qType: 'count',
        qName: 'testMethod',
        age: 'test',
        sort: 'createdAt',
        limit: '1000',
        skip: '1000',
        fields: 'age',
        filter: '{"populate":[{"path":"testRef1","query":"name=test&fields=name,testRef1"}]}',
      }, queryOptions);

      const { error: { type, message } } = filter;

      expect(type).to.equal('queryValidationError');
      expect(message[0].property).to.equal('@.sort.createdAt');
      expect(message[0].message).to.equal('must be equal to ["-1"], but is equal to "1"');
      expect(message[1].property).to.equal('@.qType');
      expect(message[1].message).to.equal('must be equal to ["all" or "allTotal"], but is equal to "count"');
      expect(message[2].property).to.equal('@.qName');
      expect(message[2].message).to.equal('must be equal to ["newMethod"], but is equal to "testMethod"');

      done();
    });

    it('should run query, default: all', (done) => {
      Test2.apiQuery({})
        .then((data) => {
          expect(data).to.deep.equal([]);
          done();
        })
        .catch(done);
    });

    it('should run query, return validation error', (done) => {
      Test2.apiQuery({
        qType: 'count',
        qName: 'testMethod',
        age: 'test',
        sort: 'createdAt',
        limit: '1000',
        skip: '1000',
        fields: 'age',
        filter: '{"populate":[{"path":"testRef1","query":"name=test&fields=name,testRef1"}]}',
      })
        .then((data) => {
          done();
        })
        .catch((err) => {
          const { type, message } = err;
          expect(type).to.equal('queryValidationError');
          expect(message[0].property).to.equal('@.sort.createdAt');
          expect(message[0].message).to.equal('must be equal to ["-1"], but is equal to "1"');
          expect(message[1].property).to.equal('@.qType');
          expect(message[1].message).to.equal('must be equal to ["all" or "allTotal"], but is equal to "count"');
          expect(message[2].property).to.equal('@.qName');
          expect(message[2].message).to.equal('must be equal to ["newMethod"], but is equal to "testMethod"');
          done();
        });
    });
  });
});

function dropDatabase(done) {
  this.timeout(0);
  app.service('Mongoose').connection.dropDatabase();
  done();
}

after(dropDatabase);
