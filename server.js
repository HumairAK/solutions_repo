/**
 * Created by warefhaque on 2016-07-16.
 */

/*change the __dirname statically for now*/

var __dirname = '/Users/warefhaque/CSC309/solutions_repo';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var dbFile  = require("./node_simple.js");
var http = require("http");
var fs = require("fs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
/*LOADS ALL STATIC FILES FROM THE DIRECTORY __dirname*/
app.use(express.static(__dirname));

app.listen(3000, function() {
    console.log('listening on http://localhost:3000/');
});

app.get('/exams',function (req,res) {
    console.log(req.query.search);
    var courseName = req.query.search;
    res.redirect("http://localhost:3000/exams.html/?course_name="+courseName);
});

app.get('/exams.html', function (req,res) {
    /*LOADS ALL THE STATIC FILES REALTIVE TO THE REDIRECTED URL*/
    app.use('/exams.html', express.static(__dirname));
    res.sendFile(__dirname+'/exams.html');
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
