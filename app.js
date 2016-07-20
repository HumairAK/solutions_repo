var fs = require("fs");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');
var dbFile = require("./node_simple.js");
var sanitizer  = require ("sanitizer");
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');

var routes = require('./routes/index');
var app = express();

// Templating engine, we are using handlebars
// This will allow us to create html pages dynamically before serving them.
app.engine('.hbs', hbs({extname: '.hbs', defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/', // Set directory for base layout
    partialsDir: __dirname + '/views/partials'})); // Set directory for partials

app.set('views', path.join(__dirname, 'views')); // Our view path
app.set('view engine', '.hbs');

// Middleware initialization, make sure everything is initialized in proper order
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret: 'pickbetterlater', resave: false, saveUninitialized: false}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport'); // simply need to load it

/*LOADS ALL STATIC FILES FROM THE DIRECTORY __dirname*/
app.use(express.static(__dirname));

// Allows us to customize express routing
// in a separate file.
app.use('/', routes);

module.exports = app;

app.listen(3000, function() {
    console.log('listening on http://localhost:3000/');
});

//to fetch exams given a course code and populate the exams page
app.get('/exams',function (req,res) {
    console.log(req.query.search);
    var courseName = req.query.search;
    courseName = sanitizer.escape(courseName);
    courseName = courseName.toUpperCase();
    console.log(courseName);
    var result = getExamsForCourseCode(courseName);
    console.log(result);
    res.write(JSON.stringify(result));
});

function getExamsForCourseCode(courseCode) {
    var minExamInfoArray = [];
    dbFile.get_all_exams(courseCode, function (exams) {
        if (exams.length == 0){
            console.log("Nothing was found");
        }
        else {
            //console.log(exams);
            //only pass over the information that is necessary for the exams page
            for (var i = 0; i<exams.length;i++){
                var minExamInfo = {     courseCode:exams[i].course_code,
                    year:exams[i].year,
                    term:toProperCase(exams[i].term),
                    instructors:exams[i].instructors,
                    type:toProperCase(exams[i].type) + " Examination"
                };
                minExamInfoArray.push(minExamInfo);
                console.log(minExamInfo);
            }
        }
    });

    return minExamInfoArray;
}


/*Helper function to make sure the proper capital case is presented*/

function toProperCase(string) {
    return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
