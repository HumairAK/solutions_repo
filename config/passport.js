/**
 * Created by nanalelfe on 2016-07-20.
 */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(err, user);
});

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, username, password, done){
    // Check if username already in use
    // If not, create new user with given info
    // Encrypt the passport using bcrypt
    return done(null, false, {message: "username already in use"});
}));