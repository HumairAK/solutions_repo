// a simple node server
/* TO DO:
* 1. get all exams given course code -- order by year desc ? PENDING
* 2. add upload date and user name  ? DONE
* 3. remove exam ? PENDING
* 4. questions ? PENDING
* 5. ....TBD
* */
var debug_mode = false;

Object.assign = require('object-assign');
var mongodb = require('mongodb');
var mongoFactory = require('mongo-factory');

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
var fields = ["CSC240", 2016, "fall", "midterm", ["Faith Ellen", "Tom F."], 20, 2, "some date", "some user name"];
var questions_array = ["this is q1", "this is q2"];

// Eventually this will be a better idea in the long run
/*var offering = {
  course_code: "CSC240",
  year: 2016,
  term: "fall",
  instructors: ["Faith Ellen", "Tom Fairgreve"]
};*/

// test adding of exams to the database functionality
add_exam(fields, questions_array);



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

  // first see if the exam already exists
  find_exam(fields, questions_array, function(result, Data) {

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
* Params: fields - an array of format ["course_code", year, "term", "type"
*                 ["instructor1",...,"instructor n"], page_count, question_count,
*                 "upload_data", "user_name"]
*         questions_array - a array by format ["q_1", "q_2", ... , "q_question_count"]
* */
function find_exam(fields, questions_array, callback) {
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
            course_code: Data.course_code,
            year: Data.year,
            term: Data.term,
            type: Data.type
          }
      ).toArray(function (err, docs) {
        if (err) throw err;

        if (docs.length == 0) { // if this exam doesnt exist.... add it
          callback(false, Data);
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



/*    IGNORE BELOW **************

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