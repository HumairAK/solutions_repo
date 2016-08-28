function main(){

    var socket = io('http://localhost:3000');
    socket.on('alert', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
    });

    socket.on('new_solution', function (data) {
        console.log("new solution: ");
        console.log(data);

        var $notification_menu = $(".notification-dropdown-menu");
        //$notification_menu.remove($('li a.generic-notification'));

        var $li = $('<li>');
        var $a = $('<a>').text(data.author + " has added a solution to an exam.");
        $li.append($a);
        $notification_menu.append($li);

        socket.emit('add_notification', data);

        // emit back to the server to save it as a notification in the database
        // update badge
    });

    // --- nav scripts ---
    $("input").keyup( function(event) {
        if(event.keyCode == 13){
            $(".go-button").click();
        }
    });

    $(".dropdown").hover(function(){
        //$(".dropdown-toggle", this).trigger("click");
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

    $('.table-row').trigger('create');


}
$(document).ready(main);