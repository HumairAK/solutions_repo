var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();

/* Render/GET homepage. */
router.get('/', function(req, res, next) {
    res.render('index');
});

/* Render/GET about page */
router.get('/about', function(req, res, next) {
    res.render('about');
});

/* Render/GET user_solutions page */
router.get('/user_solutions', function(req, res, next) {
    res.render('user_solutions');
});

/* Render/GET user_profile page */
router.get('/user_profile', function(req, res, next) {
    res.render('user_profile_alt');
});

/* Render/GET questions page */
router.get('/questions', function(req, res, next) {
    res.render('questions');
});

/* Render/GET exam page */
router.get('/exams/:id', function(req, res, next) {

    res.render('exams', {query: req.params.id});
});

/* Render/GET search (exam) page */
router.get('/search', function(req, res, next) {
    console.log(req.query.search);
    var courseName = req.query.search;
    res.redirect('/exams/' + courseName);
});

/*
app.get('/exams',function (req,res) {
    console.log(req.query.search);
    var courseName = req.query.search;
    res.redirect("http://localhost:3000/exams.html/?course_name="+courseName);
});


app.get('/exams.html', function (req,res) {
    /!*LOADS ALL THE STATIC FILES REALTIVE TO THE REDIRECTED URL*!/
    app.use('/exams.html', express.static(__dirname));
    res.sendFile(__dirname+'/exams.html');
});*/


function getExamsForCourseCode(courseCode) {
    dbFile.get_all_exams(courseCode, function (exams) {
        if (exams.length == 0){
            console.log("Nothing was found");
        }
        else {
            console.log(exams);
        }
    });
}

module.exports = router;
