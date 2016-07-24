var passport = require('passport');
var dbFile  = require("../node_simple.js");
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

var exports = module.exports = {};

var encryptPassword = exports.encryptPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

var comparePassword = function (password1, password2) {
    return bcrypt.compareSync(password1, password2);
};


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
            var user_data = {
                email: fields[0],
                user_name: fields[1],
                f_name: fields[2],
                l_name: fields[3],
                university: fields[4],
                department: fields[5],
                answered: 0,
                messages: 0,
                comments: 0,
                phone_num: fields[7],
                followers: []
            };
            return done(null, user_data);
        }
    });

}));

passport.use('local_signin', new LocalStrategy({
    usernameField: 'usrname',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, usrname, password, done) {
    dbFile.retrieveUser(usrname, function (success, error, user, message) {
        if (!success && error) {
            return done(message);
        }

        else if (!success && !error) { // Username is undefined
            //return done(null, false, {message: message});
            // ADMIN
            dbFile.adminExists(usrname, function (error, exists, data, message) {
                if (error) {
                    return done(message);
                } else if (!error && !exists){
                    return done(null, false, {message: 'Username does not exist.'});
                } else {
                    console.log("data: " + data);
                    if (comparePassword(password, data.password)) {
                        return done(null, data);
                    } else {
                        return done(null, false, {message: 'Password incorrect.'});
                    }
                }
            });
        }

        else  {

            dbFile.retrievePassword(usrname, function(success, hash_pwd, message) {
                if (!success) {
                    return done(message);
                } else {
                    console.log(hash_pwd);
                    console.log("compare password: " + comparePassword(password, hash_pwd));
                    if (comparePassword(password, hash_pwd)) {

                        return done(null, user);
                    } else {
                        return done(null, false, {message: 'Password incorrect.'});
                    }
                }
            });
        }
    });
}));
