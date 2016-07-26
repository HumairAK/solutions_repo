var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = require('chai').expect;
var assert = chai.assert;
var url  = require("url");
var path = require("path");
var fs = require('fs');


// Database info, cross check with database docs to ensure these files either:
// We test get requests here mostly as those are the core functions of the
// website that do not alter the database.

var examPull = fs.readFileSync("test/data/exam.json");
var exams = (JSON.parse(examPull));

var usersPull = fs.readFileSync("test/data/user.json");
var users = (JSON.parse(usersPull));

chai.use(chaiHttp);

/* Test simple routes that do not require database queries */
describe('Test Simple Route:', function () {

    var server;
    before(function () {
        server = require('./test_server');
    });

    after(function () {
        server.close();
    });

    /* First we test to see if a false route directs us to a 404 error
    *  this informs us that we are not sending a success code (200) at routes
    *  that do not exist. Otherwise the rest of the tests are meaningless for
    *  routing since everything would be responded with a 404 code. */
    it('Test false route', function testSlash(done) {
        chai.request(server)
            .get('//foo/bar')
            .end(function(err, res){
                expect(res).to.have.status(404);
                done();
            });
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

});

/* Public profile page response test */
describe('User_profile_page Route:', function(){
    var server;
    before(function () {
        server = require('./test_server');
    });
    after(function () {
        server.close();
    });

    it('Public Profile (existing user)', function testSlash(done) {
        var username = users.existingUser.user_name;
        chai.request(server)
            .get('/public_profile/' + username)
            .end(function(err, res){
                expect(res).to.have.status(200);

                var path = res.res.req.path;
                assert.equal(path, '/public_profile/' + username); // Check url path
                done();
            });
    });

    it('Public Profile (non-existing user)', function testSlash(done) {
        var username = users.nonExistingUser.user_name;
        chai.request(server)
            .get('/public_profile/' + username)
            .end(function(err, res){
                expect(res).to.have.status(200);

                var path = res.res.req.path;
                assert.equal(path, '/user/' + username); // redirect to search
                done();
            });
    });

    // Should return 404 Since no username is specified
    it('Public Profile (empty case)', function testSlash(done) {
        chai.request(server)
            .get('/public_profile/')
            .end(function(err, res){
                expect(res).to.have.status(404);
                done();
            });
    });

});

/* Exam search response test */
describe('Course search Route:', function(){
    var server;
    before(function () {
        server = require('./test_server');
    });
    after(function () {
        server.close();
    });

    /* Ensure that path contains the code params */
    it('Search existing exam', function testSlash(done) {
        var code =  exams.existing.course_code;
        chai.request(server)
            .get('/exams/' + code)
            .end(function(err, res){
                expect(res).to.have.status(200);
                var path = res.res.req.path;
                assert.equal(path, '/exams/' + code); // Check url path
                done();
            });
    });

    it('Search non-existing exam', function testSlash(done) {
        var code =  exams.nonExisting.course_code;
        chai.request(server)
            .get('/exams/' + code)
            .end(function(err, res){
                expect(res).to.have.status(200);
                var path = res.res.req.path;
                assert.equal(path, '/exams/' + code);
                done();
            });
    });

    // Test check for empty search. Should be re-directed to homepage
    it('Search empty case', function testSlash(done) {
        chai.request(server)
            .get('/exams/')
            .end(function(err, res){
                expect(res).to.have.status(200);
                var path = res.res.req.path;
                assert.equal(path, '/'); // re-direct to home page
                done();
            });
    });



});

/* Search response test
*  Test to see if a user search directs to user route and likewise a course
*  search directs to the exam route (since it lists exams)*/
describe('Search Route:', function(){
    var server;
    before(function () {
        server = require('./test_server');
    });
    after(function () {
        server.close();
    });

    /* Ensure that path contains the code params */
    it('Path for exams', function testSlash(done) {
        var code =  exams.existing.course_code;
        chai.request(server)
            .get('/search/exams/' + code)
            .end(function(err, res){
                expect(res).to.have.status(404); // Since there is no search query
                var path = res.res.req.path;
                assert.equal(path, '/search/exams/' + code); // Check url path
                done();
            });
    });

    /* Ensure that path contains the code params */
    it('Path for exams', function testSlash(done) {
        var username = users.existingUser.user_name;
        chai.request(server)
            .get('/search/user/' + username)
            .end(function(err, res){
                expect(res).to.have.status(404); // Since there is no search query
                var path = res.res.req.path;
                assert.equal(path, '/search/user/' + username); // Check url path
                done();
            });
    });


});

/* Questions Listing route for a particular exam */
describe('Questions Search Route:', function(){
    var server;
    before(function () {
        server = require('./test_server');
    });
    after(function () {
        server.close();
    });

    it('Search questions for an existing exam', function testSlash(done) {
        var examID =  exams.existing._id.$oid;
        chai.request(server)
            .get('/questions/' + examID)
            .end(function(err, res){
                expect(res).to.have.status(200);
                var path = res.res.req.path;
                assert.equal(path, '/questions/' + examID); // Check url path
                done();
            });
    });

    it('Search questions for a non existing exam', function testSlash(done) {
        var examID =  exams.nonExisting._id.$oid;
        chai.request(server)
            .get('/questions/' + examID)
            .end(function(err, res){
                expect(res).to.have.status(200);
                var path = res.res.req.path;

                // Redirected to homepage (with err msg)
                assert.equal(path, '/');
                done();
            });
    });

    /* This differs from the earlier test because it will throw an error in db
     * query and not return an exam at all, whereas before we pass in a
     * legitimate hashed format id. Here we pass just random letters.
     */
    it('Search questions for gibberish id', function testSlash(done) {
        chai.request(server)
            .get('/questions/batman')
            .end(function(err, res){
                expect(res).to.have.status(200);
                var path = res.res.req.path;

                // Redirected to homepage (with err msg)
                assert.equal(path, '/');
                done();
            });
    });


});

/* Solutions listing for a particular exam question
*  Pre-condition: Assume existing exam in db has at least question 1*/
describe('Solutions Route:', function(){
    var server;
    before(function () {
        server = require('./test_server');
    });
    after(function () {
        server.close();
    });


    it('Search solutions for an existing exam', function testSlash(done) {
        var qID = 1; //Check the first question
        var examID =  exams.existing._id.$oid;
        chai.request(server)
            .get('/solutions/' + examID + '/' + qID)
            .end(function(err, res){
                expect(res).to.have.status(200);
                // Check for expected url path
                var path = res.res.req.path;
                assert.equal(path, '/solutions/' + examID + '/' + qID);
                done();
            });
    });

    it.only('Search solutions for a non existing exam', function testSlash(done) {
        var qID = 1; //Check the first question
        var examID =  exams.nonExisting._id.$oid;
        chai.request(server)
            .get('/solutions/' + examID + '/' + qID)
            .end(function(err, res){
                expect(res).to.have.status(200);
                // Check for expected url path
                var path = res.res.req.path;
                assert.equal(path, '/solutions/' + examID + '/' + qID);
                done();
            });
    });


});

