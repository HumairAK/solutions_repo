var passport = require('passport');
var dbFile  = require("../node_simple.js");
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var bcrypt = require('bcrypt-nodejs');

var configAuth = require('./auth');

var exports = module.exports = {};

/**
 * Encrypts password and returns hashed password.
 *
 * @param password - the password to be encrypted
 * @type {exports.encryptPassword}
 */
var encryptPassword = exports.encryptPassword = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

/**
 * Compares the hashed and unhashed password, and checks if one corresponds to the other.
 *
 * @param password1
 * @param password2
 * @returns {*}
 */
var comparePassword = function (password1, password2) {
    return bcrypt.compareSync(password1, password2);
};


/**
 * Serializes user instance to the session.
 */
passport.serializeUser(function (user, done) {
    done(null, user);
});

/**
 * Deserializes user instance from the session.
 */
passport.deserializeUser(function(user, done) {
    done(null, user);
});

/**
 * Configures the Local strategy to authenticate signup request.
 */
passport.use('local_signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){

    var hash_pass = encryptPassword(password);

    var fields = [email, req.body.usrname, req.body.fname, req.body.lname, req.body.univ, req.body.dept, hash_pass,
        req.body.phone_num, 0];

    dbFile.add_user(fields, function (success, error, message) {

        if (!success && error) {
            return done(null, false, {message:message}); // Review later, need to pass errors
        }

        else if (!success && !error) {
            return done(null, false, {message: message});
        }

        else  {
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
                followers: [],
                fb_id: 0
            };
            return done(null, user_data);
        }
    });

}));


/**
 * Configures the Local strategy to authenticate the signin request.
 */
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

            return done(null, false, {message: 'Username does not exist.'});
        }

        else  {

            dbFile.retrievePassword(usrname, function(success, hash_pwd, message) {
                if (!success) {
                    return done(message);
                } else {
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


/**
 * Configures the Local strategy to authenticate the Admin signin request.
 */
passport.use('admin_signin', new LocalStrategy({
    usernameField: 'usrname',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, usrname, password, done) {
    dbFile.adminExists(usrname, function (error, exists, data, message) {
        if (error) {
            return done(message);
        } else if (!error && !exists){
            return done(null, false, {message: 'Username does not exist.'});
        } else {
            if (comparePassword(password, data.password)) {
                return done(null, data);
            } else {
                return done(null, false, {message: 'Password incorrect.'});
            }
        }
    });
}));


/**
 * Configures the Facebook strategy to authenticate signin as well as signup request.
 *
 * var user_data = {
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
 */
passport.use(new FacebookStrategy({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name']

    },
    function(req, accessToken, refreshToken, profile, done) {
        // Find by user facebook id, if not, add user
        dbFile.retrieveUserById(profile.id, function(success, error, user, message) {
            if (!success && error) {
                return done(message);
            }

            else if (!success && !error) { // id is undefined
                var fields = [profile.emails[0].value, profile.name.givenName + ' ' + profile.name.familyName,
                    profile.name.givenName, profile.name.familyName, null, null, null,
                    null, profile.id];

                dbFile.add_user(fields, function (success, error, message) {
                    console.log('inside add_user');
                    console.log("SUCCESS: " + success);
                    console.log("ERROR: " + error);
                    console.log(message);
                    if (!success && error) {
                        return done(null, false, {message:message}); // Review later, need to pass errors
                    } else if (!success && !error) {
                        return done(null, false, {message: message});
                    }

                    else  {
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
                            followers: [],
                            fb_id: profile.id
                        };
                        return done(null, user_data);
                    }
                });
            }

            else  {
                return done(null, user);
            }
        });
    }
));