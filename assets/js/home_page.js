function main(){

    // Search bar drop down scripting (some of it is shared with nav panel
    // in script.js but this code in this file is exclusive to search bar
    $('.search-menu').bind('click', function(e) {
        e.preventDefault();
        $("#search-drop-down").click();
        var type = $(this).text();

        switch(type) {
            case "Courses":
                $("#search-field").attr("action","/search/courses");
                $("#user-input").attr("placeholder", "Enter coure code");
                $("#drop-down-value").text("Courses");
                break;
            case "Users":
                $("#search-field").attr("action","/search/users");
                $("#user-input").attr("placeholder", "Enter user info");
                $("#drop-down-value").text("Users");
                break;
            default:
                console.log("Error: Click not registered");
        }
    });


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
    // get array of all courses from controllers
    $.ajax({
        url: '/auto-complete-courses',
        type: 'GET',
        success: function(data){
            // console.log(JSON.parse(data));
            var states = JSON.parse(data);

            $('.typeahead').typeahead({
              hint: true,
              highlight: true,
              minLength: 1
            },
            {
              name: 'courseNames',
              source: substringMatcher(states)
            });
        }
    });
}
$(document).ready(main);
