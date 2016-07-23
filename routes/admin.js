var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var passport = require('passport');

var csrfProtection = csrf();
router.use(csrfProtection); // router is protected

router.get('/', function(req,res){
    res.render('admin', {csrfToken: req.csrfToken()});
});

/* Adds exam from front-end */
router.post('/add/exam', function(req,res){
    var course_code = req.body.course_code,
        year = req.body.year,
        type = req.body.type,
        term = req.body.term,
        instructors = parseStringArray(req.body.instructors),
        page_count = req.body.page_count,
        questions_count = req.body.questions_count,
        questions_list = parseStringArray(req.body.questions_list),
        upload_date = req.body.upload_date,
        uploaded_by = req.body.uploaded_by;

    var fields = [
        course_code,           // String
        year,                  // Int
        term,                  // String
        type,                  // String
        instructors,           // Array of strings
        page_count,            // Int
        questions_count,       // Int
        upload_date,           // String
        uploaded_by];          // String

    dbFile.add_exam(fields, questions_list, function(examAdded, statusMessage){
        if(examAdded){
            console.log("Success!");
        }else{
            console.log("Failed!");
        }
        console.log(statusMessage);
    });
    res.redirect('/admin');
});

/* Adds course from front-end */
router.post('/add/course', function(req,res){
    var course_code = req.body.course_code,
        title = req.body.title;

    dbFile.add_course(course_code, title, function(courseAdded, statusMessage){
        if(courseAdded){
            console.log("Success!");
        }else{
            console.log("Failure!");
        }
        console.log("Status message: " + statusMessage)
    });
    res.redirect('/admin');
});

router.post('/remove/exam', function(req,res){
    var course_code = req.body.course_code,
        year = req.body.year,
        term = req.body.term,
        type = req.body.type,
        campus = req.body.campus;

    var fields = [course_code, year, term, type];
    console.log(fields);
    dbFile.remove_exam(fields,
        function(examRemoved, statusMessage){
        if(examRemoved){
            console.log("Success.");
        } else {
            console.log("Failed.");
        }
        console.log(statusMessage);
    });

    res.redirect('/admin');
});



/* Takes an input string delimited by commas, will split by comma and trim white
 * spaces. Consider callback.
 */
function parseStringArray(input){
    var list = input.split(',');
    var parsedList = [];
    list.forEach(function(word){
        if (word != ""){
            parsedList.push(word.trim());
        }
    });
    return parsedList;
}

module.exports = router;

