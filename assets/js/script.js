function main(){

    // User-profile dynamic paging
    var items = [
        $("#profile-general"),
        $("#profile-follows"),
        $("#profile-friends"),
        $("#profile-inbox"),
        $("#profile-comments"),
        $('#profile-send-message')];

    function hidePages(){
        items.forEach(function(item){
            item.hide();
        });
    }

    // Hide all pages at load
    hidePages();

    // Show General page
    items[0].show();

    $('.prf-page').bind('click', function(e){

        e.preventDefault();
        hidePages();

        /* Each case will need to be changed to call a handler for fetching data
         * from server*/
        switch($(this).text()) {
            case "General":
                console.log("clicked general");
                $("#profile-general").show();
                break;
            case "Following":
                $("#profile-follows").show();
                break;
            case "Friends":
                $("#profile-friends").show();
                break;
            case "Inbox":
                $("#profile-inbox").show();
                break;
            case "Comments":
                $("#profile-comments").show();
                break;
            case "Send Message":
                $('#profile-send-message').show();
                break;
            default:
                console.log("Error: User page not found");
        }
    });

    // *********  Admin Panel Scripts *********** //
    var adminOptions = [
        $("#cpnl-addExam"),
        $("#cpnl-addCourse"),
        $("#cpnl-addAdmin"),
        $("#cpnl-removeExam"),
        $("#cpnl-removeCourse"),
        $("#cpnl-removeUser")
    ];

    function hideCpnlPages(){
        adminOptions.forEach(function(item){
            item.hide();
        });
    }

    hideCpnlPages();

    // Show General page
    adminOptions[0].show();
    $('.cpnl-page').bind('click', function(e){

        e.preventDefault();
        hideCpnlPages();

        /* Each case will need to be changed to call a handler for fetching data
         * from server*/
        switch($(this).text()) {
            case "Add Exam":
                $("#cpnl-addExam").show();
                break;
            case "Add Course":
                $("#cpnl-addCourse").show();
                break;
            case "Add Admin":
                $("#cpnl-addAdmin").show();
                break;
            case "Remove Exam":
                $("#cpnl-removeExam").show();
                break;
            case "Remove Course":
                $("#cpnl-removeCourse").show();
                break;
            case "Remove User":
                $("#cpnl-removeUser").show();
                break;
            default:
                console.log("Error: User page not found");
        }
    });


    // --- nav scripts ---
    $("input").keyup( function(event) {
        if(event.keyCode == 13){
            $(".go-button").click();
        }
    });

    $(".dropdown").hover(function(){
        $(".dropdown-toggle", this).trigger("click");
    });

    $(".dropdown-toggle").click(function() {
        $(this).next(".dropdown-menu").fadeToggle(200);
    });

    // For the Second level Dropdown menu, highlight the parent
    $( ".dropdown-menu" )
        .mouseenter(function() {
            $(this).parent('li').addClass('active');
        })
        .mouseleave(function() {
            $(this).parent('li').removeClass('active');
        });

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

    $('.table-row').trigger('create');
}
$(document).ready(main);