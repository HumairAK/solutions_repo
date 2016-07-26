var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = require('chai').expect;
var dbFile = require('../node_simple.js');

chai.use(chaiHttp);

var request = require('supertest');


// Database info, cross check with database docs to ensure these files either:
// a) exist
// b) do not exist

var existingUser = 'kumar';         // username must be in db
var nonExistingUser = 'a1b2c3d4';   // username must not be in db


/* Test simple routes that do not require database queries */
describe('Test Simple Route:', function () {

    var server;
    before(function () {
        server = require('./test_server');
    });

    after(function () {
        server.close();
    });

    it('Get Homepage', function testSlash(done) {
        chai.request(server)
            .get('/')
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Get About Page', function testSlash(done) {
        chai.request(server)
            .get('/about')
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Test false route', function testSlash(done) {
        chai.request(server)
            .get('//foo/bar')
            .end(function(err, res){
                expect(res).to.have.status(404);
                done();
            });
    });

});

/* public_profile response test */
describe('User_profile_page Route:', function(){
    var server;
    before(function () {
        server = require('./test_server');
    });
    after(function () {
        server.close();
    });

    it('Public Profile (existing user)', function testSlash(done) {
        chai.request(server)
            .get('/public_profile/' + existingUser)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Public Profile (non-existing user)', function testSlash(done) {
        chai.request(server)
            .get('/public_profile/' + nonExistingUser)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });

    it('Public Profile (empty case)', function testSlash(done) {
        chai.request(server)
            .get('/public_profile/' + nonExistingUser)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });

});
