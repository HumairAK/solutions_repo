var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var passport = require('passport');
var passport_file = require('../config/passport.js');

var csrfProtection = csrf();
router.use(csrfProtection); // router is protected

router.get('/', isAdmin, function(req,res){
    console.log(req.session.messages);
    res.render('admin', {csrfToken: req.csrfToken()});
    req.session.messages = null;
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

    dbFile.add_exam(fields, questions_list, function(examAdded, statusMsg){
        if(examAdded){
            req.session.messages  = {success : statusMsg};
        }else{
            req.session.messages  = {error : statusMsg};
        }
        console.log(statusMsg);
        res.redirect('/admin');
    });

});

/* Adds course from front-end */
router.post('/add/course', function(req,res){
    var course_code = req.body.course_code,
        title = req.body.title;

    dbFile.add_course(course_code, title, function(courseAdded, statusMsg){
        if(courseAdded){
            req.session.messages  = {success : statusMsg};
        }else{
            req.session.messages  = {error : statusMsg};
        }
        console.log(statusMsg);
        res.redirect('/admin');
    });

});

/* Add a new admin, redirect to admin panel */
router.post('/add/admin', function(req,res){
    var admin_data = {
        fname: req.body.fname,
        lname: req.body.lname,
        username: req.body.username,
        password: passport_file.encryptPassword(req.body.password)
    };

    dbFile.addAdmin(admin_data, function(success, error, statusMsg){
        if(success){
            req.session.messages  = {success : statusMsg};
        }else{
            req.session.messages  = {error : statusMsg};
        }
        console.log(statusMsg);
        res.redirect('/admin');
    });

});

/* Remove an exam route, redirect to admin panel */
router.post('/remove/exam', function(req,res){
    var course_code = req.body.course_code,
        year = req.body.year,
        term = req.body.term,
        type = req.body.type,
        campus = req.body.campus;

    var fields = [course_code, year, term, type];

    dbFile.remove_exam(fields, function(examRemoved, statusMsg){
        if(examRemoved){
            req.session.messages  = {success : statusMsg};
        } else {
            req.session.messages  = {error : statusMsg};
        }
        console.log(statusMsg);
        res.redirect('/admin');
    });
});

/* Remove a course route, redirect to admin panel */
router.post('/remove/course', function(req,res){
    var course_code = req.body.course_code;
    dbFile.remove_course(course_code, function(courseRemoved, statusMsg){
            if(courseRemoved){
                req.session.messages  = {success : statusMsg};
            } else {
                req.session.messages  = {error : statusMsg};
            }
            console.log(statusMsg);
            res.redirect('/admin');
        });
});

/* Remove a user route, redirect to admin panel */
router.post('/remove/user', function(req,res){
    var username = req.body.username;
    dbFile.remove_user(username, function(userRemoved, statusMsg){
        if(userRemoved){
            req.session.messages  = {success : statusMsg};
        } else {
            req.session.messages  = {error : statusMsg};
        }
        console.log(statusMsg);
        res.redirect('/admin');
    });


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


/************** Route protection ********************/
function isAdmin(req, res, next) {
    if (req.user && !req.user.email){
        return next();
    }
    res.redirect('/');
}

