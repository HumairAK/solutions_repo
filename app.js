var fs = require("fs");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var dbFile = require("./node_simple.js");
var sanitizer  = require ("sanitizer");
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');

var MongoStore = require('connect-mongo') (session); //for storing sessions in database

var routes = require('./routes/index');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var app = express();

// Templating engine, we are using handlebars
// This will allow us to create html pages dynamically before serving them.
app.engine('.hbs', hbs({extname: '.hbs', defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/', // Set directory for base layout
    partialsDir: __dirname + '/views/partials'})); // Set directory for partials

app.set('views', path.join(__dirname, 'views')); // Our view path
app.set('view engine', 'hbs');

// Middleware initialization, make sure everything is initialized in proper order
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(cookieParser());
// session is stored in memory, change to storage in mongo later
app.use(session({
    secret: 'pickBetterLater',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({url : dbFile.uri}),
    cookie: {maxAge: 120 * 60 * 1000} // in milliseconds - 120 mins, expires after this amount of time
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport'); // simply need to load it

/*LOADS ALL STATIC FILES FROM THE DIRECTORY __dirname*/
app.use(express.static(__dirname));

// Needed to style the header based on the whether the user is signed in or not
// Gives errors for admin - need to figure out
app.use(function(req, res, next) {
    res.locals.login = req.isAuthenticated(); // global variable
    res.locals.session = req.session;
    res.locals.user = req.user;
    console.log(res.locals.user);
    next();
});

// Allows us to customize express routing
// in a separate file.
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/', routes);

module.exports = app;
