// a simple node driver to interact with mongo database

/* TO DO:
 * 1. get all exams given course code -- order by year desc ? DONE
 * 1B. get the title of the course ? DONE
 * 2. add upload date and user name  ? DONE
 * 3. remove exam ? DONE
 * 4a. get all questions for a given exam_id ? DONE
 * 4b. add exam id to each question returned. ? PENDING
 * 6. get all solutions provided question_id and exam_id ? DONE
 * 5. solutions ? CURRENTLY WORKING ON -- need to add field for solutions provider, and updating.
 * 7. add university field to courses, exams ? PENDING
 * 8. make a user ? DONE
 * 9. 
 * */


/* I pass in exam id and you give me the number of questions and the comments and solutions associated with each question?*/

/* Tables SO FAR:
 * 1. exams
 * 2. courses
 * 3. solutions
 * 4. users
 * 5. logins
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


// |================================solutions============================================|
// |_________ _id_____________|exam_id_____________________|q_id_|text____|votes|comments|
// |==========================|============================|=====|========|=====|========|
// |"354ff71ed078933079d6467e"|"578a44ff71ed097fc3079d6e"  |1    |"answer"| 1   |[{},{}] |
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

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
var uri = exports.uri =  'mongodb://general:assignment4@ds057862.mlab.com:57862/solutions_repo';

// Keep this for testing on local machine, do not remove. - Humair
//var uri = 'mongodb://localhost:27017/db';


//***********************PRELIMINARY TESTING******************************************|

/*refer to testImports.js*/

//****************************FUNCTIONS************************************************|


// will add comments ASAP
/*  callback(success, data/message) => callback(boolean, object/String);
 *
 *
 */
exports.retrieve_userComments_history = function (username, callback) {

    // get a connection
    mongoFactory.getConnection(uri).then(function (db) {

        var solutions = db.collection('solutions');
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
        ]).toArray(function (err, results) {
            if (err) callback(false, "Error: some weird error occurred while query");
            else {
                callback(true, results);
            }

        });

        db.close();

    }).catch(function (err) {
        // console.err(err);
        callback(false, "Error: failed to connect to db");
    })
};

exports.retrieve_userComments_count = function (username, callback) {

    exports.retrieve_userComments_history(username, function (bool, results) {
        if (!bool) callback(false, "Error: error occurred");
        else {
            var length = results.length;
            callback(true, length);
        }
    });

};

exports.retrieve_userSolutions_history = function (username, callback) {

    // get a connection
    mongoFactory.getConnection(uri).then(function (db) {

        var solutions = db.collection('solutions');
        solutions.find( { author: username } ).toArray(function (err, result) {
            if (err) callback(false, "Error: problem while looking for stuff");
            else {
                callback(true, result);
            }
            db.close();
        });

    }).catch(function (err) {
        // console.err(err);
        callback(false, "Error: failed to connect to db");
    })
};

exports.retrieve_userSolutions_count = function (username, callback) {

    exports.retrieve_userSolutions_history(username, function (bool, results) {
        if (!bool) callback(false, "Error: error occured");
        else {
            var length = results.length;
            callback(true, length);
        }
    });

};


/*
 * This function creates and adds a user to users table.
 * IFF both the email and the user_name are not in the database already.
 * If either of them exist, the user is NOT added.
 * Params: fields - [email, user_name, f_name, l_name, uni, department, password, phone_num]
 * */
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
    exports.find_user( fields[0] ,callbackUser, function (result, callbackUser) {
        if  (result == false) {

            // find out if the user_name is taken
            exports.find_user_name( fields[1], callbackUser,  function (docs) {
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
                                    db.close();
                                }

                                else {// user insert successfull
                                    logins.insertOne(login_data, function (err) {
                                        if (err) {
                                            callbackUser(false, true, "Error : User has not been added.");
                                            db.close();
                                        }

                                        else {// login insert successfull
                                            callbackUser(true, false, "User has been added.");
                                            db.close();
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

/*
 * This (helper) function returns true IFF user_name already exists in the database
 * Params: user_name - the user name
 * */
exports.find_user_name = function (user_name, callbackUser, callback) {
    // make a connection
    mongoFactory.getConnection(uri)
        .then(function (db) {

            var logins = db.collection('logins');
            logins.find( { user_name: user_name } ).toArray(function (err, result) {
                if (err) throw err;
                else if (result.length == 0) {  // nothing was found  so this user is new
                    callback(false);
                }
                else {
                    callback(true);
                }
            });
            // db.close();
        })
        .catch(function (err) {
            console.err(err);
        })
};

/*
  Retrieves the user object based on the username.
*/

exports.retrieveUser = function (username, callback) {
    mongoFactory.getConnection(uri).then(function (db) {
        var users = db.collection('users');

        users.find({user_name: username}).toArray(function (err, result) {
            if (err) {
                // callback(success, error, user, message)
                callback(false, true,  null, "Error : Could not retrieve user.");
            }

            else if (result.length) {
                console.log("retreive User: " + result[0]);
                callback(true, false, result[0], "User retrieved");
            }

            else {
                callback(false, false, null, "Username is undefined.");
            }

        });
    });
}

/*
 Returns the hashed password given the username. Assume username exists. Used for both admins and users.
 retrievePassword(String, boolean, function())
 */

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

/*
 * This (helper) function returns true IFF email already exists in the database
 * */
exports.find_user = function (email, callbackUser, callback) {
    // make a connection
    console.log("inside find_user");
    mongoFactory.getConnection(uri)
        .then(function (db) {

            var logins = db.collection('logins');
            logins.find( { email: email } ).toArray(function (err, result) {
                if (err) throw err;
                else if (result.length == 0) {  // nothing was found  so this user is new
                    callback(false, callbackUser);
                }
                else {
                    callback(true, callbackUser);
                }
            });
            // db.close();
        })
        .catch(function (err) {
            console.err(err);
        })
};

// this function returns an array where is element contains info for a particular question
// such as the question number (_id), number of solutions (count), and number of comments
// (comments). [ {_id,count,comments}, {} ...]
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
                // console.log(result);
                callback(result);

            });
        })
        .catch(function (err) {
            console.err(err);
        })

};

/*
 * This function will add a comment to the solutions table
 * Params: sol_id - id of the solution to which to add the comment
 *         fields - [text, by]
 * */
exports.add_comment = function (sol_id, fields) {
    var Data = {
        text: fields[0],
        date: new Date(),
        by: fields[1]
    };

    mongoFactory.getConnection(uri)
        .then(function (db) {

            // find the solutions table
            var solutions = db.collection('solutions');
            // insert data into table
            solutions.updateOne( {_id: ObjectId(sol_id)}, {$push: {comments: Data}} , function (err, result) {
                if (err) throw err;
                else {
                    console.log("comment added");
                }
            });

        })
        .catch(function (err) {
            console.error(err);
        })
};

// get all solutions given an exam_id and the question number
exports.get_all_solutions = function (exam_id, q_num, callback) {
    mongoFactory.getConnection(uri)
        .then(function (db) {

            var solutions = db.collection('solutions');

            solutions.find(
                {
                    exam_id: exam_id,
                    q_id: q_num
                }
            ).toArray( function (err, docs) {
                if (err) throw err;
                else {
                    console.log(docs);

                    callback(docs);
                }
            });


        })
        .catch(function () {
            console.error(err);
        })


};

/*
 * This function will add a solution to the solutions table in the database .
 * Params: fields - [exam_id , question_id, solution text, user_name]
 * Note: exam_id - is a unique identifier for each exam in the database. to see an example, ...
 *          ... call get_all_exams and look at the output. Looks like: 578a44ff71ed097fc3079d6e
 *       question_id - is unique relevant to 1 exam.
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
    mongoFactory.getConnection(uri)
        .then(function(db) {

            // find the solutions table
            var solutions = db.collection('solutions');
            // insert data into table
            solutions.insert(Data, function(err) {
                if (err) callback(false , "Error: Failed to add the solution");
                else {
                    // console.log("solution added");
                    callback(true, "Success: added exam successfully!");
                    db.close(function (err) {   // close the connection when done
                        if (err) throw err;
                    });
                }
            });
        })
        .catch(function(err) {
            console.error(err);
        });

};

/*
 * This function will retrieve all exams in the database given the course code ...
 * ... ordered by the year of the exam.
 * Params: course_code - an string of format "CSC309"
 * */
exports.get_all_exams = function (course_code, callback) {

    // get a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

            // get the exams table
            var exam_collection = db.collection('exams');

            // search exams table with given course code
            exam_collection.find(
                { course_code: course_code }
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

/*
 * This function will add an exam to the database UNLESS the exams already exists.
 * If the exams table is empty, this will create one and then add the data.
 * Note: this assumes that (course_code + year + term + type) together form a unique exam.
 * i.e there can't be two exams occurring for the same course in the same year in the same term with the same type.
 * Params: fields - an array of format ["course_code", year, "term",
 *                 ["instructor1",...,"instructor n"], page_count, question_count
 *                 "upload_date", "user_name"]
 *         questions_array - a array by format ["q_1", "q_2", ... , "q_question_count"]
 *
 * callback parameter takes a boolean to indicate whether insert was successful
 * and an output status message.*/
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
                            db.close(function (err) {   // close the connection when done
                                if (err) throw err;
                            });
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

/*
 * This function will return TRUE if the provided exam info already exists in the database
 * OR FALSE if it does not exist in the database.
 * Params: fields - an array of format ["course_code", year, "term", "type"]
 *
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

            /*      db.close(function (err) {
             if (err) throw err;
             });*/

        })
        .catch(function(err) {
            console.error(err);
        });
};

/*
 * This function will add a course to the database UNLESS the course already exists.
 * If the course table is empty, this will create one and then add the data.
 * Note: this assumes that (course_codes) are unique.
 * Params: course_code - an string of format "CSC309"
 *         title - the course description
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
                            db.close(function (err) {   // close the connection when done
                                if (err) throw err;
                            });
                        }
                    });
                })
                .catch(function(err) {
                    console.error(err);
                });
        }
    });
};

/*
 * This function will return TRUE if the provided course info already exists in the database
 * OR FALSE if it does not exist in the database.
 * Params: course code - an string of the format: "CSC309"
 *
 * */
exports.find_course = function (course_code, callback) {
    // check the data to see if this exam exists...

    // first make a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

            // fetch the courses table
            var courses = db.collection('courses');

            // look for the courses
            courses.find(
                { course_code: course_code }
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

            /*              db.close(function (err) {
             if (err) throw err;
             });*/

        })
        .catch(function(err) {
            console.error(err);
        });
};

/*
 * This function will remove the exam from the database given the combination of (course_code+ year +  term + type)
 * Params: fields - an array of format ["course_code", year, "term", "type"]
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
                            db.close();
                            //console.log("exam was removed");
                        }
                        else if (docs.deletedCount == 0) {
                            serverCallback(false, "No such exam was found");
                            db.close();
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

// callback(success, error, data)
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

    // Check if the admin username already exists. If it does, then we don't add the admin_data and return a message.
    exports.adminExists( admin_data.username , function (error, exists, data, message) {
            console.log("adminExists: " + message);
            if (!exists && !error) {
                mongoFactory.getConnection(uri).then(function (db) {

                    var admins = db.collection('admins');

                    admins.insertOne( admin_data, function (err) {
                        if (err) {
                            callback(false, true, message);
                            db.close();
                        }
                        else {
                            callback(true, false, "Admin added.");
                            db.close();
                        }
                    });

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
                db.close();
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
