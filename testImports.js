var dbFile = require("./node_simple");

var fields = ["CSC240", 2016, "fall", "midterm", ["Faith Ellen", "Tom F."], 20, 2, "some date", "some user name"];
var questions_array = ["this is q1", "this is q2"];


// *****************************************************************************
//                         EXAMPLE USAGE
// *****************************************************************************


// test adding of exams to the database functionality
// dbFile.add_exam(fields, questions_array);

//test removal of exam from the database functionality
//dbFile.remove_exam([fields[0],fields[1],fields[2],fields[3]]);


//test getting all exams database functionality -- USE FOR THE EXAMS PAGES maybe?
/*dbFile.get_all_exams("CSC240", function (exams) {
 if (exams.length == 0){
 console.log("Nothing was found");
 }
 else {
 console.log(exams);
 }
 });*/

//test adding course
// dbFile.add_course("CSC148", "Intro to Programming");

//test adding solution
/*dbFile.add_solution(["57917d4d2a73c0224fb6e763", 2, "this is a solution to q2", "some_user name"], function (bool, mssg) {

    console.log(mssg);

    if (bool == true) {
        // do stuff
    }

});*/

/*dbFile.retrieve_userSolutions_history("some_user name", function (bool, result) {
    if (bool == false) {
        console.log(result);
    }
    else {
        console.log(result);
    }
});*/

/*dbFile.retrieve_userSolutions_count("some_user name", function (bool, result) {
    if (!bool) console.log(result);
    else {  // bool is true i.e no error occured. result contains an integer
        console.log(result);
    }
});*/

/*dbFile.retrieve_userComments_history("some_user name", function (bool, results) {
   if (!bool) console.log(results);
   else {
       console.log(results);
   }
});*/

/*dbFile.retrieve_userComments_count("sad@saddy.com", function (bool, result) {
    if (!bool) console.log(result);
    else {  // bool is true i.e no error occured. result contains an integer
        console.log(result);
    }
});*/


// the following just prints the exam to console
// dbFile.get_exam_byID("578a44ff71ed097fc3079d6e");

//test getting all solutions of a given exam and question number
//dbFile.get_all_solutions("578a44ff71ed097fc3079d6e", 1);


//test adding of comments given a solution_id, and the comment information as an array
/*dbFile.add_comment("5794c63ba930e20485a376a0", ["this is asdfasdasdfasdff",  "some_user name"]);*/


/*
 dbFile.get_exam_info_by_ID("578a44ff71ed097fc3079d6e", function (result) {
 if (result.length == 0) {
 console.log("some error occured");
 }
 else {
 console.log(result);
 }
 });*/

/*dbFile.add_user(["some as email", "some_user names", "kumar", "damani", "uofT", "cs", "some hashed passwd", "12312312312"], function (bool1, bool2, mssg) {
    console.log(mssg);
});*/


/*
 dbFile.find_user("some Email", function (result) {
 if  (result == false) {
 console.log("no such user found");
 }
 else {
 console.log("user already exists");
 }
 });*/

/* dbFile.find_user_name("some_user name", function (result) {
 if  (result == false) {
 console.log("no such user_name found");
 }
 else {
 console.log("user_name taken");
 }
 });*/


/*dbFile.followExam("nanalelfe@gmail.com", "578a44ff71ed097fc3079d6e", function (bool, mssg) {
   if (!bool) console.log(mssg);
    else {
       console.log(mssg);
   }
});*/

/*
dbFile.retrieveFollows("some_user names", function (bool, result) {
    if (!bool) console.log(result);
    else {
        console.log(result);
    }
 });*/


/*dbFile.vote_solution("5792d8a970040378d4e4b389" , "down", function (bool, mssg) {
   console.log(mssg);
});*/


/*dbFile.search_users("kumar", function (bool, mssg) {
    if (mssg.length != 0) console.log(mssg);
});*/

/*dbFile.remove_user("some_user name", function (bool, mssg) {
    console.log(mssg);
});*/


/*
dbFile.search_exams("cSc240", function (bool, mssg) {
    console.log(mssg);
});*/
