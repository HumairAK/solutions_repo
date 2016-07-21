var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var passport = require('passport');

var csrfProtection = csrf();
router.use(csrfProtection); // router is protected

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
/* Render/GET exam page */
//EXAMPLE EXPECTED DATA GIVEN BELOW:
/*[ {   courseCode: 'CSC240',
 year: 2016,
 term: 'Fall',
 instructors: [ 'Faith Ellen', 'Tom F.' ],
 type: 'Midterm Examination',
 title: 'Thry of Computation' },
 {  courseCode: 'CSC240',
 year: 2014,
 term: 'Fall',
 instructors: [ 'Faith Ellen', 'Tom F.' ],
 type: 'Midterm Examination',
 title: 'Thry of Computation' } ]
 */

router.get('/exams/:id', function(req, res, next) {
    var minExamInfoArray = [];
    dbFile.get_all_exams(req.params.id, function (exams) {
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
                    type:toProperCase(exams[i].type) + " Examination",
                    title:exams[i].title,
                    id:exams[i]._id
                };
                //console.log(minExamInfo);
                minExamInfoArray.push(minExamInfo);
            }
        }
        console.log(minExamInfoArray);
        res.render('exams', {query: minExamInfoArray});
    });
});

/* Render/GET search (exam) page */
router.get('/search', function(req, res, next) {
    console.log(req.query.search);
    var courseName = req.query.search;
    res.redirect('/exams/' + courseName);
});


/* REDIRECT - exam -> questions page*/
router.get('/exam_click',function (req,res) {
    //TODO:get needs to have exam_id attached
    var examId = req.query.exam_id;
    res.redirect('/questions/'+examId);
});

/*EXAMPLE DATA GIVEN BELOW:
 * questions = [{id,count,comments},{id,count,comments}] --> array of "question" objects
 *
 * id = questions number
 * count= number of solutions
 * comments = number of comments*/
router.get('/questions/:exam_id', function (req,res) {
    dbFile.get_exam_info_by_ID(req.params.exam_id, function (questions) {

        res.render('questions', {query: questions});
    });
});

router.get('/signup', function(req, res, next) {
    res.render('signup', {csrfToken: req.csrfToken()});
});

router.post('/signup', function(req, res, next) {
    res.redirect('/');
});

/*router.post('/signup', passport.authenticate('local.signup', {
    sucessRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
}));*/


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

function toProperCase(string) {
    return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}