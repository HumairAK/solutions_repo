var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention
var passport = require('passport');
var passport_file = require('../config/passport.js');
var express_validator = require ("express-validator");
app = express();
var csrfProtection = csrf();
router.use(csrfProtection); // router is protected

app.use(express_validator({
    customValidators:{
        validRadio: function (value) {
            if (value==undefined){
                return false;
            }else{
                return true;
            }
        },isCommaSeparated: function(value){
            if (value.match(/[^,\s][^\,]*[^,\s]*/g)){
                return true;
            }else{
                return false;
            }
        },isValidDate:function (value) {
            if (value.match(/^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/)){
                return true;
            }else{
                return false;
            }
        }
    }
}));

router.get('/', isAdmin, function(req,res){
    console.log(req.session.messages);
    res.render('admin', {csrfToken: req.csrfToken()});
    req.session.messages = null;
});

/* Adds exam from front-end */
router.post('/add/exam', function(req,res){
    req.sanitize('course_code').escape();
    req.sanitize('course_code').trim();
    req.check('course_code','Course code cannot be empty').notEmpty();

    req.sanitize('year').escape();
    req.sanitize('year').trim();
    req.check('year','Invalid year').isInt();

    req.checkBody('type','Please select a type of exam').validRadio();
    req.checkBody('term','Please select a term for the exam').validRadio();

    req.sanitize('instructors').trim();
    req.check('instructors','Invalid instructors format').isCommaSeparated();

    req.sanitize('page_count').trim();
    req.check('page_count','Invalid page count').isInt();

    req.sanitize('questions_count').trim();
    req.check('questions_count','Invalid questions count').isInt();

    req.sanitize('questions_list').trim();
    req.check('questions_list','Invalid questions format').isCommaSeparated();

    req.sanitize('upload_date').trim();
    req.check('upload_date','Invalid date format').isValidDate();

    req.sanitize('uploaded_by').trim();
    req.sanitize('uploaded_by').escape();
    req.check('uploaded_by','Invalid user name format').notEmpty();

    var errors  = req.validationErrors();

    if (errors){
        console.log(errors);
        req.session.errors = errors;
        req.session.success = false;
        res.redirect('/admin');
    }else{

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

        // dbFile.add_exam(fields, questions_list, function(examAdded, statusMsg){
        //     if(examAdded){
        //         req.session.messages  = {success : statusMsg};
        //     }else{
        //         req.session.messages  = {error : statusMsg};
        //     }
        //     console.log(statusMsg);
        //     res.redirect('/admin');
        // });
    }
});

/* Adds course from front-end */
router.post('/add/course', function(req,res){

    req.sanitize('course_code').escape();
    req.sanitize('course_code').trim();
    req.check('course_code','Course code cannot be empty').notEmpty();

    req.sanitize('title').escape();
    req.sanitize('title').trim();
    req.check('title','Invalid title').isAlpha();

    var errors = req.validationErrors();

    if (errors){
        console.log(errors);
    }else{
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
    }
});

/* Add a new admin, redirect to admin panel */
router.post('/add/admin', function(req,res){
    req.assert('fname', 'Please enter a valid first name.').notEmpty().withMessage('First name required.').isAlpha();
    req.check('lname', 'Please enter a valid first name.').notEmpty().withMessage('Last name required.').isAlpha();
    req.check('usrname', 'Enter a valid username').notEmpty().withMessage('Username required.');
    req.check('password', "Password should be between 6 and 12 characters.")
        .notEmpty().withMessage('Password required').isLength({min: 6, max: 12});

    var errors = req.validationErrors();
    if (errors) {
        console.log(errors);
    }else{
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

    }

});

/* Remove an exam route, redirect to admin panel */
router.post('/remove/exam', function(req,res){
    req.sanitize('course_code').escape();
    req.sanitize('course_code').trim();
    req.check('course_code','Course code cannot be empty').notEmpty();

    req.sanitize('year').escape();
    req.sanitize('year').trim();
    req.check('year','Invalid year').isInt();

    req.checkBody('type','Please select a type of exam').validRadio();
    req.checkBody('term','Please select a term for the exam').validRadio();
    req.checkBody('campus','Please select a campus for the exam').validRadio();


    var errors = req.validationErrors();
    if (errors){
        console.log(errors);

    }else{

        var course_code = req.body.course_code,
            year = req.body.year,
            term = req.body.term,
            type = req.body.type,
            campus = req.body.campus;

        course_code = course_code.toUpperCase();

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
    }
});

/* Remove a course route, redirect to admin panel */
router.post('/remove/course', function(req,res){

    req.sanitize('course_code').escape();
    req.sanitize('course_code').trim();
    req.check('course_code','Course code cannot be empty').notEmpty();

    var errors = req.validationErrors();

    if (errors){

    }else{
        var course_code = req.body.course_code;
        course_code = course_code.toUpperCase();
        dbFile.remove_course(course_code, function(courseRemoved, statusMsg){
            if(courseRemoved){
                req.session.messages  = {success : statusMsg};
            } else {
                req.session.messages  = {error : statusMsg};
            }
            console.log(statusMsg);
            res.redirect('/admin');
        });
    }

});

/* Remove a user route, redirect to admin panel */
router.post('/remove/user', function(req,res){

    req.sanitize('username').trim();
    req.sanitize('username').escape();
    req.check('username','Invalid user name format').notEmpty();

    var errors = validationErrors();
    if (errors){

    }else{
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
    }

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

