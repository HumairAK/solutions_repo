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
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


// fields - [email, user_name, f_name, l_name, uni, department, password, phone_num]

passport.use('local_signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){
    console.log("nothing here");

    var hash_pass = encryptPassword(password);

    var fields = [email, req.body.usrname, req.body.fname, req.body.lname, req.body.univ, req.body.dept, hash_pass,
        req.body.phone_num];

    dbFile.add_user(fields, function (success, error, message) {

        if (!success && error) {
            console.log("!success && error");
            return done(null, false, {message:message}); // Review later, need to pass errors
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

}));
