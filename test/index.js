const chai = require('chai');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2query = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

const app = r2base({ baseDir: __dirname });
app.start()
  .serve(r2query)
  .serve(r2mongoose, { database: 'r2test' })
  .load('model')
  .into(app);

const Test = app.service('model/test');

before((done) => {
  Test.saveNew({ name: 'Project Title 1', slug: 'project-title-1' })
    .then(data => Test.saveNew({ name: 'Project Title 2', slug: 'project-title-2', testRef1: data.id }))
    .then(data => Test.saveNew({ name: 'Project Title 3', slug: 'project-title-3', testRef1: data.id }))
    .then(data => Test.saveNew({ name: 'Project Title 4', slug: 'project-title-4', testRef1: data.id }))
    .then(data => Test.saveNew({ name: 'Project Title 5', slug: 'project-title-5', testRef1: data.id }))
    .then(() => done())
    .catch(() => done());
});

describe('r2query', () => {
  describe('type', () => {
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
});

function dropDatabase(done) {
  this.timeout(0);
  app.service('Mongoose').connection.db.dropDatabase();
  done();
}

after(dropDatabase);
