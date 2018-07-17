function main(){
    $("#go-button").on('click', function(e) {
        e.preventDefault();
        if ($("#drop-down-value").text() == "Courses") {
            // $("#search-field").attr("action", "search/courses");
            window.location += 'search/courses?search=' + $("#user-input-course").val();
        } else {
            // $("#search-field").attr("action", "search/users");
            window.location += 'search/users?search=' + $("#user-input-users").val();
        }
    });

    // Search bar drop down scripting (some of it is shared with nav panel
    // in script.js but this code in this file is exclusive to search bar
    $('.search-menu').bind('click', function(e) {
        e.preventDefault();
        $("#search-drop-down").click();
        var type = $(this).text();

        switch(type) {
            case "Courses":
                // hide the input for user search 
                $("#user-input-users").css("display", "none");
                // show the input for courses search
                $("#custom-autocomplete").css("display", "block");

                $("#search-field").attr("action", "/search/courses");
                $("#drop-down-value").text("Courses");
                break;
            case "Users":
                // hide the input for courses search
                $("#custom-autocomplete").css("display", "none");
                // show the input for users search
                $("#user-input-users").css("display", "block");

                $("#search-field").attr("action", "/search/users");
                $("#drop-down-value").text("Users");
                break;
            default:
                console.log("Error: Click not registered");
        }
    });

    // TODO: move this function to a general helper class??
    // for auto-complete
    var substringMatcher = function(strs) {
        return function findMatches(q, cb) {
            var matches, substringRegex;
            // an array that will be populated with substring matches
            matches = [];

            // regex used to determine if a string contains the substring `q`
            substrRegex = new RegExp(q, 'i');

            // iterate through the pool of strings and for any string that
            // contains the substring `q`, add it to the `matches` array
            $.each(strs, function(i, str) {
                if (substrRegex.test(str)) {
                  matches.push(str);
                }
            });

          cb(matches);
        };
    };


    // get array of all courses from controller
    $.ajax({
        url: '/auto-complete-courses',
        type: 'GET',
        success: function(data){
            var jsonData = JSON.parse(data);
            if (jsonData.success) {
                var states = jsonData.data;

                $('.typeahead').typeahead({
                  hint: true,
                  highlight: true,
                  minLength: 1
                },
                {
                  name: 'courseNames',
                  source: substringMatcher(states)
                });
            } else { // console log the error mssg
                console.log(jsonData.data);
            }
        }
    });
}
$(document).ready(main);
