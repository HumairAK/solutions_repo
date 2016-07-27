function main(){
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
}
$(document).ready(main);