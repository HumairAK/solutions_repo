var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var csrfProtection = csrf();
router.use(csrfProtection); // router is protected
var passport_file = require('../config/passport.js');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');

/** Serve the main index.hbs page for a regular user (logged in or not) */
router.get('/', function(req, res, next) {
    //addFirstAdmin();
    res.render('index', {homePage: true, csrfToken: req.csrfToken(), success: req.session.success, errors: req.session.errors});
    req.session.errors = null;
    req.session.success = null;
    req.session.messages = null;

});

router.get('/auto-complete-courses', function(req, res, next) {

      // console.log('in controller');
      dbFile.find_all_course_codes_from_exams( function (success, data) {
        var res_obj = {};
        res_obj.success = success;
        res_obj.data = data;
        res.send(JSON.stringify(res_obj));
      });
});

/** Serve the about.hbs page */
router.get('/about', function(req, res, next) {
    res.render('about');
});

/** Serve the terms_and_conditions.hbs page */
router.get('/terms_and_conditions', function(req, res, next) {
    res.render('terms_and_conditions');
});

/** Serve the privacy_poicy.hbs page */
router.get('/privacy_policy', function(req, res, next) {
    res.render('privacy_policy');
});


/** Serve the profile page of a user with given username */
router.get('/public_profile/:username', function(req,res,next){
    var username = req.params.username;
    dbFile.retrieveUser(username, function(success, error, user, statusMsg){
        if(success){
            res.render('public_profile.hbs', {user: user});
        }else{
            req.session.messages  = {error : statusMsg};
            res.redirect('/user/' + username);
        }
    });

});

/** Serve the user_solutions.hbs page */
router.get('/user_solutions', function(req, res, next) {
    res.render('user_solutions');
});

/**
 * Serve the exams.hbs page
 *
 * EXAMPLE EXPECTED DATA GIVEN BELOW:
[     {courseCode: 'CSC240',
        year: 2016,
        term: 'Fall',
        instructors: ['Faith Ellen', 'Tom F.'],
        type: 'Midterm Examination',
        title: 'Thry of Computation' },

        {courseCode: 'CSC240',
        year: 2014,
        term: 'Fall',
        instructors: ['Faith Ellen', 'Tom F.'],
        type: 'Midterm Examination',
        title: 'Thry of Computation' } ]  */
router.get('/exams/', function(req,res,next){
    req.checkParams('id','Course code should be between 6').notEmpty().withMessage('Course code required')
        .isLength({min: 6, max: 6});
    var errors = req.validationErrors();
    if (errors){
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/');
    }
});


/** Serve the exams.hbs with a specific exam corresponding to the id */
router.get('/exams/:id', function(req, res, next) {

    req.checkParams('id','Course code should be between 6 characters').notEmpty().withMessage('Course code required')
        .isLength({min: 6, max: 6});

    var errors = req.validationErrors();
    if (errors){
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/');
    }else{

        var minExamInfoArray = [];
        dbFile.get_all_exams(req.params.id, function (exams) {
            if (exams.length == 0){
            }
            else {
                //only pass over the information that is necessary for the exams page
                for (var i = 0; i<exams.length;i++){

                    var getInstructors = exams[i].instructors.join(", ");
                    var minExamInfo = {     courseCode:exams[i].course_code,
                        year:exams[i].year,
                        term:toProperCase(exams[i].term),
                        instructors: getInstructors,
                        type:toProperCase(exams[i].type) + " Examination",
                        title:exams[i].title,
                        id:exams[i]._id,
                        questionCount : exams[i].questions_count
                    };
                    minExamInfoArray.push(minExamInfo);
                }
            }
            res.render('exams',  {query: req.params.id, result: minExamInfoArray});
        });

    }
});

/** Route protection. Redirect to the main page if errors.  */
router.get('/user/',function (req, res) {
    req.checkParams('username','Please enter a username').notEmpty();
    var errors = req.validationErrors();
    if (errors){
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/');
    }
});

/** Render user search page based on query */
router.get('/user/:query', function(req,res,next){
    var query = req.params.query;
    // Need to validate query

    dbFile.search_users(query, function(success, result){
        if(success){
            res.render('user_search', {users : result, query : query, resultCount: result.length});
            req.session.messages = null;
        }else{
            res.redirect('/');
        }
    });
});


/** Render/GET search (exam) page */
router.get('/search/:type', function(req, res, next) {

    var searchType = req.params.type;
    if(searchType == "courses"){
        var courseName = req.query.search;
        res.redirect('/exams/' + courseName);
    }else{
        var userInfo = req.query.search;
        res.redirect('/user/' + userInfo);
    }

});

/** This is a redirect from the exams page, route is generated in exams.hbs
 *
 * EXAMPLE DATA GIVEN BELOW:
 * questions = [{id,count,comments},{id,count,comments}] --> array of "question" objects
 *
 * id = questions number
 * count= number of solutions
 * comments = number of comments*/
router.get('/questions/:exam_id', function (req,res) {
    var examID = req.params.exam_id;
    dbFile.get_exam_byID(examID, function(success, error, exam){

        if(success && exam){
            var qList = exam.questions_list;
            // Add comments/solutions
            dbFile.get_exam_info_by_ID(examID, function (questionsInfo) {
                qList.forEach(function(question){
                    question.count = 0;
                    question.comments = 0;

                    // Find q_id in questionsInfo, update comment/solutions count
                    questionsInfo.forEach(function(q){
                        if (question.q_id == q._id){
                            question.count += q.count;
                            question.comments += q.comments;
                        }
                    });
                });

                var examInfo = {
                    id : exam._id,
                    courseCode : exam.course_code,
                    term : toProperCase(exam.term),
                    type : toProperCase(exam.type),
                    year : exam.year,
                    instructors : exam.instructors.join(),
                    uploadDate : exam.upload_date,
                    uploader : exam.uploaded_by,
                    pageCount : exam.page_count,
                    questionCount : exam.questions_count
                };
                res.render('questions', {query: qList, examInfo: examInfo, csrfToken: req.csrfToken()});
                req.session.messages = null;
            });
        }else{
            req.session.messages  = {error : "Could not find exam."};
            res.redirect('/');
        }


    });
});

/** GET the solutions for a given exam given the question number and the exam_id

* EXPECTED DATA GIVEN BELOW:
* array of solutions:
* solutions = [ {
                   _id: "354ff71ed078933079d6467e"
                   exam_id: "578a44ff71ed097fc3079d6e"
                   q_id: 1  (int)
                   text: "answer"
                   votes: 1 (int)
                   comments: [{}.{}] (just going to be string for now i think)
                   author : "text"
               }
               {
                    _id: ...
                   exam_id:  ..
                   q_id: ...
                   text: ..
                   votes: ..
                   comments: ..
                   author : "text"

               }
               ]
                "comments": []

     A comment:
     {
     "text": "this is asdfasdf",
     "date": {"$date": "2016-07-23T03:55:34.906Z"},
     "by": "some_user name"
     },
    *
    **/
router.get('/solutions/:exam_id/:q_num', function (req, res) {
    var examID = req.params.exam_id;
    var qID = req.params.q_num;
    dbFile.get_all_solutions(examID, qID, function (success, failure, message, solutions) {
        if(success){
            solutions.forEach(function(soln){
                soln.commentCount = soln.comments.length;
            });
            res.render('user_solutions', {query: solutions, examID: examID, qID: qID, csrfToken: req.csrfToken()});
            req.session.messages = null;
        } else{
            res.render('error', {error : message});
        }

    });
});


/** Redirect the user to Facebook for authentication.  When complete,
     Facebook will redirect the user back to the application at
    /auth/facebook/callback */
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email']}));

/** Facebook will redirect the user to this URL after approval.  Finish the
    authentication process by attempting to obtain an access token.  If
    access was granted, the user will be logged in.  Otherwise,
    authentication has failed. */
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
    successRedirect: '/user/user_profile',
        failureRedirect: '/user/signin',
        failureFlash: true}));



/**** Helpers ****/

/**
 * Adds an admin manually. There is no way to add an admin unless another admin adds him/her. Hence, there has to be
 * at least one admin in the database.
 */
function addFirstAdmin() {

    //admin_data = {fname: firstname, lname: lastname, username: username, password: password}
    var password = 'lamptable';
    var hash_pwd = passport_file.encryptPassword(password);
    var admin_data = {
        fname: 'Admin',
        lname: 'Admin',
        username: 'admin',
        password: hash_pwd
    };

    dbFile.addAdmin(admin_data, function (success, error, message) {
    });
}

/**
 * Returns a proper cased string, given string.
 * @param string
 * @returns {void|XML}
 */
function toProperCase(string) {
    return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

module.exports = router;
