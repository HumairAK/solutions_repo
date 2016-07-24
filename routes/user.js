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

    // GET INBOX
    var inbox = [];
    dbFile.checkMailbox(req.user.user_name, function(success, error, data, message){
        if (success) {
            inbox = data;
        } else if (error) {
            // Need to redirect to an error page instead.
            console.log("Could not retrieve mail.");
        }
    });

    // For testing purposes, remove later:
    if (!inbox.length) {
        var mail_data = {
            sender: 'The Dude', receiver: req.user.user_name,
            message: 'Whoa look at this',
            date: '2016-04-05'
        }
    }
        inbox.push(mail_data);
        inbox.push(mail_data);

    res.render('user_profile_alt', {comments : comments, inbox: inbox});
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

router.get('/user_profile/send_message/:id', loggedIn, function(req, res, next) {
    var date = new Date();
    var current_date = date.toString().slice(0, 24);
    var mail_data = {
        sender: req.user.user_name,
        receiver: req.body.receiver_username,
        message: req.body.message,
        date: current_date
    }

    dbFile.sendMail(mail_data, function(success, error, message) {
        if ((!success && !error) || (error)) {
            res.redirect('/user/user_profile', {error: message});
            $('#profile-send-message').show();
        }  else {
            res.redirect('/user/user_profile', {success: message});
            $('#profile-send-message').show();
        }
    });

    //res.redirect('/user/user_profile');
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
    if (req.user && req.user.email) {
        return next();
    }
    res.redirect('/admin');
}

