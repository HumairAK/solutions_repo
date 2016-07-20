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
//dbFile.add_solution(["578a44ff71ed097fc3079d6e", 2, "this is a solution to q2"]);


// the following just prints the exam to console
// dbFile.get_exam_byID("578a44ff71ed097fc3079d6e");

//test getting all solutions of a given exam and question number
//dbFile.get_all_solutions("578a44ff71ed097fc3079d6e", 1);


//test adding of comments given a solution_id, and the comment information as an array
// dbFile.add_comment("578f08e43bba452ee98da444", ["this is asdfasdf", "this is the date", "this is the author"]);


dbFile.get_exam_info_by_ID("578a44ff71ed097fc3079d6e", function (result) {
    if (result.length == 0) {
        console.log("some error occured");
    }
    else {
        console.log(result);
    }
});