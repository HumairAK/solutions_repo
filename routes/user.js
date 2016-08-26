var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var passport = require('passport');
var nodemailer =  require('nodemailer');
var bcrypt = require('bcrypt-nodejs');

var dbFile  = require("../node_simple.js");
var Promise = require('promise');
var crypto = require('crypto');
var resetLink = "http://localhost:3000/user/password/reset/";
var pass = require('../config/passport');
var csrfProtection = csrf();
router.use(csrfProtection); // router is protected

router.get('/logout', loggedIn, function (req, res, next) {
    req.logout();
    res.redirect('/');
});

/** Render/GET user_profile page. */
router.get('/user_profile', loggedIn, isUser, function(req, res, next) {

    req.session.messages = null;
    var comments = [];
    var inbox = [];
    var error = null;
    var follows = [];
    function getComments() {
        return new Promise(function(resolve, reject) {
            dbFile.retrieve_userComments_history(req.user.user_name, function (success, object) {
                if (!success) {
                    // Need to redirect to an error page instead.
                    if (!comments.length) {
                        var obj = {
                            comment: 'Use a heap!',
                            date: '2016-04-05',
                            exam_id: 'some id',
                            course_code : 'CSC263',
                            term: 'Fall',
                            year : 2016
                        };
                        comments.push(obj);
                        comments.push(obj);

                    }

                    resolve(1);
                } else if (object.length){
                    req.user.comments = object.length;
                    req.user.comment_list = object;

                    resolve(1);
                } else {
                    req.user.comments = object.length;
                    resolve(1);
                }

            });
        });
    }
    function getMail(){
        return new Promise(function(resolve, reject) {

            // We assume that the messages stored in data are sorted by date
            dbFile.checkMailbox(req.user.user_name, function(success, error, data, message){
                if (success) {
                    inbox = data;
                    req.user.messages = inbox.length;
                    // needed to display in layout
                    var i = 0;
                    inbox.forEach(function(element) {
                        element.class = i;
                        i ++;
                    });
                    resolve(1);
                } else if (error) {
                    // For testing purposes, remove later:
                    if (!inbox.length) {
                        var mail_data = {
                            sender: 'The Dude', receiver: req.user.user_name,
                            subject: 'Whoa look at this',
                            message: 'I sent you a link on Skype',
                            date: '2016-04-05'
                        }
                    }
                    inbox.push(mail_data);
                    inbox.push(mail_data);
                    // Need to redirect to an error page instead.
                    resolve(1);
                }
            });
        });
    }

    function getFollows(){
        return new Promise(function(resolve, reject) {
            dbFile.retrieveFollows(req.user.user_name, function(success, data){

                // Add a new attribute to users, examFollows & followerCount
                req.user.examfollows = [];
                req.user.followerCount = data.length;
                if(success && data.length){
                    var count = 1;
                    data.forEach(function(item){
                        dbFile.get_exam_byID(item, function(success, error, data){
                            if(success){
                                req.user.examfollows.push(data);
                                if(count == req.user.followerCount ){
                                    resolve(1);
                                }else{
                                    count++;
                                }
                            }else{
                                resolve(1);
                            }
                        })
                    });
                } else if(success && !data.length){
                    resolve(1);
                }
                else{ //error
                    error = data;
                    resolve(1);
                }

            });
        });
    }

    getComments().then(getMail).then(getFollows).then(function (data) {
        res.render('user_profile_alt', {inbox: inbox, error: error, csrfToken: req.csrfToken(), userProfile: true});
    });

});

/**
 * Serve mail messages for page pageNum with messageCount messages as a JSON object
 */
router.get('/user_profile/inbox/:messageCount/:pageNum', loggedIn, isUser, function(req, res, next) {

    req.session.messages = null;
    var inbox = [];
    var error = null;
    var pageNum = parseInt(req.params.pageNum);
    var messageCount = parseInt(req.params.messageCount);

    function getMail(){
        return new Promise(function(resolve, reject) {

            // We assume that the messages stored in data are sorted by date
            dbFile.checkMailbox(req.user.user_name,
                function(success, error, data, message){

                if (success) {
                    inbox = data;
                    req.user.messages = inbox.length; // Give user message length
                    console.log("Success: " + message);

                    resolve(1);
                } else if (error) {
                    // Need to redirect to an error page instead.
                    console.log("Error: " + message);
                    resolve(1);
                }
            });
        });
    }


    getMail().then(function (data) {

        var mail = [];
        var index = (pageNum - 1) * messageCount;
        var indexMax = index + messageCount;
        var inboxLength = inbox.length;
        var count = 0;

        /* Testing Purposes
        var notification = "index = " + index + "\n" +
            "indexMax = " + indexMax + "\n" +
            "inboxLength = " + inbox.length + "\n";
        console.log(notification); */

        // Find the 10 messages situated at page num in inbox, store in mail
        if(index >= inboxLength){
            res.writeHead(400, {"Content-Type": "application/json"});
            console.log("Specified index is out of bounds");
        }else if (inboxLength <= messageCount) {
            res.writeHead(200, {"Content-Type": "application/json"});
            mail = inbox;
        }else {
            res.writeHead(200, {"Content-Type": "application/json"});
            while((index < inboxLength) && (index < indexMax)){
                mail.push(inbox[index]);
                index++;
                count++;
                console.log("in while: " + count);
            }
        }

        // return mail JSON object ::  JSON.stringify({json});
        var mailJSON = JSON.stringify(mail);
        res.end(mailJSON);
    });
});

router.get('/resetPassword', loggedOut, function(req, res, next) {
    res.render('reset_password', {csrfToken: req.csrfToken(), success: req.session.success, errors: req.session.errors});
    req.session.errors = null;
});

router.post('/sendReset', loggedOut, function(req, res, next){

    dbFile.find_user(req.body.email, function(found){
        if (!found) {
            res.render('reset_password', {errors: "This email does not exist in our database."});
        } else {
            var token = crypto.randomBytes(32).toString('hex');
            var userToken = crypto.randomBytes(8).toString('hex');

            dbFile.addToken(req.body.email, userToken, token, function(error, message){
                if (error) {
                    res.render('reset_password', {errors: "An error has occurred. Please try again."});
                } else {
                    var transporter = nodemailer.createTransport({
                        service: "Gmail",
                        auth: {
                            user: 'solutionsrepo0@gmail.com',
                            pass: 'lamptable'
                        }
                    });

                    var mailOptions = {
                        from: "Solutions.Repo < solutionsrepo0@gmail.com >",
                        to: req.body.email,
                        subject: 'Password reset on Solutions.Repo',
                        text: "Hello!\n" +
                        "You are receiving this email because you requested a password reset for your account at Solutions.Repo.\n" +
                        "In order to reset your password, please visit the following link:\n" +
                        resetLink + userToken + '/' + token + '\n' +
                        'Thanks for using Solutions.Repo! The Solutions.Repo Team.',
                        html: "<p>Hello!</p>" +
                        "<p>You are receiving this email because you requested a password reset for your account at Solutions.Repo.</p>" +
                        "<p>In order to reset your password, please visit the following link:</p>" +
                        "<a href='"+ resetLink + userToken + '/' + token + "'>Click here!</a>" +
                        "<p>Thanks for using Solutions.Repo! The Solutions.Repo Team.</p>"
                    };

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                            res.render('reset_password', {errors: "An error has occurred. Please try again."});
                        } else {
                            console.log("Message Sent");
                            res.render('reset_password', {success: "We've e-mailed you instructions for resetting your password." +
                            " You should be receiving the email shortly. Please check your inbox."});
                        }
                    });
                }
            });
        }
    });

});

router.get('/password/reset/:emailHash/:token', loggedOut, function(req, res, next) {
    var emailHash = req.params.emailHash;
    var token = req.params.token;

    dbFile.getToken(token, function(err, data) {
        if (err || !data.length) {
            res.redirect('/');
        } else {
            if (data[0].userToken === emailHash) {
                dbFile.removeToken(token, function(err, message) {
                    if (err)
                        console.log('could not remove token from db');
                    else {
                        console.log('token removed');
                    }
                });
                res.render('password_edit', {email: data[0].email, csrfToken: req.csrfToken()});

            } else {
                res.redirect('/');
            }
        }
    });
});

router.post('/password/change', loggedOut, function(req, res, next) {
    var email = req.body._email.valueOf();
    var password = req.body.password;
    var hashed = pass.encryptPassword(password);
    dbFile.updatePassword(email, hashed, function(err, message) {
        if (err) {
            res.render('password_edit', {errors: "Could not change password!"});
        } else {
            res.render('password_edit', {success: "Password changed."});
        }
    });
});

/** Render/GET signin page. */
router.get('/signup', loggedOut, function(req, res, next) {
    res.render('signup', {csrfToken: req.csrfToken(), success: req.session.success, errors: req.session.errors});
    req.session.errors = null;
});

/** Render/GET signup page when the user failed. Redirect to signup page */
router.get('/signup/failed', loggedOut, function(req, res, next) {
    var msg = req.flash('error');

    res.render('signup', {csrfToken: req.csrfToken(),
        success: req.session.success,
        errors: req.session.errors,
        flashMsg: msg});
});

/** Render/GET signin page. */
router.get('/signin', loggedOut, function (req, res, next) {
    var msg = req.flash('error');
    res.render('signin', {
        csrfToken: req.csrfToken(),
        success: req.session.success,
        errors: req.session.errors,
        flashMsg: msg
    });
});

/** Retrieves infomation from the signup form, form validates and sends it to passport.js to authenticate. */
router.post('/signup', loggedOut, function(req, res, next) {
    req.assert('fname', 'Please enter a valid first name.').notEmpty().withMessage('First name required.').isAlpha();
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
        passport.authenticate('local_signup', {
            successRedirect: '/user/user_profile',
            failureRedirect: '/user/signup/failed',
            failureFlash: true
        })(req, res);

    }
});

/** Retrieves infomation from the signin form, form validates and sends it to passport.js to authenticate. */
router.post('/signin', loggedOut, function(req, res, next) {
    req.check('usrname', 'Username field is empty.').notEmpty();
    req.check('password', "Password field is empty.").notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/user/signin');
    } else {
        passport.authenticate('local_signin', {
            successRedirect: '/user/user_profile',
            failureRedirect: '/user/signin',
            failureFlash: true
        })(req, res);
    }


});

/** Retrieves infomation from the message sending form and sends it to the database to add. Redirects back if
 * some error occurs. */
router.post('/user_profile/send_message', loggedIn, function(req, res, next) {
    if (req.user.user_name === req.body.receiver_username) {
        req.session.messages  = {error : 'You cannot send a message to yourself.'};
        res.redirect('/user/user_profile/');
    } else if (!req.body.message){
        req.session.messages = {error: 'You cannot send an empty message.'};
        res.redirect('/user/user_profile/');
    } else {
        var date = new Date();
        var current_date = date.toString().slice(0, 24);
        var subject = req.body.subject;
        if (!subject) {
            subject = '(none)';
        }
        var mail_data = {
            sender: req.user.user_name,
            receiver: req.body.receiver_username,
            subject: subject,
            message: req.body.message,
            date: current_date
        };

        dbFile.sendMail(mail_data, function(success, error, message) {
            if ((!success && !error) || (error)) {
                req.session.messages  = {error : message};
                res.redirect('/user/user_profile/');


            }  else {
                req.session.messages = {success: message};
                res.redirect('/user/user_profile/');
                //$('#profile-send-message').show();


            }
        });

    }

});

/**Adds a solution into the database, redirect to exam/question/solution page */
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

    if (!req.body.solution) {
        req.session.messages = {error: 'You cannot submit an empty solution.'};
        res.redirect('/user/add_solution/' + examID + '/' + qID);
    } else {
        var text = req.body.solution,
            votes = 0,
            comments = [],
            author = req.user.user_name;

        var fields = [examID, qID, text, author];
        // Add to database
        dbFile.add_solution(fields, function(addedSolution, statusMsg){
            if(addedSolution){
                req.session.messages  = {success : statusMsg};
            }else{
                req.session.messages  = {error : statusMsg};
            }
            //Redirect to solutions page again
            res.redirect('/solutions/' + examID + '/' + qID);

        });
    }




});

/** Routed here from Solutions page (add solution button)
 *  Renders add_solution page for response.*/
router.get('/add_solution/:examID/:qID', function (req, res, next) {
    var examID = req.params.examID;
    var qID = req.params.qID;

    // Must be a logged in user to access
    if(req.isAuthenticated()){
        res.render('add_solutions', {csrfToken: req.csrfToken(), examID: examID, qID: qID});
    } else {
        var message = "Must be logged in to add a solution!";
        req.session.messages  = {error : message};
        res.redirect('/solutions/' + examID + '/' + qID);
    }

});

/**
 * Retrieves information from the comment adding form, authenticates on whether the user is logged in or not (redirects
 * in this case). Sends information to the database to add.
 */
router.post('/comment/submit/:examID/:qID/:solID', function(req, res, next){
    var examID = req.params.examID;
    var qID = req.params.qID;
    var comment = req.body.comment;
    var username = req.user.user_name;
    var solutionID = req.params.solID;
    // Must be a logged in user to access
    var fields = [comment, username];
    if (!req.body.comment ==='') {
        req.session.messages  = {error : 'Cannot submit an empty comment.'};
        res.redirect('/solutions/' + examID + '/' + qID);
    } else {
        if(req.isAuthenticated()){
            dbFile.add_comment(solutionID, fields, function(commentAdded, statusMsg){
                if(commentAdded){
                    req.session.messages  = {success : statusMsg};
                } else{
                    req.session.messages  = {error : statusMsg};
                }
                res.redirect('/solutions/' + examID + '/' + qID);
            });

        } else { //User not logged in
            var message = "Must be logged in to comment!";
            req.session.messages  = {error : message};
            res.redirect('/solutions/' + examID + '/' + qID);
        }
    }

});

/**
 * Retrieves information from the voting button and sends it to the database. Redirects back if there is an error, or
 * simply shows an error alert if the user is not logged in.
 */
router.post('/solution/vote/:examID/:qID/:solID', function(req, res, next){
    var vote = req.body.vote;
    var examID = req.params.examID;
    var qID = req.params.qID;
    var solutionID = req.params.solID;

    if(req.isAuthenticated()){
        dbFile.vote_solution(solutionID, vote, function(voteCounted, statusMsg){
            if(voteCounted){
                res.redirect('/solutions/' + examID + '/' + qID);
            }else{
                req.session.messages  = {error : statusMsg};
                res.redirect('/solutions/' + examID + '/' + qID);
            }
        });
    } else { //User not logged in
        var message = "Must be logged in to Vote!";
        req.session.messages  = {error : message};
        res.redirect('/solutions/' + examID + '/' + qID);
    }

});

/**
 * Retrieves information about the exam following button, redirects if there is an error, and shows an error alert
 * if the user is not logged in.
 */
router.post('/follow_exam/:examID',function (req, res) {
    var examId = req.params.examID;

    if (req.isAuthenticated()){

        dbFile.followExam(req.user.user_name,examId,function (success, message) {
            if (success){
                req.session.messages  = {success : message};
                res.redirect('/questions/' + examId);
            }else{
                req.session.messages  = {error : message};
                res.redirect('/questions/' + examId);
            }

        });

    }else{
        var message = "Must be logged in to follow an exam!";
        req.session.messages  = {error : message};
        res.redirect('/questions/' + examId);

    }
});

module.exports = router;

/************** Route protection ********************/

/**
 * Redirects to the main page if the user is logged in.
 */
function loggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

/**
 * Redirects to the main page is the user is not logged in.
 */
function loggedOut(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

/**
 * Redirects to the admin panel if the user is an admin.
 */
function isUser(req, res, next) {
    if (req.user && req.user.email) {
        return next();
    }
    res.redirect('/admin');
}

crypto.randomBytes(32, function(ex, buf) {
    var token = buf.toString('hex');
});
