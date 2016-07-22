var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();

/* Render/GET homepage. */
router.get('/', function(req, res, next) {
    res.render('index');
    req.session.errors = null;
    req.session.success = null;
});

/* Render/GET about page */
router.get('/about', function(req, res, next) {
    res.render('about');
});

/* Render/GET user_solutions page */
router.get('/user_solutions', function(req, res, next) {
    res.render('user_solutions');
});

/* Render/GET questions page */
router.get('/questions', function(req, res, next) {
    res.render('questions');
});

router.get('/admin', function(req,res){
    res.render('admin', {csrfToken: req.csrfToken()});
});

/* Adds exam from front-end */
router.post('/admin/update/exam', function(req,res){
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
        type,                  // String; Needs to be added to database code
        term,                  // String
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
router.post('/admin/update/course', function(req,res){
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

//EXAMPLE EXPECTED DATA GIVEN BELOW:
/*[     {courseCode: 'CSC240',
        year: 2016,
        term: 'Fall',
        instructors: ['Faith Ellen', 'Tom F.'],
        type: 'Midterm Examination',
        title: 'Thry of Computation' },

        {courseCode: 'CSC240',
        year: 2014,
        term: 'Fall',
        instructors: ['Faith Ellen', 'Tom F.'],
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

                var getInstructors = exams[i].instructors.join(", ");
                var minExamInfo = {     courseCode:exams[i].course_code,
                    year:exams[i].year,
                    term:toProperCase(exams[i].term),
                    instructors: getInstructors,
                    type:toProperCase(exams[i].type) + " Examination",
                    title:exams[i].title,
                    id:exams[i]._id
                };
                //console.log(minExamInfo);
                minExamInfoArray.push(minExamInfo);
            }
        }
        console.log(minExamInfoArray);
        res.render('exams',  {query: req.params.id, result: minExamInfoArray});
    });
});

/* Render/GET search (exam) page */
router.get('/search', function(req, res, next) {
    console.log(req.query.search);
    var courseName = req.query.search;
    res.redirect('/exams/' + courseName);
});

/*EXAMPLE DATA GIVEN BELOW:
 * questions = [{id,count,comments},{id,count,comments}] --> array of "question" objects
 *
 * id = questions number
 * count= number of solutions
 * comments = number of comments*/
router.get('/questions/:exam_id', function (req,res) {
    console.log(req.params.exam_id);
    dbFile.get_exam_info_by_ID(req.params.exam_id, function (questions) {
        res.render('questions', {query: questions});
        console.log(questions);
    });
});



/**** Helpers ****/

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

function toProperCase(string) {
    return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

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