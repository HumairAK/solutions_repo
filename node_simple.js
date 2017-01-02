/**
 * A simple node driver to interact with mongo database
 */

/**********************
 **** COLLECTIONS: ****
 * ********************
 *
 * * * ADMINS - Admins login info
 *         {
 *              fname: first name,
 *              lname: last name,
 *              username: admin username,
 *              password: hashed password
 *         }
 *
 * * * COURSES - Course info
 *         {
 *              course_code: course code,
 *              title: course title
 *         }
 *
 *
 * * * EXAMS - Exams info
 *         {
 *              course_code: course code,
 *              year: course year,
 *              term: course term,
 *              type: midterm or final,
 *              instructors: array of instructor names,
 *              page_count: the midterm/exam's number of pages,
 *              questions_count: the midterm/exam's number of questions,
 *              questions_list: array containing question objects, {q_id: question #, question: question},
 *              upload_date: date,
 *              uploaded_by: username
 *         }
 *
 *
 * * * LOGINS - Users login info
 *         {
 *              email: user email,
 *              user_name: user username,
 *              password: users hashed password
 *         }
 *
 *
 * * * MAIL - messaging system base
 *         {
 *              sender: the message sender's username,
 *              receiver: the receiver's username,
 *              message: message,
 *              date: date message was sent
 *         }
 *
 *
 * * * SOLUTIONS - exam solutions
 *         {
 *              exam_id: the id of the exam this solution applies to,
 *              q_id: question id,
 *              text: users solution,
 *              votes: votes,
 *              comments: list of comment objects, {text: comment, date: comment date, by: username}
 *         }
 *
 * * * USERS
 *         {
 *              email: user email,
 *              username: username,
 *              f_name: first name,
 *              l_name: last name,
 *              university: user's university,
 *              department: user's department,
 *              answered: number of solutions user posted,
 *              messages: user's inbox count,
 *              comments: user comment count,
 *              phone_num: user phone number,
 *              followers: the list of exams that the user follows
 *         }
 *
 *
 * * * VERIFICATIONS - link facebook profile to the user
 *         {
 *              username: user username,
 *              facebookID: facebook profile id,
 *              facebookToken: facebook token,
 *         }
 *
 *
 */


var exports = module.exports = {};

const debug_mode = false;

Object.assign = require('object-assign');
var mongodb = require('mongodb');
var mongoFactory = require('mongo-factory');
var ObjectId = require('mongodb').ObjectID;
var assert = require('assert');
var _ = require('underscore');

var db;

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
if (process.env.NODE_ENV == 'staging') {
    var uri = exports.uri =  'mongodb://root:solutions_repo@ds023624.mlab.com:23624/solutions_staging';
} else if (process.env.NODE_ENV == 'production') {
    var uri = exports.uri =  'mongodb://general:assignment4@ds057862.mlab.com:57862/solutions_repo';
} else if (process.env.NODE_ENV == 'development') {
    // Keep this for testing on local machine, do not remove. - Humair
    //var uri = 'mongodb://localhost:27017/db';
}

// Keep this for testing on local machine, do not remove. - Humair
//var uri = 'mongodb://localhost:27017/db';


/*******************************FUNCTIONS************************************************/

/************************* SETUP **********************************/

exports.setupDB = function (callback) {
    mongoFactory.getConnection(uri).then(function (database) {
        db = database;
        callback(true, "Database connected"); // signal start of app

    }).catch(function (err) {
        callback(false, "Error: connecting to the database");
    });
};

/************************* USERS **********************************/

/**
 * This function will remove the user given user_name from the users table
 * and the logins table. So far.
 * IF there is a sessions table, we need to remove it from there as well.
 * We can leave it in the mail table (involves another user).
 * We can leave it in the solutions table (solution may still be valid).
 *
 * @param {string}    username: the unique user_name for the user
 * @param  {function} callback: 2 args: (boolean, <string>),
 *                              where <boolean> : err ? false : true
 *                              where <string> : error ? error_mssg : success_mssg
 */
exports.remove_user = function (username, callback) {

    var users = db.collection('users');
    var logins = db.collection('logins');

    // look for the specific user
    users.removeOne( { user_name: username }, function (err, docs) {
        if (err) throw callback(false, "Error: problem while removing the user from users");
        else if (docs.deletedCount == 1) {
            // now remove it from logins ....
            logins.removeOne( { user_name: username }, function (err, result) {
                if (err) throw callback(false, "Error: problem whlie remvoving course from courses");
                else if (result.deletedCount == 1) {
                    callback(true, "User was removed successfully from both tables");

                }
            });
        }
        else if (docs.deletedCount == 0) {
            callback(false, "No such user was found");

            //console.log("No such exam was found");
        }
    });
};

/**
 * This function will search through the users table to look for 'token'.
 * It will search the user_name, f_name, l_name fields of the table.
 * Do not worry about case sensitivity. Malicious string is a possibility though.
 * Returns a [] of user object(s)
 *
 * @params {string}   token: search term (hopefully user info)
 * @params {function} callback: with 2 args: (boolean, <string>),
 *                              where <boolean> : err ? false : true
 *                              where <string> can be error message
 *                              OR on success <[Objs]> RESULT
 * */
exports.search_users = function ( token, callback ) {

    var users = db.collection('users');
    users.createIndex(          // make the following fields searchable
        {
            "user_name":"text",
            "f_name":"text",
            "l_name":"text"
        });
    users.find(
        { $text: { $search: token } },
        { score: { $meta: "textScore" } }
    ).sort( { score: { $meta:"textScore" } } ).toArray(function (err, docs) {
        if (err) callback(false, "Error: some error while searching");
        else {
            // console.log(docs);
            callback(true, docs);
        }
    });
};


/**
 * This function will return a list of followers of user i.e. a list of
 * exam_ids that the user has chosen to follow
 *
 * @param {string}   user_name: the unique user name for the user
 * @param {function} callback: with 2 args: (boolean, <string>),
 *                             where boolean : err ? false : true
 *                             where <string> can be error message
 *                             OR on success <[<strings>]> RESULT
 **/
exports.retrieveFollows = function (user_name, callback) {

    var users = db.collection('users');
    // insert data into table
    users.find( {user_name: user_name} ).toArray(function (err, docs) {
        // if (err) throw err;
        if (err) callback(false, "Error: followers could not be retrieved for some reason");
        else {
            callback(true, docs[0].followers);
        }
    });
};

/**
 * This function will retrieve ALL the comments a user has ever made.
 * It returns an array containing objects of the form: {exam_id, comment, date, ...
 * course_code, year, term}.
 * Note: a comment should only exist IF a solution exists.
 *
 * @param {string}   username: the unique user name for the user
 * @param {function} callback: with 2 args: (boolean, <string>),
 *                             where boolean : err ? false : true
 *                             where <string> can be error message
 *                             OR on success <[Objs]> RESULT
 **/
exports.retrieve_userComments_history = function (username, callback) {

    var solutions = db.collection('solutions');
    var exams = db.collection('exams');
    var mylist = [];
    solutions.aggregate([

        { $match : {
            "comments.by": username
        }},
        { $unwind : "$comments" },
        { $match : {
            "comments.by": username
        }},
        {$project: {
            comment: "$comments.text",
            date: "$comments.date",
            exam_id: "$exam_id",
            _id: 0
        }}
    ]).toArray(function (err, res) {
        if(!res.length){ // Ensure a callback is executed if res is empty
            callback(true, res);
        }else{
            var finised = _.after(res.length, doCall);      // execute "doCall" only after res.length # of attempts
            res.forEach(function (comment) {
                exams.find( { _id: ObjectId(comment.exam_id) } ).toArray(function (err, docs) {     // get the exam info
                    comment.course_code = docs[0].course_code;
                    comment.year = docs[0].year;
                    comment.term = docs[0].term;
                    mylist.push(comment);       // save it to array
                    finised();
                });
            });
        }
    });


    function doCall() {
        callback(true, mylist);
    }
};

/** We CAN use this. IF we do, we should remove the comments_count field from a user
 * IF we dont wanna go that route, need to update these fields whenever they are altered
 * by the user manually.
 *
 * @param {string}   username: the unique user name for the user
 * @param {function} callback: with 2 args: (boolean, <string>),
 *                             where boolean : err ? false : true
 *                             where <string> can be error message
 *                             OR on success <int> RESULT
 **/
exports.retrieve_userComments_count = function (username, callback) {

    exports.retrieve_userComments_history(username, function (bool, results) {
        if (!bool) callback(false, "Error: error occurred");
        else {
            var length = results.length;
            callback(true, length);
        }
    });

};

/**
 * This function will retrieve ALL the solutions a user has ever provided.
 * It returns an array containing objects of the solution form.
 *
 * @param {string}   username: the unique user name for the user
 * @param {function} callback: with 2 args: (boolean, <string>),
 *                             where boolean : err ? false : true
 *                             where <string> can be error message
 *                             OR on success <[Objs]> RESULT
 **/
exports.retrieve_userSolutions_history = function (username, callback) {

    var solutions = db.collection('solutions');
    solutions.find( { author: username } ).toArray(function (err, result) {
        if (err) callback(false, "Error: problem while looking for stuff");
        else {
            callback(true, result);
        }

    });
};

/** We CAN use this. IF we do, we should remove the solutions_count field from a user
 * IF we dont wanna go that route, need to update these fields whenever they are altered
 * by the user manually.
 *
 * @param {string}   username: the unique user name for the user
 * @param {function} callback: with 2 args: (boolean, <string>),
 *                             where boolean is false if err OR true if no error
 *                             where <string> can be error message
 *                             OR on success <int> RESULT
 **/
exports.retrieve_userSolutions_count = function (username, callback) {

    exports.retrieve_userSolutions_history(username, function (bool, results) {
        if (!bool) callback(false, "Error: error occured");
        else {
            var length = results.length;
            callback(true, length);
        }
    });

};

/**
 * This function creates and adds a user to users table.
 * IFF both the email and the user_name are not in the database already.
 * If either of them exist, the user is NOT added.
 *
 * @param {string[]} fields: [email, user_name, f_name, l_name, uni, department, password, phone_num, facebook_id]
 * @param {function} callbackUser: of the form (<boolean1>, <boolean2>, <string>)
 *                                  where, <boolean1> -
 *                                   <boolean2> -
 *                                   <string> - error ? error_mssg : success_mssg
 **/
exports.add_user = function (fields, callbackUser) {
    // create a user object
    var user_data = {
        email: fields[0],
        user_name: fields[1],
        f_name: fields[2],
        l_name: fields[3],
        university: fields[4],
        department: fields[5],
        answered: 0,
        messages: 0,
        comments: 0,
        phone_num: fields[7],
        followers: [],
        fb_id: fields[8]
    };

    var login_data = {
        email: fields[0],
        user_name: fields[1],
        password: fields[6]
    };

    // find out if this user already exists by checking their email
    exports.find_user( fields[0], function (result) {
        if  (result == false) {

            // find out if the user_name is taken
            exports.find_user_name( fields[1], function (docs) {
                if (docs == false) {        // if not ...
                    // continue
                    console.log("user name is valid");

                    // when both are valid add the user to the users and logins table

                    var users = db.collection('users');
                    var logins = db.collection('logins');

                    // Add users, and login through callbacks
                    users.insertOne( user_data, function (err) {
                        if (err) {
                            callbackUser(false, true, "Error : User has not been added.");

                        }

                        else {// user insert successfull
                            logins.insertOne(login_data, function (err) {
                                if (err) {
                                    callbackUser(false, true, "Error : User has not been added.");

                                }

                                else {// login insert successfull
                                    callbackUser(true, false, "User has been added.");

                                }
                            });
                        }
                    });
                }
                else {
                    callbackUser(false, false, "Username is taken.");
                }
            });
        }
        else {
            callbackUser(false, false, "User with this email already exists.");
        }
    });
};

/**
 * This function returns whether the user with the given username has already been signed in before.
 * This is important because we need to link a unique facebook account with a username. If the user has signed in
 * before, return the verification object, consisting of facebook profile id.
 *
 * @param {string} username
 * @param {function} callbackUser: of the form (<boolean>, verifications object (See COLLECTION)) -
 *  callbackUser(error, object)
 *
 **/

exports.userVerifiedBefore = function(username, callback) {

    var verif = db.collection('verifications');

    verif.find( { username : username } ).toArray(function(err, result) {
        if (err) {
            callback(true, null);
        } else {
            callback(false, result);
        }

    });
};

/**
 * THis function adds the user's facebook account verification to the database and links it to the user's local in site
 * account.
 *
 * @param {object}  - verifications object
 * @param {function} callbackUser: of the form (<boolean>) - callback(error)
 *
 **/
exports.addVerification = function(verification, callBack) {

    var verif = db.collection('verifications');
    verif.insertOne(verification, function (err) {
        if (err) {
            callBack(true);
        } else {
            callBack(false);
        }
    })
};

/**
 * This (helper) function returns true IFF user_name already exists in the database
 *
 * @param {string}   user_name: the user name
 * @param {function} callback: of the arg (bool)
 *                              where <bool> : found ? true : false
 * */
exports.find_user_name = function (user_name, callback) {

    var logins = db.collection('logins');
    var admins = db.collection('admins');
    logins.find( { user_name: user_name } ).toArray(function (err, result) {
        if (err) throw err;
        else if (result.length == 0) {  // nothing was found in users
            // check if user_name is taken by admin
            admins.find({username : user_name}).toArray(function(err, data) {
                if (err) throw err;
                else if (data.length == 0) {
                    callback(false);
                }
                else {
                    callback(true);
                }
            });
        }
        else {
            callback(true);
        }
    });
};

/**
 * This function retrieves the user object given their user_name
 *
 * @param {string}   username: the user name
 * @param {function} callback: with args (<bool1>,<bool2>,<string1>,<string2>)
 *                            where, <bool1> : success ? true : false
 *                            where, <bool2> : error ? true : false
 *                            where, <string1> : success ? {Obj} : null
 *                            where, <string2> : success ? success_mssg : err_mssg
 * */
exports.retrieveUser = function (username, callback) {

    var users = db.collection('users');

    users.find({user_name: username}).toArray(function (err, result) {
        if (err) {
            // callback(success, error, user, message)
            callback(false, true,  null, "Error : Could not retrieve user.");
        }

        else if (result.length) {
            callback(true, false, result[0], "User retrieved");
        }

        else {
            callback(false, false, null, "Username is undefined.");
        }
    });
};

/**
 * This function retrieves the user object given their Facebook username.
 *
 * @param {string}   id: the user's facebook id
 * @param {function} callback: with args (<bool1>,<bool2>,<string1>,<string2>)
 *                            where, <bool1> : success ? true : false
 *                            where, <bool2> : error ? true : false
 *                            where, <string1> : success ? {Obj} : null
 *                            where, <string2> : success ? success_mssg : err_mssg
 * */
exports.retrieveUserById = function(id, callback){
    var users = db.collection('users');

    users.find({fb_id: id}).toArray(function(err, result) {
        if (err) {
            // callback(success, error, user, message)
            callback(false, true,  null, "Error : Could not retrieve user.");
        } else if (result.length) {
            callback(true, false, result[0], "User retrieved");
        } else {
            callback(false, false, null, "ID is undefined.");
        }
    });
}

/**
 * Returns the hashed password given the username. Assume username exists.
 * Used for both admins and users.
 *
 * @param {string}   username: the user name
 * @param {function} callback: with args (<bool>,<string>,<string>)
 *                           where, <bool> : success ? true : false
 *                           where, <string> : success ? "pwd" : null
 *                           where, <string> : success ? success_mssg : err_mssg
 * */
exports.retrievePassword = function (username, callback) {

    var collection = db.collection('logins');

    collection.find({user_name: username}).toArray(function(err, result) {
        if (err) {
            // callback(success, password, message)
            callback(false, null, "Error : Could not retrieve password.");
        }

        else {
            var pwd = result[0].password; //result is an array
            callback(true, pwd, "Password retrieved");
        }

    });
};

/**
 * This (helper) function returns true IFF email already exists in the database
 *
 * @param {string}   email: unique email of the user
 * @param {function} callback: <bool> : found ? true : false
 * */
exports.find_user = function (email, callback) {

    var logins = db.collection('logins');
    logins.find( { email: email } ).toArray(function (err, result) {
        if (err) throw err;
        else if (result.length == 0) {  // nothing was found  so this user is new
            callback(false);
        }
        else {
            callback(true);
        }
    });
};


/**
 * This function retrieves the user object from the users collection given the object id.
 *
 * @param {string} id
 * @param {function} callbackUser: of the form (<boolean>, user object (See COLLECTION)) -
 * callbackUser(error, object)
 *
 **/
exports.findUserByID = function (id, callback) {
    var logins = db.collection('logins');
    logins.find( { _id : id }, function (err, result) {
        callback(err, result);

    });
};

exports.updatePassword = function (email, password, callback) {
    var logins = db.collection('logins');
    logins.updateOne({email: email}, {$set: {password: password}}, function(err, docs) {
        if (err) callback(true, "Error: Failed to update password.");

        else {
            callback(false, "Success");
        }
    });
}

/*exports.findUserByEmail = function (email, callback) {
    var users = db.collection('users');
    users.find({email: email}).toArray(function(err, result) {
        if (err) {
            // callback(success, error, user, message)
            callback(false, true,  null, "Error : Could not retrieve user.");
        } else if (result.length) {
            callback(true, false, result[0], "User retrieved");
        } else {
            callback(false, false, null, "ID is undefined.");
        }
    });

}*/

/************************* COURSES / EXAMS **********************************/

/**
 * Remvove a course from ONLY the courses table IN CASE of accidental
 * addition.
 *
 * @param {string}   course_code: the course code
 * @param {function} callback: 2 args: (boolean, <string>),
 *                             where <boolean> : err ? false : true
 *                             where <string> : error ? error_mssg : success_mssg
 */
exports.remove_course = function (course_code, callback) {

    var courses = db.collection('courses');

    courses.createIndex(          // make the following fields searchable
        {
            "course_code":"text"
        });
    // look for the specific course
    courses.removeOne( { $text: { $search: course_code } }, function (err, docs) {
        // if (err) throw err;
        if (err) callback(false, "Error: Failed to remove the course.");

        else if (docs.deletedCount == 1) {
            callback(true, "Course was removed successfully from JUST courses");

        }
        else if (docs.deletedCount == 0) {
            callback(false, "No such course was found");

            //console.log("No such exam was found");
        }
    });
};

/**
 * This function will add the given exam_id to the given user's followers list.
 * It simply appends the exam_id to the list and nothing else.
 * If the exam_id already exists in the user's followers list,
 * false will be returned, andnothing will be added.
 *
 * Ideally the user shouldnt even be able to attempt to follow an exam twice.
 *
 * @param {string}   user_name: the unique user name for the user
 * @param {string}   exam_id: the _id of the exam TO follow
 * @param {function} callback: with 2 args: (boolean, <string>),
 *                             where <boolean> : err ? false : true
 *                             where <string> : error ? err_messg : success_messg
 **/
exports.followExam = function (user_name, exam_id, callback) {

    exports.retrieveFollows(user_name, function (bool, result) {
        if (!bool) callback(false, result);
        else {      // no err occured so far...

            var found = false;
            for (var i = 0; i < result.length; i++) {       // search through the list of exams followed
                if (result[i] == exam_id) {
                    found = true;
                }
            }

            if (found) {    // means exam is already followed by user
                callback(false, "user is already following this exam");
            }

            else {      // add it to the user follower list

                // find the user table
                var users = db.collection('users');
                // insert data into table
                users.updateOne( {user_name: user_name}, {$push: {followers: exam_id}} , function (err) {
                    // if (err) throw err;
                    if (err) callback(false, "Error: some error occurred while following the exam");
                    else {
                        // console.log("user is following this exam");
                        callback(true, "Success: user is following this exam");
                    }
                });
            }
        }
    });
};

/**
 * This function returns an array where each element contains info for a particular question
 * such as the question number (_id), number of solutions (count), and number of comments
 * (comments). [ {_id,count,comments}, {} , ...]
 *
 * @param {string}   exam_id: the exam_id of which the info is required
 * @param {function} callback: with arg (<[Objs]>) - RESULT
 * */
exports.get_exam_info_by_ID = function (exam_id, callback) {
    var solutions = db.collection('solutions');

    solutions.aggregate([
        // {$unwind: "$comments"},
        { $match: { exam_id: exam_id }},
        {
            $project:
            {
                num_comments: { $size: "$comments" },
                _id: "$exam_id",
                q_id: "$q_id"
            }
        },
        {
            $group : {
                _id : "$q_id",
                count: { $sum: 1 },
                comments: {$sum: "$num_comments"}
                // num_comments: { $size: "$comments" }

            }
        }
    ]).toArray(function (err, result) {
        callback(result);
    });
};

/**
 * CALLBACK ADDED RECENTLY, BEWARE WHEN CALLING IT
 * This function will add a comment to the solutions table
 *
 * @param {string}   sol_id: id of the solution to which to add the comment
 * @param {string[]} fields: <[text, by_username]>
 * @param {function} serverCallback: with args (<bool>,<string>)
 *                              where <bool> : err ? false : true
 *                              where <string> : err ? err_mssg : success_mssg
 * */
exports.add_comment = function (sol_id, fields, serverCallback) {
    var date = new Date();
    var Data = {
        text: fields[0],
        date: date.toString().slice(0, 24),
        by: fields[1]
    };

    // find the solutions table
    var solutions = db.collection('solutions');
    var users = db.collection('users');
    // insert data into table
    solutions.updateOne( {_id: ObjectId(sol_id)}, {$push: {comments: Data}} , function (err, result) {
        if (err) {
            serverCallback(false, "Error: Solution found, but could not update comments.");
            throw err;
        }
        else {
            users.updateOne( { user_name: fields[1] }, { $inc: { comments: 1} }, function (err) {
                if (err) serverCallback(false, "Error: Some error occured while updating user info");
                else {
                    serverCallback(true, "Success: comment added successfully");
                }

            });
        }

    });
};

/**
 * This function will get all the solution for a given exam_id and q_num
 * sorted by highest to lowest votes.
 *
 * @param {string}   exam_id: exam_id for which the info is required.
 * @param {int}      q_num: the question number for which solutions are required.
 * @param {function} callback: <[Objs]> - RESULT
 * */
exports.get_all_solutions = function (exam_id, q_num, callback) {

    // check if the exam id already exists...
    exports.get_exam_byID(exam_id, function (success, failure, exam) {
        if (!success && failure) {  // some error occurred while searching
            callback(false, true, "Error: Some error occurred while searching for exam", null);
        } else if (!success && !failure) {
            callback(false, true, "Error: this exam doesn't exist", null);
        } else if (success && !failure) {       // this exam exists proceed with task

            var solutions = db.collection('solutions');

            solutions.find(
                {
                    exam_id: exam_id,
                    q_id: q_num
                }
            ).sort({ votes: -1}).toArray( function (err, docs) {
                if (err) callback(false, true, "Error: Some error occurred while looking for solutions");
                else {      // either nothing was found or something was found
                    callback(true, false, "Solutions", docs);
                }

            });
        }
    });
};

/**
 * CALLBACK ADDED RECENTLY, BEWARE WHEN CALLING IT
 * This function will add a solution to the solutions table in the database.
 *
 * @param {string[]} fields: [exam_id , question_id, solution text, user_name]
 * @param {function} callback: with args (bool, string)
 *                       where, <bool>: err ? false : true
 *                       where, <string>: err ? err_mssg : success_mssg
 * */
exports.add_solution = function (fields, callback) {
    var Data = {
        exam_id: fields[0],
        q_id: fields[1],
        text: fields[2],
        votes: 0,
        comments: [],
        author: fields[3]
    };

    // find the solutions table
    var solutions = db.collection('solutions');
    var users = db.collection('users');
    // insert data into table
    solutions.insert(Data, function(err) {
        if (err) callback(false , "Error: Failed to add the solution");
        else {
            users.updateOne( { user_name: fields[3] }, { $inc: { answered: 1} }, function (err) {
                if (err) callback(false, "Error: Failed to update the user solution count");
                else {
                    // console.log("solution added");
                    callback(true, "Success: added solution successfully!");
                }
            });
        }
    });
};

/**
 * This function will update the vote count of a solution.
 *
 * @param {string}   sol_id: the sol_id of the solution to vote
 * @param {string}   upORdown: <string> : up_vote ? "up" : "down"
 * @param {function} callback: with args (bool, string)
 *                       where, <bool>: err ? false : true
 *                       where, <string>: err ? err_mssg : success_mssg
 * */
exports.vote_solution = function (sol_id, upORdown , callback) {

    var vote = (upORdown == "up") ? 1 : -1;
    var solutions = db.collection('solutions');
    solutions.updateOne(
        {_id: ObjectId(sol_id) },
        { $inc: { votes: vote} }, function (err) {
            // if (err) throw err;
            if (err) callback(false, "Error: couldnt update the vote count");
            else {
                callback(true, "Success: updated vote count");
            }
        });
};

/**
 * This function will retrieve all exams in the database given the course code ...
 * ... ordered by the year of the exam.
 *
 * @param {string}   course_code: the course code to get all the exams for
 * @param {function} callback: with args (<string>)
 *                      where on success is <[Objs]>
 * */
exports.get_all_exams = function (course_code, callback) {
    // get the exams table
    var exam_collection = db.collection('exams');

    exam_collection.createIndex(          // make the following fields searchable
        {
            "course_code":"text"
        });
    // search exams table with given course code
    exam_collection.find(
        { $text: { $search: course_code } }
    ).sort({ year: -1}).toArray( function (err, docs) {   // order by year
        if (err) throw err;
        else {    // get the title
            exports.find_course(course_code, function (result, data) {

                if (result == true) {
                    // append the title from data to each exam object from docs
                    docs.forEach(function (doc) {
                        doc.title = data[0].title;
                    });

                    /*callback(docs);     // send back the data*/
                }
                else if (result == false) {    // no such course was found
                }
                callback(docs);     // send back the data

            });
        }
    });
};

/**
 * This function will add an exam to the database UNLESS the exams already exists.
 * If the exams table is empty, this will create one and then add the data.
 * Note: this assumes that (course_code + year + term + type) together form a unique exam.
 * i.e there can't be two exams occurring for the same course in the same year in the same term with the same type.
 *
 * @param {string[]} fields: an array of format ["course_code", year, "term",
 *                       ["instructor1",...,"instructor n"], page_count, question_count
 *                       "upload_date", "user_name"]
 * @param {string[]} questions_array: a array by format ["q_1", "q_2", ... , "q_question_count"]
 * @param {function} serverCallback: with args (<bool>, <string>)
 *                      where <bool> : err ? false : true
 *                      where <string> : err ? err_mssg : success_mssg
 *
 * */
exports.add_exam = function (fields, questions_array, serverCallback) {
    // construct an exam object
    var Data =
    {
        course_code: fields[0],
        year: fields[1],
        term: fields[2],
        type: fields[3],
        instructors: fields[4],
        page_count: fields[5],
        questions_count: fields[6],
        questions_list: [],
        upload_date: fields[7],
        uploaded_by: fields[8]
    };

    // create the questions objects
    for (var i = 1; i <= Data.questions_count; i++) {
        Data.questions_list.push(
            {
                q_id: i,
                question: questions_array[i - 1]
            }
        );
    }

    // first see if the exam already exists
    // pass in course_code, year, term and type...
    exports.find_exam([fields[0], fields[1], fields[2], fields[3]], serverCallback, function(result, serverCallback) {

        if (result == true) {     // meaning that the exam was found
            serverCallback(false, "This exam already exists in the database.");
        }

        else {    // add Data to the database
            // find the exams table
            var exam_collection = db.collection('exams');
            // insert data into table
            exam_collection.insert(Data, function(err) {
                if (err) {
                    serverCallback(false, "Error: Could not add exam into database.");
                    throw err;
                }
                else {
                    serverCallback(true, "Exam Successfully added.");
                }
            });
        }
    });
};

/**
 * This function will return TRUE if the provided exam info already exists in the database
 * OR FALSE if it does not exist in the database.
 *
 * @param {string[]} fields: an array of format ["course_code", year, "term", "type"]
 * @param {function} serverCallback: ...
 * @param {function} callback: with args (<bool>, ...)
 *                      where <bool> : found ? true : false
 * */
exports.find_exam = function (fields, serverCallback, callback) {
    var course_code = fields[0];
    var year = fields[1];
    var term = fields[2];
    var type = fields[3];

    // check the data to see if this exam exists...


    // fetch the exams table
    var exams = db.collection('exams');

    // look for the exam
    exams.find(
        {
            course_code: course_code,
            year: year,
            term: term,
            type: type
        }
    ).toArray(function (err, docs) {
        if (err) throw err;

        if (docs.length == 0) { // if this exam doesnt exist.... add it
            callback(false, serverCallback);
        }
        else {  // exam was found
            callback(true, serverCallback);
        }
    });
};

/**
 * This function will add a course to the database UNLESS the course already exists.
 * If the course table is empty, this will create one and then add the data.
 * Note: this assumes that (course_codes) are unique.
 *
 * @param {string}   course_code: the course code
 * @param {string}   title: the course description
 * @param {function} serverCallback: with args (<bool>, <string>)
 *                          where <bool> : err ? false : true
 *                          where <string> : err ? err_mssg : success_mssg
 * */
exports.add_course = function (course_code, title, serverCallback) {

    var courseData = {
        course_code: course_code,
        title: title
    };

    exports.find_course(course_code, function (result) {

        if (result == true){
            serverCallback(false, "Course already exists");
            console.log("course already exists");
        }
        else if (result == false) {    // add it
            // find the exams table
            var courses = db.collection('courses');
            // insert data into table
            courses.insert(courseData, function(err) {
                if (err) throw err;
                else {
                    serverCallback(true, "Course added successfully.");
                }
            });
        }
    });
};

/**
 * This function will return TRUE if the provided course info already exists in the database
 * OR FALSE if it does not exist in the database.
 *
 * @param {string}   course_code: the course code
 * @param {function} callback: with args (<bool>, <string>)
 *                          where <bool> : found ? true : false
 *                          where <string> : found ? null : [{Obj}]
 * */
exports.find_course = function (course_code, callback) {
    // check the data to see if this exam exists...

    var courses = db.collection('courses');
    courses.createIndex(          // make the following fields searchable
        {
            "course_code":"text"
        });
    // look for the courses
    courses.find(
        { $text: { $search: course_code } }
    ).toArray(function (err, docs) {
        if (err) callback(false, "Error: error while looking for course");
        // if this course doesnt exist.... add it (via add_course call)
        if (docs.length == 0) {
            callback(false);
        }
        else {  // course was found
            callback(true, docs);
        }
    });
};

/**
 * This function will remove the exam from the database given the combination
 * of (course_code+ year +  term + type)
 *
 * @param {string[]} fields: an array of format ["course_code", year, "term", "type"]
 * @param {function} serverCallback: with args (<bool>, <string>)
 *                              where <bool> : success ? true : false
 *                              where <string> : success ? success_mssg ? err_mssg
 *
 * */
exports.remove_exam = function (fields, serverCallback) {

    var course_code = fields[0];
    var year = fields[1];
    var term = fields[2];
    var type = fields[3];

    // establish connection

    // fetch the exams table
    var exams = db.collection('exams');

    // look for the specific exam
    exams.removeOne(
        {
            course_code: course_code,
            year: year,
            term: term,
            type: type
        }, function (err, docs) {
            if (err) callback(false, "Error: problem while removing the exam");
            else {
                if (docs.deletedCount == 1) {
                    serverCallback(true, "Exam was removed successfully");

                    //console.log("exam was removed");
                }
                else if (docs.deletedCount == 0) {
                    serverCallback(false, "No such exam was found");

                    //console.log("No such exam was found");
                }
            }
        }
    );
};

/**
 * This function will get the specific exam object given its ID.
 *
 * @param {string}   id: the exma_id
 * @param {function} callback: with args (<bool>,<bool>,<string>)
 *                       where, <bool> : success ? true : false
 *                       where, <bool> : error ? true : false
 *                       where, <string> : success ? {Obj}
 * */
exports.get_exam_byID = function (id, callback) {

    // find the solutions table
    var exams = db.collection('exams');
    // query
    exams.find( {_id: ObjectId(id)} ).toArray(function (err, docs) {
        if  (err) {
            callback(false, true,  null);
        } else if (!docs) {
            callback(false, false, null);
        }
        else {
            callback(true, false,  docs[0]);
        }
    });
};

/******************************  ADMINS *********************************/

/**
 * This function adds the admin given the admin data admin_data (see ADMINS in COLLECTIONS) into the admins collection.
 * Does not add and returns a message if the username in admin_data already exists.
 *
 * @param {object} admin object (see ADMINS in COLLECTIONS)
 * @param {function} callbackUser: of the form (<boolean1>, <boolean2>, <string>) -
 * callback(error, success, message)
 *
 **/

exports.addAdmin = function (admin_data, callback) {
    var logins = db.collection('logins');
    // Check if the admin username already exists. Also check for user username. If it does, then we don't add the admin_data and return a message.
    exports.adminExists( admin_data.username , function (error, exists, data, message) {
        if (!exists && !error) {
            logins.find({username: username}).toArray(function (err, result) {
                if (err){
                    callback(true, false, "Error: could not retreive logins collection in addAdmin().");
                } else if (result.length) {
                    callback(false, false, 'User with given username already exists.');
                } else {

                    var admins = db.collection('admins');

                    admins.insertOne(admin_data, function (err) {
                        if (err) {
                            callback(false, true, message);
                        }
                        else {
                            callback(true, false, "Admin added.");
                        }

                    });

                }
            })
        } else {
            callback(error, exists, message);
        }
    });
};


/**
 * This function checks if the admin username already exists in the ADMINS collection. If it does, then callback
 * returns success, and the admin object is passed through the callback.
 *
 * @param {string} username - admin username
 * @param {function} callbackUser: of the form (<boolean1>, <boolean2>,<object>, <string>) -
 * callback(error, success, object,  message)
 *
 **/
exports.adminExists = function (username, callback) {
    var admins = db.collection('admins');
    admins.find( { username: username } ).toArray(function (err, result) {
        if (err) {
            callback(true, false, null, "Error: could not retrieve admin in adminExists().");
        } else if (result.length) {
            callback(false, true, result[0], "Admin with given username exists");
        } else {
            callback(false, false, null, "Admin with given username does not exist");
        }
    });
};

/******************************  MAIL *********************************/

/**
 * This function adds the message object (see MAIL in COLLECTIONS) to the MAIL collection.
 *
 * @param {object} mail object
 * @param {function} callbackUser: of the form (<boolean1>, <boolean2>, <string>) -
 * callback(error, success, message)
 *
 **/
exports.sendMail = function (mail_data, callback) {
    exports.find_user_name(mail_data.receiver, function (exist){
        if (exist) {

            var mail = db.collection('mail');
            mail.insertOne(mail_data, function(err) {
                if (err) {
                    callback(false, true, 'Error: could not send message.');
                }
                else {
                    callback(true, false, "Message sent.");
                }

            });

        } else {
            callback(false, false, 'The receiver\'s  username is undefined.');
        }
    });
};

/**
 * This function checks if the user with the given username has mail. If the user does, then sends a list of all
 * mail through callback.
 *
 * @param {object} admin object (see ADMINS in COLLECTIONS)
 * @param {function} callbackUser: of the form (<boolean1>, <boolean2>, <array of objects>, <string>) -
 * callback(error, success, mail,  message)
 *
 **/
exports.checkMailbox = function (username, callback) {

    var mail = db.collection('mail');

    mail.find({receiver: username}).toArray(function (err, data) {
        if (err) {
            callback(false, true, null, 'Error: could not retrieve inbox messages.');
        } else if (!data) {
            callback(false, false, null, 'No inbox.');
        } else {
            callback(true, false, data, 'Retrieved inbox');
        }

    });

};

exports.addToken = function (email, userToken, token, callback) {

    var tokens = db.collection('tokens');

    var userToken = {
        userToken: userToken,
        email: email,
        token: token
    };

    tokens.insertOne(userToken, function (err) {
        if (err) {
            //callback(error, message)
            callback(true, "Error : Token has not been added.");
        }

        else {
            callback(false, "Token has been added");
        }
    });


};

exports.getToken = function(token, callback) {
    var tokens = db.collection('tokens');
    tokens.find({token: token}).toArray(function(err, result) {
        if (err) {
            callback(true, null);
        } else {
            callback(false, result);
        }
    });
};

exports.removeToken = function(token, callback) {
    var tokens = db.collection('tokens');
    tokens.removeOne({token: token}, function(err, docs) {
        if (err) {
            callback(true, "There was an error.");
        } else if (docs.deletedCount) {
            callback(false, "Token removed");
        }
    });
};


/**
 * Check if the user with the given username has mail.
 * If the user does, then send the mail that falls within the specified page range.
 *
 * @param {object} username object
 * @param {function} callback of the form (<boolean1>, <boolean2>, <array of objects>, <string>)
 * - callback(error, success, mail,  message)
 * */
exports.getMail = function (username, callback) {

    var mail = db.collection('mail');

    mail.find({receiver: username}).toArray(function (err, data) {
        if (err) {
            callback(false, true, null, 'Error: could not retrieve inbox messages.');
        } else if (!data) {
            callback(false, false, null, 'No inbox.');
        } else {
            // Mail retrieved
            callback(true, false, data, 'Retrieved inbox');
        }

    });

};

/**
 * Adds a notification to a user.
 * @param email
 * @param notification
 * @param callback
 */

exports.addNotification = function(email, notification, callback) {

    var notif = db.collection('notifications');
    notification['email'] = email;

    notif.insertOne(notification, function (err) {
        if (err) {
            //callback(error, message)
            callback(true, "Error : Notification has not been added.");
        }

        else {
            callback(false, "Notification has been added");
        }
    });
}

/**
 * Retrieves a list of all notifications related to a user's email.
 * @param email
 * @param callback
 */
exports.getNotifications = function(email, callback) {
    var notif = db.collection('notifications');

    notif.find({email: email}).toArray(function (err, data) {
        if (err) {
            callback(false, true, null, 'Error: could not retrieve notifications.');
        } else if (!data) {
            callback(false, false, null, 'No notifications.');
        } else {
            callback(true, false, data, 'Retrieved notifications');
        }

    });

}