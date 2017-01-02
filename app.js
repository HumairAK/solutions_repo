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
var compression = require('compression');

var MongoStore = require('connect-mongo') (session); //for storing sessions in database

var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var routes = require('./routes/index');
var userRoutes = require('./routes/user')(io);
var adminRoutes = require('./routes/admin');

// Templating engine, we are using handlebars
// This will allow us to create html pages dynamically before serving them.
app.engine('.hbs', hbs({extname: '.hbs', defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/', // Set directory for base layout
    partialsDir: __dirname + '/views/partials'})); // Set directory for partials

app.set('views', path.join(__dirname, 'views')); // Our view path
app.set('view engine', 'hbs');

// Middleware initialization, make sure everything is initialized in proper order
app.use(compression());
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
//app.use(minify({cache: __dirname + '/cache'}));
app.use(express.static(__dirname));

// Needed to style the header based on the whether the user is signed in or not
app.use(function(req, res, next) {
    res.locals.login = req.isAuthenticated(); // global variable
    res.locals.session = req.session;
    res.locals.user = req.user;
    res.locals.messages = req.session.messages;
    next();


});



// Allows us to customize express routing
// in a separate file.
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/', routes);


/* Handle error page */
app.use(function(req, res, next){
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('error', { url: req.url });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');

});

app.use(function(error, req, res, next) {
    res.status(500);
    url = req.url;
    res.render('error', {error: error, url: url});
});

/****************** Server Setup ********************/

dbFile.setupDB(function (success, mssg) {
    if (success) {      // db establiseh
        server.listen(port, function(){         // now accept connections
            console.log('listening on port 3000');
        });
    }
    else {
        console.log(mssg);
    }
});

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}
/*********************** Setup end *******************/

module.exports = app;
