// a simple node driver to interact with mongo database

/* TO DO:
 * 1. get all exams given course code -- order by year desc ? DONE
 * 1B. get the title of the course ? DONE
 * 2. add upload date and user name  ? DONE
 * 3. remove exam ? DONE
 * 4a. get all questions for a given exam_id ? DONE
 * 4b. add exam id to each question returned. ? NO NEED
 * 6. get all solutions provided question_id and exam_id ? DONE
 * 5. solutions ? DONE -- need to add field for solutions provider, and updating. DONE
 * 7. add university field to courses, exams ? PENDING
 * 8. make a user ? DONE
 * 9. update user info when they comment or post a solution  ? DONE
 * 10. comment_history ? DONE
 * 11. solutions_history ? DONE
 * 12. voting for solutions ? DONE
 * 13. A search users function ? DONE
 * 14. remove user ? DONE (mostly) wat about sessions?
 * 15. remove course ? DONE
 * 16.
 * */


/* I pass in exam id and you give me the number of questions and the comments and solutions associated with each question?*/

/* Tables SO FAR:
 * 1. exams
 * 2. courses
 * 3. solutions
 * 4. users
 * 5. logins
 * 6. admins
 * 7. sessions
 * 8. mail
 *
 * */

/*Tables schema SO FAR:*/
// |======================================================exams==================================================================================|
// |_________ _id_____________|course_code|year__|term__|type____|instructors|page_count|questions_count|questions_list_|upload_date|uploaded_by_|
// |==========================|===========|======|======|========|===========|==========|===============|===============|===========|============|
// |"578a44ff71ed097fc3079d6e"|"CSC240"   |2016  |"fall"|"final" |["a","b"]  |20        | 10            |[{id,q},{id,q}]| "date"    | "by"       |
// |..........|


// |=======================courses=========================|
// |_________ _id_____________|course_code|title___________|
// |==========================|===========|================|
// |"178a42342233ff71c3079d6e"|"CSC240"   |"title"         |
// |..........|


// |================================solutions========================================================|
// |_________ _id_____________|exam_id_____________________|q_id_|text____|votes|comments   | author |
// |==========================|============================|=====|========|=====|===========|========|
// |"354ff71ed078933079d6467e"|"578a44ff71ed097fc3079d6e"  |1    |"answer"| 1   |[{},{}]    |  joe   |
// |..........|

// |========================================users===============================================================================|
// |_______ _id_________|email_________|user_name__|f_name__|l_name__|uni___|departm.|answered|messeges|comments|phone|followers|
// |====================|==============|===========|========|========|======|========|========|========|========|=====|=========|
// |"3.....efsdfsdf...."|blah@blah.com |"some_user"|"f.name"|"l.name"|"uofT"|CS      |40      |30      |15      |() - |[{},{}]  |
// |..........|

// |====================================login===================================|
// |_________ _id_____________|email____________|user_name|pass_________________|
// |==========================|=================|=========|=====================|
// |"askjdfklajsdf..........."|"asdf@asdf.com   |"asdfasd"|(some hasehd thing)  |
// |..........|

/*

 NEW COLLECTIONS:

 - sessions: stores user session - no need to keep track
 - admins: stores admin name, username and password only. The logins collection will be reserved for user logins.

 */



var exports = module.exports = {};

const debug_mode = false;

Object.assign = require('object-assign');
var mongodb = exports.mongodb =  require('mongodb');
var mongoFactory = exports.mongoFactory = require('mongo-factory');
var ObjectId = require('mongodb').ObjectID;
var assert = require('assert');
var _ = require('underscore');

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
var uri = exports.uri =  'mongodb://general:assignment4@ds057862.mlab.com:57862/solutions_repo';


// Keep this for testing on local machine, do not remove. - Humair
//var uri = 'mongodb://localhost:27017/db';


//***********************PRELIMINARY TESTING******************************************|

/*refer to testImports.js*/

//****************************FUNCTIONS************************************************|

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

    mongoFactory.getConnection(uri).then(function(db) {

        // fetch the exams table
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
                callback(false, "No such user was found");

                //console.log("No such exam was found");
            }
        });
    }).catch(function(err) {
        console.error(err);
    });
};

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

    mongoFactory.getConnection(uri).then(function(db) {

        // fetch the exams table
        var users = db.collection('users');
        var logins = db.collection('logins');

        // look for the specific user
        users.removeOne( { user_name: username }, function (err, docs) {
            if (err) throw err;
            else if (docs.deletedCount == 1) {
                // now remove it from logins ....
                logins.removeOne( { user_name: username }, function (err, result) {
                    if (err) throw err;
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
    }).catch(function(err) {
        console.error(err);
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

    mongoFactory.getConnection(uri).then(function (db) {
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



    }).catch(function (err) {
        console.error(err);
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
        if (!bool) console.log(result);
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
                mongoFactory.getConnection(uri).then(function (db) {

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


                }).catch(function (err) {
                    console.error(err);
                });
            }
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

    mongoFactory.getConnection(uri).then(function (db) {

        // find the solutions table
        var users = db.collection('users');
        // insert data into table
        users.find( {user_name: user_name} ).toArray(function (err, docs) {
            // if (err) throw err;
            if (err) callback(false, "Error: followers could not be retrieved for some reason");
            else {
                callback(true, docs[0].followers);
            }
        });

    }).catch(function (err) {
        console.error(err);
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

    // get a connection
    mongoFactory.getConnection(uri).then(function (db) {
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


    }).catch(function (err) {
        // console.err(err);
        callback(false, "Error: failed to connect to db");
    })
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

    // get a connection
    mongoFactory.getConnection(uri).then(function (db) {

        var solutions = db.collection('solutions');
        solutions.find( { author: username } ).toArray(function (err, result) {
            if (err) callback(false, "Error: problem while looking for stuff");
            else {
                callback(true, result);
            }

        });

    }).catch(function (err) {
        // console.err(err);
        callback(false, "Error: failed to connect to db");
    })
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
 * @param {string[]} fields: [email, user_name, f_name, l_name, uni, department, password, phone_num]
 * @param {function} callbackUser: of the form (<boolean1>, <boolean2>, <string>)
 *                                  where, <boolean1> -
 *                                   <boolean2> -
 *                                   <string> - error ? error_mssg : success_mssg
 **/
exports.add_user = function (fields, callbackUser) {
    console.log("inside add_user");
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
        followers: []
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
                    mongoFactory.getConnection(uri)
                        .then(function (db) {

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

                        })
                        .catch(function (err) {
                            callbackUser(false, true,  "Unable to connect.");
                        })
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
 * This (helper) function returns true IFF user_name already exists in the database
 *
 * @param {string}   user_name: the user name
 * @param {function} callback: of the arg (bool)
 *                              where <bool> : found ? true : false
 * */
exports.find_user_name = function (user_name, callback) {
    // make a connection
    mongoFactory.getConnection(uri)
        .then(function (db) {

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
        })
        .catch(function (err) {
            console.err(err);
        })
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

    mongoFactory.getConnection(uri).then(function (db) {
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
    mongoFactory.getConnection(uri).then(function (db) {

        var collection = db.collection('logins');

        collection.find({user_name: username}).toArray(function(err, result) {
            if (err) {
                // callback(success, password, message)
                callback(false, null, "Error : Could not retrieve password.");
            }

            else {
                console.log("NODE SIMPLE result[0]: " + result);
                var pwd = result[0].password; //result is an array
                callback(true, pwd, "Password retrieved");
            }

        });
    });
}

/**
 * This (helper) function returns true IFF email already exists in the database
 *
 * @param {string}   email: unique email of the user
 * @param {function} callback: <bool> : found ? true : false
 * */
exports.find_user = function (email, callback) {
    // make a connection
    console.log("inside find_user");
    mongoFactory.getConnection(uri)
        .then(function (db) {

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
        })
        .catch(function (err) {
            console.err(err);
        })
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

    mongoFactory.getConnection(uri)
        .then(function (db) {

            var solutions = db.collection('solutions');

            solutions.aggregate(
                [

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
        })
        .catch(function (err) {
            console.err(err);
        })

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

    mongoFactory.getConnection(uri)
        .then(function (db) {

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

        })
        .catch(function (err) {
            serverCallback(false, "Error: Could not establish connection with database.");
            console.error(err);
        })
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
            mongoFactory.getConnection(uri).then(function (db) {

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
            }).catch(function () {
                callback(false, true, "Error: Some error occurred with the db connection", null);
            })
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

    // establish a connection
    mongoFactory.getConnection(uri).then(function(db) {

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


    }).catch(function(err) {
        console.error(err);
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

    mongoFactory.getConnection(uri).then(function (db) {
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
    }).catch(function (err) {
        console.log(err);
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

    // get a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

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

                            if (debug_mode == true){
                                console.log(docs);
                                console.log(data);
                            }
                            /*callback(docs);     // send back the data*/
                        }
                        else if (result == false) {    // no such course was found
                            console.log("This course has not been added to the database.");
                        }
                        callback(docs);     // send back the data

                    });
                }
            });
        })
        .catch(function(err) {
            console.error(err);
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
            console.log("This exam already exists in the database");
        }

        else {    // add Data to the database
            // make a connection
            mongoFactory.getConnection(uri)
                .then(function(db) {

                    // find the exams table
                    var exam_collection = db.collection('exams');
                    // insert data into table
                    exam_collection.insert(Data, function(err) {
                        if (err) {
                            serverCallback(false, "Error: Could not add exam into database.");
                            throw err;
                        }
                        else {
                            console.log("exam added");
                            serverCallback(true, "Exam Successfully added.");
                        }
                    });
                })
                .catch(function(err) {
                    serverCallback(false, "Error: Could not establish connection with database.");
                    console.error(err);
                });
        }
    });
};

/**
 * This function will return TRUE if the provided exam info already exists in the database
 * OR FALSE if it does not exist in the database.
 *
 * @param {string[]} fields: an array of format ["course_code", year, "term", "type"]
 * @param {fucntion} serverCallback: ...
 * @param {function} callback: with args (<bool>, ...)
 *                      where <bool> : found ? true : false
 * */
exports.find_exam = function (fields, serverCallback, callback) {

    var course_code = fields[0];
    var year = fields[1];
    var term = fields[2];
    var type = fields[3];

    // console.log(Data);

    // check the data to see if this exam exists...

    // first make a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

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
        })
        .catch(function(err) {
            console.error(err);
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
            mongoFactory.getConnection(uri)
                .then(function(db) {

                    // find the exams table
                    var courses = db.collection('courses');
                    // insert data into table
                    courses.insert(courseData, function(err) {
                        if (err) throw err;
                        else {
                            console.log("course added");
                            serverCallback(true, "Course added successfully.");
                        }
                    });
                })
                .catch(function(err) {
                    console.error(err);
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

    // first make a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

            // fetch the courses table
            var courses = db.collection('courses');
            courses.createIndex(          // make the following fields searchable
                {
                    "course_code":"text"
                });
            // look for the courses
            courses.find(
                { $text: { $search: course_code } }
            ).toArray(function (err, docs) {
                if (err) throw err;
                // if this course doesnt exist.... add it (via add_course call)
                if (docs.length == 0) {
                    callback(false);
                }
                else {  // course was found
                    callback(true, docs);
                }
            });
        })
        .catch(function(err) {
            console.error(err);
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
    mongoFactory.getConnection(uri)
        .then(function(db) {

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
                    if (err) throw err;
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
        })
        .catch(function(err) {
            console.error(err);
        });
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

    // establish a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

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
        })
        .catch(function(err) {
            callback(false, true, null);
        });
};

/******************************  ADMINS *********************************/

/*
 *   Adds an admin to the admins collection.
 *   Params: admin_data = {fname: firstname, lname: lastname, username: username, password: password}
 *   Callback: callback(success, error, message) => callback(boolean, boolean, String)
 */

exports.addAdmin = function (admin_data, callback) {
    console.log('addAdmin, admin_data: ' +  admin_data.fname);

    console.log("inside addAdmin");
    var logins = db.collection('logins');
    // Check if the admin username already exists. Also check for user username. If it does, then we don't add the admin_data and return a message.
    exports.adminExists( admin_data.username , function (error, exists, data, message) {
        console.log("adminExists: " + message);
        if (!exists && !error) {
            logins.find({username: username}).toArray(function (err, result) {
                if (err){
                    callback(true, false, null, "Error: could not retreive logins collection in addAdmin().");
                } else if (result.length) {
                    callback(false, false, 'User with given username already exists.');
                } else {
                    mongoFactory.getConnection(uri).then(function (db) {

                        var admins = db.collection('admins');

                        admins.insertOne(admin_data, function (err) {
                            if (err) {
                                callback(false, true, message);
                            }
                            else {
                                callback(true, false, "Admin added.");
                            }

                        });
                    });
            }
            }).catch(function (err) {
                callbackUser(false, true,  "Unable to connect.");
            })
        } else {
            callback(error, exists, message);
        }
    });

};

/*
 *  Equivalent of function find_user, but for admins. Calls back true if admin with a
 *  given username exists. If true, also returns the admin 'object'.
 *  Callback: callback(error, exists, message)
 */
exports.adminExists = function (username, callback) {
    // make a connection
    console.log("inside adminExists");
    mongoFactory.getConnection(uri).then(function (db) {

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
    })
        .catch(function (err) {
            callback(true, false, "Error: could not connect to the database.");
        })
};

/******************************  MAIL *********************************/

/*
 * mail_data = {
 *      sender: sender_username,
 *      receiver: receiver_username,
 *      message: message,
 *      date: date,
 * }
 *
 * callback(success, error, message)
 *
 */
exports.sendMail = function (mail_data, callback) {
    exports.find_user_name(mail_data.receiver, function (exist){
        if (exist) {
            mongoFactory.getConnection(uri).then(function(db) {
                var mail = db.collection('mail');
                mail.insertOne(mail_data, function(err) {
                    if (err) {
                        callback(false, true, 'Error: could not send message.');
                    }
                    else {
                        callback(true, false, "Message sent.");
                    }

                });
            });
        } else {
            callback(false, false, 'The receiver\'s  username is undefined.');
        }
    });
}

/*
 *
 * callback(success, error, data, message)
 * Returns the user's inbox (array of message objects)
 *
 */
exports.checkMailbox = function (username, callback) {

    mongoFactory.getConnection(uri).then(function(db) {

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
    });

}

//testing
exports.findUserByID = function (id, callback) {
    // make a connection
    console.log("inside findUserByID");
    mongoFactory.getConnection(uri)
        .then(function (db) {
            var logins = db.collection('logins');
            logins.find( { _id : id }, function (err, result) {
                callback(err, result);

            });
        })
        .catch(function (err) {
            console.err(err);
        })
};




/*
 * userObj = {fs: fs, ls: ls, email: email, username: username, pass_hash: pass_hash, univ: univ, dept: dept}
 *
 *
 exports.addUser = function (userObj) {
 mongoFactory.getConnection(uri)
 .then(function(db) {
 var users = db.collection('users').insertOne(userObj, function (err, result) {
 assert.equal(null, error);
 console.log("User inserted");

 });

 });
 } */



/*    IGNORE BELOW *********************************************************************************



 /!*
 * Then we need to give Boyz II Men credit for their contribution
 * to the hit "One Sweet Day".
 *!/

 songs.update(
 { song: 'One Sweet Day' },
 { $set: { artist: 'Mariah Carey ft. Boyz II Men' } },
 function (err, result) {

 if(err) throw err;

 /!*
 * Finally we run a query which returns all the hits that spend 10 or
 * more weeks at number 1.
 *!/

 songs.find({ weeksAtOne : { $gte: 10 } }).sort({ decade: 1 }).toArray(function (err, docs) {

 if(err) throw err;

 docs.forEach(function (doc) {
 console.log(
 'In the ' + doc['decade'] + ', ' + doc['song'] + ' by ' + doc['artist'] +
 ' topped the charts for ' + doc['weeksAtOne'] + ' straight weeks.'
 );
 });

 // Since this is an example, we'll clean up after ourselves.
 songs.drop(function (err) {
 if(err) throw err;

 // Only close the connection when your app is terminating.
 db.close(function (err) {
 if(err) throw err;
 });
 });
 });
 }
 );
 });
 });*/
