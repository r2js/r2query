const chai = require('chai');
const r2base = require('r2base');
const r2mongoose = require('r2mongoose');
const r2inspector = require('r2inspector');
const r2api = require('r2api');
const r2query = require('../index');

const expect = chai.expect;
process.chdir(__dirname);

const app = r2base({ baseDir: __dirname });
app.start()
  .serve(r2query)
  .serve(r2mongoose, { database: 'r2test' })
  .serve(r2inspector)
  .load('model')
  .serve(r2api, 'Test', { model: 'test', jwt: { secret: '1234', expiresIn: 7 } })
  .into(app);

const Test = app.service('Test');
const Model = app.service('model/test');

before((done) => {
  Test.post({ name: 'Project Title 1', slug: 'project-title-1' })
    .then(() => Test.post({ name: 'Project Title 2', slug: 'project-title-2' }))
    .then(() => Test.post({ name: 'Project Title 3', slug: 'project-title-3' }))
    .then(() => Test.post({ name: 'Project Title 4', slug: 'project-title-4' }))
    .then(() => Test.post({ name: 'Project Title 5', slug: 'project-title-5' }))
    .then(() => done())
    .catch(() => done());
});

describe('r2query', () => {
  describe('type', () => {
    it('should run query, all', (done) => {
      Model.all()
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

    it('should run query, allCount', (done) => {
      Model.allCount()
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
      Model.one()
        .then((data) => {
          expect(data.name).to.equal('Project Title 1');
          expect(data.slug).to.equal('project-title-1');
          done();
        })
        .catch(done);
    });

    it('should run query, total', (done) => {
      Model.total()
        .then((data) => {
          expect(data).to.equal(5);
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
