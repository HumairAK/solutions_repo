function main(){
    // User-profile dynamic paging
    var items = [
        $("#profile-general"),
        $("#profile-follows"),
        $("#profile-comments"),
        $("#profile-inbox")];

    function hidePages(){
        items.forEach(function(item){
            item.hide();
        });
    }

    // Hide all pages at load
    hidePages();

    // Show General page
    items[0].show();

    $('.nav-o').bind('click', function(e){

        e.preventDefault();
        hidePages();

        /* Each case will need to be changed to call a handler for fetching data
         * from server*/
        switch($(this).attr('id')) {
            case "nav-profile":
                console.log("clicked general");
                $("#profile-general").show();
                break;
            case "nav-follows":
                $("#profile-follows").show();
                break;
            case "nav-comments":
                $("#profile-comments").show();
                break;
            case "nav-inbox":
                $("#profile-inbox").show();
                break;
            default:
                console.log("Error: User page not found");
        }
    });




}



$(document).ready(main);