/**
 * Created by warefhaque on 2016-07-16.
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var dbFile  = require("./node_simple.js");
var http = require("http");
var fs = require("fs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.listen(3000, function() {
    console.log('listening on 3000');
});



app.get('/exams',function (req,res) {
    console.log(req.query.search);
    var courseName = req.query.search;
    res.redirect("http://localhost:3000/exams.html/?course_name="+courseName);
});

app.get('/exams.html', function (req,res) {
    res.sendFile('/Users/warefhaque/CSC309/solutions_repo/exams.html');
});

app.get("/exams.html/assets/css/style.css",function (req,res) {
    res.sendFile('/Users/warefhaque/CSC309/solutions_repo/assets/css/style.css');
});

function getExamsForCourseCode(courseCode) {
    dbFile.get_all_exams(courseCode, function (exams) {
        if (exams.length == 0){
            console.log("Nothing was found");
        }
        else {
            console.log(exams);
        }
    });
}
