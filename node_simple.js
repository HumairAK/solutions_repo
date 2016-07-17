// a simple node server
/* TO DO:
* 1. get all exams given course code -- order by year desc ? DONE
* 1B. get the title of the course ? DONE
* 2. add upload date and user name  ? DONE
* 3. remove exam ? DONE
* 4. answers ? CURRENTLY WORKING
* 5. ....TBD
* */


/* Tables SO FAR:
* 1. exams
* 2. courses
* 3. solutions
* 4.
*
* */
const debug_mode = false;

Object.assign = require('object-assign');
var mongodb = require('mongodb');
var mongoFactory = require('mongo-factory');
var ObjectId = require('mongodb').ObjectID;

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
var uri = 'mongodb://general:assignment4@ds057862.mlab.com:57862/solutions_repo';

// sample exam data
// hopefully this will be collected when an admin user fills out a form to create an exam.
// this looks something like...
/*
*   var exam =
 {
   course_code: "CSC240",
   year: 2016,
   term: "fall",
   type: "midterm",
   page_count: 20,
   questions_count: 2,
   questions_list: [],
   upload_date: "some date",
   uploaded_by: "some user name"
 };
 */

// Eventually this will be a better idea in the long run
/*var offering = {
  course_code: "CSC240",
  year: 2016,
  term: "fall",
  instructors: ["Faith Ellen", "Tom Fairgreve"]
};*/


/*var course = {
  course_code: "CSC240",
  title: "Thry of Computation"
};*/


//*************************************************************************************
//************PRELIMINARY TESTING******************************************************
//*************************************************************************************

// Sample data:
var fields = ["CSC240", 2016, "fall", "midterm", ["Faith Ellen", "Tom F."], 20, 2, "some date", "some user name"];
var questions_array = ["this is q1", "this is q2"];

// test adding of exams to the database functionality
//add_exam(fields, questions_array);

//test removal of exam from the database functionality
// remove_exam([fields[0],fields[1],fields[2],fields[3]]);


//test getting all exams database functionality -- USE FOR THE EXAMS PAGES maybe?
/*get_all_exams("CSC240", function (exams) {
  if (exams.length == 0){
    console.log("Nothing was found");
  }
  else {
    console.log(exams);
  }
});*/

//test adding course
// add_course("CSC148", "Intro to Programming");

//test adding solution
//add_solution(["578a44ff71ed097fc3079d6e", 1, "this is the solution to q1"]);


//*************************************************************************************
//*************************************************************************************
//*************************************************************************************



/*
 * This function will add a solution to the solutions table in the database .
 * Params: fields - [exam_id , question_id, solution text]
 * Note: exam_id - is a unique identifier for each exam in the database. to see an example, ...
 *          ... call get_all_exams and look at the output. Looks like: 578a44ff71ed097fc3079d6e
 *       question_id - is unique relevant to 1 exam.
 * */
function add_solution(fields) {
    var Data = {
        exam_id: fields[0],
        q_id: fields[1],
        text: fields[2],
        votes: 0
    };

    // establish a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

            // find the solutions table
            var solutions = db.collection('solutions');
            // insert data into table
            solutions.insert(Data, function(err) {
                if (err) throw err;
                else {
                    console.log("solution added");
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



/*
 * This function will retrieve all exams in the database given the course code ...
 * ... ordered by the year of the exam.
 * Params: course_code - an string of format "CSC309"
 * */
function get_all_exams(course_code, callback) {

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
            find_course(course_code, function (result, data) {

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

}



/*
* This function will add an exam to the database UNLESS the exams already exists.
* If the exams table is empty, this will create one and then add the data.
* Note: this assumes that (course_code + year + term + type) together form a unique exam.
* i.e there can't be two exams occurring for the same course in the same year in the same term with the same type.
* Params: fields - an array of format ["course_code", year, "term",
*                 ["instructor1",...,"instructor n"], page_count, question_count
*                 "upload_date", "user_name"]
*         questions_array - a array by format ["q_1", "q_2", ... , "q_question_count"]
* */
function add_exam(fields, questions_array) {

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
  find_exam([fields[0], fields[1], fields[2], fields[3]], function(result) {

    if (result == true) {     // meaning that the exam was found
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
              if (err) throw err;
              else {
                console.log("exam added");
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
}


/*
* This function will return TRUE if the provided exam info already exists in the database
* OR FALSE if it does not exist in the database.
* Params: fields - an array of format ["course_code", year, "term", "type"]
*
* */
function find_exam(fields, callback) {

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
          callback(false);
        }
        else {  // exam was found
          callback(true);
        }
      });

/*      db.close(function (err) {
        if (err) throw err;
      });*/

    })
    .catch(function(err) {
      console.error(err);
    });
}


/*
 * This function will add a course to the database UNLESS the course already exists.
 * If the course table is empty, this will create one and then add the data.
 * Note: this assumes that (course_codes) are unique.
 * Params: course_code - an string of format "CSC309"
 *         title - the course description
 * */
function add_course(course_code, title) {

  var courseData = {
    course_code: course_code,
    title: title
  };

  find_course(course_code, function (result, data) {

    if (result == true){
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
                console.log("couse added");
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
}


/*
 * This function will return TRUE if the provided course info already exists in the database
 * OR FALSE if it does not exist in the database.
 * Params: course code - an string of the format: "CSC309"
 *
 * */
function find_course(course_code, callback) {
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

          if (docs.length == 0) { // if this course doesnt exist.... add it
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
}


/*
 * This function will remove the exam from the database given the combination of (course_code+ year +  term + type)
 * Params: fields - an array of format ["course_code", year, "term", "type"]
 *
 * */
function remove_exam(fields) {

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
                            console.log("exam was removed");
                        }
                        else if (docs.deletedCount == 0) {
                            console.log("No such exam was found");
                        }
                    }
                }
            );
        })
        .catch(function(err) {
            console.error(err);
        });
}


//get_exam_byID("578a44ff71ed097fc3079d6e");

function get_exam_byID(id) {

    // establish a connection
    mongoFactory.getConnection(uri)
        .then(function(db) {

            // find the solutions table
            var exams = db.collection('exams');
            // query
            exams.find( {_id: ObjectId(id)} ).toArray(function (err, docs) {
                if  (err) throw err;
                else {
                    // console.log(JSON.stringify(docs, null, 2));
                    console.log(docs);
                }
            });
        })
        .catch(function(err) {
            console.error(err);
        });
}

/*    IGNORE BELOW *********************************************************************************

ONLY FOR SYNTAX REFERENCE

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