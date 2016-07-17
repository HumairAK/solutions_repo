function main(){

    // User-profile dynamic paging
    var items = [
        $("#profile-general"),
        $("#profile-follows"),
        $("#profile-friends"),
        $("#profile-inbox"),
        $("#profile-comments")];

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
            case "Follows":
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
            default:
                console.log("Error: User page not found");
        }
    });

}
$(document).ready(main);