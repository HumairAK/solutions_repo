var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var passport = require('passport');

var dbFile  = require("../node_simple.js");

var csrfProtection = csrf();
router.use(csrfProtection); // router is protected


router.get('/logout', loggedIn, function (req, res, next) {
    req.logout();
    res.redirect('/');
});

/* Render/GET user_profile page */
router.get('/user_profile', loggedIn, isUser, function(req, res, next) {
    // GET COMMENTS
    var comments = [];
    dbFile.retrieve_userComments_history(req.user.user_name, function (success, object) {
        if (!success) {
            // Need to redirect to an error page instead.
            console.log("Could not retrieve comments.");
        } else if (object){
            comments = object;
            for (var comment in comments) {
                dbFile.get_exam_byID(comment.exam_id, function(success, error, data) {
                    if (success) {
                        comment.exam_info = {
                            course_code : data.course_code,
                            term: data.term,
                            year : data.year
                        };
                    }
                });
            }

        }
    });
    // For testing purposes, remove later:
    if (!comments.length) {
        var obj = {
            comment: 'Use a heap!',
            date: '2016-04-05',
            exam_id: 'some id',
            exam_info : {
                course_code : 'CSC263',
                term: 'Fall',
                year : 2016
            }
        };
        comments.push(obj);
        comments.push(obj);
    }

    res.render('user_profile_alt', {comments : comments});
});

/* Adds a solution into the database, redirect to exam/question/solution page */
router.post('/submit_solution/:examID/:qID', function(req,res){
    // Get required fields from body
    // Populate this data
    /* var Data = {
     exam_id: fields[0],
     q_id: fields[1],
     text: fields[2],
     votes: 0,
     comments: [],
     author: fields[3]
     };*/

    var examID = req.params.examID;
    var qID = req.params.qID;

    var text = req.body.solution,
        votes = 0,
        comments = [],
        author = req.user.user_name;

    var fields = [examID, qID, text, votes, comments, author];
    console.log(fields);
    // Add to database
    dbFile.add_solution(fields, function(addedSolution, statusMsg){
        if(addedSolution){
            console.log("Success!");
        }else{
            console.log("Failed to add solution!");
        }
        console.log(statusMsg);

        //Redirect to solutions page again
        res.redirect('/solutions/' + examID + '/' + qID);
        
    });

});

/* Routed here from Solutions page (add solution button)
*  Renders add_solution page for response.*/
router.get('/add_solution/:examID/:qID', function (req, res, next) {
    var examID = req.params.examID;
    var qID = req.params.qID;

    // Must be a logged in user to access
    if(req.isAuthenticated()){
        res.render('add_solutions', {csrfToken: req.csrfToken(), examID: examID, qID: qID});
    } else {
        res.redirect('/'); // Change this to go back to the solutions page
    }

});


router.get('/signup', loggedOut, function(req, res, next) {
    res.render('signup', {csrfToken: req.csrfToken(), success: req.session.success, errors: req.session.errors});
    req.session.errors = null;
});

router.get('/signup/failed', loggedOut, function(req, res, next) {
    var msg = req.flash('error');

    res.render('signup', {csrfToken: req.csrfToken(),
        success: req.session.success,
        errors: req.session.errors,
        flashMsg: msg});
});

router.get('/signin', loggedOut, function (req, res, next) {
    var msg = req.flash('error');
    res.render('signin', {
        csrfToken: req.csrfToken(),
        success: req.session.success,
        errors: req.session.errors,
        flashMsg: msg
    });
});

router.post('/signup', loggedOut, function(req, res, next) {
    req.check('fname', 'Please enter a valid first name.').notEmpty().withMessage('First name required.').isAlpha();
    req.check('lname', 'Please enter a valid first name.').notEmpty().withMessage('Last name required.').isAlpha();
    req.check('email', 'Enter a valid Email address').notEmpty().withMessage('Email required').isEmail();
    req.check('usrname', 'Enter a valid username').notEmpty().withMessage('Username required.');
    req.check('password', "Password should be between 6 and 12 characters.")
        .notEmpty().withMessage('Password required').isLength({min: 6, max: 12});
    req.check('password', "The confirmation password doesn't match.").equals(req.body.confirmPassword);

    // phone number optional
    if (req.body.phone_num){
        req.check('phone_num', 'Please enter a valid phone number').isMobilePhone('en-CA');
    }

    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/user/signup');
    } else {
        console.log("GOT SUCCESS");
        passport.authenticate('local_signup', {
            successRedirect: '/user/user_profile',
            failureRedirect: '/user/signup/failed',
            failureFlash: true
        })(req, res);

    }
});

router.post('/signin', loggedOut, function(req, res, next) {
    req.check('usrname', 'Username field is empty.').notEmpty();
    req.check('password', "Password field is empty.").notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/signin');
    } else {
        passport.authenticate('local_signin', {
            successRedirect: '/user/user_profile',
            failureRedirect: '/user/signin',
            failureFlash: true
        })(req, res);
    }


});

module.exports = router;

/************** Route protection ********************/

function loggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function loggedOut(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function isUser(req, res, next) {
    if (req.user.email) {
        return next();
    }
    res.redirect('/admin');
}
