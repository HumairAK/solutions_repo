var users_data = require('./users_data.json');
var exams_data = require('./exams_data.json');

var dbFile = require("../node_simple");		// after modifications
// var dbFile = require("../node_simple_backup");		// original file

var users_fields = format_users();
var exams_info = format_exams();

//console.log(exams_info);
// populate_users(users_fields);

dbFile.setupDB(function (success, mssg) {
	// begin
	console.log(mssg);

	populate_users(users_fields);
	// add_same_user(users_fields, 0);
	// remove_all_users(users_fields);
	// populate_exams(exams_info);

});

function populate_exams(exam_info) {
	for (var i = 0; i < exam_info[0].length; i++) {
		dbFile.add_exam(exam_info[0][i],exam_info[1][i], function (success, mssg) {
			console.log(mssg);
		})
	}
}


function populate_users(users_fields) {
	for (var i = 0; i < users_fields.length; i++) {
		dbFile.add_user(users_fields[i], function (success, fail, mssg) {
			if (success && !fail) {
				console.log(mssg);
			}
		})
	}
}

function add_same_user(users_fields, index) {
	var rand_user_fields = users_fields[index];
	dbFile.add_user(rand_user_fields, function (success, fail, mssg) {
		if (!success && !fail) {
			console.log(mssg);
		}
	});
}

function remove_all_users(users_fields) {
	for (var i = 0; i < users_fields.length; i++) {
		dbFile.remove_user(users_fields[i][1], function (success, mssg) {
			console.log(mssg);
		});
		// console.log(users_fields[i][1]);
	}
}



// console.log(users_fields);
// format users to proper form
function format_users() {
	var users_fields = [];
	users_data.forEach(function (user) {
		var fields = [];
		fields.push(user.email);
		fields.push(user.user_name);
		fields.push(user.name.first);
		fields.push(user.name.last);
		fields.push("u of t");		//university
		fields.push("CS");		// departmnet
		fields.push(user.password);
		fields.push(user.phone);

    	// console.log(fields);
		users_fields.push(fields);
	});

	return users_fields;
}

function format_exams() {
	var exams_fields = [];
	var questions_arrays = [];

	exams_data.forEach(function (exam) {
		var fields = [];
		var question_array = [];
		fields.push(exam.course_code);
		fields.push(exam.year);
		fields.push(exam.term);
		fields.push(exam.type);
		fields.push(exam.instructors);
		fields.push(exam.page_count);
		fields.push(exam.questions_count);
		fields.push(new Date().toString());
		fields.push(exam.uploaded_by);

		// create questions array
		for (var j = 1; j <= exam.questions_count; j++) {
			var question = "this is question " + j;
			question_array.push(question);
		}
		/*    var Data =
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
		 };*/

		/*    "id": 1,
		 "serial": 321,
		 "course_code": "CSC321",
		 "year": 2014,
		 "term": "winter",
		 "type": "final",
		 "instructors": [
		 "Sandra Crane",
		 "Mcintyre Holmes"
		 ],
		 "page_count": 17,
		 "questions_count": 17,
		 "uploaded_by": "admin0"*/
		exams_fields.push(fields);
		questions_arrays.push(question_array);
	});

	return [exams_fields, questions_arrays];
}
//var uri = 'mongodb://localhost:27017/db';


// console.log(courses_data);