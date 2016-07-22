/**
 * Created by nanalelfe on 2016-07-20.
 */
var passport = require('passport');
var dbFile  = require("../node_simple.js");
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

var encryptPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
}

var comparePassword = function (password) {
    return bcrypt.compareSync(password1, password2);
}

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(err, user);
});


// fields - [email, user_name, f_name, l_name, uni, department, password, phone_num]

passport.use('local_signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){
    req.check('email', 'Invalid email address').notEmpty().isEmail();
    req.check('password', "Password is invalid").notEmpty().isLength({min: 6}).equals(req.body.confirmPassword);
    // password has to be at least 4 characters long

    var errors = req.validationErrors();
    console.log("IN PASSPORT");
    if (errors) {
       var messages = [];
        errors.forEach(function (error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }
    var hash_pass = encryptPassword(password);

    var fields = [email, req.body.usrname, req.body.fname, req.body.lname, req.body.univ, req.body.dept, hash_pass,
        req.body.phone_num];

    dbFile.add_user(fields, function (success, error,  message) {

        if (!success && error) {
            console.log("!success && error");
            return done(message);
        }

        else if (!success && !error) {
            console.log("!success && !error");
            console.log(message);
            return done(null, false, {message: message});
        }

        else  {
            console.log("ELSE");
            return done(null, fields);
        }
    });

    // Check if username already in use
    // If not, create new user with given info
    // Encrypt the passport using bcrypt
}));

/*router.post('/signup', function(req, res, next) {
 req.check('email', 'Invalid email address').isEmail();
 req.check('password', "Password is invalid").isLength({min: 4}).equals(req.body.confirmPassword);
 // password has to be at least 4 characters long

 var errors = req.validationErrors();
 if (errors) {
 req.session.errors = errors;
 req.session.success = false;
 console.log("got here");
 res.redirect('/signup');
 } else {
 req.session.success = true;
 console.log("GOT SUCCESS");
 passport.authenticate('local_signup', {
 successRedirect: '/user_profile',
 failureRedirect: '/signup',
 failureFlash: true
 });
 }
 //res.redirect('/signup');

 });*/

/*router.post('/signup', passport.authenticate('local.signup', {
 sucessRedirect: '/profile',
 failureRedirect: '/signup',
 failureFlash: true
 }));*/
