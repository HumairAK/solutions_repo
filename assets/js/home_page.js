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
}
$(document).ready(main);